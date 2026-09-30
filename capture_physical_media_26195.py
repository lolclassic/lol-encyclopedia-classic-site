"""Capture offline English 26.19.5 screens from the installed physical dev app.

Run with --android-repo pointing at the private Android checkout. Captures stay
in a temporary directory until visual privacy review is recorded.
This script never installs an APK, clears app data, or changes online services.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path


SERIAL: str | None = None
DEV_PACKAGE = 'com.lolclassic.encyclopedia.overlaytest.dev'
PROD_PACKAGE = 'com.lolclassic.encyclopedia'
EXPECTED_FOREGROUND = f'{DEV_PACKAGE}/'
FORWARD_PORT = 9227
ROUTES = {
    'champions': 'champions',
    'garen': 'champion/garen/basic',
    'items': 'items',
    'spells': 'spells',
}


def run(*args: str, timeout: int = 30) -> str:
    return subprocess.check_output(args, text=True, encoding='utf-8', errors='replace', timeout=timeout).strip()


def adb(*args: str, timeout: int = 30) -> str:
    if SERIAL is None:
        raise RuntimeError('An expected Android serial is required before device access')
    return run('adb', '-s', SERIAL, *args, timeout=timeout)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def media_details(path: Path) -> dict:
    details = {'sha256': sha256(path), 'bytes': path.stat().st_size}
    if path.suffix == '.png':
        content = path.read_bytes()
        if not content.startswith(b'\x89PNG\r\n\x1a\n'):
            raise RuntimeError(f'Invalid PNG: {path.name}')
        details['pixels'] = list(struct.unpack('>II', content[16:24]))
        if details['pixels'] != [1080, 2340]:
            raise RuntimeError(f'Unexpected physical screenshot resolution: {path.name}')
    else:
        probe = json.loads(run('ffprobe', '-v', 'error', '-show_entries',
                               'format=duration:stream=codec_type,codec_name,width,height,nb_frames',
                               '-of', 'json', str(path)))
        video = [row for row in probe['streams'] if row.get('codec_type') == 'video']
        if len(video) != 1 or video[0].get('codec_name') != 'h264' or [video[0].get('width'), video[0].get('height')] != [1080, 2340]:
            raise RuntimeError('Android screenrecord video format or dimensions differ')
        if any(row.get('codec_type') == 'audio' for row in probe['streams']):
            raise RuntimeError('Android screenrecord unexpectedly contains audio')
        details.update(durationSeconds=round(float(probe['format']['duration']), 2),
                       frameCount=int(video[0]['nb_frames']), audioTrack=False,
                       pixels=[1080, 2340], codec='h264')
    return details


def installed_hashes(package: str) -> dict[str, str]:
    paths = []
    for line in adb('shell', 'pm', 'path', '--user', '0', package).splitlines():
        if line.startswith('package:'):
            paths.append(line.removeprefix('package:'))
    if not paths:
        raise RuntimeError(f'Package absent for Android user 0: {package}')
    result = {}
    for path in paths:
        digest = adb('shell', 'sha256sum', path).split()[0]
        if not re.fullmatch(r'[0-9a-f]{64}', digest):
            raise RuntimeError(f'Invalid APK digest for {package}')
        result[Path(path).name] = digest
    return result


def foreground_activity() -> str:
    output = adb('shell', 'dumpsys', 'activity', 'activities')
    match = re.search(r'topResumedActivity=ActivityRecord\{[^\n]*? u0 ([^\s}]+)', output)
    if not match:
        raise RuntimeError('Could not identify the active Android user-0 activity')
    return match.group(1)


def webview_socket() -> str:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        try:
            pid = adb('shell', 'pidof', DEV_PACKAGE)
        except subprocess.CalledProcessError:
            pid = ''
        if pid:
            socket = f'webview_devtools_remote_{pid.split()[0]}'
            if socket in adb('shell', 'cat', '/proc/net/unix'):
                return socket
        time.sleep(0.5)
    raise RuntimeError('Development WebView DevTools socket did not appear')


def page_websocket() -> str:
    deadline = time.monotonic() + 20
    while time.monotonic() < deadline:
        with urllib.request.urlopen(f'http://127.0.0.1:{FORWARD_PORT}/json/list', timeout=3) as response:
            pages = json.load(response)
        for page in pages:
            if page.get('url', '').startswith('https://appassets.androidplatform.net/assets/www/index.html'):
                return page['webSocketDebuggerUrl']
        time.sleep(0.5)
    raise RuntimeError('Development app page is absent from WebView DevTools')


def evaluate(node_script: Path, websocket: str, expression: str):
    completed = subprocess.run(
        ['node', str(node_script), websocket, '-'], input=expression, text=True,
        encoding='utf-8', capture_output=True, timeout=65,
    )
    if completed.returncode:
        raise RuntimeError(f'WebView evaluate failed: {completed.stderr.strip()}')
    return json.loads(completed.stdout)


def wait_for_boot(node_script: Path, websocket: str) -> dict:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        state = evaluate(node_script, websocket, "(() => { if (typeof booted === 'undefined' || !booted || typeof ClassicLocale === 'undefined' || typeof S === 'undefined') return {ready:false}; const scrollOf = selector => { const element = document.querySelector(selector); return element ? [element.scrollLeft, element.scrollTop] : null; }; return {ready:true, locale: ClassicLocale.getLocale(), storedLocale: localStorage.getItem('classicAppLocaleV1'), href: location.href, view: S.view, state: {...S}, routes: [...routeHistory], scroll: [scrollX, scrollY], innerScroll: {app: scrollOf('.app'), view: scrollOf('#view')}, historyLength: history.length, historyState: history.state ?? null, historyStateJson: JSON.stringify(history.state) ?? null, headerText: document.querySelector('#home')?.textContent, modalOpen: !!document.querySelector('#modal')?.open, drawerOpen: !!document.querySelector('#drawer')?.classList.contains('open')}; })()")
        if state['ready']:
            return state
        time.sleep(0.5)
    raise RuntimeError('Development app did not finish loading')


def set_route(node_script: Path, websocket: str, route: str) -> None:
    expression = f"(() => {{ history.replaceState(history.state, '', '#{route}'); S.view = {json.dumps(route)}; render(); window.scrollTo(0, 0); return {{route: S.view, locale: ClassicLocale.getLocale(), lang: document.documentElement.lang}}; }})()"
    result = evaluate(node_script, websocket, expression)
    if result != {'route': route, 'locale': 'en_US', 'lang': 'en'}:
        raise RuntimeError(f'English offline route was not rendered: {result}')


def screenshot(path: Path) -> None:
    content = subprocess.check_output(['adb', '-s', SERIAL, 'exec-out', 'screencap', '-p'], timeout=20)
    if not content.startswith(b'\x89PNG\r\n\x1a\n'):
        raise RuntimeError('Physical screenshot is not a PNG')
    path.write_bytes(content)


def restore_app(node_script: Path, websocket: str, original: dict) -> None:
    payload = json.dumps(original, ensure_ascii=False)
    expression = f"(async () => {{ const original = {payload}; ClassicLocale.setLocale(original.locale); if (original.storedLocale === null) localStorage.removeItem('classicAppLocaleV1'); else localStorage.setItem('classicAppLocaleV1', original.storedLocale); Object.assign(S, original.state); routeHistory.splice(0, routeHistory.length, ...original.routes); history.replaceState(original.historyState, '', original.href); renderDrawer(); render(); appLocale.apply(document.body); await new Promise(resolve => requestAnimationFrame(resolve)); window.scrollTo(...original.scroll); for (const [selector, position] of [['.app', original.innerScroll.app], ['#view', original.innerScroll.view]]) {{ if (position) document.querySelector(selector)?.scrollTo(...position); }} await new Promise(resolve => requestAnimationFrame(resolve)); const scrollOf = selector => {{ const element = document.querySelector(selector); return element ? [element.scrollLeft, element.scrollTop] : null; }}; return {{locale: ClassicLocale.getLocale(), storedLocale: localStorage.getItem('classicAppLocaleV1'), href: location.href, view: S.view, scroll: [scrollX, scrollY], innerScroll: {{app: scrollOf('.app'), view: scrollOf('#view')}}, historyLength: history.length, historyStateJson: JSON.stringify(history.state) ?? null, headerText: document.querySelector('#home')?.textContent}}; }})()"
    result = evaluate(node_script, websocket, expression)
    if result != {key: original[key] for key in ('locale', 'storedLocale', 'href', 'view', 'scroll', 'innerScroll', 'historyLength', 'historyStateJson', 'headerText')}:
        raise RuntimeError('Development app locale, storage, route, history, view, or scroll was not restored')


def main() -> int:
    global SERIAL
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--android-repo', type=Path, required=True)
    parser.add_argument('--expected-serial', required=True,
                        help='Physical Android serial supplied locally; do not publish it')
    parser.add_argument('--expected-model', required=True,
                        help='Physical Android model supplied locally')
    parser.add_argument('--expected-dev-sha256', required=True,
                        help='Independently verified SHA-256 of the final 26.19.5 development APK')
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9._:-]+', args.expected_serial):
        raise ValueError('--expected-serial contains invalid characters')
    if not args.expected_model.strip() or '\n' in args.expected_model or '\r' in args.expected_model:
        raise ValueError('--expected-model must be a single nonempty line')
    SERIAL = args.expected_serial
    expected_dev_sha256 = args.expected_dev_sha256.lower()
    if not re.fullmatch(r'[0-9a-f]{64}', expected_dev_sha256):
        raise ValueError('--expected-dev-sha256 must be a 64-character SHA-256 digest')
    android_repo = args.android_repo.resolve(strict=True)
    node_script = android_repo / 'tools/webview_eval.mjs'
    local_apk = android_repo / 'build/parallel-26195/android-app/outputs/apk/overlayTest/app-overlayTest.apk'
    if not node_script.is_file() or not local_apk.is_file():
        raise RuntimeError('Expected Android WebView evaluator and 26.19.5 APK')
    if sha256(local_apk) != expected_dev_sha256:
        raise RuntimeError('Current local development APK hash differs from the reviewed build')
    model = adb('shell', 'getprop', 'ro.product.model')
    qemu = adb('shell', 'getprop', 'ro.kernel.qemu')
    if model != args.expected_model or qemu not in ('', '0') or adb('shell', 'am', 'get-current-user') != '0':
        raise RuntimeError('The target is not the expected physical phone and Android user')
    original_foreground = foreground_activity()
    if not original_foreground.startswith(EXPECTED_FOREGROUND):
        raise RuntimeError('Unexpected foreground app; leave the phone untouched')
    before = {package: installed_hashes(package) for package in (DEV_PACKAGE, PROD_PACKAGE)}
    if before[DEV_PACKAGE].get('base.apk') != expected_dev_sha256:
        raise RuntimeError('Installed development APK does not match the local build')
    package_dump = adb('shell', 'dumpsys', 'package', DEV_PACKAGE)
    if not re.search(r'versionCode=24\b', package_dump) or not re.search(r'versionName=26\.19\.5\b', package_dump):
        raise RuntimeError('Installed development package is not version 26.19.5 (code 24)')
    if any(f'tcp:{FORWARD_PORT}' in line for line in adb('forward', '--list').splitlines()):
        raise RuntimeError('DevTools TCP port is already forwarded')

    scratch = Path(tempfile.mkdtemp(prefix='lolclassic-physical-26195-'))
    websocket = None
    original = None
    forwarded = False
    recording = None
    remote_video = f'/sdcard/Download/codex-physical-26195-en-{int(time.time())}.mp4'
    try:
        socket = webview_socket()
        adb('forward', f'tcp:{FORWARD_PORT}', f'localabstract:{socket}')
        forwarded = True
        websocket = page_websocket()
        original = wait_for_boot(node_script, websocket)
        if original['modalOpen'] or original['drawerOpen']:
            raise RuntimeError('An existing app overlay is open; stop before changing its screen')
        if evaluate(node_script, websocket, "(() => { if (!appLocale.setLocale('en_US')) return false; renderDrawer(); render(); appLocale.apply(document.body); return document.querySelector('#home')?.textContent === 'LoL Encyclopedia (Beta)'; })()") is not True:
            raise RuntimeError('Unable to switch the app to English')
        for name, route in ROUTES.items():
            set_route(node_script, websocket, route)
            time.sleep(1.5)
            evaluate(node_script, websocket, "(() => { window.scrollTo(0, 0); document.querySelector('.app')?.scrollTo(0, 0); document.querySelector('#view')?.scrollTo(0, 0); return true; })()")
            time.sleep(0.2)
            screenshot(scratch / f'physical-26195-en-{name}.png')

        set_route(node_script, websocket, ROUTES['champions'])
        recording = subprocess.Popen(
            ['adb', '-s', SERIAL, 'shell', 'screenrecord', '--time-limit', '10',
             '--bit-rate', '6000000', remote_video], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        time.sleep(1)
        adb('shell', 'input', 'swipe', '540', '1800', '540', '700', '800')
        time.sleep(2)
        scroll = evaluate(node_script, websocket, "Math.max(window.scrollY, document.scrollingElement?.scrollTop || 0, document.querySelector('#view')?.scrollTop || 0)")
        if not isinstance(scroll, (int, float)) or scroll < 100:
            raise RuntimeError('Physical swipe did not scroll the champion roster')
        adb('shell', 'input', 'swipe', '540', '700', '540', '1800', '800')
        time.sleep(2)
        _, error = recording.communicate(timeout=20)
        if recording.returncode:
            raise RuntimeError(f'Android screenrecord failed: {error.decode(errors="replace").strip()}')
        subprocess.check_call(['adb', '-s', SERIAL, 'pull', remote_video,
                               str(scratch / 'physical-26195-en-tour.mp4')], timeout=45)
    finally:
        restore_errors = []
        if recording is not None and recording.poll() is None:
            recording.terminate()
            try:
                recording.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                recording.kill()
                recording.communicate()
        if original is not None and websocket is not None:
            try:
                restore_app(node_script, websocket, original)
            except Exception as exc:
                restore_errors.append(f'app route/locale: {exc}')
        try:
            if foreground_activity() != original_foreground:
                adb('shell', 'am', 'start', '-n', original_foreground)
        except Exception as exc:
            restore_errors.append(f'foreground: {exc}')
        if forwarded:
            try:
                adb('forward', '--remove', f'tcp:{FORWARD_PORT}')
            except Exception as exc:
                restore_errors.append(f'forward: {exc}')
        try:
            adb('shell', 'rm', '-f', remote_video)
        except Exception as exc:
            restore_errors.append(f'temporary phone video: {exc}')
        if restore_errors:
            raise RuntimeError('Capture restoration failed: ' + '; '.join(restore_errors))

    after = {package: installed_hashes(package) for package in (DEV_PACKAGE, PROD_PACKAGE)}
    if before != after or foreground_activity() != original_foreground:
        raise RuntimeError('Installed APK hashes or original foreground changed after capture')
    files = {f'physical-26195-en-{name}.png': media_details(scratch / f'physical-26195-en-{name}.png')
             for name in ROUTES}
    files['physical-26195-en-tour.mp4'] = media_details(scratch / 'physical-26195-en-tour.mp4')
    provenance = {
        'schemaVersion': 1,
        'classification': 'ENGLISH_PHYSICAL_ANDROID_DEVELOPMENT_NOT_PLAY_RELEASE',
        'appVersion': '26.19.5',
        'build': {'packageName': DEV_PACKAGE, 'versionCode': 24,
                  'localAndInstalledApkSha256': expected_dev_sha256},
        'device': {'model': model, 'physical': True, 'androidUser': 0,
                   'exactSerialVerifiedLocally': True},
        'capture': {'locale': 'en_US', 'offlineRoutes': list(ROUTES.values()),
                    'screenshotMethod': 'adb exec-out screencap -p',
                    'videoMethod': 'adb shell screenrecord',
                    'routeControl': 'WebView DevTools Runtime.evaluate for still routes; native Android input swipe for screenrecord',
                    'audioTrack': False},
        'stateRestoration': {'originalLocaleAndRoute': True,
                             'originalForeground': True,
                             'developmentAndProductionApkHashesUnchanged': True,
                             'productionApkSha256': before[PROD_PACKAGE]},
        'privacyReview': {'status': 'PENDING_MANUAL_REVIEW',
                          'screensReviewed': 0, 'videoFramesReviewed': 0,
                          'privateContentObserved': None},
        'files': files,
    }
    (scratch / 'physical-26195-en-provenance.json').write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({
        'result': 'CAPTURED_FOR_PRIVATE_REVIEW', 'directory': str(scratch),
        'model': model, 'version': '26.19.5',
        'localAndInstalledDevApkSha256': expected_dev_sha256,
        'productionApkSha256': before[PROD_PACKAGE],
        'originalForegroundRestored': True,
        'originalLocaleAndRouteRestored': True,
        'files': files,
    }, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

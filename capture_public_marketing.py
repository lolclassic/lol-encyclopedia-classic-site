from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from PIL import Image, ImageDraw, ImageFont
except ModuleNotFoundError:
    Image = None  # type: ignore[assignment]
    ImageDraw = None  # type: ignore[assignment]
    ImageFont = None  # type: ignore[assignment]


PUBLIC_ROOT = Path(__file__).resolve().parent
EXPECTED_ANDROID_HEAD = "c7f21617c450509987920b85d7a2f695b15b5421"
EXPECTED_ANDROID_BRANCH = "codex"
EXPECTED_PACKAGE = "com.lolclassic.encyclopedia.qa"
REJECTED_PRODUCTION_PACKAGE = "com.lolclassic.encyclopedia"
EXPECTED_ACTIVITY_CLASS = "com.lolclassic.encyclopedia.MainActivity"
# applicationId is QA-scoped while the Java activity keeps the production
# namespace declared by the Android source manifest.
ACTIVITY = f"{EXPECTED_PACKAGE}/{EXPECTED_ACTIVITY_CLASS}"
APP_URL_PREFIX = "https://appassets.androidplatform.net/assets/www/index.html"
DEVTOOLS_PORT = 9222
EXPECTED_ANDROID_WIP_PATHS = frozenset(
    {
        "app/src/main/assets/www/app.js",
        "app/src/main/assets/www/final-ui-hotfix.js",
        "app/src/main/assets/www/index.html",
        "app/src/main/assets/www/sw.js",
        "app/src/main/assets/www/images/branding/app-icon-192.png",
        "app/src/main/assets/www/images/branding/app-icon-512.png",
        "app/src/main/assets/www/images/branding/app-icon-maskable-512.png",
        "app/src/main/assets/www/data/offline-assets.json",
        "app/src/main/res/mipmap-hdpi/ic_launcher.png",
        "app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png",
        "app/src/main/res/mipmap-mdpi/ic_launcher.png",
        "app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png",
        "app/src/main/res/mipmap-xhdpi/ic_launcher.png",
        "app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png",
        "app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
        "app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png",
        "app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
        "app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png",
        "play-store/assets/app-icon-512.png",
        "play-store/assets/feature-graphic-1024x500.png",
        "play-store/asset-provenance.md",
        "play-store/riot-asset-provenance.json",
        "tools/android_runtime_qa.py",
        "tools/check_classic_ui_overrides.mjs",
        "tools/check_mobile_layout_contracts.mjs",
        "tools/release_lint.py",
        "tools/test-classic-skills-ui.mjs",
        "tools/test-community-online.mjs",
    }
)
EXPECTED_ANDROID_UNTRACKED_PATHS = frozenset(
    {
        "app/src/main/assets/www/home-layout-video-player-fix.js.bak-20260822-160457",
        "app/src/main/assets/www/home-layout-video-player-fix.js.bak-20260822-160935",
        "app/src/main/assets/www/home-layout-video-player-fix.js.bak-20260822-162011",
        "app/src/main/assets/www/index.html.bak-20260822-162011",
        "play-store/android-runtime-qa-classic-fantasy.json",
        "play-store/android-runtime-qa-phase2b3-final.json",
        "play-store/android-runtime-qa-phase2b3-rerun.json",
        "play-store/android-runtime-qa-phase2b3.json",
        "play-store/classic-fantasy-design-provenance.json",
        "play-store/qa-skin-portraits/akali-7-skins.png",
        "play-store/qa-skin-portraits/fiddlesticks-skins.png",
        "play-store/qa-skin-portraits/garen-skins.png",
        "play-store/qa-skin-portraits/ryze-skins.png",
        "play-store/qa-skin-portraits/shen-skins.png",
        "play-store/qa-skin-portraits/warwick-skins.png",
        "play-store/skin-portrait-qa.json",
        "tools/generate_classic_fantasy_brand_assets.py",
    }
)

CAPTURES: tuple[tuple[str, str, str, str], ...] = (
    (
        "phone-01-home.png",
        "HOME",
        "home",
        "S.tab = '새소식'; S.q = ''; go('home');",
    ),
    (
        "phone-02-champions.png",
        "CHAMPION_LIST",
        "classic",
        "S.onlyClassic = true; S.q = ''; go('classic');",
    ),
    (
        "phone-03-champion-detail.png",
        "CHAMPION_DETAIL",
        "champion/garen/basic",
        "S.showTip = null; go('champion/garen/basic');",
    ),
    (
        "phone-04-items.png",
        "ITEM",
        "items",
        "S.cat = null; S.iq = ''; go('items');",
    ),
    (
        "phone-05-masteries.png",
        "MASTERY",
        "mastery",
        "S.mbranch = 'o'; S.masteryInfo = 'o_08'; go('mastery');",
    ),
    (
        "phone-06-spells.png",
        "SPELL",
        "spells",
        "go('spells');",
    ),
    (
        "phone-07-runes.png",
        "RUNE_EDITORIAL_EMPTY_STATE",
        "runes",
        "S.runeSet = 'classic'; S.runeView = 'list'; S.rslot = 'mark'; S.rq = ''; go('runes');",
    ),
    (
        "phone-08-patch-news.png",
        "PATCH_NEWS",
        "patchnote/1",
        "go('patchnote/1');",
    ),
    (
        "phone-09-about-legal.png",
        "ABOUT_LEGAL",
        "about",
        "go('about');",
    ),
    (
        "phone-10-community.png",
        "COMMUNITY",
        "board",
        "go('board');",
    ),
)

TOUR: tuple[tuple[str, str], ...] = (
    ("HOME", "S.tab = '새소식'; S.q = ''; go('home');"),
    ("CHAMPION_LIST", "S.onlyClassic = true; S.q = ''; go('classic');"),
    ("CHAMPION_DETAIL", "S.showTip = null; go('champion/garen/basic');"),
    ("ITEM", "S.cat = null; S.iq = ''; go('items');"),
    ("MASTERY", "S.mbranch = 'o'; S.masteryInfo = 'o_08'; go('mastery');"),
    ("RUNE", "S.runeSet = 'classic'; S.runeView = 'list'; S.rslot = 'mark'; S.rq = ''; go('runes');"),
    ("PATCH_NEWS", "go('patchnote/1');"),
    ("COMMUNITY", "go('board');"),
    ("ABOUT_LEGAL", "go('about');"),
    ("HOME_RETURN", "S.tab = '새소식'; S.q = ''; go('home');"),
)

SENSITIVE_PATTERNS = {
    "email": re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I),
    "phone": re.compile(r"(?<!\d)(?:\+?82[- ]?)?0?1[016789][- ]?\d{3,4}[- ]?\d{4}(?!\d)"),
    "ipv4": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    "windows_path": re.compile(r"\b[A-Z]:\\", re.I),
    "bearer": re.compile(r"\bBearer\s+[A-Za-z0-9._~+/-]+=*", re.I),
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def require_pillow() -> None:
    if Image is None or ImageDraw is None or ImageFont is None:
        raise RuntimeError(
            "Pillow is required for capture image normalization and project-owned compositions"
        )


def run(
    command: list[str],
    *,
    cwd: Path | None = None,
    check: bool = True,
    text: bool = True,
) -> subprocess.CompletedProcess[Any]:
    completed = subprocess.run(
        command,
        cwd=cwd,
        check=False,
        capture_output=True,
        text=text,
        encoding="utf-8" if text else None,
        errors="replace" if text else None,
    )
    if check and completed.returncode != 0:
        stderr = completed.stderr.strip() if text else "binary command failed"
        raise RuntimeError(f"command failed ({completed.returncode}): {command[0]}: {stderr}")
    return completed


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_apk_identity(badging: str) -> dict[str, str]:
    package_match = re.search(r"^package:\s+name='([^']+)'", badging, re.MULTILINE)
    activity_match = re.search(
        r"^launchable-activity:\s+name='([^']+)'", badging, re.MULTILINE
    )
    if not package_match or not activity_match:
        raise RuntimeError("could not read APK package and launchable activity")
    return {"package": package_match.group(1), "activity": activity_match.group(1)}


class SafeDevice:
    def __init__(self, adb_path: Path, expected_serial: str) -> None:
        self.adb_path = adb_path
        self.expected_serial = expected_serial

    def adb(self, *arguments: str, check: bool = True) -> subprocess.CompletedProcess[str]:
        if not self.expected_serial:
            raise RuntimeError("an explicit expected serial is required")
        return run(
            [str(self.adb_path), "-s", self.expected_serial, *arguments],
            check=check,
        )

    def verify_gate(self, apk: Path, aapt: Path) -> dict[str, Any]:
        devices = run([str(self.adb_path), "devices"]).stdout.splitlines()[1:]
        online = []
        for line in devices:
            fields = line.split()
            if len(fields) >= 2 and fields[1] == "device":
                online.append(fields[0])
        if online != [self.expected_serial]:
            raise RuntimeError("exactly one matching authorized online target is required")

        qemu = self.adb("shell", "getprop", "ro.kernel.qemu").stdout.strip()
        if qemu != "0":
            raise RuntimeError("capture target is not a verified physical device")

        badging = run([str(aapt), "dump", "badging", str(apk)]).stdout
        identity = parse_apk_identity(badging)
        package = identity["package"]
        if package != EXPECTED_PACKAGE or package == REJECTED_PRODUCTION_PACKAGE:
            raise RuntimeError(f"refusing APK package {package!r}; QA package required")
        if identity["activity"] != EXPECTED_ACTIVITY_CLASS:
            raise RuntimeError(
                f"refusing APK activity {identity['activity']!r}; expected QA launch activity"
            )

        return {
            "exactlyOneAuthorizedTarget": True,
            "physicalDevice": True,
            "kernelQemu": qemu,
            "model": self.adb("shell", "getprop", "ro.product.model").stdout.strip(),
            "androidRelease": self.adb("shell", "getprop", "ro.build.version.release").stdout.strip(),
            "apiLevel": self.adb("shell", "getprop", "ro.build.version.sdk").stdout.strip(),
            "apkPackage": package,
            "apkLaunchableActivity": identity["activity"],
            "productionPackageRejected": True,
        }

    def foreground_component(self) -> str:
        activities = self.adb(
            "shell", "dumpsys", "activity", "activities", check=False
        ).stdout
        for line in activities.splitlines():
            if "topResumedActivity" not in line and "mResumedActivity" not in line:
                continue
            match = re.search(
                r"\bu\d+\s+([A-Za-z0-9_.]+/[A-Za-z0-9_.$]+)", line
            )
            if match:
                return match.group(1)
        windows = self.adb("shell", "dumpsys", "window", "windows", check=False).stdout
        for line in windows.splitlines():
            if "mCurrentFocus" not in line and "mFocusedApp" not in line:
                continue
            match = re.search(
                r"\bu\d+\s+([A-Za-z0-9_.]+/[A-Za-z0-9_.$]+)", line
            )
            if match:
                return match.group(1)
        return ""

    def wait_for_exact_foreground(self, timeout_seconds: float = 10.0) -> str:
        deadline = time.monotonic() + timeout_seconds
        latest = ""
        while time.monotonic() < deadline:
            latest = self.foreground_component()
            if latest == ACTIVITY:
                return latest
            time.sleep(0.1)
        raise RuntimeError(
            f"QA app did not become exact foreground component; observed={latest!r}"
        )

    def read_setting(self, namespace: str, key: str, *, allow_null: bool = False) -> str:
        value = self.adb("shell", "settings", "get", namespace, key).stdout.strip()
        if not value or (not allow_null and value.lower() == "null"):
            raise RuntimeError(f"could not read required {namespace} setting {key}")
        return value

    def restore_setting(self, namespace: str, key: str, original: str) -> str:
        if original.lower() == "null":
            self.adb("shell", "settings", "delete", namespace, key)
        else:
            self.adb("shell", "settings", "put", namespace, key, original)
        restored = self.read_setting(namespace, key, allow_null=True)
        if restored != original:
            raise RuntimeError(
                f"failed to restore {namespace} setting {key}: "
                f"expected={original!r}, observed={restored!r}"
            )
        return restored

    def wait_for_webview(self, android_tools: Path) -> str:
        pid = ""
        for _ in range(40):
            pid = self.adb("shell", "pidof", EXPECTED_PACKAGE, check=False).stdout.strip()
            if pid:
                break
            time.sleep(0.25)
        if not pid:
            raise RuntimeError("QA package did not start")
        self.adb(
            "forward",
            f"tcp:{DEVTOOLS_PORT}",
            f"localabstract:webview_devtools_remote_{pid}",
        )
        endpoint = f"http://127.0.0.1:{DEVTOOLS_PORT}/json/list"
        stable: tuple[str, str] | None = None
        observations = 0
        for _ in range(80):
            try:
                with urllib.request.urlopen(endpoint, timeout=2) as response:
                    pages = json.loads(response.read().decode("utf-8"))
                matches = [
                    page
                    for page in pages
                    if isinstance(page, dict)
                    and str(page.get("url", "")).startswith(APP_URL_PREFIX)
                    and page.get("webSocketDebuggerUrl")
                ]
                if matches:
                    current = (str(matches[0].get("id", "")), str(matches[0]["webSocketDebuggerUrl"]))
                    observations = observations + 1 if current == stable else 1
                    stable = current
                    if observations >= 3:
                        return current[1]
            except (OSError, ValueError):
                pass
            time.sleep(0.25)
        raise RuntimeError("QA WebView DevTools endpoint did not become ready")

    def capture_png(self, destination: Path, index: int) -> None:
        device_path = f"/sdcard/phase2b3-public-{index:02d}.png"
        try:
            with tempfile.TemporaryDirectory(prefix="phase2b3-capture-") as temporary:
                raw = Path(temporary) / destination.name
                self.adb("shell", "screencap", "-p", device_path)
                self.adb("pull", device_path, str(raw))
                with Image.open(raw) as image:
                    rgb = image.convert("RGB")
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    rgb.save(destination, "PNG", optimize=True)
        finally:
            self.adb("shell", "rm", "-f", device_path, check=False)


def locate_adb() -> Path:
    candidates = [
        Path(os.environ.get("ANDROID_SDK_ROOT", "")) / "platform-tools" / "adb.exe",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Android" / "Sdk" / "platform-tools" / "adb.exe",
    ]
    discovered = shutil.which("adb")
    if discovered:
        candidates.insert(0, Path(discovered))
    for candidate in candidates:
        if candidate.is_file():
            return candidate.resolve()
    raise RuntimeError("adb was not found")


def locate_aapt(adb_path: Path) -> Path:
    sdk = adb_path.parents[1]
    candidates = sorted((sdk / "build-tools").glob("*/aapt.exe"), reverse=True)
    if not candidates:
        raise RuntimeError("aapt was not found")
    return candidates[0]


def verify_android_repo(android_repo: Path) -> dict[str, Any]:
    branch = run(["git", "branch", "--show-current"], cwd=android_repo).stdout.strip()
    head = run(["git", "rev-parse", "HEAD"], cwd=android_repo).stdout.strip()
    tracked_paths = frozenset(
        line
        for line in run(["git", "diff", "--name-only"], cwd=android_repo).stdout.splitlines()
        if line
    )
    untracked_paths = frozenset(
        line
        for line in run(
            ["git", "ls-files", "--others", "--exclude-standard"], cwd=android_repo
        ).stdout.splitlines()
        if line
    )
    if branch != EXPECTED_ANDROID_BRANCH or head != EXPECTED_ANDROID_HEAD:
        raise RuntimeError("Android canonical branch/HEAD gate failed")
    if tracked_paths != EXPECTED_ANDROID_WIP_PATHS:
        raise RuntimeError(
            "Android tracked WIP gate failed; exact authorized classic-fantasy paths required"
        )
    if untracked_paths != EXPECTED_ANDROID_UNTRACKED_PATHS:
        raise RuntimeError(
            "Android untracked WIP gate failed; exact preserved classic-fantasy paths required"
        )
    binary_diff = run(
        ["git", "diff", "--binary", "--no-ext-diff"],
        cwd=android_repo,
        text=False,
    ).stdout
    return {
        "branch": branch,
        "commit": head,
        "trackedState": "authorized-classic-fantasy-wip",
        "trackedPaths": sorted(tracked_paths),
        "preservedUntrackedPaths": sorted(untracked_paths),
        "trackedDiffSha256": hashlib.sha256(binary_diff).hexdigest(),
    }


def evaluate(android_tools: Path, websocket_url: str, expression: str) -> Any:
    encoded = base64.b64encode(expression.encode("utf-8")).decode("ascii")
    result = run(
        ["node", str(android_tools / "webview_eval.mjs"), websocket_url, encoded]
    )
    return json.loads(result.stdout)


def route_and_audit(
    android_tools: Path,
    websocket_url: str,
    purpose: str,
    expected_route: str,
    route_script: str,
) -> dict[str, Any]:
    expression = f"""
    (async () => {{
      for (let attempt = 0; attempt < 120 && !booted; attempt += 1) {{
        await new Promise(resolve => setTimeout(resolve, 50));
      }}
      if (!booted) throw new Error('app data did not finish loading');
      const modal = document.getElementById('modal');
      if (modal && modal.open) modal.close();
      {route_script}
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise(resolve => setTimeout(resolve, 900));
      window.scrollTo(0, 0);
      document.querySelectorAll('.tree2, .ilist, .rlist').forEach(element => element.scrollTop = 0);
      const images = [...document.images];
      for (const image of images) {{
        image.loading = 'eager';
        if (!image.complete) {{
          await new Promise(resolve => {{
            const finish = () => resolve();
            image.addEventListener('load', finish, {{ once: true }});
            image.addEventListener('error', finish, {{ once: true }});
            setTimeout(finish, 8000);
          }});
        }}
      }}
      window.scrollTo(0, 0);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise(resolve => setTimeout(resolve, 500));
      const broken = images
        .filter(image => !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0)
        .map(image => image.getAttribute('src') || 'unknown-image');
      const textFallbacks = [...document.querySelectorAll('.pic.noimg')]
        .map(element => element.textContent.trim()).filter(Boolean);
      const placeholders = [...document.querySelectorAll('.spellIcon.missing')]
        .map(element => element.textContent.trim()).filter(Boolean);
      const text = document.body.innerText || '';
      return {{
        purpose: {json.dumps(purpose)},
        view: S.view,
        hash: location.hash,
        viewport: [innerWidth, innerHeight],
        imageCount: images.length,
        broken,
        placeholders,
        textFallbacks,
        modalOpen: Boolean(modal && modal.open),
        scrollX,
        scrollY,
        text,
        runeRecordCount: Array.isArray(classicRunes) ? classicRunes.length : null,
      }};
    }})()
    """
    result = evaluate(android_tools, websocket_url, expression)
    expected_hash = f"#{expected_route}"
    if result.get("view") != expected_route or result.get("hash") != expected_hash:
        raise RuntimeError(f"route mismatch for {purpose}: {result.get('view')!r}")
    if result.get("broken") or result.get("placeholders") or result.get("modalOpen"):
        raise RuntimeError(f"visual preflight failed for {purpose}")
    if result.get("scrollX") != 0 or result.get("scrollY") != 0:
        raise RuntimeError(f"capture scroll was not reset for {purpose}")
    return result


def sensitive_hits(text: str) -> dict[str, list[str]]:
    hits: dict[str, list[str]] = {}
    for label, pattern in SENSITIVE_PATTERNS.items():
        values = sorted(set(pattern.findall(text)))
        if values:
            hits[label] = values
    return hits


def inspect_png(path: Path) -> dict[str, Any]:
    with Image.open(path) as image:
        return {
            "width": image.width,
            "height": image.height,
            "mode": image.mode,
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        }


def record_tour(
    device: SafeDevice,
    android_tools: Path,
    websocket_url: str,
    destination: Path,
) -> dict[str, Any]:
    remote = "/sdcard/phase2b3-public-tour.mp4"
    route_and_audit(android_tools, websocket_url, "HOME", "home", TOUR[0][1])
    process: subprocess.Popen[str] | None = None
    route_evidence: list[dict[str, Any]] = []
    try:
        process = subprocess.Popen(
            [
                str(device.adb_path),
                "-s",
                device.expected_serial,
                "shell",
                "screenrecord",
                "--bit-rate",
                "6000000",
                "--time-limit",
                "42",
                remote,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
        )
        time.sleep(1.0)
        for purpose, script in TOUR:
            expected = {
                "HOME": "home",
                "CHAMPION_LIST": "classic",
                "CHAMPION_DETAIL": "champion/garen/basic",
                "ITEM": "items",
                "MASTERY": "mastery",
                "RUNE": "runes",
                "PATCH_NEWS": "patchnote/1",
                "COMMUNITY": "board",
                "ABOUT_LEGAL": "about",
                "HOME_RETURN": "home",
            }[purpose]
            state = route_and_audit(android_tools, websocket_url, purpose, expected, script)
            route_evidence.append({"purpose": purpose, "route": state["view"]})
            time.sleep(3.0)
        try:
            _, stderr = process.communicate(timeout=20)
        except subprocess.TimeoutExpired:
            device.adb("shell", "pkill", "-INT", "screenrecord", check=False)
            process.kill()
            _, stderr = process.communicate()
            raise RuntimeError("screenrecord did not finish within its fixed time limit")
        if process.returncode != 0:
            raise RuntimeError(f"screenrecord failed: {stderr.strip()}")

        with tempfile.TemporaryDirectory(prefix="phase2b3-video-") as temporary:
            raw = Path(temporary) / "tour-raw.mp4"
            device.adb("pull", remote, str(raw))
            destination.parent.mkdir(parents=True, exist_ok=True)
            run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(raw),
                    "-map",
                    "0:v:0",
                    "-c",
                    "copy",
                    "-movflags",
                    "+faststart",
                    str(destination),
                ]
            )
    finally:
        if process is not None and process.poll() is None:
            device.adb("shell", "pkill", "-INT", "screenrecord", check=False)
            try:
                process.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.communicate()
        device.adb("shell", "rm", "-f", remote, check=False)

    probe = json.loads(
        run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration,bit_rate,size:stream=codec_name,width,height,avg_frame_rate",
                "-of",
                "json",
                str(destination),
            ]
        ).stdout
    )
    stream = probe["streams"][0]
    fmt = probe["format"]
    return {
        "routes": route_evidence,
        "width": int(stream["width"]),
        "height": int(stream["height"]),
        "codec": stream["codec_name"],
        "frameRate": stream.get("avg_frame_rate"),
        "duration": round(float(fmt["duration"]), 3),
        "bitRate": int(fmt.get("bit_rate", 0)),
        "bytes": destination.stat().st_size,
        "sha256": sha256_file(destination),
    }


def load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    names = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for name in names:
        if Path(name).is_file():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


def generate_project_icon(source: Path, destination: Path) -> dict[str, Any]:
    if not source.is_file():
        raise RuntimeError("project-owned Android Play icon is missing")
    with Image.open(source) as original:
        if original.size != (512, 512) or original.mode != "RGBA":
            raise RuntimeError("project-owned Android Play icon is not 512x512 RGBA")
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    return inspect_png(destination)


def generate_feature_graphic(
    home_capture: Path, detail_capture: Path, destination: Path
) -> dict[str, Any]:
    canvas = Image.new("RGB", (1024, 500), "#0b1117")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, 1024, 500), fill="#0b1117")
    for y in range(18, 500, 22):
        draw.line((0, y, 1024, y), fill="#101a20", width=1)
    draw.rectangle((14, 14, 1010, 486), outline="#806938", width=3)
    draw.rectangle((23, 23, 1001, 477), outline="#3f3928", width=1)
    draw.rectangle((0, 0, 590, 500), fill="#101820")
    draw.polygon(((0, 0), (590, 0), (548, 42), (42, 42)), fill="#151f25")
    draw.line((42, 42, 548, 42), fill="#b29149", width=2)
    draw.line((55, 420, 525, 420), fill="#806938", width=2)
    draw.polygon(((42, 42), (58, 42), (42, 58)), fill="#b29149")
    draw.polygon(((548, 42), (532, 42), (548, 58)), fill="#b29149")
    draw.polygon(((42, 458), (58, 458), (42, 442)), fill="#806938")
    draw.polygon(((548, 458), (532, 458), (548, 442)), fill="#806938")
    title_font = load_font(54, bold=True)
    body_font = load_font(25)
    badge_font = load_font(18, bold=True)
    draw.text((56, 78), "LoL Encyclopedia", font=title_font, fill="#efe3bd")
    draw.text((56, 142), "Classic Archive", font=title_font, fill="#c7a75b")
    draw.text((58, 238), "Independent historical reference", font=body_font, fill="#d4cbb4")
    draw.text((58, 276), "Korean-first records & community", font=body_font, fill="#d4cbb4")
    draw.rectangle((56, 344, 316, 395), fill="#d7c696", outline="#a68743", width=2)
    draw.text((77, 358), "UNOFFICIAL FAN PROJECT", font=badge_font, fill="#251c0e")

    def add_phone(source: Path, box: tuple[int, int, int, int], angle: float) -> None:
        with Image.open(source) as screenshot:
            shot = screenshot.convert("RGB")
            target_w = box[2] - box[0]
            target_h = box[3] - box[1]
            ratio = max(target_w / shot.width, target_h / shot.height)
            resized = shot.resize((round(shot.width * ratio), round(shot.height * ratio)))
            left = max(0, (resized.width - target_w) // 2)
            top = max(0, (resized.height - target_h) // 2)
            crop = resized.crop((left, top, left + target_w, top + target_h))
            frame = Image.new("RGB", (target_w + 20, target_h + 20), "#0a0f14")
            frame.paste(crop, (10, 10))
            frame_draw = ImageDraw.Draw(frame)
            frame_draw.rectangle((2, 2, frame.width - 3, frame.height - 3), outline="#b29149", width=4)
            rotated = frame.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
            x = box[0] - (rotated.width - frame.width) // 2
            y = box[1] - (rotated.height - frame.height) // 2
            canvas.paste(rotated, (x, y))

    add_phone(home_capture, (650, 38, 850, 462), -5)
    add_phone(detail_capture, (820, 58, 1000, 442), 5)
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, "PNG", optimize=True)
    return inspect_png(destination)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Safely capture current QA Android marketing media for the local Public site."
    )
    parser.add_argument("--expected-serial", required=True)
    parser.add_argument("--android-repo", type=Path, required=True)
    parser.add_argument("--apk", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=PUBLIC_ROOT / "assets")
    parser.add_argument("--evidence", type=Path, default=PUBLIC_ROOT / "capture-evidence.json")
    args = parser.parse_args()

    android_repo = args.android_repo.resolve()
    apk = args.apk.resolve()
    output = args.output.resolve()
    evidence_path = args.evidence.resolve()
    if not apk.is_file():
        raise RuntimeError("QA APK is missing")
    require_pillow()

    git = verify_android_repo(android_repo)
    adb_path = locate_adb()
    aapt = locate_aapt(adb_path)
    device = SafeDevice(adb_path, args.expected_serial)
    gate = device.verify_gate(apk, aapt)

    previous_rotation = {
        "accelerometer": device.read_setting("system", "accelerometer_rotation"),
        "user": device.read_setting("system", "user_rotation"),
    }
    previous_heads_up = device.read_setting(
        "global", "heads_up_notifications_enabled", allow_null=True
    )
    captured_at = utc_now()
    screenshot_evidence: list[dict[str, Any]] = []
    video_evidence: dict[str, Any]
    foreground = ""
    capture_settings: dict[str, str] = {}
    settings_restoration: dict[str, Any] = {}
    try:
        device.adb("install", "-r", str(apk))
        device.adb("shell", "settings", "put", "system", "accelerometer_rotation", "0")
        device.adb("shell", "settings", "put", "system", "user_rotation", "0")
        device.adb("shell", "settings", "put", "global", "heads_up_notifications_enabled", "0")
        capture_settings = {
            "accelerometerRotation": device.read_setting("system", "accelerometer_rotation"),
            "userRotation": device.read_setting("system", "user_rotation"),
            "headsUpNotifications": device.read_setting(
                "global", "heads_up_notifications_enabled"
            ),
        }
        if set(capture_settings.values()) != {"0"}:
            raise RuntimeError(f"capture settings were not applied exactly: {capture_settings}")
        device.adb("shell", "cmd", "statusbar", "collapse", check=False)
        device.adb("shell", "am", "force-stop", EXPECTED_PACKAGE)
        device.adb("shell", "am", "start", "-W", "-n", ACTIVITY)
        foreground = device.wait_for_exact_foreground()
        websocket_url = device.wait_for_webview(android_repo / "tools")

        for index, (filename, purpose, route, script) in enumerate(CAPTURES, start=1):
            state = route_and_audit(android_repo / "tools", websocket_url, purpose, route, script)
            hits = sensitive_hits(state["text"])
            if hits:
                raise RuntimeError(f"sensitive DOM pattern found in {purpose}: {sorted(hits)}")
            destination = output / filename
            device.capture_png(destination, index)
            png = inspect_png(destination)
            screenshot_evidence.append(
                {
                    "file": filename,
                    "purpose": purpose,
                    "route": route,
                    "viewport": state["viewport"],
                    "imageCount": state["imageCount"],
                    "brokenImages": state["broken"],
                    "placeholderCount": len(state["placeholders"]),
                    "intentionalTextFallbackCount": len(state["textFallbacks"]),
                    "runeRecordCount": state["runeRecordCount"] if purpose.startswith("RUNE") else None,
                    "domTextPatternHits": hits,
                    "png": png,
                }
            )

        # app-main-screen is a deliberate poster alias of the freshly captured HOME state.
        shutil.copyfile(output / "phone-01-home.png", output / "app-main-screen.png")
        video_evidence = record_tour(
            device, android_repo / "tools", websocket_url, output / "app-feature-tour.mp4"
        )
    finally:
        restoration_errors: list[str] = []
        restored_values: dict[str, str] = {}
        for label, namespace, key, original in (
            (
                "accelerometerRotation",
                "system",
                "accelerometer_rotation",
                previous_rotation["accelerometer"],
            ),
            ("userRotation", "system", "user_rotation", previous_rotation["user"]),
            (
                "headsUpNotifications",
                "global",
                "heads_up_notifications_enabled",
                previous_heads_up,
            ),
        ):
            try:
                restored_values[label] = device.restore_setting(namespace, key, original)
            except Exception as error:
                restoration_errors.append(f"{label}: {error}")
        device.adb("forward", "--remove", f"tcp:{DEVTOOLS_PORT}", check=False)
        settings_restoration = {
            "original": {
                "accelerometerRotation": previous_rotation["accelerometer"],
                "userRotation": previous_rotation["user"],
                "headsUpNotifications": previous_heads_up,
            },
            "restored": restored_values,
            "verified": not restoration_errors,
        }
        if restoration_errors:
            raise RuntimeError("; ".join(restoration_errors))

    icon = generate_project_icon(
        android_repo / "play-store/assets/app-icon-512.png",
        output / "app-icon.png",
    )
    feature = generate_feature_graphic(
        output / "phone-01-home.png",
        output / "phone-03-champion-detail.png",
        output / "feature-graphic.png",
    )
    main_screen = inspect_png(output / "app-main-screen.png")

    evidence = {
        "schemaVersion": 1,
        "capturedAt": captured_at,
        "source": {
            "android": git,
            "applicationId": EXPECTED_PACKAGE,
            "apkSha256": sha256_file(apk),
        },
        "deviceGate": gate,
        "foregroundComponent": foreground,
        "captureSettings": capture_settings,
        "settingsRestoration": settings_restoration,
        "capturePlan": [
            {"file": filename, "purpose": purpose, "route": route}
            for filename, purpose, route, _ in CAPTURES
        ],
        "screenshots": screenshot_evidence,
        "appMainScreen": {
            "file": "app-main-screen.png",
            "purpose": "HOME_POSTER_ALIAS",
            "source": "phone-01-home.png",
            "png": main_screen,
        },
        "video": {"file": "app-feature-tour.mp4", **video_evidence},
        "projectOwned": {
            "appIcon": {"file": "app-icon.png", **icon},
            "featureGraphic": {"file": "feature-graphic.png", **feature},
        },
        "safety": {
            "productionPackageMutationCount": 0,
            "productionPackage": REJECTED_PRODUCTION_PACKAGE,
            "qaPackageOnly": True,
            "domTextPatternScanPassed": True,
            "personalDataReviewedByAutomation": False,
            "manualVisualReviewRequired": True,
        },
    }
    write_json(evidence_path, evidence)
    print(json.dumps({
        "capturedAt": captured_at,
        "applicationId": EXPECTED_PACKAGE,
        "screenshots": len(screenshot_evidence),
        "video": video_evidence,
        "icon": icon,
        "featureGraphic": feature,
        "evidence": str(evidence_path),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

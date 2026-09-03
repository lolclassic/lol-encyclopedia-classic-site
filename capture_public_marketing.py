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
EXPECTED_ANDROID_HEAD = "c0fffa988a1ed032d42d82f44adc1b0fdc7a900f"
EXPECTED_ANDROID_BRANCH = "codex"
EXPECTED_PACKAGE = "com.lolclassic.encyclopedia.qa"
REJECTED_PRODUCTION_PACKAGE = "com.lolclassic.encyclopedia"
EXPECTED_ACTIVITY_CLASS = "com.lolclassic.encyclopedia.MainActivity"
# applicationId is QA-scoped while the Java activity keeps the production
# namespace declared by the Android source manifest.
ACTIVITY = f"{EXPECTED_PACKAGE}/{EXPECTED_ACTIVITY_CLASS}"
APP_URL_PREFIX = "https://appassets.androidplatform.net/assets/www/index.html"
DEVTOOLS_PORT = 9222
CAPTURE_RUNTIME_SOURCE_PATHS = (
    "app/src/main/assets/www/data/offline-assets.json",
    "app/src/main/assets/www/index.html",
    "app/src/main/assets/www/nostalgia-218-fidelity.js",
    "app/src/main/assets/www/portrait-fix.js",
    "app/src/main/assets/www/sw.js",
)
EXPECTED_ANDROID_TRACKED_DIFF_PATHS = frozenset()
EXPECTED_ANDROID_PROTECTED_UNTRACKED_SHA256 = {
    "app/src/main/assets/www/home-layout-video-player-fix.js.bak-20260822-160457": (
        "90a9ce4ae4980114b8ada6e68d1ddff6a93579ab9b4bd956681fa978ae423262"
    ),
    "app/src/main/assets/www/home-layout-video-player-fix.js.bak-20260822-160935": (
        "bfe0e5c196b203096f0da0b60de8871fa8f037cd1c6949a89419ecccb54fe128"
    ),
    "app/src/main/assets/www/home-layout-video-player-fix.js.bak-20260822-162011": (
        "d304632fa1b2e59401ac2ec422c8f01fcd67895ac930f3e5dc2a862c86af6885"
    ),
    "app/src/main/assets/www/index.html.bak-20260822-162011": (
        "27a034e9e1244e958fb1047e6e4c578d92e947828d79067f29dba6eb73a075ff"
    ),
}
EXPECTED_ANDROID_LOCAL_EVIDENCE_FILES = frozenset(
    {
        "play-store/android-post-image-qa-version218.json",
        "play-store/android-runtime-qa-classic-fantasy.json",
        "play-store/android-runtime-qa-home-grid-white-feed-thumbnail-drawer-pass.json",
        "play-store/android-runtime-qa-icon-era.json",
        "play-store/android-runtime-qa-phase2b3-final.json",
        "play-store/android-runtime-qa-phase2b3-rerun.json",
        "play-store/android-runtime-qa-phase2b3.json",
        "play-store/android-runtime-qa-rune-patch-final.json",
        "play-store/android-runtime-qa-rune-patch-pass.json",
        "play-store/android-runtime-qa-rune-patch-rerun.json",
        "play-store/android-runtime-qa-rune-patch-upgrade-theme-final.json",
        "play-store/android-runtime-qa-rune-patch-upgrade-theme-pass.json",
        "play-store/android-runtime-qa-version218-fidelity.json",
        "play-store/local-version218-home-grid-qa/report.json",
        "play-store/screenshots/video-feed-proof.png",
        "play-store/skin-portrait-qa.json",
        "play-store/version218-dialog-evidence.json",
        "tools/capture_version218_local_layouts.mjs",
    }
    | {
        f"play-store/local-version218-home-grid-qa/{width}/{filename}"
        for width in ("320", "360", "375", "412")
        for filename in (
            "00-startup.png",
            "01-home.png",
            "01a-home-video-original-thumbnail.png",
            "01b-home-community.png",
            "01c-drawer-white.png",
            "02-champions.png",
            "03-items.png",
            "04-item-detail.png",
            "05-runes.png",
            "06-patch-index.png",
            "07-patch-detail.png",
            "08-mastery.png",
            "09-board-type.png",
            "10-write.png",
            "11-nickname.png",
        )
    }
    | {
        f"play-store/qa-skin-portraits/{filename}"
        for filename in (
            "akali-7-skins.png",
            "fiddlesticks-skins.png",
            "garen-skins.png",
            "ryze-skins.png",
            "shen-skins.png",
            "warwick-skins.png",
        )
    }
)
EXPECTED_ANDROID_UNTRACKED_PATHS = frozenset(
    EXPECTED_ANDROID_PROTECTED_UNTRACKED_SHA256
) | EXPECTED_ANDROID_LOCAL_EVIDENCE_FILES

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
        "store.set('res3mastery3', {}); S.mbranch = 'o'; S.masteryInfo = 'o_08'; go('mastery');",
    ),
    (
        "phone-06-spells.png",
        "SPELL",
        "spells",
        "go('spells');",
    ),
    (
        "phone-07-runes.png",
        "RUNE_218_ARCHIVE",
        "runes",
        "saveRunePage({}, 'archive', 1); S.runeSet = 'archive'; S.runeView = 'list'; S.rslot = 'mark'; S.rq = ''; go('runes');",
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

TOUR: tuple[tuple[str, str, str], ...] = (
    ("HOME", "home", "phone-01-home.png"),
    ("CHAMPION_LIST", "classic", "phone-02-champions.png"),
    ("CHAMPION_DETAIL", "champion/garen/basic", "phone-03-champion-detail.png"),
    ("ITEM", "items", "phone-04-items.png"),
    ("MASTERY", "mastery", "phone-05-masteries.png"),
    ("RUNE", "runes", "phone-07-runes.png"),
    ("PATCH_NEWS", "patchnote/1", "phone-08-patch-news.png"),
    ("COMMUNITY", "board", "phone-10-community.png"),
    ("ABOUT_LEGAL", "about", "phone-09-about-legal.png"),
    ("HOME_RETURN", "home", "phone-01-home.png"),
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
    if tracked_paths != EXPECTED_ANDROID_TRACKED_DIFF_PATHS:
        raise RuntimeError(
            "Android tracked-state gate failed; exact final clean checkpoint required"
        )

    manifest_path = android_repo / "play-store/version-218-fidelity-official-assets.json"
    if not manifest_path.is_file():
        raise RuntimeError("Android version-218 official asset manifest is missing")
    asset_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    asset_paths = frozenset(str(record.get("path", "")) for record in asset_manifest.get("assets", []))
    champion_assets = {
        "app/src/main/assets/www/images/official_champion/kennen.png",
        "app/src/main/assets/www/images/official_champion/shen.png",
    }
    item_assets = {
        path
        for path in asset_paths
        if re.fullmatch(r"app/src/main/assets/www/images/official_item/\d+\.png", path)
    }
    if (
        asset_manifest.get("count") != 151
        or asset_manifest.get("historicalApkGameOrContentAssetsImported") != 0
        or len(asset_paths) != 151
        or len(item_assets) != 149
        or asset_paths != frozenset(champion_assets | item_assets)
    ):
        raise RuntimeError("Android version-218 official asset manifest failed closed")
    for record in asset_manifest["assets"]:
        path = str(record["path"])
        source = android_repo / path
        if (
            not source.is_file()
            or sha256_file(source).upper() != str(record.get("sha256", "")).upper()
            or source.stat().st_size != int(record.get("size", -1))
        ):
            raise RuntimeError(f"Android official asset bytes do not match manifest: {path}")

    for relative, expected_hash in EXPECTED_ANDROID_PROTECTED_UNTRACKED_SHA256.items():
        protected = android_repo / relative
        if not protected.is_file() or sha256_file(protected) != expected_hash:
            raise RuntimeError(f"Android protected untracked file integrity failed: {relative}")

    if untracked_paths != EXPECTED_ANDROID_UNTRACKED_PATHS:
        raise RuntimeError(
            "Android untracked-state gate failed; exact preserved evidence paths required"
        )
    runtime_digest = hashlib.sha256()
    for relative in CAPTURE_RUNTIME_SOURCE_PATHS:
        source = android_repo / relative
        if not source.is_file():
            raise RuntimeError(f"Android runtime source is missing: {relative}")
        runtime_digest.update(relative.encode("utf-8"))
        runtime_digest.update(b"\0")
        runtime_digest.update(source.read_bytes())
        runtime_digest.update(b"\0")
    return {
        "branch": branch,
        "commit": head,
        "trackedState": "authorized-version-218-fidelity-final-commit",
        "trackedPaths": sorted(tracked_paths),
        "preservedUntrackedPaths": sorted(untracked_paths),
        "runtimeSourcePaths": list(CAPTURE_RUNTIME_SOURCE_PATHS),
        "runtimeSourceDiffSha256": runtime_digest.hexdigest(),
        "runtimeSourceFingerprintAlgorithm": (
            "sha256(ordered UTF-8 path NUL file bytes NUL for runtimeSourcePaths)"
        ),
        "officialAssetManifest": {
            "path": "play-store/version-218-fidelity-official-assets.json",
            "count": len(asset_paths),
            "sha256": sha256_file(manifest_path),
            "historicalApkGameOrContentAssetsImported": 0,
        },
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
    community_settle = ""
    if purpose == "COMMUNITY":
        community_settle = """
      for (let attempt = 0; attempt < 300; attempt += 1) {
        const bodyText = document.body.innerText || '';
        if (!bodyText.includes('온라인 게시판을 불러오는 중입니다.')) break;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
        """
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
      {community_settle}
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
    if purpose == "COMMUNITY":
        community_failure_markers = (
            "온라인 게시판을 불러오는 중입니다.",
            "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
            "서버 요청 실패",
        )
        visible_text = str(result.get("text", ""))
        failures = [marker for marker in community_failure_markers if marker in visible_text]
        if failures:
            raise RuntimeError(f"community capture did not settle: {failures}")
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


def build_tour_segment_command(source: Path, destination: Path) -> list[str]:
    return [
        "ffmpeg",
        "-y",
        "-loop",
        "1",
        "-framerate",
        "30",
        "-i",
        str(source),
        "-map",
        "0:v:0",
        "-frames:v",
        "90",
        "-vf",
        "setsar=1,format=yuv420p",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        str(destination),
    ]


def build_tour_concat_command(
    segments: list[Path], destination: Path
) -> list[str]:
    if not segments:
        raise RuntimeError("feature-tour concat requires at least one segment")

    command = ["ffmpeg", "-y"]
    for segment in segments:
        command.extend(["-i", str(segment)])

    normalized_inputs: list[str] = []
    concat_labels: list[str] = []
    for index in range(len(segments)):
        label = f"v{index}"
        normalized_inputs.append(
            f"[{index}:v:0]settb=AVTB,setpts=PTS-STARTPTS,"
            f"setsar=1,format=yuv420p[{label}]"
        )
        concat_labels.append(f"[{label}]")

    normalized_inputs.append(
        f"{''.join(concat_labels)}concat=n={len(segments)}:v=1:a=0[outv]"
    )
    command.extend(
        [
            "-filter_complex",
            ";".join(normalized_inputs),
            "-map",
            "[outv]",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(destination),
        ]
    )
    return command


def inspect_tour_segment(path: Path, purpose: str) -> dict[str, Any]:
    probe = json.loads(
        run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "format=duration,size:stream=codec_name,width,height,avg_frame_rate,nb_frames,duration",
                "-of",
                "json",
                str(path),
            ]
        ).stdout
    )
    streams = probe.get("streams", [])
    if len(streams) != 1:
        raise RuntimeError(f"feature-tour segment has no video stream for {purpose}")
    stream = streams[0]
    fmt = probe.get("format", {})
    duration = float(fmt.get("duration", 0))
    frames = int(stream.get("nb_frames", 0))
    frame_rate = stream.get("avg_frame_rate")
    if (
        stream.get("codec_name") != "h264"
        or int(stream.get("width", 0)) != 1080
        or int(stream.get("height", 0)) != 2340
        or frame_rate != "30/1"
        or not 2.99 <= duration <= 3.01
        or frames != 90
    ):
        raise RuntimeError(
            f"invalid feature-tour segment for {purpose}: "
            f"codec={stream.get('codec_name')!r}, "
            f"size={stream.get('width')}x{stream.get('height')}, "
            f"duration={duration:.3f}, frames={frames}, frameRate={frame_rate!r}"
        )
    return {
        "purpose": purpose,
        "duration": round(duration, 3),
        "frames": frames,
        "frameRate": frame_rate,
        "bytes": int(fmt.get("size", path.stat().st_size)),
        "sha256": sha256_file(path),
    }


def record_tour(screenshots: Path, destination: Path) -> dict[str, Any]:
    route_evidence: list[dict[str, Any]] = []
    segment_evidence: list[dict[str, Any]] = []
    with tempfile.TemporaryDirectory(prefix="phase2b3-video-") as temporary:
        temporary_path = Path(temporary)
        local_segments: list[Path] = []
        for index, (purpose, route, filename) in enumerate(TOUR, start=1):
            source = screenshots / filename
            source_png = inspect_png(source)
            if (
                source_png["width"] != 1080
                or source_png["height"] != 2340
                or source_png["mode"] != "RGB"
            ):
                raise RuntimeError(
                    f"invalid physical-device screenshot for video {purpose}: {source_png}"
                )

            local = temporary_path / f"tour-{index:02d}.mp4"
            run(build_tour_segment_command(source, local))
            segment = inspect_tour_segment(local, purpose)
            segment.update(
                {
                    "route": route,
                    "sourceScreenshot": filename,
                    "sourceScreenshotSha256": source_png["sha256"],
                }
            )
            segment_evidence.append(segment)
            local_segments.append(local)
            route_evidence.append({"purpose": purpose, "route": route})

        destination.parent.mkdir(parents=True, exist_ok=True)
        run(build_tour_concat_command(local_segments, destination))

    probe = json.loads(
        run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration,bit_rate,size:stream=codec_name,width,height,avg_frame_rate,nb_frames",
                "-of",
                "json",
                str(destination),
            ]
        ).stdout
    )
    stream = probe["streams"][0]
    fmt = probe["format"]
    duration = float(fmt["duration"])
    frames = int(stream.get("nb_frames", 0))
    expected_duration = len(TOUR) * 3
    expected_frames = len(TOUR) * 90
    if (
        stream.get("codec_name") != "h264"
        or stream.get("avg_frame_rate") != "30/1"
        or not expected_duration - 0.01 <= duration <= expected_duration + 0.01
        or frames != expected_frames
    ):
        raise RuntimeError(
            "feature-tour did not preserve every verified screenshot segment: "
            f"codec={stream.get('codec_name')!r}, "
            f"frameRate={stream.get('avg_frame_rate')!r}, "
            f"duration={duration:.3f}, frames={frames}"
        )
    return {
        "routes": route_evidence,
        "segments": segment_evidence,
        "width": int(stream["width"]),
        "height": int(stream["height"]),
        "codec": stream["codec_name"],
        "frameRate": stream.get("avg_frame_rate"),
        "frames": frames,
        "duration": round(duration, 3),
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


def copy_historical_launcher_derivative(source: Path, destination: Path) -> dict[str, Any]:
    if not source.is_file():
        raise RuntimeError("historical Android launcher derivative is missing")
    with Image.open(source) as original:
        if original.size != (512, 512) or original.mode != "RGBA":
            raise RuntimeError("historical Android launcher derivative is not 512x512 RGBA")
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
        video_evidence = record_tour(output, output / "app-feature-tour.mp4")
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

    icon = copy_historical_launcher_derivative(
        android_repo / "play-store/assets/app-icon-512.png",
        output / "app-icon.png",
    )
    icon_provenance_path = android_repo / "play-store/historical-launcher-icon-provenance.json"
    if not icon_provenance_path.is_file():
        raise RuntimeError("historical launcher icon provenance is missing")
    icon_provenance = json.loads(icon_provenance_path.read_text(encoding="utf-8"))
    icon_derivative = next(
        (
            derivative
            for derivative in icon_provenance.get("derivatives", [])
            if derivative.get("outputPath") == "play-store/assets/app-icon-512.png"
        ),
        None,
    )
    if (
        icon_provenance.get("category") != "USER_SUPPLIED_HISTORICAL_ASSET"
        or icon_provenance.get("source", {}).get("historicalLauncherSourceImported") != 1
        or icon_provenance.get("otherHistoricalApkBinaryAssetsImportedViaIconException") != 0
        or not isinstance(icon_derivative, dict)
        or str(icon_derivative.get("sha256", "")).lower() != icon["sha256"].lower()
    ):
        raise RuntimeError("historical launcher icon lineage does not match the Public icon bytes")
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
        "historicalLauncherException": {
            "file": "app-icon.png",
            "category": icon_provenance["category"],
            "sourceHistoricalApkSha256": icon_provenance["historicalApk"]["sha256"],
            "sourceHistoricalIconSha256": icon_provenance["source"]["sha256"],
            "sourceHistoricalIconPath": icon_provenance["manifestResolution"][
                "selectedSourceResource"
            ],
            "androidDerivativePath": icon_derivative["outputPath"],
            "derivativeTransformation": icon_derivative["transformation"],
            "historicalLauncherSourceImported": 1,
            "technicalDerivativeCount": icon_provenance["technicalDerivativeCount"],
            "otherHistoricalApkBinaryAssetsImportedViaIconException": 0,
            **icon,
        },
        "projectOwned": {
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

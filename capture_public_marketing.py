from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import queue
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
import zipfile
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
CANONICAL_ANDROID_ROOT = Path.home() / (
    "Documents/Codex/2026-07-24/"
    "files-mentioned-by-the-user-codex/work/LolClassicBeta_codex_recovered"
)
EXPECTED_ANDROID_BRANCH = "codex"
SONA_PATH = "app/src/main/assets/www/images/historical_gallery/sona-user-reference.png"
SONA_SHA256 = "07f68e640983dd888bc6cb4d93b8561ce5098c61053923d17e7a8be7c40d7384"
DEFAULT_COMMUNITY_ROWS = (
    ("1", "[공지] 자유게시판 이용 안내", "운영자"),
    ("5", "시즌 3 추억 공유", "복귀유저"),
    ("4", "룬 조합 공유", "미드라이너"),
    ("3", "가장 좋아했던 챔피언", "탑라이너"),
    ("2", "기억나는 시즌 3 아이템", "소환사"),
)
OFFICIAL_ONLINE_COMMUNITY_ROWS = (
    ("official-welcome-20260729", "[공지] 온라인 자유게시판 이용 안내", "운영자"),
)
EXPECTED_OFFICIAL_ASSET_COUNTS = {
    "official_champion": 3,
    "official_item": 149,
    "official_mastery": 57,
    "official_rune": 12,
}
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
        "S.bfilter = window.__LOLCLASSIC_COMMUNITY_ONLINE__ ? 'best' : 'all'; S.page = 1; go('board');",
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
        self.forward_created = False

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

    def installed_package_hashes(self, package: str) -> dict[str, str]:
        if package not in {EXPECTED_PACKAGE, REJECTED_PRODUCTION_PACKAGE}:
            raise RuntimeError("package hash request is outside the two-package allowlist")
        listing = self.adb("shell", "pm", "path", package)
        hashes: dict[str, str] = {}
        for line in listing.stdout.splitlines():
            if not line.strip():
                continue
            if not line.startswith("package:"):
                raise RuntimeError("installed APK path response was not recognized")
            path = line.removeprefix("package:").strip()
            if not re.fullmatch(r"/data/app/[A-Za-z0-9_./=+~-]+\.apk", path):
                raise RuntimeError("installed APK path did not pass the read-only allowlist")
            result = self.adb("shell", "sha256sum", path).stdout.strip()
            match = re.fullmatch(r"([0-9a-fA-F]{64})\s+(.+)", result)
            if not match or match.group(2) != path or path in hashes:
                raise RuntimeError("installed APK hash result is invalid")
            hashes[path] = match.group(1).lower()
        if not hashes:
            raise RuntimeError(f"required pre-existing package is not installed: {package}")
        return hashes

    def verify_forward_available(self) -> None:
        forwards = run([str(self.adb_path), "forward", "--list"]).stdout.splitlines()
        if any(f"tcp:{DEVTOOLS_PORT}" in line.split() for line in forwards):
            raise RuntimeError("capture DevTools port is already forwarded by another session")

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
        self.forward_created = True
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


def contained_path(root: Path, relative: str) -> Path:
    if not relative or "\\" in relative:
        raise RuntimeError("manifest path is not a repository-relative POSIX path")
    path = (root / relative).resolve()
    if Path(relative).is_absolute() or not path.is_relative_to(root.resolve()):
        raise RuntimeError("manifest path escapes the verified Android repository")
    return path


def verify_asset_manifests(android_repo: Path) -> dict[str, Any]:
    manifest_path = android_repo / "play-store/version-218-fidelity-official-assets.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    records = manifest.get("assets", [])
    paths = [str(record.get("path", "")) for record in records]
    counts: dict[str, int] = {}
    for record, relative in zip(records, paths):
        source = contained_path(android_repo, relative)
        match = re.fullmatch(
            r"app/src/main/assets/www/images/(official_[a-z]+)/[^/]+\.(?:png|jpg)",
            relative,
        )
        if not match:
            raise RuntimeError("unexpected path in the official asset manifest")
        counts[match.group(1)] = counts.get(match.group(1), 0) + 1
        if (
            not str(record.get("sourceUrl", "")).startswith(
                "https://ddragon.leagueoflegends.com/"
            )
            or not source.is_file()
            or sha256_file(source) != str(record.get("sha256", "")).lower()
            or source.stat().st_size != record.get("size")
        ):
            raise RuntimeError(f"official asset source/hash/size gate failed: {relative}")
    if (
        manifest.get("historicalApkGameOrContentAssetsImported") != 0
        or manifest.get("count") != len(paths)
        or len(set(paths)) != len(paths)
        or counts != EXPECTED_OFFICIAL_ASSET_COUNTS
    ):
        raise RuntimeError("current official asset manifest count/category gate failed")

    history_path = android_repo / "play-store/version-218-historical-gallery-assets.json"
    history = json.loads(history_path.read_text(encoding="utf-8"))
    historical = history.get("assets", [])
    if history.get("count") != 1 or len(historical) != 1:
        raise RuntimeError("exactly the verified user-selected historical Sona is required")
    sona = historical[0]
    source = contained_path(android_repo, str(sona.get("path", "")))
    if (
        sona.get("path") != SONA_PATH
        or sona.get("releaseStatus") != "BLOCKED_FOR_PUBLIC_RELEASE"
        or sona.get("localUseStatus") != "USER_REQUESTED_LOCAL_QA_ONLY"
        or str(sona.get("sha256", "")).lower() != SONA_SHA256
        or str(sona.get("sourceAttachmentSha256", "")).lower() != SONA_SHA256
        or not source.is_file()
        or sha256_file(source) != SONA_SHA256
        or source.stat().st_size != sona.get("size")
    ):
        raise RuntimeError("exact old Sona bytes or unresolved local-only status changed")

    provenance_path = android_repo / "play-store/riot-asset-provenance.json"
    provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
    blocked: list[str] = []
    for record in provenance.get("assets", []):
        if record.get("releaseStatus") not in {
            "BLOCKED_FOR_PUBLIC_RELEASE", "NEEDS_REPLACEMENT", "NEEDS_RIOT_CONFIRMATION",
            "UNRESOLVED_NOT_SHIPPED",
        }:
            continue
        relative = str(record.get("path", ""))
        candidate = contained_path(android_repo, relative)
        if not candidate.is_file():
            continue
        if (
            record.get("releaseTreePresent") is not True
            or sha256_file(candidate) != str(record.get("sha256", "")).lower()
        ):
            raise RuntimeError("included unresolved asset contradicts its provenance")
        blocked.append(relative)
    if blocked != [SONA_PATH]:
        raise RuntimeError("local capture requires exactly one identified unresolved Sona asset")
    return {
        "officialAssetManifest": {
            "path": manifest_path.relative_to(android_repo).as_posix(),
            "count": len(paths),
            "countsByDirectory": counts,
            "sha256": sha256_file(manifest_path),
            "historicalApkGameOrContentAssetsImported": 0,
        },
        "releaseReadiness": {
            "status": "BLOCKED_FOR_PUBLIC_RELEASE",
            "localUseStatus": "USER_REQUESTED_LOCAL_QA_ONLY",
            "unresolvedAssetCount": len(blocked),
            "unresolvedAssets": [{"path": SONA_PATH, "sha256": SONA_SHA256}],
            "historicalManifestSha256": sha256_file(history_path),
            "riotProvenanceSha256": sha256_file(provenance_path),
            "rightsStatement": (
                "Current source identity and physical capture do not establish public "
                "or Store redistribution authorization. These are local candidates only."
            ),
        },
    }


def verify_apk_www(android_repo: Path, apk: Path, expected_sha256: str) -> dict[str, Any]:
    if not re.fullmatch(r"[0-9a-fA-F]{64}", expected_sha256):
        raise RuntimeError("an explicit 64-character expected APK SHA-256 is required")
    if not apk.is_file() or sha256_file(apk) != expected_sha256.lower():
        raise RuntimeError("QA APK does not match the explicitly expected SHA-256")
    www = android_repo / "app/src/main/assets/www"
    excluded = {
        Path(relative).relative_to("app/src/main/assets/www").as_posix()
        for relative in EXPECTED_ANDROID_PROTECTED_UNTRACKED_SHA256
    }
    sources = {
        source.relative_to(www).as_posix(): source
        for source in www.rglob("*")
        if source.is_file() and source.relative_to(www).as_posix() not in excluded
    }
    digest = hashlib.sha256()
    with zipfile.ZipFile(apk) as archive:
        entries = [
            name.removeprefix("assets/www/")
            for name in archive.namelist()
            if name.startswith("assets/www/") and not name.endswith("/")
        ]
        if len(set(entries)) != len(entries) or set(entries) != set(sources):
            raise RuntimeError("APK www path set does not match the current source tree")
        for relative, source in sorted(sources.items()):
            if not source.resolve().is_relative_to(www.resolve()):
                raise RuntimeError("Android www source escapes the canonical tree")
            payload = source.read_bytes()
            if archive.read("assets/www/" + relative) != payload:
                raise RuntimeError(f"APK www bytes differ from current source: {relative}")
            digest.update(relative.encode("utf-8") + b"\0" + payload + b"\0")
    offline = json.loads((www / "data/offline-assets.json").read_text(encoding="utf-8"))
    image_paths = [relative for relative in sources if relative.startswith("images/")]
    if (
        offline.get("count") != len(image_paths)
        or sorted(offline.get("assets", [])) != sorted(image_paths)
        or offline.get("totalBytes") != sum(sources[path].stat().st_size for path in image_paths)
    ):
        raise RuntimeError("current offline asset manifest does not match the bundled image set")
    return {
        "apkSha256": expected_sha256.lower(),
        "wwwFileCount": len(sources),
        "wwwContentSha256": digest.hexdigest(),
        "fingerprintAlgorithm": "sha256(sorted UTF-8 www-relative path NUL file bytes NUL)",
        "everyPackagedWwwFileMatchesCurrentSource": True,
        "offlineManifestVerified": True,
    }


def verify_android_repo(android_repo: Path, expected_head: str) -> dict[str, Any]:
    android_repo = android_repo.resolve()
    if android_repo != CANONICAL_ANDROID_ROOT.resolve():
        raise RuntimeError("only the canonical recovered Android repository is allowed")
    if not re.fullmatch(r"[0-9a-fA-F]{40}", expected_head):
        raise RuntimeError("an explicit full expected Android commit is required")
    branch = run(["git", "branch", "--show-current"], cwd=android_repo).stdout.strip()
    head = run(["git", "rev-parse", "HEAD"], cwd=android_repo).stdout.strip()
    tracked_paths = frozenset(
        line
        for line in run(["git", "diff", "HEAD", "--name-only"], cwd=android_repo).stdout.splitlines()
        if line
    )
    untracked_paths = frozenset(
        line
        for line in run(
            ["git", "ls-files", "--others", "--exclude-standard"], cwd=android_repo
        ).stdout.splitlines()
        if line
    )
    if branch != EXPECTED_ANDROID_BRANCH or head != expected_head.lower():
        raise RuntimeError("Android canonical branch/HEAD gate failed")
    if tracked_paths != EXPECTED_ANDROID_TRACKED_DIFF_PATHS:
        raise RuntimeError(
            "Android tracked-state gate failed; exact final clean checkpoint required"
        )

    manifests = verify_asset_manifests(android_repo)

    for relative, expected_hash in EXPECTED_ANDROID_PROTECTED_UNTRACKED_SHA256.items():
        protected = android_repo / relative
        if not protected.is_file() or sha256_file(protected) != expected_hash:
            raise RuntimeError(f"Android protected untracked file integrity failed: {relative}")

    tracked_known = set(run(["git", "ls-files"], cwd=android_repo).stdout.splitlines())
    expected_untracked = EXPECTED_ANDROID_UNTRACKED_PATHS - tracked_known
    if untracked_paths != expected_untracked:
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
        "trackedState": "verified-clean-user-selected-sona-source-commit",
        "trackedPaths": sorted(tracked_paths),
        "preservedUntrackedPaths": sorted(untracked_paths),
        "runtimeSourcePaths": list(CAPTURE_RUNTIME_SOURCE_PATHS),
        "runtimeSourceDiffSha256": runtime_digest.hexdigest(),
        "runtimeSourceFingerprintAlgorithm": (
            "sha256(ordered UTF-8 path NUL file bytes NUL for runtimeSourcePaths)"
        ),
        **manifests,
    }


def evaluate(android_tools: Path, websocket_url: str, expression: str) -> Any:
    encoded = base64.b64encode(expression.encode("utf-8")).decode("ascii")
    result = run(
        ["node", str(android_tools / "webview_eval.mjs"), websocket_url, encoded]
    )
    return json.loads(result.stdout)


def evaluate_private(android_tools: Path, websocket_url: str, expression: str) -> Any:
    """Keep recoverable storage values out of argv and error output."""
    try:
        completed = subprocess.run(
            ["node", str(android_tools / "webview_eval.mjs"), websocket_url, "-"],
            input=expression,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=70,
            check=False,
        )
        if completed.returncode != 0:
            raise RuntimeError("private evaluation failed")
        return json.loads(completed.stdout)
    except Exception:
        raise RuntimeError("private storage operation failed; values withheld") from None


def native_storage_fingerprint(values: dict[str, str]) -> dict[str, Any]:
    # Match the shared helper's JSON.stringify(sorted [key,value] entries),
    # including JS UTF-16 key ordering and well-formed lone-surrogate escaping.
    keys = sorted(values, key=lambda key: key.encode("utf-16-be", errors="surrogatepass"))
    payload = json.dumps([[key, values[key]] for key in keys], ensure_ascii=False, separators=(",", ":"))
    payload = re.sub(r"[\ud800-\udfff]", lambda match: "\\u%04x" % ord(match.group()), payload)
    return {"keyCount": len(keys), "sha256": hashlib.sha256(payload.encode("utf-8")).hexdigest()}


def start_memory_storage_session(
    android_tools: Path, websocket_url: str
) -> tuple[subprocess.Popen[str], dict[str, Any]]:
    process = subprocess.Popen(
        ["node", str(android_tools / "qa_storage_session.mjs"), websocket_url],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding="utf-8", bufsize=1,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    ready_line: queue.Queue[str] = queue.Queue()
    def receive_ready() -> None:
        try:
            ready_line.put(process.stdout.readline() if process.stdout else "")
        except Exception:
            ready_line.put("")
    threading.Thread(target=receive_ready, daemon=True).start()
    try:
        ready = json.loads(ready_line.get(timeout=45))
        if ready.get("mode") != "fresh-in-memory-fixture" or not isinstance(ready.get("nativeStorage"), dict):
            raise RuntimeError("memory storage session readiness is invalid")
        return process, ready
    except Exception:
        if process.poll() is None:
            process.kill()
        process.communicate(timeout=10)
        raise RuntimeError("memory storage setup failed; native QA restart is required") from None


def finish_memory_storage_session(process: subprocess.Popen[str]) -> dict[str, Any]:
    try:
        stdout, _ = process.communicate(input="\n", timeout=20)
        lines = [line for line in stdout.splitlines() if line.strip()]
        result = json.loads(lines[-1]) if lines else None
        if process.returncode != 0 or result != {"preloadRemoved": True}:
            raise RuntimeError("memory storage preload removal was not acknowledged")
        return result
    except Exception:
        if process.poll() is None:
            process.kill()
        process.communicate(timeout=10)
        raise RuntimeError("memory storage cleanup failed; native QA restart is required") from None


def prepare_memory_capture_state(android_tools: Path, websocket_url: str) -> dict[str, Any]:
    result = evaluate(android_tools, websocket_url, """
    (async () => {
      if (window.__qaMemoryStorageActive !== true) throw new Error('fresh memory fixture required');
      for (let attempt = 0; attempt < 120 && (typeof booted === 'undefined' || !booted); attempt++)
        await new Promise(resolve => setTimeout(resolve, 50));
      if (window.__qaMemoryStorageActive !== true || typeof booted === 'undefined' || !booted)
        throw new Error('fresh memory fixture did not boot');
      if (store.get('lolcCommunitySessionV1', null) !== null) throw new Error('unexpected authenticated session');
      store.set('res3nick', '소환사');
      store.set('res3posts', JSON.parse(JSON.stringify(SEED_POSTS)));
      const posts = loadPosts();
      window.__qaMarketingFixturePrepared = true;
      return {memoryFixtureActive: true, fixturePrepared: true, nicknameIsDefault: nick() === '소환사',
        seededPostIds: posts.map(post => String(post.id)).sort(),
        localOwnerCount: posts.filter(post => post.localOwner).length,
        commentCount: posts.reduce((sum, post) => sum + post.comments.length, 0),
        authenticatedSessionPresent: store.get('lolcCommunitySessionV1', null) !== null};
    })()
    """)
    expected = {
        "memoryFixtureActive": True, "fixturePrepared": True, "nicknameIsDefault": True,
        "seededPostIds": ["1", "2", "3", "4", "5"], "localOwnerCount": 0,
        "commentCount": 0, "authenticatedSessionPresent": False,
    }
    if result != expected:
        raise RuntimeError("marketing memory fixture does not match deterministic default data")
    return result


def require_memory_capture_state(android_tools: Path, websocket_url: str) -> None:
    verified = evaluate(android_tools, websocket_url, """
    window.__qaMemoryStorageActive === true && window.__qaMarketingFixturePrepared === true
      && store.get('lolcCommunitySessionV1', null) === null && nick() === '소환사'
    """)
    if verified is not True:
        raise RuntimeError("capture refused because isolated default memory fixture is missing")


def validate_community_rows(state: dict[str, Any]) -> None:
    expected = OFFICIAL_ONLINE_COMMUNITY_ROWS if state.get("communityOnline") else DEFAULT_COMMUNITY_ROWS
    rows = tuple(tuple(row) for row in state.get("communityRows", []))
    if rows != expected or state.get("authenticatedSessionPresent") is not False:
        raise RuntimeError("community capture contains unexpected rows or an authenticated session")


def capture_isolated_png(
    device: SafeDevice, android_tools: Path, websocket_url: str, destination: Path, index: int
) -> dict[str, Any]:
    require_memory_capture_state(android_tools, websocket_url)
    device.wait_for_exact_foreground()
    device.capture_png(destination, index)
    png = inspect_png(destination)
    if (png["width"], png["height"], png["mode"]) != (1080, 2340, "RGB"):
        raise RuntimeError("physical capture dimensions or RGB encoding changed")
    return png


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
    expression = rf"""
    (async () => {{
      if (window.__qaMemoryStorageActive !== true || window.__qaMarketingFixturePrepared !== true)
        throw new Error('isolated marketing fixture required before routing');
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
      let homeFeature = null;
      if ({json.dumps(purpose)} === 'HOME') {{
        const poster = document.querySelector('.hmPoster');
        if (!poster) throw new Error('home feature missing');
        const style = getComputedStyle(poster);
        const url = style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
        if (!url) throw new Error('home feature image URL missing');
        const image = new Image(); image.src = url; await image.decode();
        const bytes = await (await fetch(url)).arrayBuffer();
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
          .map(byte => byte.toString(16).padStart(2, '0')).join('');
        homeFeature = {{url, sha256: hash, width: image.naturalWidth, height: image.naturalHeight,
          backgroundSize: style.backgroundSize, backgroundPosition: style.backgroundPosition}};
      }}
      return {{
        purpose: {json.dumps(purpose)},
        view: S.view,
        hash: location.hash,
        href: location.href,
        memoryFixtureActive: window.__qaMemoryStorageActive === true,
        marketingFixturePrepared: window.__qaMarketingFixturePrepared === true,
        authenticatedSessionPresent: store.get('lolcCommunitySessionV1', null) !== null,
        communityOnline: window.__LOLCLASSIC_COMMUNITY_ONLINE__ === true,
        communityFilter: S.bfilter || 'all',
        communityRows: [...document.querySelectorAll('.brows .brow')].map(row => [
          row.getAttribute('data-post'), row.querySelector('.bt')?.textContent.trim(),
          row.querySelector('.bn')?.textContent.trim()]),
        serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller),
        homeFeature,
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
    if result.get("memoryFixtureActive") is not True or result.get("marketingFixturePrepared") is not True:
        raise RuntimeError("route audit lost the isolated marketing memory fixture")
    expected_hash = f"#{expected_route}"
    if result.get("view") != expected_route or result.get("hash") != expected_hash:
        raise RuntimeError(f"route mismatch for {purpose}: {result.get('view')!r}")
    if (
        not str(result.get("href", "")).startswith(APP_URL_PREFIX)
        or result.get("serviceWorkerControlled") is not False
    ):
        raise RuntimeError("capture runtime is not the current un-cached Android appassets page")
    if purpose == "HOME":
        feature = result.get("homeFeature") or {}
        if (
            not str(feature.get("url", "")).endswith("/images/historical_gallery/sona-user-reference.png")
            or feature.get("sha256") != SONA_SHA256
            or (feature.get("width"), feature.get("height")) != (307, 557)
        ):
            raise RuntimeError("physical home does not render the exact user-selected old Sona bytes")
    if result.get("broken") or result.get("placeholders") or result.get("modalOpen"):
        raise RuntimeError(f"visual preflight failed for {purpose}")
    if result.get("scrollX") != 0 or result.get("scrollY") != 0:
        raise RuntimeError(f"capture scroll was not reset for {purpose}")
    if purpose == "COMMUNITY":
        validate_community_rows(result)
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
        "classification": "PHYSICAL_SCREENSHOT_DERIVED_TOUR",
        "liveScreenRecording": False,
        "captureMethod": "Ten physical screenshots held for 3 seconds each; no live screen recording",
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


def verify_staging_directory(staging: Path, android_repo: Path) -> Path:
    staging = staging.resolve()
    for repository in (PUBLIC_ROOT.resolve(), android_repo.resolve()):
        if staging.is_relative_to(repository) or repository.is_relative_to(staging):
            raise RuntimeError("local marketing staging must be outside both repositories")
    if any((ancestor / ".git").exists() for ancestor in (staging, *staging.parents)):
        raise RuntimeError("local marketing staging must not be inside a Git repository")
    if staging.exists():
        raise RuntimeError("a new, non-existing local staging directory is required")
    return staging


def local_storage_snapshot(android_tools: Path, websocket_url: str) -> dict[str, str]:
    result = evaluate_private(android_tools, websocket_url, """
    (() => {
      if (typeof booted === 'undefined' || !booted)
        throw new Error('existing app must already be booted before storage snapshot');
      if (window.__qaMemoryStorageActive)
        throw new Error('full QA memory fixtures must be removed before marketing capture');
      return Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)]));
    })()
    """)
    if not isinstance(result, dict) or any(
        not isinstance(key, str) or not isinstance(value, str)
        for key, value in result.items()
    ):
        raise RuntimeError("QA LocalStorage snapshot was invalid")
    return result


def snapshot_existing_qa_storage(
    device: SafeDevice, android_tools: Path
) -> tuple[str, dict[str, str]]:
    """Attach to an existing target without launching or restarting the QA app."""
    pid = device.adb("shell", "pidof", EXPECTED_PACKAGE, check=False).stdout.strip()
    if not re.fullmatch(r"[1-9][0-9]*", pid):
        raise RuntimeError("an already-running QA WebView is required for the prelaunch snapshot")
    websocket_url = device.wait_for_webview(android_tools)
    # The synchronous result is also the sole input to storage_fingerprint; a
    # second observation cannot silently become the baseline for the saved values.
    original = local_storage_snapshot(android_tools, websocket_url)
    return websocket_url, original


def storage_fingerprint(values: dict[str, str]) -> dict[str, Any]:
    payload = json.dumps(values, sort_keys=True, ensure_ascii=True).encode("utf-8")
    return {"entries": len(values), "sha256": hashlib.sha256(payload).hexdigest()}


def restore_local_storage(
    android_tools: Path, websocket_url: str, original: dict[str, str]
) -> dict[str, Any]:
    encoded = json.dumps(json.dumps(original, ensure_ascii=True), ensure_ascii=True)
    # Values remain in process memory and are never written to capture evidence.
    evaluate_private(android_tools, websocket_url, """
    (async () => {
      if (globalThis.__qaMemoryStorageActive) throw new Error('native storage restore requires fixture removal');
      for (let attempt = 0; attempt < 120 && (typeof booted === 'undefined' || !booted); attempt++)
        await new Promise(resolve => setTimeout(resolve, 50));
      if (globalThis.__qaMemoryStorageActive || typeof booted === 'undefined' || !booted)
        throw new Error('native QA runtime did not finish booting before storage restore');
      const original = JSON.parse(""" + encoded + """);
      for (const key of Object.keys(localStorage)) {
        if (!Object.hasOwn(original, key)) localStorage.removeItem(key);
      }
      for (const [key, value] of Object.entries(original)) localStorage.setItem(key, value);
      return true;
    })()
    """)
    observed = local_storage_snapshot(android_tools, websocket_url)
    if observed != original:
        raise RuntimeError("QA LocalStorage restoration did not reproduce the original values")
    return {"original": storage_fingerprint(original), "restored": storage_fingerprint(observed), "verified": True}


def restore_capture_state(
    device: SafeDevice,
    android_tools: Path,
    websocket_url: str | None,
    original_storage: dict[str, str] | None,
    original_settings: dict[str, str],
    production_before: dict[str, str],
    *,
    memory_session: subprocess.Popen[str] | None = None,
    memory_session_attempted: bool = False,
) -> dict[str, Any]:
    result: dict[str, Any] = {"errors": [], "storage": {"verified": False}, "settings": {}}
    if memory_session is not None:
        try:
            result["memorySession"] = finish_memory_storage_session(memory_session)
        except Exception as error:
            result["errors"].append("memorySession: " + type(error).__name__)
    if memory_session_attempted:
        # Removing the preload does not replace Storage in the current document.
        # A new native QA process is mandatory before touching original values.
        try:
            device.adb("shell", "am", "force-stop", EXPECTED_PACKAGE)
            device.adb("shell", "am", "start", "-W", "-n", ACTIVITY)
            device.wait_for_exact_foreground()
            websocket_url = device.wait_for_webview(android_tools)
            result["nativeQaRestartedAfterFixture"] = True
        except Exception as error:
            websocket_url = None
            result["errors"].append("nativeQaRestart: " + type(error).__name__)
    if original_storage is None:
        result["storage"] = {"verified": True, "captureStorageMutationsStarted": False}
    else:
        try:
            try:
                if websocket_url is None:
                    raise RuntimeError("original capture WebView session was lost")
                result["storage"] = restore_local_storage(android_tools, websocket_url, original_storage)
            except Exception:
                # An install/restart may invalidate the earlier target. Reconnect only
                # to the known QA activity so the original snapshot is still restored.
                device.adb("shell", "am", "start", "-W", "-n", ACTIVITY)
                device.wait_for_exact_foreground()
                reconnected = device.wait_for_webview(android_tools)
                result["storage"] = restore_local_storage(android_tools, reconnected, original_storage)
                result["storage"]["reconnectedForRestoration"] = True
            # Stop capture-only in-memory timers after the durable values are restored.
            device.adb("shell", "am", "force-stop", EXPECTED_PACKAGE)
        except Exception as error:
            result["errors"].append("localStorage: " + type(error).__name__)
    restored: dict[str, str] = {}
    settings_errors: list[str] = []
    for label, namespace, key in (
        ("accelerometerRotation", "system", "accelerometer_rotation"),
        ("userRotation", "system", "user_rotation"),
        ("headsUpNotifications", "global", "heads_up_notifications_enabled"),
    ):
        try:
            restored[label] = device.restore_setting(namespace, key, original_settings[label])
        except Exception as error:
            settings_errors.append(label + ": " + type(error).__name__)
    result["settings"] = {"original": original_settings, "restored": restored, "verified": not settings_errors}
    result["errors"].extend(settings_errors)
    try:
        after = device.installed_package_hashes(REJECTED_PRODUCTION_PACKAGE)
        result["productionPackage"] = {
            "before": production_before, "after": after, "verified": production_before == after,
        }
        if not production_before or production_before != after:
            raise RuntimeError("production package hashes changed")
    except Exception as error:
        result["errors"].append("productionPackage: " + type(error).__name__)
    try:
        if device.forward_created:
            removed = device.adb("forward", "--remove", f"tcp:{DEVTOOLS_PORT}")
            device.forward_created = False
            result["devtoolsForwardRemoved"] = removed.returncode == 0
        else:
            result["devtoolsForwardRemoved"] = True
    except Exception as error:
        result["errors"].append("devtoolsForward: " + type(error).__name__)
    result["verified"] = not result["errors"]
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Stage data-preserving physical QA marketing candidates outside both repositories."
    )
    parser.add_argument("--expected-serial", required=True)
    parser.add_argument("--android-repo", type=Path, required=True)
    parser.add_argument("--expected-head", required=True)
    parser.add_argument("--apk", type=Path, required=True)
    parser.add_argument("--expected-apk-sha256", required=True)
    parser.add_argument("--staging-dir", type=Path, required=True)
    parser.add_argument("--preflight-only", action="store_true", help="Verify files and hashes without contacting or mutating any device.")
    args = parser.parse_args()

    android_repo = args.android_repo.resolve()
    apk = args.apk.resolve()
    staging = verify_staging_directory(args.staging_dir, android_repo)
    output = staging / "assets"
    evidence_path = staging / "capture-evidence.json"
    require_pillow()

    git = verify_android_repo(android_repo, args.expected_head)
    bundled = verify_apk_www(android_repo, apk, args.expected_apk_sha256)
    if args.preflight_only:
        print(json.dumps({"source": git, "bundledWww": bundled, "deviceContacted": False}, ensure_ascii=False, indent=2))
        return 0
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise RuntimeError("ffmpeg and ffprobe are required before capture starts")
    adb_path = locate_adb()
    aapt = locate_aapt(adb_path)
    device = SafeDevice(adb_path, args.expected_serial)
    gate = device.verify_gate(apk, aapt)
    device.verify_forward_available()
    production_before = device.installed_package_hashes(REJECTED_PRODUCTION_PACKAGE)
    device.installed_package_hashes(EXPECTED_PACKAGE)

    original_settings = {
        "accelerometerRotation": device.read_setting("system", "accelerometer_rotation"),
        "userRotation": device.read_setting("system", "user_rotation"),
        "headsUpNotifications": device.read_setting("global", "heads_up_notifications_enabled", allow_null=True),
    }
    staging.mkdir(parents=True, exist_ok=False)
    captured_at = utc_now()
    screenshot_evidence: list[dict[str, Any]] = []
    video_evidence: dict[str, Any] = {}
    foreground = ""
    capture_settings: dict[str, str] = {}
    websocket_url: str | None = None
    original_storage: dict[str, str] | None = None
    upgrade_storage: dict[str, Any] = {}
    memory_session: subprocess.Popen[str] | None = None
    memory_session_attempted = False
    memory_ready: dict[str, Any] = {}
    memory_prepared: dict[str, Any] = {}
    failure: str | None = None
    source_failure: str | None = None
    phase = "snapshot-already-running-qa-before-launch"
    try:
        websocket_url, original_storage = snapshot_existing_qa_storage(device, android_repo / "tools")
        # Recheck identity and bytes immediately before the only package installation.
        device.verify_gate(apk, aapt)
        verify_apk_www(android_repo, apk, args.expected_apk_sha256)
        phase = "upgrade-qa"
        installed = device.adb("install", "-r", str(apk))
        if "Success" not in installed.stdout:
            raise RuntimeError("QA-only install -r did not report success")
        if list(device.installed_package_hashes(EXPECTED_PACKAGE).values()) != [bundled["apkSha256"]]:
            raise RuntimeError("installed QA APK does not match the verified input APK")
        phase = "configure-capture-settings"
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
        phase = "verify-upgrade-storage"
        after_upgrade = local_storage_snapshot(android_repo / "tools", websocket_url)
        upgrade_storage = {
            "original": storage_fingerprint(original_storage),
            "afterUpgrade": storage_fingerprint(after_upgrade),
            "verified": after_upgrade == original_storage,
        }
        if after_upgrade != original_storage:
            raise RuntimeError("QA upgrade changed existing LocalStorage before capture")

        phase = "start-fresh-memory-marketing-fixture"
        memory_session_attempted = True
        memory_session, memory_ready = start_memory_storage_session(android_repo / "tools", websocket_url)
        if memory_ready["nativeStorage"] != native_storage_fingerprint(original_storage):
            raise RuntimeError("native LocalStorage changed while the memory preload was installed")
        memory_prepared = prepare_memory_capture_state(android_repo / "tools", websocket_url)

        for index, (filename, purpose, route, script) in enumerate(CAPTURES, start=1):
            phase = "capture-" + purpose
            require_memory_capture_state(android_repo / "tools", websocket_url)
            state = route_and_audit(android_repo / "tools", websocket_url, purpose, route, script)
            hits = sensitive_hits(state["text"])
            if hits:
                raise RuntimeError(f"sensitive DOM pattern found in {purpose}: {sorted(hits)}")
            destination = output / filename
            png = capture_isolated_png(device, android_repo / "tools", websocket_url, destination, index)
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
                    "classification": "LOCAL_PHYSICAL_CAPTURE_PENDING_REVIEW",
                    "captureDataMode": "fresh-in-memory-fixture with deterministic default data; existing personal storage excluded",
                    "syntheticContent": False,
                    "runtime": {
                        "href": state["href"], "serviceWorkerControlled": state["serviceWorkerControlled"],
                        "homeFeature": state["homeFeature"],
                        "memoryFixtureActive": state["memoryFixtureActive"],
                        "marketingFixturePrepared": state["marketingFixturePrepared"],
                        "communityOnline": state["communityOnline"],
                        "communityFilter": state["communityFilter"] if purpose == "COMMUNITY" else None,
                        "communityRows": state["communityRows"] if purpose == "COMMUNITY" else [],
                        "authenticatedSessionPresent": state["authenticatedSessionPresent"],
                    },
                    "png": png,
                }
            )

        # app-main-screen is a deliberate poster alias of the freshly captured HOME state.
        shutil.copyfile(output / "phone-01-home.png", output / "app-main-screen.png")
    except (Exception, KeyboardInterrupt) as error:
        # Do not copy device/DOM errors that could include private storage values.
        failure = type(error).__name__
    finally:
        cleanup = restore_capture_state(
            device, android_repo / "tools", websocket_url, original_storage,
            original_settings, production_before,
            memory_session=memory_session, memory_session_attempted=memory_session_attempted,
        )
        write_json(staging / "capture-safety.json", {
            "capturedAt": captured_at, "failureType": failure,
            "failurePhase": phase if failure else None,
            "upgradeStorage": upgrade_storage, "restoration": cleanup,
            "releaseStatus": "BLOCKED_FOR_PUBLIC_RELEASE", "unresolvedAssetCount": 1,
            "storageValuesPersistedToDisk": False, "pmClearCalled": False,
            "storageSnapshotBoundary": "existing running WebView before capture launches, restarts, or installs the QA app",
            "storageSnapshotTaken": original_storage is not None,
            "memoryStorageIsolation": {"attempted": memory_session_attempted, "ready": memory_ready, "prepared": memory_prepared},
        })
    if failure or not cleanup["verified"]:
        raise RuntimeError("capture or state restoration failed; inspect local capture-safety.json")
    # Release the device before the deterministic video/composition workload.
    if verify_android_repo(android_repo, args.expected_head) != git:
        source_failure = "Android source changed during capture"
    if verify_apk_www(android_repo, apk, args.expected_apk_sha256) != bundled:
        source_failure = "Android APK changed during capture"
    if source_failure:
        raise RuntimeError(source_failure)
    video_evidence = record_tour(output, output / "app-feature-tour.mp4")

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
        "classification": "LOCAL_CANDIDATE_NOT_PUBLISHED",
        "releaseStatus": "BLOCKED_FOR_PUBLIC_RELEASE",
        "unresolvedAssetCount": 1,
        "releaseReadiness": git["releaseReadiness"],
        "capturedAt": captured_at,
        "source": {
            "android": git,
            "applicationId": EXPECTED_PACKAGE,
            "apkSha256": sha256_file(apk),
            "bundledWww": bundled,
        },
        "deviceGate": gate,
        "foregroundComponent": foreground,
        "captureSettings": capture_settings,
        "settingsRestoration": cleanup["settings"],
        "localStoragePreservation": {
            "upgrade": upgrade_storage, "restoration": cleanup["storage"], "valuesPersistedToDisk": False,
            "snapshotBoundary": "existing running WebView before capture launches, restarts, or installs the QA app",
            "privateEvaluationTransport": "stdin; saved values are not command arguments",
        },
        "captureDataIsolation": {
            "mode": "fresh-in-memory-fixture", "ready": memory_ready, "prepared": memory_prepared,
            "preloadRemoval": cleanup.get("memorySession"),
            "nativeQaRestartedAfterFixture": cleanup.get("nativeQaRestartedAfterFixture", False),
            "communityRule": "bundled default seed rows in offline mode; sole official notice in online mode",
            "persistentUserPostsOrNicknameUsed": False,
        },
        "productionPackagePreservation": cleanup["productionPackage"],
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
            "featureGraphic": {
                "file": "feature-graphic.png", "classification": "SCREENSHOT_DERIVED_MARKETING_COMPOSITION",
                "syntheticPhysicalCapture": False, **feature,
            },
        },
        "safety": {
            "productionPackageMutationCount": 0,
            "productionPackage": REJECTED_PRODUCTION_PACKAGE,
            "qaPackageOnly": True,
            "domTextPatternScanPassed": True,
            "personalDataReviewedByAutomation": False,
            "manualVisualReviewRequired": True,
            "publicReleaseAuthorized": False,
            "pmClearCalled": False,
            "devtoolsForwardRemoved": cleanup["devtoolsForwardRemoved"],
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

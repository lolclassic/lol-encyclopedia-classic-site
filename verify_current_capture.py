"""Read-only checks for the current physical-device capture publication.

This verifies the published capture evidence, not whole-APK release permission.
The legacy capture/finalizer scripts retain their original release gates.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCREENS = (
    "phone-01-rune-page.png", "phone-02-champions.png",
    "phone-03-champion-detail.png", "phone-04-items.png",
    "phone-05-masteries.png", "phone-06-spells.png", "phone-07-runes.png",
    "phone-08-patch-news.png", "phone-09-about-legal.png", "phone-10-contact.png",
)


def validate(evidence: dict, manifest: dict, root: Path = ROOT) -> list[str]:
    failures = []

    def require(condition: bool, name: str) -> None:
        if not condition:
            failures.append(name)

    require(evidence.get("schemaVersion") == 2, "capture-schema")
    require(evidence.get("wholeApkReleaseAuthorizationAsserted") is False,
            "capture-not-release-authorization")
    for field in ("physicalDeviceVerified", "storagePreserved",
                  "productionPackageUnchanged", "notificationsRestored"):
        require(evidence.get("validation", {}).get(field) is True, field)
    for field in ("externalWrites", "runtimeErrors"):
        require(evidence.get("validation", {}).get(field) == 0, field)
    require(evidence.get("validation", {}).get("inquirySent") is False, "inquiry")
    binding = evidence.get("source", {})
    require(binding.get("allBundledWebBytesMatchSource") is True, "apk-source-binding")
    require(binding.get("applicationId") == "com.lolclassic.encyclopedia.qa", "qa-package")
    require(bool(binding.get("webAssetCount")), "web-asset-count")
    shots = evidence.get("screenshots", [])
    require(tuple(shot.get("file") for shot in shots) == SCREENS, "exact-screen-set")
    records = manifest.get("assets", [])
    by_name = {record.get("filename"): record for record in records}
    expected = set(SCREENS) | {"app-main-screen.png", "app-feature-tour.mp4", "app-icon.png"}
    require(set(by_name) == expected and len(records) == len(expected), "exact-media-set")
    require(evidence.get("manualReview", {}).get("completed") is True, "manual-review")
    for field in ("personalDataFound", "notificationContentFound", "notificationIconsFound"):
        require(evidence.get("manualReview", {}).get(field) is False, f"privacy-review:{field}")
    require(evidence.get("validation", {}).get("systemUiDemoRestored") is True, "system-ui-restoration")
    require(evidence.get("manualReview", {}).get("reviewedVideoSha256") ==
            by_name.get("app-feature-tour.mp4", {}).get("outputSha256"), "video-review-binding")
    for shot in shots:
        name = shot.get("file", "")
        if name not in SCREENS:
            continue
        path = root / "assets" / name
        if not path.is_file():
            failures.append(f"missing:{name}")
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        require(digest == shot.get("sha256") == by_name.get(name, {}).get("outputSha256"),
                f"capture-hash:{name}")
        require(shot.get("unresolvedVisibleCount") == 0, f"visible-review:{name}")
        require(evidence.get("manualReview", {}).get("reviewedScreenshots", {}).get(name) == digest,
                f"image-review-binding:{name}")
        for asset in shot.get("visibleAssets", []):
            relative = asset.get("path", "")
            require(relative.startswith("images/") and ".." not in Path(relative).parts
                    and "historical_gallery" not in relative.lower(), f"visible-source:{name}")
            require(len(asset.get("sha256", "")) == 64, f"visible-source-hash:{name}")
    for name, record in by_name.items():
        if name == "app-icon.png":
            continue  # Its unchanged historical lineage is checked by the public verifier.
        require(record.get("sourceApkSha256") == binding.get("apkSha256"), f"source-apk:{name}")
        require(record.get("sourceAndroidCommit") == binding.get("androidCommit"), f"source-commit:{name}")
        require(record.get("sourceAndroidRuntimeDiffSha256") == binding.get("runtimeDiffSha256"),
                f"source-diff:{name}")
    require(by_name.get("app-main-screen.png", {}).get("outputSha256") ==
            by_name.get(SCREENS[0], {}).get("outputSha256"), "poster-alias")
    video = evidence.get("video", {})
    require(video.get("outputSha256") == by_name.get("app-feature-tour.mp4", {}).get("outputSha256"),
            "video-evidence-binding")
    require(video.get("captureMethod") == "Android screenrecord", "native-video")
    require(video.get("visualStreamUnchanged") is True, "unchanged-video-stream")
    published_video = root / "assets" / "app-feature-tour.mp4"
    if published_video.is_file():
        try:
            result = subprocess.run(
                ["ffmpeg", "-v", "error", "-i", str(published_video), "-map", "0:v:0",
                 "-c:v", "copy", "-f", "hash", "-hash", "sha256", "-"],
                capture_output=True, text=True, check=True, timeout=30,
            )
            actual = result.stdout.strip().removeprefix("SHA256=")
            require(actual == video.get("videoStreamSha256"), "recorded-video-stream-hash")
        except (OSError, subprocess.SubprocessError):
            failures.append("recorded-video-stream-unreadable")
    else:
        failures.append("missing-video")
    return failures


def main() -> int:
    evidence = json.loads((ROOT / "capture-evidence.json").read_text(encoding="utf-8"))
    manifest = json.loads((ROOT / "assets/media-provenance.json").read_text(encoding="utf-8"))
    failures = validate(evidence, manifest)
    print(json.dumps({"result": "FAIL" if failures else "PASS", "failures": failures,
                      "screenshots": len(SCREENS), "mediaRecords": len(manifest["assets"]),
                      "wholeApkReleaseAuthorizationAsserted": False}, indent=2))
    return int(bool(failures))


if __name__ == "__main__":
    raise SystemExit(main())

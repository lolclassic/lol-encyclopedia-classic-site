from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
EVIDENCE = ROOT / "capture-evidence.json"
OUTPUT = ROOT / "assets/media-provenance.json"
EXPECTED_PACKAGE = "com.lolclassic.encyclopedia.qa"
EXPECTED_SCREENSHOTS = (
    "phone-01-home.png",
    "phone-02-champions.png",
    "phone-03-champion-detail.png",
    "phone-04-items.png",
    "phone-05-masteries.png",
    "phone-06-spells.png",
    "phone-07-runes.png",
    "phone-08-patch-news.png",
    "phone-09-about-legal.png",
    "phone-10-community.png",
)
CAPTURE_RUNTIME_SOURCE_PATHS = (
    "app/src/main/assets/www/app.js",
    "app/src/main/assets/www/final-ui-hotfix.js",
    "app/src/main/assets/www/index.html",
    "app/src/main/assets/www/sw.js",
)

OFFICIAL_CONTENT_FILES = {
    "phone-01-home.png",
    "phone-02-champions.png",
    "phone-03-champion-detail.png",
    "phone-06-spells.png",
    "app-main-screen.png",
    "app-feature-tour.mp4",
    "feature-graphic.png",
}

NOTES = {
    "phone-01-home.png": "Current-build home capture; the reviewed news row and all archive controls are readable.",
    "phone-02-champions.png": "Current-build Classic champion list; two documented text-only portrait fallbacks remain intentional.",
    "phone-03-champion-detail.png": "Current-build champion detail with project-owned rectangular price markers.",
    "phone-04-items.png": "Current-build text-first item index; unresolved item artwork remains excluded.",
    "phone-05-masteries.png": "Current-build mastery index; heading and intended line breaks render normally with no literal br markup.",
    "phone-06-spells.png": "Current-build spell index; heading, icons, and card text are readable.",
    "phone-07-runes.png": "Current-build rune capture showing Classic excluded and the honest editorial omission state.",
    "phone-08-patch-news.png": "Current-build archived patch-news capture with project-owned rectangular close control.",
    "phone-09-about-legal.png": "Current-build about and legal capture; only project and Riot legal notice text is visible.",
    "phone-10-community.png": "Current-build community capture; no real account identifier or personal data is visible.",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def common_record(
    evidence: dict[str, Any], filename: str, *, source_type: str, purpose: str
) -> dict[str, Any]:
    source = evidence["source"]
    gate = evidence["deviceGate"]
    official = filename in OFFICIAL_CONTENT_FILES
    return {
        "filename": filename,
        "localPath": f"assets/{filename}",
        "sourceType": source_type,
        "sourceAndroidCommit": source["android"]["commit"],
        "sourceAndroidRuntimeDiffSha256": source["android"][
            "runtimeSourceDiffSha256"
        ],
        "sourceApplicationId": source["applicationId"],
        "sourceApkSha256": source["apkSha256"],
        "captureDate": evidence["capturedAt"],
        "deviceModel": gate["model"],
        "currentScreenPurpose": purpose,
        "containsRiotOfficialAssetInsideAppUI": official,
        "containsOfficialRiotContentInsideAppUI": official,
        "projectOwnedChrome": True,
        "unresolvedAssetCount": 0,
        "personalDataReviewed": True,
    }


def reconcile_runtime_source_fingerprint(
    evidence: dict[str, Any], android_repo: Path
) -> None:
    android_repo = android_repo.resolve()
    source = evidence["source"]
    android = source["android"]
    head = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=android_repo,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    ).stdout.strip()
    if head != android["commit"]:
        raise RuntimeError("Android HEAD no longer matches the capture source commit")

    changed = subprocess.run(
        ["git", "diff", "--name-only", "--", *CAPTURE_RUNTIME_SOURCE_PATHS],
        cwd=android_repo,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    ).stdout.splitlines()
    captured_tracked_paths = set(android.get("trackedPaths", []))
    expected_changed = tuple(
        path for path in CAPTURE_RUNTIME_SOURCE_PATHS if path in captured_tracked_paths
    )
    if tuple(changed) != expected_changed:
        raise RuntimeError("Android runtime source allowlist is incomplete or out of order")

    binary_diff = subprocess.run(
        [
            "git",
            "diff",
            "--binary",
            "--no-ext-diff",
            "--",
            *CAPTURE_RUNTIME_SOURCE_PATHS,
        ],
        cwd=android_repo,
        check=True,
        capture_output=True,
    ).stdout
    runtime_diff_sha256 = hashlib.sha256(binary_diff).hexdigest()
    if android.get("runtimeSourceDiffSha256") != runtime_diff_sha256:
        raise RuntimeError("Android runtime source diff changed after capture")
    apk = android_repo / "app/build/outputs/apk/debug/app-debug.apk"
    if not apk.is_file() or sha256(apk) != source["apkSha256"]:
        raise RuntimeError("current debug APK bytes do not match the capture evidence")

    android.pop("trackedDiffSha256", None)
    android["runtimeSourcePaths"] = list(CAPTURE_RUNTIME_SOURCE_PATHS)
    android["runtimeSourceDiffSha256"] = runtime_diff_sha256
    android["runtimeSourceFingerprintAlgorithm"] = (
        "sha256(git diff --binary --no-ext-diff -- ordered runtimeSourcePaths)"
    )


def sync_android_play_screenshots(
    evidence: dict[str, Any], android_repo: Path
) -> Path:
    android_repo = android_repo.resolve()
    screenshot_dir = android_repo / "play-store/screenshots"
    evidence_path = android_repo / "play-store/screenshot-evidence.json"
    if not screenshot_dir.is_dir() or not evidence_path.is_file():
        raise RuntimeError("Android Play screenshot destinations are missing")

    captures = evidence["screenshots"]
    if tuple(capture["file"] for capture in captures) != EXPECTED_SCREENSHOTS:
        raise RuntimeError("capture set does not match the exact Android Play allowlist")

    prepared: list[tuple[Path, Path, dict[str, Any]]] = []
    for capture in captures:
        filename = capture["file"]
        source = ROOT / "assets" / filename
        destination = screenshot_dir / filename
        png = capture["png"]
        if (
            not source.is_file()
            or sha256(source) != png["sha256"]
            or source.stat().st_size != png["bytes"]
            or png["width"] != 1080
            or png["height"] != 2340
            or png["mode"] != "RGB"
        ):
            raise RuntimeError(f"reviewed screenshot source is invalid: {filename}")
        prepared.append((source, destination, capture))

    for source, destination, _ in prepared:
        shutil.copyfile(source, destination)

    source = evidence["source"]
    gate = evidence["deviceGate"]
    screenshot_evidence = {
        "schemaVersion": 2,
        "source": {
            "repository": "lol-encyclopedia-classic-site-repo",
            "evidencePath": "capture-evidence.json",
            "capturedAt": evidence["capturedAt"],
            "androidCommit": source["android"]["commit"],
            "androidTrackedState": source["android"]["trackedState"],
            "package": source["applicationId"],
            "apkSha256": source["apkSha256"],
            "captureMethod": "audited physical-device QA screencap",
        },
        "deviceSafety": {
            "physicalDevice": gate["physicalDevice"],
            "kernelQemu": gate["kernelQemu"],
            "exactlyOneAuthorizedTarget": gate["exactlyOneAuthorizedTarget"],
            "qaPackageOnly": True,
            "productionPackageRejected": gate["productionPackageRejected"],
            "productionPackageMutationCount": 0,
            "settingsRestored": evidence["settingsRestoration"]["verified"],
        },
        "screenshots": [
            {
                "file": capture["file"],
                "purpose": capture["purpose"],
                "route": capture["route"],
                "sourceMapping": f"assets/{capture['file']}",
                "width": capture["png"]["width"],
                "height": capture["png"]["height"],
                "mode": capture["png"]["mode"],
                "bytes": capture["png"]["bytes"],
                "sha256": capture["png"]["sha256"],
                "privacyReviewed": True,
                "classification": "CURRENT_AND_MATCHING",
            }
            for _, _, capture in prepared
        ],
        "summary": {
            "authoritativePlayScreenshotSources": 1,
            "currentAndMatching": len(prepared),
            "stale": 0,
            "invalid": 0,
            "hashMismatches": 0,
            "manualPrivacyReviewCompleted": True,
        },
    }
    temporary = evidence_path.with_suffix(".json.tmp")
    temporary.write_text(
        json.dumps(screenshot_evidence, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, evidence_path)
    return evidence_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Finalize manually reviewed Public media provenance.")
    parser.add_argument("--manual-visual-review-accepted", action="store_true")
    parser.add_argument(
        "--android-repo",
        type=Path,
        help="Also sync the reviewed ten-file set into the Android Play evidence paths.",
    )
    args = parser.parse_args()
    if not args.manual_visual_review_accepted:
        raise RuntimeError("manual visual review acceptance is required")

    evidence = json.loads(EVIDENCE.read_text(encoding="utf-8"))
    if evidence["source"]["applicationId"] != EXPECTED_PACKAGE:
        raise RuntimeError("capture evidence is not QA-package scoped")
    if evidence["safety"]["productionPackageMutationCount"] != 0:
        raise RuntimeError("production package mutation evidence is not zero")
    if evidence["settingsRestoration"]["verified"] is not True:
        raise RuntimeError("device settings restoration was not verified")
    if len(evidence["screenshots"]) != 10:
        raise RuntimeError("exactly ten screenshots are required")
    for screenshot in evidence["screenshots"]:
        if screenshot["brokenImages"] or screenshot["placeholderCount"]:
            raise RuntimeError(f"invalid capture evidence: {screenshot['file']}")
        if screenshot["domTextPatternHits"]:
            raise RuntimeError(f"sensitive DOM pattern evidence: {screenshot['file']}")

    if args.android_repo is None:
        raise RuntimeError(
            "--android-repo is required to reproduce the runtime source fingerprint"
        )
    reconcile_runtime_source_fingerprint(evidence, args.android_repo)
    evidence_temporary = EVIDENCE.with_suffix(".json.tmp")
    evidence_temporary.write_text(
        json.dumps(evidence, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    os.replace(evidence_temporary, EVIDENCE)

    records: list[dict[str, Any]] = []
    for screenshot in evidence["screenshots"]:
        filename = screenshot["file"]
        png = screenshot["png"]
        record = common_record(
            evidence,
            filename,
            source_type="PROJECT_OWNED_SCREEN_CAPTURE",
            purpose=screenshot["purpose"],
        )
        record.update(
            {
                "mediaType": "image/png",
                "captureMethod": "adb screencap -p on the authorized physical device after exact QA foreground verification",
                "width": png["width"],
                "height": png["height"],
                "bytes": png["bytes"],
                "outputSha256": png["sha256"],
                "classification": "CURRENT_AND_MATCHING",
                "notes": NOTES[filename],
            }
        )
        records.append(record)

    main_screen = evidence["appMainScreen"]["png"]
    record = common_record(
        evidence,
        "app-main-screen.png",
        source_type="PROJECT_OWNED_SCREEN_CAPTURE",
        purpose="HOME_VIDEO_POSTER",
    )
    record.update(
        {
            "mediaType": "image/png",
            "captureMethod": "Byte-identical copy of the manually reviewed phone-01-home.png capture",
            "width": main_screen["width"],
            "height": main_screen["height"],
            "bytes": main_screen["bytes"],
            "outputSha256": main_screen["sha256"],
            "classification": "CURRENT_AND_MATCHING",
            "notes": "Poster alias of the reviewed authentic HOME capture.",
        }
    )
    records.append(record)

    video = evidence["video"]
    record = common_record(
        evidence,
        "app-feature-tour.mp4",
        source_type="PROJECT_OWNED_SCREEN_CAPTURE",
        purpose="FEATURE_TOUR",
    )
    record.update(
        {
            "mediaType": "video/mp4",
            "captureMethod": "adb screenrecord on the authorized physical device, stream-copied with faststart metadata",
            "width": video["width"],
            "height": video["height"],
            "duration": video["duration"],
            "codec": video["codec"],
            "fps": video["frameRate"],
            "bitRate": video["bitRate"],
            "bytes": video["bytes"],
            "outputSha256": video["sha256"],
            "classification": "CURRENT_AND_MATCHING",
            "notes": "Representative frames across the audited route tour were manually reviewed; no personal data or notification content was observed.",
        }
    )
    records.append(record)

    feature = evidence["projectOwned"]["featureGraphic"]
    record = common_record(
        evidence,
        "feature-graphic.png",
        source_type="PROJECT_OWNED_COMPOSITION",
        purpose="PUBLIC_FEATURE_GRAPHIC",
    )
    record.update(
        {
            "mediaType": "image/png",
            "captureMethod": "Deterministic project-owned archive composition using the current reviewed HOME and CHAMPION_DETAIL captures",
            "width": feature["width"],
            "height": feature["height"],
            "bytes": feature["bytes"],
            "outputSha256": feature["sha256"],
            "classification": "PROJECT_OWNED_COMPOSITION",
            "notes": "Project-owned navy, parchment, bronze framing and typography; embedded app screenshots contain official imagery only inside the app UI.",
        }
    )
    records.append(record)

    icon = evidence["historicalLauncherException"]
    icon_provenance_path = (
        args.android_repo.resolve()
        / "play-store/historical-launcher-icon-provenance.json"
    )
    if not icon_provenance_path.is_file():
        raise RuntimeError("historical launcher icon provenance is missing")
    icon_provenance = json.loads(icon_provenance_path.read_text(encoding="utf-8"))
    icon_derivative = next(
        (
            derivative
            for derivative in icon_provenance.get("derivatives", [])
            if derivative.get("outputPath") == icon.get("androidDerivativePath")
        ),
        None,
    )
    if (
        icon_provenance.get("category") != "USER_SUPPLIED_HISTORICAL_ASSET"
        or icon.get("category") != icon_provenance.get("category")
        or icon.get("sourceHistoricalApkSha256")
        != icon_provenance.get("historicalApk", {}).get("sha256")
        or icon.get("sourceHistoricalIconSha256")
        != icon_provenance.get("source", {}).get("sha256")
        or icon.get("sourceHistoricalIconPath")
        != icon_provenance.get("manifestResolution", {}).get(
            "selectedSourceResource"
        )
        or icon.get("historicalLauncherSourceImported") != 1
        or icon.get("otherHistoricalApkBinaryAssetsImportedViaIconException") != 0
        or not isinstance(icon_derivative, dict)
        or str(icon_derivative.get("sha256", "")).lower()
        != str(icon.get("sha256", "")).lower()
    ):
        raise RuntimeError("Public icon lineage does not match Android historical provenance")
    record = common_record(
        evidence,
        "app-icon.png",
        source_type="USER_SUPPLIED_HISTORICAL_LAUNCHER_DERIVATIVE",
        purpose="PUBLIC_APP_ICON",
    )
    record.update(
        {
            "mediaType": "image/png",
            "captureMethod": "Byte-identical copy of the Android 512px technical derivative mechanically generated from the manifest-linked historical launcher icon",
            "width": icon["width"],
            "height": icon["height"],
            "bytes": icon["bytes"],
            "outputSha256": icon["sha256"],
            "classification": "USER_AUTHORIZED_HISTORICAL_EXCEPTION",
            "projectOwnedChrome": False,
            "sourceHistoricalApkSha256": icon["sourceHistoricalApkSha256"],
            "sourceHistoricalIconSha256": icon["sourceHistoricalIconSha256"],
            "sourceHistoricalIconPath": icon["sourceHistoricalIconPath"],
            "sourceAndroidDerivativePath": icon["androidDerivativePath"],
            "sourceAndroidDerivativeSha256": icon_derivative["sha256"],
            "derivativeTransformation": icon["derivativeTransformation"],
            "historicalLauncherSourceImported": 1,
            "otherHistoricalApkBinaryAssetsImportedViaIconException": 0,
            "notes": "User-authorized sole historical binary exception: the verified manifest-linked blue/gold L launcher icon, mechanically resized without redesign for Android and Public presentation.",
        }
    )
    records.append(record)

    for record in records:
        path = ROOT / record["localPath"]
        if not path.is_file() or sha256(path) != record["outputSha256"]:
            raise RuntimeError(f"media byte verification failed: {record['filename']}")

    previous = json.loads(OUTPUT.read_text(encoding="utf-8"))
    reviewed_at = utc_now()
    payload = {
        "schemaVersion": 1,
        "generatedAt": reviewed_at,
        "sourceAndroidCommit": evidence["source"]["android"]["commit"],
        "sourceAndroidRuntimeDiffSha256": evidence["source"]["android"][
            "runtimeSourceDiffSha256"
        ],
        "sourceApplicationId": evidence["source"]["applicationId"],
        "sourceApkSha256": evidence["source"]["apkSha256"],
        "captureDevice": {
            "model": evidence["deviceGate"]["model"],
            "androidRelease": evidence["deviceGate"]["androidRelease"],
            "apiLevel": evidence["deviceGate"]["apiLevel"],
            "physicalDeviceVerified": evidence["deviceGate"]["physicalDevice"],
            "serialRecorded": False,
        },
        "manualReview": {
            "completed": True,
            "reviewedAt": reviewed_at,
            "method": "All ten final screenshots plus five representative feature-tour frames reviewed at source capture dimensions",
            "personalDataFound": False,
            "notificationContentFound": False,
            "literalBrPresentationFound": False,
            "staleTealOrMinimalScreenFound": False,
            "brokenAssetFound": False,
            "lowContrastRegressionFound": False,
        },
        "retiredAssetFilesRemovedByPublicRefresh": previous.get(
            "retiredAssetFilesRemovedByPublicRefresh", []
        ),
        "assets": records,
        "summary": {
            "currentAndMatching": sum(
                record["classification"] == "CURRENT_AND_MATCHING" for record in records
            ),
            "currentButMarketingCrop": 0,
            "projectOwnedComposition": sum(
                record["classification"] == "PROJECT_OWNED_COMPOSITION" for record in records
            ),
            "historicalLauncherException": sum(
                record["classification"] == "USER_AUTHORIZED_HISTORICAL_EXCEPTION"
                for record in records
            ),
            "stale": 0,
            "invalid": 0,
        },
    }
    temporary = OUTPUT.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, OUTPUT)
    print(f"Wrote {len(records)} reviewed media records to {OUTPUT}")
    if args.android_repo is not None:
        android_evidence = sync_android_play_screenshots(evidence, args.android_repo)
        print(f"Synced reviewed Android Play evidence to {android_evidence}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

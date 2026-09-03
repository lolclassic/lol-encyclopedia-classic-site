from __future__ import annotations

import argparse
import copy
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
    "app/src/main/assets/www/data/offline-assets.json",
    "app/src/main/assets/www/index.html",
    "app/src/main/assets/www/nostalgia-218-fidelity.js",
    "app/src/main/assets/www/portrait-fix.js",
    "app/src/main/assets/www/sw.js",
)

OFFICIAL_CONTENT_FILES = {
    "phone-01-home.png",
    "phone-02-champions.png",
    "phone-03-champion-detail.png",
    "phone-04-items.png",
    "phone-06-spells.png",
    "app-main-screen.png",
    "app-feature-tour.mp4",
    "feature-graphic.png",
}

NOTES = {
    "phone-01-home.png": "Current-build 218-style home capture; the two-row rotation, news tabs, and archive controls are readable.",
    "phone-02-champions.png": "Current-build 218-style Classic champion list; all 63 portraits load, including the two official supplements.",
    "phone-03-champion-detail.png": "Current-build champion detail using the restored compact historical interface.",
    "phone-04-items.png": "Current-build 218-style item index; all 149 version-pinned official item icons load.",
    "phone-05-masteries.png": "Current-build compact mastery tree; the selected description remains visible on the same screen.",
    "phone-06-spells.png": "Current-build spell index; heading, icons, and card text are readable.",
    "phone-07-runes.png": "Current-build 218-style four-tab rune archive with source-truthful historical text and selection state.",
    "phone-08-patch-news.png": "Current-build archived patch-news capture with parchment document presentation.",
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


def capture_commit_reaches_head(
    android_repo: Path, capture_commit: str, head: str
) -> bool:
    if head == capture_commit:
        return True
    ancestry = subprocess.run(
        ["git", "merge-base", "--is-ancestor", capture_commit, head],
        cwd=android_repo,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return ancestry.returncode == 0


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
    capture_commit = android["commit"]
    if not capture_commit_reaches_head(android_repo, capture_commit, head):
        raise RuntimeError(
            "Android capture source commit is not an ancestor of current HEAD"
        )
    android["currentHeadAtFinalization"] = head
    android["captureCommitAncestorOfCurrentHead"] = True

    runtime_digest = hashlib.sha256()
    for relative in CAPTURE_RUNTIME_SOURCE_PATHS:
        source_path = android_repo / relative
        if not source_path.is_file():
            raise RuntimeError(f"Android runtime source is missing: {relative}")
        runtime_digest.update(relative.encode("utf-8"))
        runtime_digest.update(b"\0")
        runtime_digest.update(source_path.read_bytes())
        runtime_digest.update(b"\0")
    runtime_diff_sha256 = runtime_digest.hexdigest()
    if android.get("runtimeSourceDiffSha256") != runtime_diff_sha256:
        raise RuntimeError("Android runtime source diff changed after capture")
    apk = android_repo / "app/build/outputs/apk/debug/app-debug.apk"
    if not apk.is_file() or sha256(apk) != source["apkSha256"]:
        raise RuntimeError("current debug APK bytes do not match the capture evidence")

    android.pop("trackedDiffSha256", None)
    android["runtimeSourcePaths"] = list(CAPTURE_RUNTIME_SOURCE_PATHS)
    android["runtimeSourceDiffSha256"] = runtime_diff_sha256
    android["runtimeSourceFingerprintAlgorithm"] = (
        "sha256(ordered UTF-8 path NUL file bytes NUL for runtimeSourcePaths)"
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

    try:
        existing_evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError("existing Android screenshot evidence is unreadable") from exc

    if not android_evidence_has_preserved_details(existing_evidence):
        current_source = existing_evidence.get("source", {})
        current_captures = existing_evidence.get("screenshots", [])
        capture_hashes = {
            capture["file"]: capture["png"]["sha256"] for capture in captures
        }
        if (
            current_source.get("repository") != "lol-encyclopedia-classic-site-repo"
            or current_source.get("evidencePath") != "capture-evidence.json"
            or current_source.get("apkSha256") != evidence["source"]["apkSha256"]
            or not isinstance(current_captures, list)
            or {
                capture.get("file"): capture.get("sha256")
                for capture in current_captures
                if isinstance(capture, dict)
            }
            != capture_hashes
        ):
            raise RuntimeError(
                "Android screenshot evidence lacks preserved details and is not "
                "the verified generated migration payload"
            )
        git = shutil.which("git")
        if git is None:
            raise RuntimeError("git is required to recover preserved Android evidence")
        baseline_result = subprocess.run(
            [git, "show", "HEAD:play-store/screenshot-evidence.json"],
            cwd=android_repo,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        if baseline_result.returncode != 0:
            raise RuntimeError("could not read preserved Android evidence from HEAD")
        try:
            baseline = json.loads(baseline_result.stdout)
        except json.JSONDecodeError as exc:
            raise RuntimeError("preserved Android evidence in HEAD is invalid") from exc
        if (
            not android_evidence_has_preserved_details(baseline)
            or baseline.get("source", {}).get("apkSha256")
            != evidence["source"]["apkSha256"]
        ):
            raise RuntimeError(
                "preserved Android evidence does not describe the captured APK"
            )
        existing_evidence = baseline

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

    screenshot_evidence = merge_android_play_evidence(
        existing_evidence,
        evidence,
        [capture for _, _, capture in prepared],
    )
    temporary = evidence_path.with_suffix(".json.tmp")
    temporary.write_text(
        json.dumps(screenshot_evidence, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, evidence_path)
    return evidence_path


def android_evidence_has_preserved_details(evidence: dict[str, Any]) -> bool:
    device_safety = evidence.get("deviceSafety")
    video_audit = evidence.get("videoAudit")
    captures = evidence.get("screenshots")
    if not isinstance(device_safety, dict):
        return False
    before = device_safety.get("productionHashesBefore")
    after = device_safety.get("productionHashesAfter")
    return bool(
        isinstance(before, dict)
        and before
        and before == after
        and isinstance(video_audit, dict)
        and isinstance(video_audit.get("runtime"), dict)
        and isinstance(video_audit.get("physicalProof"), dict)
        and isinstance(captures, list)
        and len(captures) == len(EXPECTED_SCREENSHOTS)
        and all(
            isinstance(capture, dict) and isinstance(capture.get("runtime"), dict)
            for capture in captures
        )
    )


def merge_android_play_evidence(
    existing: dict[str, Any],
    evidence: dict[str, Any],
    captures: list[dict[str, Any]],
) -> dict[str, Any]:
    """Refresh screenshot bytes while retaining same-APK physical QA evidence."""
    if existing.get("schemaVersion") != 2:
        raise RuntimeError("existing Android screenshot evidence schema is invalid")
    old_source = existing.get("source")
    old_device_safety = existing.get("deviceSafety")
    old_video_audit = existing.get("videoAudit")
    old_captures = existing.get("screenshots")
    if not isinstance(old_source, dict):
        raise RuntimeError("existing Android screenshot source is invalid")
    if not isinstance(old_device_safety, dict):
        raise RuntimeError("existing Android device safety evidence is invalid")
    before = old_device_safety.get("productionHashesBefore")
    after = old_device_safety.get("productionHashesAfter")
    if not isinstance(before, dict) or not before or before != after:
        raise RuntimeError("existing Android production-package hashes are invalid")
    if not isinstance(old_video_audit, dict) or not all(
        isinstance(old_video_audit.get(key), dict)
        for key in ("runtime", "physicalProof")
    ):
        raise RuntimeError("existing Android video audit is invalid")
    if not isinstance(old_captures, list):
        raise RuntimeError("existing Android screenshot records are invalid")
    old_capture_by_file = {
        capture.get("file"): capture
        for capture in old_captures
        if isinstance(capture, dict) and isinstance(capture.get("file"), str)
    }
    if tuple(old_capture_by_file) != EXPECTED_SCREENSHOTS or any(
        not isinstance(old_capture_by_file[name].get("runtime"), dict)
        for name in EXPECTED_SCREENSHOTS
    ):
        raise RuntimeError("existing Android screenshot runtime evidence is incomplete")

    source = evidence["source"]
    gate = evidence["deviceGate"]
    merged = copy.deepcopy(existing)
    merged["source"] = {
        **copy.deepcopy(old_source),
        "repository": "LolClassicBeta_codex_recovered",
        "evidencePath": "play-store/screenshot-evidence.json",
        "capturedAt": evidence["capturedAt"],
        "androidCommit": source["android"]["commit"],
        "androidTrackedState": source["android"]["trackedState"],
        "package": source["applicationId"],
        "apkSha256": source["apkSha256"],
        "captureMethod": (
            "audited physical-device QA screencap; same-APK detailed runtime "
            "evidence retained from the preceding verified capture"
        ),
        "publicCaptureEvidence": {
            "repository": "lol-encyclopedia-classic-site-repo",
            "path": "capture-evidence.json",
        },
        "retainedRuntimeEvidence": {
            "capturedAt": old_source.get("capturedAt"),
            "androidCommit": old_source.get("androidCommit"),
            "apkSha256": old_source.get("apkSha256"),
        },
    }
    merged["deviceSafety"].update(
        {
            "physicalDevice": gate["physicalDevice"],
            "kernelQemu": gate["kernelQemu"],
            "exactlyOneAuthorizedTarget": gate["exactlyOneAuthorizedTarget"],
            "qaPackageOnly": True,
            "productionPackageRejected": gate["productionPackageRejected"],
            "productionPackageMutationCount": 0,
            "settingsRestored": evidence["settingsRestoration"]["verified"],
        }
    )
    merged["screenshots"] = []
    for capture in captures:
        old_capture = old_capture_by_file[capture["file"]]
        merged["screenshots"].append(
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
                "runtime": copy.deepcopy(old_capture["runtime"]),
            }
        )
    merged["summary"] = {
        "authoritativePlayScreenshotSources": 1,
        "currentAndMatching": len(captures),
        "stale": 0,
        "invalid": 0,
        "hashMismatches": 0,
        "manualPrivacyReviewCompleted": True,
    }
    return merged


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
            "captureMethod": "Ten post-render screenshots captured from the authorized physical device; each screenshot was held for exactly 3 seconds at 30 fps, concatenated, and normalized to H.264 with faststart metadata",
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
            "method": "All ten final screenshots plus the midpoint frame of every one of the ten feature-tour segments reviewed at source capture dimensions",
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

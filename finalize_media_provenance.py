from __future__ import annotations

import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
EVIDENCE = ROOT / "capture-evidence.json"
OUTPUT = ROOT / "assets/media-provenance.json"
EXPECTED_PACKAGE = "com.lolclassic.encyclopedia.qa"

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
        "sourceAndroidWipDiffSha256": source["android"]["trackedDiffSha256"],
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Finalize manually reviewed Public media provenance.")
    parser.add_argument("--manual-visual-review-accepted", action="store_true")
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

    icon = evidence["projectOwned"]["appIcon"]
    record = common_record(
        evidence,
        "app-icon.png",
        source_type="PROJECT_OWNED_ICON",
        purpose="PUBLIC_APP_ICON",
    )
    record.update(
        {
            "mediaType": "image/png",
            "captureMethod": "Byte-identical copy of the deterministic Android project-owned Play icon",
            "width": icon["width"],
            "height": icon["height"],
            "bytes": icon["bytes"],
            "outputSha256": icon["sha256"],
            "classification": "PROJECT_OWNED_COMPOSITION",
            "notes": "Project-owned open archive-book identity; no Riot or League logo geometry or extracted client decoration is used.",
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
        "sourceAndroidWipDiffSha256": evidence["source"]["android"]["trackedDiffSha256"],
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
            "stale": 0,
            "invalid": 0,
        },
    }
    temporary = OUTPUT.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, OUTPUT)
    print(f"Wrote {len(records)} reviewed media records to {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "asset-provenance.json"
CURRENT_MANIFEST = ROOT / "assets" / "media-provenance.json"
HISTORICAL_LAUNCHER_SOURCE_TYPE = "USER_SUPPLIED_HISTORICAL_LAUNCHER_DERIVATIVE"


def to_release_record(record: dict[str, object]) -> dict[str, object]:
    source_type = str(record["sourceType"])
    is_historical_launcher_exception = source_type == HISTORICAL_LAUNCHER_SOURCE_TYPE
    if record["mediaType"] == "video/mp4":
        category = "marketing_video"
    elif is_historical_launcher_exception:
        category = "historical_launcher_exception"
    elif source_type in {"PROJECT_OWNED_COMPOSITION", "PROJECT_OWNED_ICON"}:
        category = "marketing_brand_asset"
    else:
        category = "marketing_screenshot"

    return {
        "path": record["localPath"],
        "category": category,
        "sha256": record["outputSha256"],
        "knownSource": source_type,
        "sourceUrlOrVersion": "assets/media-provenance.json",
        "acquisitionMethod": record["captureMethod"],
        "riotOfficial": False,
        "thirdParty": is_historical_launcher_exception,
        "redistributionEvidence": (
            "technical provenance recorded; rights and distribution authorization remain separate gates"
        ),
        "officialReplacementCandidate": None,
        "releaseStatus": "CURRENT_PROVENANCE_RECORDED",
        "embeddedRiotOrThirdPartyContent": (
            bool(record["containsRiotOfficialAssetInsideAppUI"])
            or is_historical_launcher_exception
        ),
    }


def main() -> None:
    current = json.loads(CURRENT_MANIFEST.read_text(encoding="utf-8"))
    assets = [to_release_record(record) for record in current["assets"]]
    payload = {
        "schemaVersion": 2,
        "product": "LoL Encyclopedia Classic public site",
        "authoritativeManifest": "assets/media-provenance.json",
        "allowedReleaseStatuses": ["CURRENT_PROVENANCE_RECORDED"],
        "rightsStatement": "Technical provenance and hash verification do not establish redistribution permission.",
        "assets": assets,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Wrote {len(assets)} records to {OUTPUT.name}")


if __name__ == "__main__":
    main()

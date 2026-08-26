from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "asset-provenance.json"
CURRENT_MANIFEST = ROOT / "assets" / "media-provenance.json"


def main() -> None:
    current = json.loads(CURRENT_MANIFEST.read_text(encoding="utf-8"))
    assets = [
        {
            "path": record["localPath"],
            "category": (
                "marketing_video"
                if record["mediaType"] == "video/mp4"
                else (
                    "marketing_brand_asset"
                    if record["sourceType"]
                    in {"PROJECT_OWNED_COMPOSITION", "PROJECT_OWNED_ICON"}
                    else "marketing_screenshot"
                )
            ),
            "sha256": record["outputSha256"],
            "knownSource": record["sourceType"],
            "sourceUrlOrVersion": "assets/media-provenance.json",
            "acquisitionMethod": record["captureMethod"],
            "riotOfficial": False,
            "thirdParty": False,
            "redistributionEvidence": (
                "technical provenance recorded; rights and distribution authorization remain separate gates"
            ),
            "officialReplacementCandidate": None,
            "releaseStatus": "CURRENT_PROVENANCE_RECORDED",
            "embeddedRiotOrThirdPartyContent": record[
                "containsRiotOfficialAssetInsideAppUI"
            ],
        }
        for record in current["assets"]
    ]
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

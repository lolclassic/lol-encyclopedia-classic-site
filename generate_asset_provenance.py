from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "asset-provenance.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    assets = []
    for path in sorted(item for item in (ROOT / "assets").rglob("*") if item.is_file()):
        relative = path.relative_to(ROOT).as_posix()
        is_brand = path.name in {"app-icon.png", "feature-graphic.png"}
        is_video = path.suffix.lower() == ".mp4"
        assets.append({
            "path": relative,
            "category": "marketing_brand_asset" if is_brand else ("marketing_video" if is_video else "marketing_screenshot"),
            "sha256": sha256(path),
            "knownSource": "project-owned branding derived from the Android ImageGen design record" if is_brand else "project-owned Android app screen capture",
            "sourceUrlOrVersion": "Android play-store/asset-provenance.md" if is_brand else "Android play-store/screenshot-evidence.json and local capture workflow",
            "acquisitionMethod": "copied from project-owned generated branding" if is_brand else ("recorded from the Android app on a physical device" if is_video else "captured from the Android app"),
            "riotOfficial": False,
            "thirdParty": False,
            "redistributionEvidence": "project creation record exists" if is_brand else "capture provenance exists; embedded game assets require separate review",
            "officialReplacementCandidate": None if is_brand else "recapture after blocked embedded assets are replaced or Riot confirms their use",
            "releaseStatus": "ALLOWED_OFFICIAL" if is_brand else "NEEDS_REPLACEMENT",
            "embeddedRiotOrThirdPartyContent": False if is_brand else "unknown",
        })
    payload = {
        "schemaVersion": 1,
        "product": "LoL Encyclopedia Classic public site",
        "allowedReleaseStatuses": ["ALLOWED_OFFICIAL", "NEEDS_REPLACEMENT", "NEEDS_RIOT_CONFIRMATION", "BLOCKED_FOR_PUBLIC_RELEASE"],
        "rightsStatement": "Technical provenance and hash verification do not establish redistribution permission.",
        "assets": assets,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Wrote {len(assets)} records to {OUTPUT.name}")


if __name__ == "__main__":
    main()

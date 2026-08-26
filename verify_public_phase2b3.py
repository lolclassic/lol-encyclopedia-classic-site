from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import subprocess
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent
HTML_FILES = tuple(sorted(ROOT.glob("*.html")))
POLICY_FILES = {"privacy.html", "terms.html", "delete-account.html", "contact.html"}
ALLOWED_SOURCE_TYPES = {
    "PROJECT_OWNED_SCREEN_CAPTURE",
    "PROJECT_OWNED_COMPOSITION",
    "PROJECT_OWNED_ICON",
}
ALLOWED_CLASSIFICATIONS = {
    "CURRENT_AND_MATCHING",
    "CURRENT_BUT_MARKETING_CROP",
    "PROJECT_OWNED_COMPOSITION",
}
RETIRED_MEDIA = {"phone-08-rune-page.png", "phone-09-builder.png"}
SUPPORT_EMAIL = "gktmtmxhs7313@gmail.com"


class ReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.references: list[tuple[str, str, str]] = []
        self.images_without_alt: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for attribute in ("href", "src", "poster"):
            value = values.get(attribute)
            if value:
                self.references.append((tag, attribute, value))
        if tag == "img" and "alt" not in values:
            self.images_without_alt.append(values.get("src", "unknown"))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def png_dimensions(path: Path) -> tuple[int, int]:
    with path.open("rb") as source:
        header = source.read(24)
    if len(header) != 24 or header[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    return struct.unpack(">II", header[16:24])


def text_files() -> list[Path]:
    extensions = {".html", ".css", ".js", ".json", ".md", ".py"}
    return [
        path
        for path in ROOT.rglob("*")
        if path.is_file()
        and path.suffix.lower() in extensions
        and path.name != Path(__file__).name
        and ".git" not in path.parts
        and "__pycache__" not in path.parts
    ]


def local_target(page: Path, value: str) -> Path | None:
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or value.startswith(("#", "mailto:", "tel:")):
        return None
    relative = unquote(parsed.path)
    if not relative:
        return page
    return (page.parent / relative).resolve()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    failures: list[str] = []
    checks: dict[str, object] = {}

    references: list[tuple[Path, str]] = []
    missing: list[str] = []
    alt_failures: list[str] = []
    for page in HTML_FILES:
        parsed = ReferenceParser()
        parsed.feed(page.read_text(encoding="utf-8"))
        alt_failures.extend(f"{page.name}:{item}" for item in parsed.images_without_alt)
        for _, _, value in parsed.references:
            references.append((page, value))
            target = local_target(page, value)
            if target is not None and not target.exists():
                missing.append(f"{page.name}:{value}")
    checks["htmlFiles"] = len(HTML_FILES)
    checks["localReferences"] = len(references)
    checks["missingLocalReferences"] = missing
    checks["imagesWithoutAlt"] = alt_failures
    failures.extend(f"missing-local-reference:{item}" for item in missing)
    failures.extend(f"image-without-alt:{item}" for item in alt_failures)

    referenced_values = {value.split("?", 1)[0] for _, value in references}
    stale_references = sorted(
        value for value in referenced_values if Path(value).name in RETIRED_MEDIA
    )
    checks["staleMediaReferences"] = stale_references
    failures.extend(f"stale-media-reference:{item}" for item in stale_references)

    missing_policy = sorted(POLICY_FILES - {path.name for path in HTML_FILES})
    checks["missingPolicyPages"] = missing_policy
    failures.extend(f"missing-policy-page:{item}" for item in missing_policy)

    combined_text = "\n".join(
        path.read_text(encoding="utf-8", errors="replace") for path in text_files()
    )
    stale_claims = [
        claim
        for claim in (
            "190 historical items",
            "56 masteries",
            "20 customizable rune pages",
            "30-slot page layout",
            "phone-08-rune-page.png",
            "phone-09-builder.png",
            "v=20260822-1835",
        )
        if claim in combined_text and claim not in RETIRED_MEDIA
    ]
    checks["staleClaims"] = stale_claims
    failures.extend(f"stale-claim:{item}" for item in stale_claims)

    secret_patterns = {
        "riot-api-key": re.compile(r"RGAPI-[A-Za-z0-9_-]{12,}|RIOT_API_KEY|X-Riot-Token", re.I),
        "private-key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
        "bearer-token": re.compile(r"\bBearer\s+[A-Za-z0-9._~+/-]{16,}", re.I),
    }
    secret_hits = [name for name, pattern in secret_patterns.items() if pattern.search(combined_text)]
    checks["secretHits"] = secret_hits
    failures.extend(f"secret-hit:{item}" for item in secret_hits)

    emails = sorted(
        set(re.findall(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", combined_text, re.I))
    )
    unexpected_emails = [email for email in emails if email.lower() != SUPPORT_EMAIL]
    checks["publishedSupportEmail"] = SUPPORT_EMAIL in {email.lower() for email in emails}
    checks["unexpectedEmails"] = unexpected_emails
    failures.extend(f"unexpected-email:{item}" for item in unexpected_emails)

    windows_paths: list[str] = []
    localhost_hits: list[str] = []
    for path in text_files():
        text = path.read_text(encoding="utf-8", errors="replace")
        if re.search(
            r"\b[A-Za-z]:\\(?:Users|Windows|Program Files|ProgramData|[A-Za-z0-9_.-]+\\)",
            text,
        ):
            windows_paths.append(path.relative_to(ROOT).as_posix())
        if re.search(r"\b(?:localhost|127\.0\.0\.1)\b", text, re.I):
            localhost_hits.append(path.relative_to(ROOT).as_posix())
    unexpected_localhost = [item for item in localhost_hits if item != "capture_public_marketing.py"]
    checks["windowsPathFiles"] = windows_paths
    checks["localhostFiles"] = localhost_hits
    checks["localhostToolingAllowlist"] = ["capture_public_marketing.py"]
    failures.extend(f"windows-path:{item}" for item in windows_paths)
    failures.extend(f"unexpected-localhost:{item}" for item in unexpected_localhost)

    manifest_path = ROOT / "assets" / "media-provenance.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    required = {
        "localPath",
        "mediaType",
        "sourceType",
        "captureDate",
        "sourceApplicationId",
        "sourceAndroidCommit",
        "deviceModel",
        "captureMethod",
        "width",
        "height",
        "outputSha256",
        "containsRiotOfficialAssetInsideAppUI",
        "unresolvedAssetCount",
        "personalDataReviewed",
        "currentScreenPurpose",
        "notes",
        "classification",
    }
    hash_groups: dict[str, list[str]] = defaultdict(list)
    media_records: list[dict[str, object]] = []
    for record in manifest["assets"]:
        filename = str(record.get("filename", "unknown"))
        absent = sorted(required - set(record))
        if absent:
            failures.append(f"provenance-fields:{filename}:{','.join(absent)}")
            continue
        if record["sourceType"] not in ALLOWED_SOURCE_TYPES:
            failures.append(f"provenance-source-type:{filename}")
        if record["classification"] not in ALLOWED_CLASSIFICATIONS:
            failures.append(f"provenance-classification:{filename}")
        if record["unresolvedAssetCount"] != 0 or record["personalDataReviewed"] is not True:
            failures.append(f"provenance-review:{filename}")
        asset = ROOT / str(record["localPath"])
        if not asset.is_file():
            failures.append(f"provenance-missing:{filename}")
            continue
        actual_hash = sha256(asset)
        hash_groups[actual_hash].append(filename)
        if actual_hash != record["outputSha256"]:
            failures.append(f"provenance-hash:{filename}")
        if record["mediaType"] == "image/png":
            width, height = png_dimensions(asset)
            if (width, height) != (record["width"], record["height"]):
                failures.append(f"provenance-dimensions:{filename}")
        media_records.append({"filename": filename, "sha256": actual_hash})

    duplicate_groups = [sorted(group) for group in hash_groups.values() if len(group) > 1]
    allowed_duplicate = sorted(["app-main-screen.png", "phone-01-home.png"])
    unexpected_duplicates = [group for group in duplicate_groups if group != allowed_duplicate]
    checks["duplicateMediaGroups"] = duplicate_groups
    checks["intentionalPosterAlias"] = allowed_duplicate in duplicate_groups
    failures.extend(f"unexpected-duplicate:{','.join(group)}" for group in unexpected_duplicates)

    video = next(record for record in manifest["assets"] if record["mediaType"] == "video/mp4")
    probe = json.loads(
        subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration,size,bit_rate:stream=codec_name,width,height,avg_frame_rate",
                "-of",
                "json",
                str(ROOT / video["localPath"]),
            ],
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
        ).stdout
    )
    stream = probe["streams"][0]
    fmt = probe["format"]
    video_actual = {
        "width": int(stream["width"]),
        "height": int(stream["height"]),
        "codec": stream["codec_name"],
        "fps": stream["avg_frame_rate"],
        "duration": round(float(fmt["duration"]), 3),
        "bytes": int(fmt["size"]),
        "bitRate": int(fmt["bit_rate"]),
    }
    for key in ("width", "height", "codec", "fps", "duration"):
        if video_actual[key] != video[key]:
            failures.append(f"video-metadata:{key}")
    checks["videoMetadata"] = video_actual
    checks["mediaRecords"] = len(media_records)
    checks["manifestSummary"] = manifest["summary"]

    payload = {
        "schemaVersion": 1,
        "result": "PASS" if not failures else "FAIL",
        "checks": checks,
        "failures": failures,
    }
    if args.report:
        report = args.report if args.report.is_absolute() else ROOT / args.report
        report.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())

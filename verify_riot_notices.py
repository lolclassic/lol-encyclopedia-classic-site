from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parent
HTML_FILES = ("index.html", "contact.html", "privacy.html", "terms.html", "delete-account.html")
GENERAL = "LoL Encyclopedia Classic — Unofficial Archive isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc."
LEGAL_JIBBER_JABBER = "LoL Encyclopedia Classic — Unofficial Archive was created under Riot Games' \"Legal Jibber Jabber\" policy using assets owned by Riot Games.  Riot Games does not endorse or sponsor this project."


def main() -> None:
    failures = []
    for filename in HTML_FILES:
        text = (ROOT / filename).read_text(encoding="utf-8")
        footer_start = text.find('<footer class="site-footer">')
        footer_end = text.find("</footer>", footer_start)
        footer = text[footer_start:footer_end]
        if footer_start < 0 or footer_end < 0:
            failures.append(f"{filename}: visible site footer missing")
            continue
        if GENERAL not in footer:
            failures.append(f"{filename}: exact Riot General notice missing from footer")
        if LEGAL_JIBBER_JABBER not in footer:
            failures.append(f"{filename}: exact Legal Jibber Jabber notice missing from footer")
    if failures:
        raise SystemExit("\n".join(failures))
    print(f"PASS: exact Riot notices are visible in all {len(HTML_FILES)} public HTML footers")


if __name__ == "__main__":
    main()

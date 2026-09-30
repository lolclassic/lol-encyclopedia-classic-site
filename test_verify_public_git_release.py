import unittest

from verify_public_phase2b3 import ROOT, untracked_local_references


class GitReleaseReferenceTest(unittest.TestCase):
    def test_local_html_media_must_be_in_git_index(self):
        page = ROOT / "index.html"
        references = [
            (page, "assets/app-icon.png?v=1"),
            (page, "assets/physical-26195-en-r25-raw/physical-26195-en-tour.mp4"),
            (page, "assets/physical-26195-en-r25-raw/physical-26195-en-tour.mp4"),
            (page, "https://example.org/remote.png"),
            (page, "#features"),
        ]
        self.assertEqual(
            untracked_local_references(references, {"assets/app-icon.png"}),
            ["index.html:assets/physical-26195-en-r25-raw/physical-26195-en-tour.mp4"],
        )

    def test_path_outside_site_cannot_be_published(self):
        self.assertEqual(
            untracked_local_references([(ROOT / "index.html", "../outside.png")], set()),
            ["index.html:../outside.png"],
        )


if __name__ == "__main__":
    unittest.main()

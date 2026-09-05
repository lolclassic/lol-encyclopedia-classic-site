import copy
import json
import unittest

from verify_current_capture import ROOT, validate


class CurrentCaptureTests(unittest.TestCase):
    def setUp(self):
        self.evidence = json.loads((ROOT / "capture-evidence.json").read_text(encoding="utf-8"))
        self.manifest = json.loads((ROOT / "assets/media-provenance.json").read_text(encoding="utf-8"))

    def test_current_files_pass(self):
        self.assertEqual([], validate(self.evidence, self.manifest))

    def test_added_screen_and_changed_capture_hash_are_rejected(self):
        self.evidence["screenshots"][0]["sha256"] = "0" * 64
        self.evidence["screenshots"].append(copy.deepcopy(self.evidence["screenshots"][0]))
        failures = validate(self.evidence, self.manifest)
        self.assertIn("exact-screen-set", failures)
        self.assertIn("capture-hash:phone-01-rune-page.png", failures)

    def test_unreviewed_video_and_whole_apk_authorization_claim_are_rejected(self):
        self.evidence["manualReview"]["reviewedVideoSha256"] = "0" * 64
        self.evidence["wholeApkReleaseAuthorizationAsserted"] = True
        failures = validate(self.evidence, self.manifest)
        self.assertIn("video-review-binding", failures)
        self.assertIn("capture-not-release-authorization", failures)

    def test_private_gallery_and_stale_apk_binding_are_rejected(self):
        self.evidence["screenshots"][0]["visibleAssets"][0]["path"] = "images/historical_gallery/private.png"
        self.manifest["assets"][0]["sourceApkSha256"] = "0" * 64
        failures = validate(self.evidence, self.manifest)
        self.assertIn("visible-source:phone-01-rune-page.png", failures)
        self.assertIn("source-apk:phone-01-rune-page.png", failures)

    def test_writes_or_storage_changes_reject_capture(self):
        self.evidence["validation"]["externalWrites"] = 1
        self.evidence["validation"]["storagePreserved"] = False
        failures = validate(self.evidence, self.manifest)
        self.assertIn("externalWrites", failures)
        self.assertIn("storagePreserved", failures)

    def test_missing_privacy_review_and_false_stream_hash_are_rejected(self):
        del self.evidence["manualReview"]["personalDataFound"]
        self.evidence["manualReview"]["notificationIconsFound"] = True
        self.evidence["video"]["videoStreamSha256"] = "0" * 64
        failures = validate(self.evidence, self.manifest)
        self.assertIn("privacy-review:personalDataFound", failures)
        self.assertIn("privacy-review:notificationIconsFound", failures)
        self.assertIn("recorded-video-stream-hash", failures)


if __name__ == "__main__":
    unittest.main()

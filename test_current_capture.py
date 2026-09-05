import copy
import json
import unittest
import subprocess
from unittest.mock import patch

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

    def test_matching_but_false_container_hash_cannot_replace_actual_video_identity(self):
        self.evidence["video"]["outputSha256"] = "0" * 64
        self.evidence["manualReview"]["reviewedVideoSha256"] = "0" * 64
        for row in self.manifest["assets"]:
            if row["filename"] == "app-feature-tour.mp4":
                row["outputSha256"] = "0" * 64
        self.assertIn("published-video-file-hash", validate(self.evidence, self.manifest))

    def test_extra_audio_track_is_rejected_even_with_unchanged_video_stream(self):
        run = subprocess.run
        def with_audio(args, **kwargs):
            if args[0] == "ffprobe":
                return subprocess.CompletedProcess(args, 0, json.dumps({"streams": [
                    {"codec_type": "video", "codec_name": "h264", "width": 1080, "height": 1920},
                    {"codec_type": "audio", "codec_name": "aac"},
                ]}), "")
            return run(args, **kwargs)
        with patch("verify_current_capture.subprocess.run", side_effect=with_audio):
            self.assertIn("published-video-stream-set", validate(self.evidence, self.manifest))


if __name__ == "__main__":
    unittest.main()

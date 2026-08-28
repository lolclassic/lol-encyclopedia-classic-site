from __future__ import annotations

import unittest

import capture_public_marketing as capture
import finalize_media_provenance as finalize


class ApkIdentityTests(unittest.TestCase):
    def test_expected_qa_identity_is_parsed(self) -> None:
        identity = capture.parse_apk_identity(
            "package: name='com.lolclassic.encyclopedia.qa' versionCode='1'\n"
            "launchable-activity: name='com.lolclassic.encyclopedia.MainActivity'\n"
        )
        self.assertEqual(identity["package"], capture.EXPECTED_PACKAGE)
        self.assertEqual(identity["activity"], capture.EXPECTED_ACTIVITY_CLASS)

    def test_missing_launchable_activity_fails_closed(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "launchable activity"):
            capture.parse_apk_identity(
                "package: name='com.lolclassic.encyclopedia.qa' versionCode='1'\n"
            )


class SafetyConstantTests(unittest.TestCase):
    def test_production_package_is_never_the_capture_target(self) -> None:
        self.assertNotEqual(capture.EXPECTED_PACKAGE, capture.REJECTED_PRODUCTION_PACKAGE)
        self.assertEqual(
            capture.ACTIVITY,
            "com.lolclassic.encyclopedia.qa/com.lolclassic.encyclopedia.MainActivity",
        )

    def test_runtime_fingerprint_is_exact_and_excludes_post_capture_evidence(self) -> None:
        expected = (
            "app/src/main/assets/www/app.js",
            "app/src/main/assets/www/final-ui-hotfix.js",
            "app/src/main/assets/www/index.html",
            "app/src/main/assets/www/sw.js",
        )
        self.assertEqual(capture.CAPTURE_RUNTIME_SOURCE_PATHS, expected)
        self.assertEqual(finalize.CAPTURE_RUNTIME_SOURCE_PATHS, expected)
        self.assertTrue(set(expected).issubset(capture.EXPECTED_ANDROID_WIP_PATHS))
        self.assertFalse(any(path.startswith("play-store/") for path in expected))


if __name__ == "__main__":
    unittest.main()

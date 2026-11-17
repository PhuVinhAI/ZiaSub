/**
 * Expo Config Plugin: name the packaged release APK after the app version.
 *
 * AGP 9 removed applicationVariants and Gradle 9 removed
 * defaultConfig.archivesBaseName, so the versioned name is applied to the
 * packageRelease output directly.
 */
const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "// @ziasub-apk-output-name";

module.exports = (config) =>
  withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("withApkOutputName requires a Groovy build.gradle");
    }

    const contents = config.modResults.contents;
    if (contents.includes(MARKER)) return config;

    const block = `
${MARKER}
def ziasubApkVersionName = android.defaultConfig.versionName
tasks.configureEach { task ->
    if (task.name == "packageRelease") {
        task.doLast {
            def ziasubApkDir = layout.buildDirectory.dir("outputs/apk/release").get().asFile
            def ziasubApkSource = new File(ziasubApkDir, "app-release.apk")
            def ziasubApkTarget = new File(ziasubApkDir, "ziasub-v\${ziasubApkVersionName}.apk")
            if (ziasubApkSource.exists()) {
                java.nio.file.Files.move(
                    ziasubApkSource.toPath(),
                    ziasubApkTarget.toPath(),
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING
                )
            }
        }
    }
}
`;

    config.modResults.contents = `${contents.trimEnd()}\n${block}`;
    return config;
  });

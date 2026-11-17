/**
 * Expo Config Plugin: fix Windows long-path failures in the Android NDK build.
 *
 * CMake/ninja still enforce the ~260 character MAX_PATH limit even when
 * LongPathsEnabled is on, which breaks Reanimated's deep C++ object paths.
 * Moving the native staging directory to a short path keeps builds working.
 */
const fs = require("fs");
const {
  withAppBuildGradle,
  withGradleProperties,
  withProjectBuildGradle,
} = require("expo/config-plugins");

const MARKER = "// @ziasub-long-path-fix";
const PROJECT_MARKER = "// @ziasub-long-path-fix-global";
const STAGING_DIR = "C:/tmp/cxx";
const CMAKE_VERSION = "3.31.6";

const withBuildStagingDirectory = (config) =>
  withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("withAndroidLongPathFix requires a Groovy build.gradle");
    }
    if (process.platform !== "win32") return config;

    const contents = config.modResults.contents;
    if (contents.includes("buildStagingDirectory")) return config;

    const androidBlock = contents.match(/android\s*\{/);
    if (!androidBlock || androidBlock.index === undefined) {
      throw new Error("withAndroidLongPathFix could not find android block");
    }

    try {
      fs.mkdirSync("C:/tmp", { recursive: true });
    } catch (error) {
      console.warn(
        `[withAndroidLongPathFix] Could not create C:/tmp: ${error.message}`
      );
    }

    const block = `
    ${MARKER}
    externalNativeBuild {
        cmake {
            buildStagingDirectory "${STAGING_DIR}"
        }
    }`;
    const insertAt = androidBlock.index + androidBlock[0].length;
    config.modResults.contents =
      contents.slice(0, insertAt) + block + contents.slice(insertAt);
    return config;
  });

const withProjectStagingDirectories = (config) =>
  withProjectBuildGradle(config, (config) => {
    if (process.platform !== "win32") return config;
    if (config.modResults.language !== "groovy") {
      throw new Error(
        "withAndroidLongPathFix requires a Groovy project build.gradle"
      );
    }

    const contents = config.modResults.contents;
    if (contents.includes(PROJECT_MARKER)) return config;

    const block = `
${PROJECT_MARKER}
subprojects { subproject ->
    def ziasubConfigureLongPath = {
        subproject.android.externalNativeBuild {
            cmake {
                buildStagingDirectory new File("${STAGING_DIR}/\${subproject.name}")
            }
        }
    }
    subproject.plugins.withId("com.android.application") {
        ziasubConfigureLongPath()
    }
    subproject.plugins.withId("com.android.library") {
        ziasubConfigureLongPath()
    }
}

`;

    const anchor = 'apply plugin: "expo-root-project"';
    const anchorIndex = contents.indexOf(anchor);
    if (anchorIndex < 0) {
      throw new Error(
        "withAndroidLongPathFix could not find expo-root-project plugin"
      );
    }

    config.modResults.contents =
      contents.slice(0, anchorIndex) + block + contents.slice(anchorIndex);
    return config;
  });

const withGradleCaching = (config) =>
  withGradleProperties(config, (config) => {
    const properties = config.modResults;
    const exists = properties.some(
      (item) => item.type === "property" && item.key === "org.gradle.caching"
    );
    if (!exists) {
      properties.push({
        type: "property",
        key: "org.gradle.caching",
        value: "true",
      });
    }

    // CMake 3.22.1 bundles Ninja 1.10, which rejects paths over 260 chars.
    // 3.31.6 bundles Ninja 1.12.1 with long-path support.
    if (process.platform === "win32") {
      const cmakeVersion = properties.find(
        (item) => item.type === "property" && item.key === "android.cmakeVersion"
      );
      if (cmakeVersion) {
        cmakeVersion.value = CMAKE_VERSION;
      } else {
        properties.push({
          type: "property",
          key: "android.cmakeVersion",
          value: CMAKE_VERSION,
        });
      }
    }
    return config;
  });

module.exports = (config) => {
  config = withBuildStagingDirectory(config);
  config = withProjectStagingDirectories(config);
  config = withGradleCaching(config);
  return config;
};

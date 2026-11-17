const { withAppBuildGradle } = require("@expo/config-plugins");

const MARKER = "// @ziasub-release-signing";

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("withReleaseSigning requires a Groovy build.gradle");
    }

    let contents = config.modResults.contents;
    if (contents.includes(MARKER)) return config;

    const prelude = `${MARKER}
def ziasubKeystorePropertiesPath = System.getenv("ZIASUB_KEYSTORE_PROPERTIES")
def ziasubKeystorePropertiesFile = ziasubKeystorePropertiesPath
    ? new File(ziasubKeystorePropertiesPath)
    : rootProject.file("../release-signing/keystore.properties")
def ziasubKeystoreProperties = new Properties()
if (ziasubKeystorePropertiesFile.exists()) {
    ziasubKeystorePropertiesFile.withInputStream { stream ->
        ziasubKeystoreProperties.load(stream)
    }
}
def ziasubReleaseBuildRequested = gradle.startParameter.taskNames.any { taskName ->
    taskName.toLowerCase().contains("release")
}
if (ziasubReleaseBuildRequested) {
    if (!ziasubKeystorePropertiesFile.exists()) {
        throw new GradleException("Release keystore properties not found: \${ziasubKeystorePropertiesFile}")
    }
    def ziasubRequiredKeys = ["storeFile", "storePassword", "keyAlias", "keyPassword"]
    def ziasubMissingKeys = ziasubRequiredKeys.findAll { key ->
        !ziasubKeystoreProperties[key]?.toString()?.trim()
    }
    if (!ziasubMissingKeys.isEmpty()) {
        throw new GradleException("Release keystore properties are missing: \${ziasubMissingKeys.join(', ')}")
    }
}
def ziasubResolveKeystoreFile = { pathValue ->
    def candidate = new File(pathValue)
    return candidate.isAbsolute()
        ? candidate
        : new File(ziasubKeystorePropertiesFile.parentFile, pathValue)
}

`;

    const buildTypesIndex = contents.indexOf("buildTypes {");
    if (buildTypesIndex < 0) {
      throw new Error("withReleaseSigning could not find buildTypes block");
    }
    const beforeBuildTypes = contents.slice(0, buildTypesIndex);
    const afterBuildTypes = contents
      .slice(buildTypesIndex)
      .replace(
        /(release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
        "$1signingConfig signingConfigs.release"
      );
    contents = beforeBuildTypes + afterBuildTypes;

    const signingConfigsBlock = "signingConfigs {";
    const signingConfigsIndex = contents.indexOf(signingConfigsBlock);
    if (signingConfigsIndex < 0) {
      throw new Error("withReleaseSigning could not find signingConfigs block");
    }
    const releaseSigningConfig = `${signingConfigsBlock}
        release {
            if (ziasubKeystorePropertiesFile.exists()) {
                storeFile ziasubResolveKeystoreFile(ziasubKeystoreProperties['storeFile'])
                storePassword ziasubKeystoreProperties['storePassword']
                keyAlias ziasubKeystoreProperties['keyAlias']
                keyPassword ziasubKeystoreProperties['keyPassword']
            }
        }`;
    contents =
      contents.slice(0, signingConfigsIndex) +
      releaseSigningConfig +
      contents.slice(signingConfigsIndex + signingConfigsBlock.length);

    contents = prelude + contents;
    config.modResults.contents = contents;
    return config;
  });
};

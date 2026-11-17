/**
 * Update Section - Check for app updates
 */
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme, useUpdate } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { updateService } from "@services/updateService";

const UpdateSection: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(updateThemedStyles);
  const { hasUpdate, updateResult, showUpdateModal, checkForUpdate } = useUpdate();

  const [checking, setChecking] = useState(false);
  const [checkStatus, setCheckStatus] = useState<
    "idle" | "upToDate" | "error"
  >("idle");

  const checkUpdate = useCallback(async () => {
    if (hasUpdate && updateResult) {
      // Already have update info, just show modal
      showUpdateModal();
      return;
    }

    setChecking(true);
    setCheckStatus("idle");
    try {
      const result = await checkForUpdate();
      if (!result) {
        setCheckStatus("error");
      } else if (!result.hasUpdate) {
        setCheckStatus("upToDate");
      } else {
        showUpdateModal();
      }
    } catch (err) {
      console.error("Update check failed:", err);
      setCheckStatus("error");
    } finally {
      setChecking(false);
    }
  }, [checkForUpdate, hasUpdate, updateResult, showUpdateModal]);

  const currentVersion = updateService.getCurrentVersion();

  return (
    <View style={styles.container}>
      <View style={styles.versionRow}>
        <Text style={themedStyles.label}>{t("update.currentVersion")}</Text>
        <Text style={themedStyles.version}>v{currentVersion}</Text>
      </View>

      {hasUpdate && updateResult?.latestRelease && (
        <TouchableOpacity
          style={[styles.updateBox, themedStyles.updateBox]}
          onPress={showUpdateModal}
          activeOpacity={0.7}
        >
          <View style={styles.updateHeader}>
            <MaterialCommunityIcons
              name="arrow-up-circle"
              size={24}
              color={colors.primary}
            />
            <View style={styles.updateInfo}>
              <Text style={themedStyles.updateTitle}>
                {t("update.available")}
              </Text>
              <Text style={themedStyles.newVersion}>
                v{updateResult.latestRelease.version}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textMuted}
            />
          </View>
        </TouchableOpacity>
      )}

      {!hasUpdate && (
        <>
          {checkStatus !== "idle" && (
            <View
              style={[
                styles.statusBox,
                checkStatus === "upToDate"
                  ? themedStyles.successBox
                  : themedStyles.errorBox,
              ]}
            >
              <MaterialCommunityIcons
                name={
                  checkStatus === "upToDate"
                    ? "check-circle-outline"
                    : "alert-circle-outline"
                }
                size={19}
                color={
                  checkStatus === "upToDate" ? colors.success : colors.error
                }
              />
              <Text
                style={
                  checkStatus === "upToDate"
                    ? themedStyles.successText
                    : themedStyles.errorText
                }
              >
                {checkStatus === "upToDate"
                  ? t("update.upToDate")
                  : t("update.checkError")}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.checkButton, themedStyles.checkButton]}
            onPress={checkUpdate}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="refresh"
                size={18}
                color={colors.primary}
              />
            )}
            <Text style={themedStyles.checkButtonText}>
              {checking ? t("update.checking") : t("update.checkNow")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  versionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updateBox: {
    padding: 12,
    borderRadius: 10,
  },
  updateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  updateInfo: {
    flex: 1,
  },
  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
});

const updateThemedStyles = createThemedStyles((colors) => ({
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  version: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  updateBox: {
    backgroundColor: colors.primarySoft,
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  newVersion: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkButton: {
    backgroundColor: colors.surfaceLight,
  },
  checkButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  successBox: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderColor: colors.error,
  },
  successText: { flex: 1, color: colors.success, fontSize: 13 },
  errorText: { flex: 1, color: colors.error, fontSize: 13 },
}));

export default UpdateSection;

import React from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import type { NotificationSettings } from "@src/types";
import Button3D from "@components/common/Button3D";
import ToggleSettingRow from "@components/common/ToggleSettingRow";
import { notificationService } from "@services/notificationService";
import {
  SettingsCard,
  SettingsSectionHeader,
} from "../SettingsPrimitives";

interface NotificationSectionProps {
  notificationSettings: NotificationSettings;
  onNotificationChange: (settings: NotificationSettings) => void;
}

const NotificationSection: React.FC<NotificationSectionProps> = ({
  notificationSettings,
  onNotificationChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(notificationThemedStyles);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [requestingPermission, setRequestingPermission] = React.useState(false);

  React.useEffect(() => {
    notificationService.checkPermission().then(setHasPermission);
  }, []);

  const handleRequestPermission = async () => {
    setRequestingPermission(true);
    const granted = await notificationService.requestPermission();
    setHasPermission(granted);
    setRequestingPermission(false);
    if (!granted && Platform.OS === "android") {
      Linking.openSettings();
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    onNotificationChange({ ...notificationSettings, [key]: value });
  };

  const isEnabled = notificationSettings.enabled;

  return (
    <View style={styles.container}>
      <View>
        <SettingsSectionHeader
          icon="power"
          title={t("settings.notification.masterTitle")}
          description={t("settings.notification.masterDescription")}
        />
        <SettingsCard style={styles.toggleCard}>
          <ToggleSettingRow
            value={isEnabled}
            onValueChange={(value) => updateSetting("enabled", value)}
            label={
              isEnabled
                ? t("settings.notification.statusOn")
                : t("settings.notification.statusOff")
            }
            description={t("settings.notification.enabledHint")}
            icon="bell-off-outline"
            activeIcon="bell-ring-outline"
            activeColor={colors.success}
            activeBackgroundColor={colors.successBg}
          />
        </SettingsCard>
      </View>

      {isEnabled && (
        <View>
          <SettingsSectionHeader
            icon="shield-check-outline"
            title={t("settings.notification.permissionTitle")}
            description={t("settings.notification.permissionDescription")}
          />
          {hasPermission === null ? (
            <SettingsCard style={styles.permissionLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={themedStyles.permissionLoadingText}>
                {t("settings.notification.checkingPermission")}
              </Text>
            </SettingsCard>
          ) : hasPermission ? (
            <View style={[styles.statusBanner, themedStyles.successBanner]}>
              <View style={[styles.statusIcon, themedStyles.successIcon]}>
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color={colors.success}
                />
              </View>
              <View style={styles.flex}>
                <Text style={themedStyles.successTitle}>
                  {t("settings.notification.permissionReady")}
                </Text>
                <Text style={themedStyles.successHint}>
                  {t("settings.notification.permissionGranted")}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.permissionWarning, themedStyles.permissionWarning]}>
              <View style={[styles.statusIcon, themedStyles.warningIcon]}>
                <MaterialCommunityIcons
                  name="alert-outline"
                  size={19}
                  color={colors.warning}
                />
              </View>
              <View style={styles.permissionText}>
                <Text style={themedStyles.warningTitle}>
                  {t("settings.notification.noPermission")}
                </Text>
                <Text style={themedStyles.warningText}>
                  {t("settings.notification.noPermissionHint")}
                </Text>
              </View>
              <Button3D
                title={t("settings.notification.grantPermission")}
                onPress={handleRequestPermission}
                variant="primary"
                size="small"
                disabled={requestingPermission}
              />
            </View>
          )}
        </View>
      )}

      {isEnabled && hasPermission === true ? (
        <>
          <View>
            <SettingsSectionHeader
              icon="source-branch"
              title={t("settings.notification.sourceTitle")}
              description={t("settings.notification.sourceDescription")}
            />
            <SettingsCard style={styles.toggleCard}>
              <ToggleSettingRow
                icon="playlist-play"
                label={t("settings.notification.fromQueue")}
                description={t("settings.notification.fromQueueHint")}
                value={notificationSettings.fromQueue}
                onValueChange={(value) => updateSetting("fromQueue", value)}
                activeColor={colors.success}
                activeBackgroundColor={colors.successBg}
                divider
              />
              <ToggleSettingRow
                icon="translate"
                label={t("settings.notification.fromDirect")}
                description={t("settings.notification.fromDirectHint")}
                value={notificationSettings.fromDirect}
                onValueChange={(value) => updateSetting("fromDirect", value)}
                activeColor={colors.success}
                activeBackgroundColor={colors.successBg}
              />
            </SettingsCard>
          </View>

          <View>
            <SettingsSectionHeader
              icon="format-list-checks"
              title={t("settings.notification.typeTitle")}
              description={t("settings.notification.typeDescription")}
            />
            <SettingsCard style={styles.toggleCard}>
              <ToggleSettingRow
                icon="check-circle-outline"
                label={t("settings.notification.onComplete")}
                description={t("settings.notification.onCompleteHint")}
                value={notificationSettings.onComplete}
                onValueChange={(value) => updateSetting("onComplete", value)}
                activeColor={colors.success}
                activeBackgroundColor={colors.successBg}
                divider
              />
              <ToggleSettingRow
                icon="progress-check"
                label={t("settings.notification.onBatchComplete")}
                description={t("settings.notification.onBatchCompleteHint")}
                value={notificationSettings.onBatchComplete}
                onValueChange={(value) =>
                  updateSetting("onBatchComplete", value)
                }
                activeColor={colors.success}
                activeBackgroundColor={colors.successBg}
                divider
              />
              <ToggleSettingRow
                icon="alert-circle-outline"
                label={t("settings.notification.onError")}
                description={t("settings.notification.onErrorHint")}
                value={notificationSettings.onError}
                onValueChange={(value) => updateSetting("onError", value)}
                activeColor={colors.success}
                activeBackgroundColor={colors.successBg}
              />
            </SettingsCard>
          </View>
        </>
      ) : !isEnabled ? (
        <View style={[styles.disabledState, themedStyles.disabledState]}>
          <MaterialCommunityIcons
            name="bell-sleep-outline"
            size={29}
            color={colors.textMuted}
          />
          <Text style={themedStyles.disabledTitle}>
            {t("settings.notification.disabledTitle")}
          </Text>
          <Text style={themedStyles.disabledDescription}>
            {t("settings.notification.disabledDescription")}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 26 },
  flex: { flex: 1 },
  permissionLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  permissionText: { flex: 1 },
  toggleCard: { padding: 6 },
  disabledState: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
});

const notificationThemedStyles = createThemedStyles((colors) => ({
  permissionLoadingText: { color: colors.textMuted, fontSize: 13 },
  successBanner: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  successIcon: { backgroundColor: colors.surface },
  successTitle: { color: colors.success, fontSize: 14, fontWeight: "700" },
  successHint: { color: colors.success, fontSize: 11, marginTop: 2 },
  permissionWarning: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
  },
  warningIcon: { backgroundColor: colors.surface },
  warningTitle: { color: colors.warning, fontSize: 13, fontWeight: "700" },
  warningText: {
    color: colors.warning,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  disabledState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  disabledTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },
  disabledDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
  },
}));

export default NotificationSection;

import React from "react";
import {
  View,
  Alert,
  StyleSheet,
  Linking,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Application from "expo-application";
import * as Sharing from "expo-sharing";

import { exportDatabase, importDatabase } from "../src/utils/ExportImportDB";
import { getDB } from "../db";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

export default function SettingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const currentVersion = Application.nativeApplicationVersion;
  console.log("Current app version:", currentVersion);
  const [latestRelease, setLatestRelease] = React.useState<{
    version: string;
    apkUrl: string;
  } | null>(null);

  /** FETCH LATEST GITHUB RELEASE */
  const fetchLatestRelease = async () => {
    try {
      const response = await fetch(
        "https://api.github.com/repos/Mav977/SpendWise/releases/latest"
      );
      const release = await response.json();
      const apkAsset = release.assets?.find((a: any) =>
        a.name.endsWith(".apk")
      );
     
      if (apkAsset) {
        setLatestRelease({
          version: release.tag_name,
          apkUrl: release.html_url,
        });
      }
    } catch (e) {
      console.error("Failed to fetch GitHub release", e);
    }
  };

  React.useEffect(() => {
    fetchLatestRelease();
  }, []);

  /** SIMPLIFIED APK UPDATE HANDLER */
/** SIMPLIFIED APK UPDATE HANDLER (GitHub only) */
const handleUpdate = (apkUrl: string) => {
  Alert.alert(
    "Update Available",
    "A new version is available. Download it from GitHub:",
    [
      {
        text: "Download from GitHub",
        onPress: () => Linking.openURL(apkUrl),
      },
      { text: "Cancel", style: "cancel" },
    ]
  );
};

  /** CLEAR ALL DATA */
  const handleClearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all transactions from your app. Go ahead?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Go Ahead",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await getDB();
              await db.withTransactionAsync(async () => {
                await db.runAsync("DELETE FROM Transactions");
              });
              Alert.alert("Success", "All data cleared.");
            } catch (e) {
              Alert.alert("Error", "Failed to clear all data.");
              console.error(e);
            }
          },
        },
      ]
    );
  };

  /** CLEAR DATA EXCEPT THIS MONTH */
  const handleClearDataExceptThisMonth = async () => {
    Alert.alert(
      "Clear Data Except This Month",
      "This will delete all data except for the current month. Go ahead?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Go Ahead",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await getDB();
              const now = new Date();
              const firstDayOfMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
              ).getTime();
              await db.withTransactionAsync(async () => {
                await db.runAsync(
                  "DELETE FROM Transactions WHERE date < ?",
                  [firstDayOfMonth]
                );
              });
              Alert.alert("Success", "Data except this month cleared.");
            } catch (e) {
              Alert.alert("Error", "Failed to clear data.");
              console.error(e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* --- GitHub / LinkedIn Links --- */}
      <Text style={styles.linkHeader}>Connect with me:</Text>

      <TouchableOpacity
        style={styles.linkCard}
        onPress={() =>
          Linking.openURL("https://github.com/Mav977/SpendWise")
        }
      >
        <MaterialCommunityIcons
          name="github"
          style={styles.linkIcon}
          color="#333"
        />
        <Text style={styles.linkCardText}>GitHub: Mav977/SpendWise</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkCard}
        onPress={() =>
          Linking.openURL(
            "https://www.linkedin.com/in/madhav-raj-goyal-98b225326/"
          )
        }
      >
        <MaterialCommunityIcons
          name="linkedin"
          style={styles.linkIcon}
          color="#0077B5"
        />
        <Text style={styles.linkCardText}>LinkedIn: Madhav Raj Goyal</Text>
      </TouchableOpacity>

   {/* --- Update Section --- */}
<View style={[styles.spacing, { height: 32 }]} />
<Text style={styles.linkHeader}>App Version:</Text>

{latestRelease ? (
  latestRelease.version !== currentVersion ? (
    <>
      <TouchableOpacity
        style={styles.linkCard}
        onPress={() => handleUpdate(latestRelease.apkUrl)}
      >
        <MaterialCommunityIcons
          name="update"
          style={styles.linkIcon}
          color="#333"
        />
        <Text style={styles.linkCardText}>
          Update to {latestRelease.version}
        </Text>
      </TouchableOpacity>

      {/* Update Instructions */}
      <View style={styles.updateInstructions}>
        <MaterialCommunityIcons name="information" size={16} color="#666" />
        <Text style={styles.instructionText}>
          Updates are hosted on GitHub. Tap the button above to download and install.
        </Text>
      </View>
    </>
  ) : (
    <View style={styles.linkCard}>
      <MaterialCommunityIcons
        name="check-circle"
        style={styles.linkIcon}
        color="green"
      />
      <Text style={styles.linkCardText}>
        You’re up to date! (v{currentVersion})
      </Text>
    </View>
  )
) : (
  <Text style={{ color: "#666" }}>Checking for updates...</Text>
)}


      {/* --- Data Management Section --- */}
      <Text style={styles.linkHeader}>Data Management:</Text>
      <Text style={styles.syncLabel}>Sync data across devices</Text>

      <View style={styles.syncButtonsContainer}>
        <TouchableOpacity
          style={[styles.customButton, styles.primaryButton, styles.syncButton]}
          onPress={exportDatabase}
        >
          <MaterialCommunityIcons
            name="cloud-upload"
            size={22}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>Export Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.customButton,
            styles.destructiveButton,
            styles.syncButton,
          ]}
          onPress={() => {
            Alert.alert(
              "Import Warning",
              "Importing a database will replace your current data. Continue?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Import", style: "destructive", onPress: importDatabase },
              ]
            );
          }}
        >
          <MaterialCommunityIcons
            name="cloud-download"
            size={22}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>Import Data</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.spacing, { height: 20 }]} />

      <TouchableOpacity
        style={[styles.customButton, styles.reddishButton]}
        onPress={handleClearAllData}
      >
        <MaterialCommunityIcons
          name="delete-outline"
          size={22}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.buttonText}>Clear All Data</Text>
      </TouchableOpacity>

      <View style={styles.spacing} />

      <TouchableOpacity
        style={[styles.customButton, styles.reddishButton]}
        onPress={handleClearDataExceptThisMonth}
      >
        <MaterialCommunityIcons
          name="calendar-remove"
          size={22}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.buttonText}>Clear Data Except This Month</Text>
      </TouchableOpacity>

      {/* App Settings Section */}
      <View style={[styles.spacing, { height: 32 }]} />
      <Text style={styles.linkHeader}>App Settings:</Text>

      <TouchableOpacity
        style={[styles.customButton, styles.settingsButton]}
        onPress={() => navigation.navigate("Permissions")}
      >
        <MaterialCommunityIcons
          name="lock-open-outline"
          size={22}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.buttonText}>Manage App Permissions</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", marginVertical: 5 }}>
        <MaterialCommunityIcons name="information" size={15} color="#666" />
        <Text
          style={{
            color: "#666",
            marginLeft: 4,
            marginRight: 10,
            fontSize: 15,
          }}
        >
          Your bank may not send notifications for all transactions. So add the
          missing ones manually.
        </Text>
      </View>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F2E7FF" },
  spacing: { height: 16 },
  linkHeader: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#333" },
  customButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 10
  },
  primaryButton: { backgroundColor: "rgba(115, 0, 255, 0.72)" },
  destructiveButton: { backgroundColor: "rgba(175, 5, 255, 0.72)" },
  reddishButton: { backgroundColor: "#d32f2f" },
  settingsButton: { backgroundColor: "#f9a825", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  linkCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(115, 0, 255, 0.1)", padding: 16, borderRadius: 10, marginBottom: 10 },
  linkIcon: { fontSize: 24, marginRight: 10 },
  linkCardText: { fontSize: 16, fontWeight: "500", color: "rgba(115, 0, 255, 1)" },
  syncButtonsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  syncButton: { flex: 1, marginHorizontal: 5 },
  syncLabel: { textAlign: "center", fontSize: 14, color: "#666", marginTop: 5, marginBottom: 10 },
  updateInstructions: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    backgroundColor: "rgba(255, 193, 7, 0.1)", 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 8 
  },
  instructionText: { 
    flex: 1, 
    marginLeft: 8, 
    fontSize: 13, 
    color: "#666", 
    lineHeight: 18 
  },
});
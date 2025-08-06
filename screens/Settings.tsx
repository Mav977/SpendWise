import React from "react";
import {
  View,
  Alert,
  StyleSheet,
  Linking,
  Text,
  TouchableOpacity,
} from "react-native";

import { exportDatabase, importDatabase } from "../src/utils/ExportImportDB";

import { getDB } from "../db";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

export default function SettingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleClearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all data from your app. Go ahead?",
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
                await db.runAsync("DELETE FROM Categories");
                await db.runAsync("DELETE FROM UPICategory");
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
                await db.runAsync("DELETE FROM Transactions WHERE date < ?", [
                  firstDayOfMonth,
                ]);
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
      {/* Section Header for social links */}
      <Text style={styles.linkHeader}>Connect with me:</Text>

      <TouchableOpacity
        style={styles.linkCard}
        onPress={() => Linking.openURL("https://github.com/Mav977/SpendWise")}
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

      <View style={[styles.spacing, { height: 32 }]} />

      {/* Data Management Section */}
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
                {
                  text: "Import",
                  style: "destructive",
                  onPress: importDatabase,
                },
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F2E7FF",
  },
  spacing: {
    height: 16,
  },
  linkHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  customButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: "rgba(115, 0, 255, 0.72)",
  },
  destructiveButton: {
    backgroundColor: "rgba(175, 5, 255, 0.72)",
  },
  clearMonthlyButton: {
    backgroundColor: "rgba(150, 0, 200, 0.72)",
  },
  reddishButton: {
    backgroundColor: "#d32f2f",
  },
  blueButton: {
    backgroundColor: "#1976d2",
  },
  settingsButton: {
    backgroundColor: "#f9a825", // Amber 700
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(115, 0, 255, 0.1)",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  linkIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  linkCardText: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(115, 0, 255, 1)",
  },
  syncButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  syncButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  syncLabel: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    marginBottom: 10,
  },
});

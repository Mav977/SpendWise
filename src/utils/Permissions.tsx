import * as IntentLauncher from "expo-intent-launcher";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const openSettings = (action: string) => {
  if (Platform.OS === "android") {
    switch (action) {
      case "notification_listener":
        IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.NOTIFICATION_LISTENER_SETTINGS
        );
        break;
      case "notification_permission":
        IntentLauncher.startActivityAsync(
          "android.settings.APP_NOTIFICATION_SETTINGS",
          {
            extra: {
              "android.provider.extra.APP_PACKAGE": "com.mav977.SpendWise", // Replace with your app's package name
            },
          }
        );
        break;
      case "battery_optimization":
        IntentLauncher.startActivityAsync(
          "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"
        );
        break;
      case "pause_if_unused":
        // Try the app info settings first, which usually contains the "Pause app if unused" option
        IntentLauncher.startActivityAsync(
          "android.settings.APPLICATION_DETAILS_SETTINGS",
          {
            data: "package:com.mav977.SpendWise",
          }
        ).catch(() => {
          // Fallback to general app settings if the above doesn't work
          IntentLauncher.startActivityAsync(
            "android.settings.MANAGE_APPLICATIONS_SETTINGS"
          );
        });
        break;
      default:
        Alert.alert("Error", "Could not open settings.");
        break;
    }
  }
};

interface PermissionScreenProps {
  onComplete: () => void;
}

export default function PermissionScreen({ onComplete }: PermissionScreenProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Enable Notification Listener",
      description:
        "This helps us detect UPI transactions. Turn on listener for Spendwise.\n\n⚠️⚠️❗❗IMPORTANT: Among the 2 Spendwise apps, choose the second one. If that doesn't work, choose the one which doesn't crash your app.⚠️⚠️❗❗",
      action: () => openSettings("notification_listener"),
    },
    {
      title: "Allow Notification Permission",
      description:
        "We use notifications to alert you for categorization and insights.",
      action: () => openSettings("notification_permission"),
    },
    {
      title: "Disable Battery Optimization",
      description:
        "To make sure we work in background, disable battery optimization for Spendwise.",
      action: () => openSettings("battery_optimization"),
    },
    {
      title: "Disable 'Pause app if unused'",
      description:
        "In the app settings, look for 'Pause app if unused' or 'Remove permissions if app isn't used' and turn it OFF. This ensures Spendwise keeps working even if you don't open it often. ",
      action: () => openSettings("pause_if_unused"),
    },
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // This is the finish step
      console.log("Completing permissions setup...");
      try {
        await onComplete();
        console.log("Permissions setup completed successfully");
      } catch (error) {
        console.error("Error completing permissions setup:", error);
        Alert.alert("Error", "Failed to complete setup. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{steps[step].title}</Text>
      <Text style={styles.desc}>{steps[step].description}</Text>

      <TouchableOpacity style={styles.btn} onPress={steps[step].action}>
        <Text style={styles.btnText}>Open Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.btnText}>
          {step === steps.length - 1 ? "Finish (Open app again after clicking it)" : "Next"}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  desc: { fontSize: 16, marginBottom: 24 },
  btn: {
    backgroundColor: "#2e86de",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  nextBtn: {
    backgroundColor: "#27ae60",
    padding: 16,
    borderRadius: 8,
  },
  btnText: { color: "white", textAlign: "center", fontWeight: "bold" },
  debugContainer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
});
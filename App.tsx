import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { createRef, Suspense, useEffect, useState } from "react";
import { SQLiteProvider } from "expo-sqlite";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from "./screens/Home";
import CategoriseScreen from "./screens/CategoriseScreen"
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from "./types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Analytics from "./screens/Analytics";
import SpTransactions from "./screens/SpTransactions";
import PendingTxns from "./screens/PendingTxns";
import SettingsScreen from "./screens/Settings";
import PermissionsScreen from "./src/utils/Permissions";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LIGHT_PURPLE = "#F2E7FE";
const HEADER_PURPLE = "rgba(115, 0, 255, 0.72)";

export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Categorise: {
        path: 'categorise',
        parse: {
          receiver: (receiver: string) => decodeURIComponent(receiver),
          amount: (amount: string) => parseFloat(amount),
        },
      },
      TabNavigation: {
        path: 'tabs',
        screens: {
          HomeScreen: 'home',
          AnalyticsScreen: 'analytics',
        },
      },
    },
  },
};

// Create a wrapper component for PermissionsScreen
function PermissionsWrapper({ onComplete }: { onComplete: () => void }) {
  const handlePermissionsComplete = async () => {
    try {
      await AsyncStorage.setItem("permissionsGranted", "true");
      console.log("Permissions saved to AsyncStorage");
      onComplete(); // Call the parent's completion handler
    } catch (error) {
      console.error("Error completing permissions:", error);
    }
  };

  return <PermissionsScreen onComplete={handlePermissionsComplete} />;
}

export default function App() {
  const [permissionsComplete, setPermissionsComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      const granted = await AsyncStorage.getItem("permissionsGranted");
      setPermissionsComplete(granted === "true");
    };
    checkPermissions();
  }, []);

  const handlePermissionsFinished = () => {
    setPermissionsComplete(true);
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const deepLink = response.notification.request.content.data?.deepLink;

      if (deepLink && typeof deepLink === 'string') {
        try {
          const url = new URL(deepLink);
          const receiver = url.searchParams.get('receiver');
          const amount = parseFloat(url.searchParams.get('amount') || '0');
          const ask = parseFloat(url.searchParams.get('alwaysask') || '0');
          const transactionId = url.searchParams.get('transactionId');
          if (receiver && !isNaN(amount)) {
            navigationRef.current?.navigate('Categorise', {
              receiver,
              amount,
              ask,
              transactionId: transactionId ? parseInt(transactionId, 10) : undefined
            });
          } else {
            console.log("Missing or invalid parameters in deep link");
          }
        } catch (e) {
          console.error("Invalid deep link URL:", deepLink);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  if (permissionsComplete === null) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" />
        <Text>Checking permissions...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} ref={navigationRef}>
      <Suspense
        fallback={
          <View style={styles.splashContainer}>
            <ActivityIndicator size="large" />
            <Text>Loading Database...</Text>
          </View>
        }
      >
        <SQLiteProvider
          databaseName="myDatabase.db"
          assetSource={{ assetId: require("./assets/myDatabase.db") }}
          useSuspense
        >
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: HEADER_PURPLE },
              headerTitleStyle: { color: "#FFF" },
              contentStyle: { backgroundColor: LIGHT_PURPLE }
            }}
          >
            {!permissionsComplete ? (
              <Stack.Screen
                name="Permissions"
                options={{ headerShown: false }}
              >
                {() => <PermissionsWrapper onComplete={handlePermissionsFinished} />}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="TabNavigation" component={TabNavigation} options={{ headerShown: false }} />
                <Stack.Screen name="Categorise" component={CategoriseScreen} />
                <Stack.Screen name="Transactions" component={SpTransactions} />
                 <Stack.Screen
                name="Permissions"
                options={{ headerShown: false }}
              >
                {() => <PermissionsWrapper onComplete={handlePermissionsFinished} />}
              </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </SQLiteProvider>
      </Suspense>
    </NavigationContainer>
  );
}

function TabNavigation() {
  return (
    <Tab.Navigator initialRouteName="Home">
      <Tab.Screen
        name="Pending Transactions"
        component={PendingTxns}
        options={{
          tabBarLabel: "Pending",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="progress-clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={Analytics}
        options={{
          tabBarLabel: "Analytics",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="google-analytics" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerStyle: { backgroundColor: HEADER_PURPLE },
          headerTintColor: "#fff",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
// import { LogBox } from 'react-native';


//   // Ignore all logs
//   LogBox.ignoreAllLogs();

//   // Override console methods to silence them
//   console.log = () => {};
//   console.warn = () => {};
//   console.error = () => {};
//   console.info = () => {};
//   console.debug = () => {};


import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Platform,
  useColorScheme,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { createRef, Suspense, useEffect } from "react";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from "./screens/Home";
import CategoriseScreen from "./screens/CategoriseScreen"
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from "./types";
import { useNavigationContainerRef } from '@react-navigation/native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Analytics from "./screens/Analytics";
import SpTransactions from "./screens/SpTransactions";
import { Colors } from "./styles/theme";

export async function resetToAssetDB() {
  const path = `${FileSystem.documentDirectory}SQLite/myDatabase.db`;

  try {
    await FileSystem.deleteAsync(path, { idempotent: true });
    console.log("🗑️ Deleted sandboxed DB. Will reload from assets on next access.");
  } catch (error) {
    console.error("❌ Failed to delete DB:", error);
  }
}


// const navigationRef = useNavigationContainerRef();
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
        path: 'tabs', // e.g., your-app://tabs/home or your-app://tabs/analytics
        screens: {
          HomeScreen: 'home',
          AnalyticsScreen: 'analytics', // Assuming you'll name your analytics tab screen AnalyticsScreen
        },
      },
    },
  },
};


export default function App() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  console.log("Current color scheme:", colorScheme);

  // useEffect(() => {
  //   const reset = async () => {
  //     await resetToAssetDB();
  //   };
  //   reset();
  // }, []);
  useEffect(() => {
   const subscription = Notifications.addNotificationResponseReceivedListener(response => {
  const deepLink = response.notification.request.content.data?.deepLink;

  if (deepLink && typeof deepLink === 'string') {
    try {
      const url = new URL(deepLink);
      const receiver = url.searchParams.get('receiver');
      const amount = parseFloat(url.searchParams.get('amount') || '0');
      const ask = parseFloat(url.searchParams.get('alwaysask') || '0');
      if (receiver && !isNaN(amount)) {
        console.log("🔗 Navigating to Categorise screen with:", { receiver, amount, ask });
        navigationRef.current?.navigate('Categorise', { receiver, amount, ask });
      } else {
        console.log(" Missing or invalid parameters in deep link");
      }
    } catch (e) {
      console.error(" Invalid deep link URL:", deepLink);
    }
  }
});


    return () => subscription.remove();
  }, []);
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer linking={linking} ref={navigationRef} >
        <Suspense
          fallback={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size={"large"} />

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
              headerStyle: {
                backgroundColor: theme.tint,
              },
              headerTitleStyle: {
                color: theme.buttonText,
              },
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          >
            <Stack.Screen
              name="TabNavigation"
              options={{ headerShown: false }}
            >
              {(props) => <TabNavigation {...props} theme={theme} />}
            </Stack.Screen>
            <Stack.Screen name="Categorise" component={CategoriseScreen} />
            <Stack.Screen name="Transactions" component={SpTransactions} />
          </Stack.Navigator>
        </SQLiteProvider>
      </Suspense>
    </NavigationContainer>
    </>
  );
}
function TabNavigation({ theme }: { theme: typeof Colors.light | typeof Colors.dark }) {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarStyle: { backgroundColor: theme.card },
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
      }}
    >
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
            <MaterialCommunityIcons
              name="google-analytics"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#fff",

    alignItems: "center",

    justifyContent: "center",
  },
});

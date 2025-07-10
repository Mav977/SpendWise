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
import { createRef, Suspense, useEffect } from "react";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./screens/Home";
import CategoriseScreen from "./screens/CategoriseScreen"
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from "./types";
import { useNavigationContainerRef } from '@react-navigation/native';

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
const Stack = createNativeStackNavigator<RootStackParamList>();
const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Home: '',
      Categorise: {
        path: 'categorise',
        parse: {
          receiver: (receiver: string) => decodeURIComponent(receiver),
          amount: (amount: string) => parseFloat(amount),
          
        },
      },
    },
  },
};


export default function App() {
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
        console.log("⚠️ Missing or invalid parameters in deep link");
      }
    } catch (e) {
      console.error("❌ Invalid deep link URL:", deepLink);
    }
  }
});


    return () => subscription.remove();
  }, []);
  return (
   <NavigationContainer linking={linking} ref={navigationRef}>
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
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={Home}
              options={{
                headerTitle: "Spendwise",
                headerLargeTitle: true,
                headerTransparent: Platform.OS === "ios" ? true : false,
                headerBlurEffect: "light",
              }}
            />
            <Stack.Screen name="Categorise" component={CategoriseScreen} />
          </Stack.Navigator>
        </SQLiteProvider>
      </Suspense>
    </NavigationContainer>
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
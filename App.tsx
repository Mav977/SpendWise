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


import { Suspense } from "react";

import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./screens/Home";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
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

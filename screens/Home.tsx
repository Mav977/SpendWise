import { View, Text, ScrollView, TextStyle, StyleSheet, Button, Platform, Linking, Alert, TouchableOpacity, RefreshControl, FlatList, ToastAndroid, useColorScheme } from 'react-native'
import React, { useCallback, useEffect, useState, useLayoutEffect } from 'react'
import { Category, RootStackParamList, Transaction, TransactionsByMonth } from '../types';
import { useSQLiteContext } from 'expo-sqlite';
import Card from "../ui/Card"
import AddTransaction from '../ui/AddTransaction';
import TransactionSummary from '../components/TransactionSummary';
import * as IntentLauncher from 'expo-intent-launcher';
import NotificationListener from 'react-native-android-notification-listener';
import * as FileSystem from 'expo-file-system';
import { DeviceEventEmitter } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllAppData } from '../src/db/helpers';
import { addCategory } from '../src/db/addCategory';
import TransactionsListItem from "../components/TransactionListItem";
import { Colors } from '../styles/theme';


type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TabNavigation'>;


const Home = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isFocused = useIsFocused(); // Get the focus state


  useEffect(() => {
    // This effect runs whenever the screen's focus state changes
    if (isFocused) {
      console.log("Home screen is focused, refreshing data.");
      getData(); // Call your data fetching function
    }
  }, [isFocused]); // Depend on isFocused
const navigation = useNavigation<HomeScreenNavigationProp>();
 useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Spendwise",
      headerLargeTitle: true,
      headerTransparent: Platform.OS === "ios" ? true : false,
      headerBlurEffect: "light",
      headerStyle: {
        backgroundColor: theme.tint,
      },
      headerTitleStyle: {
        color: theme.buttonText,
      },
      // You can also set headerRight, headerLeft, etc. here if needed
    });
   }, [navigation]); 
useEffect(() => {
  Notifications.requestPermissionsAsync().then(({ granted }) => {
    if (!granted) {
      alert('Notification permission not granted');
    }
  });
}, []);
useEffect(() => {
  const subscription = DeviceEventEmitter.addListener(
    "transactionInserted",
    () => {
      console.log("🔄 Received event: transactionInserted");
      getData(); // this will re-fetch data and update UI
    }
  );
  // Clean up
  return () => {
    subscription.remove();
  };
}, []);
    

useEffect(() => {
  const checkNotificationAccess = async () => {
    if (Platform.OS === 'android') {
      if (!NotificationListener) {
        console.warn("NotificationListener is not available");
        return;
      }
      try {
        const status = await NotificationListener.getPermissionStatus();
        console.log("🔍 Notification Access Status:", status);

        if (status !== 'authorized') {
          ToastAndroid.show("Permission denied!", ToastAndroid.LONG);
          
          // Delay the alert to ensure it's shown properly
          setTimeout(() => {
            Alert.alert(
              "Notification Access Required",
              "To detect UPI messages, please grant Notification Access to this app.\n\nIMPORTANT: Among the 2 Spendwise apps, choose the second one.",
          
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Open Settings",
                  onPress: () => {
                    IntentLauncher.startActivityAsync(
                      IntentLauncher.ActivityAction.NOTIFICATION_LISTENER_SETTINGS
                    );
                  },
                },
              ],
              { cancelable: true }
            );
          }, 500); // Delay ensures the UI is ready
        } else {
          console.log("✅ Notification access is already granted");
        }
      } catch (e) {
        console.warn("❌ Error checking notification access:", e);
        // As a fallback, show the alert anyway
        setTimeout(() => {
          Alert.alert(
            "Notification Access Required",
            "Could not verify notification access. Please grant access manually.",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Open Settings",
                onPress: () => {
                  IntentLauncher.startActivityAsync(
                    IntentLauncher.ActivityAction.NOTIFICATION_LISTENER_SETTINGS
                  );
                },
              },
            ],
            { cancelable: true }
          );
        }, 500);
      }
    }
  };

  checkNotificationAccess();
}, []);
 const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

   getData();
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);
    //useState<Category[]>([]); means categories is an array of type Category (taken from types.ts)
    const [categories,setCategories]=useState<Category[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
     const [transactionsByMonth, setTransactionsByMonth] =
    React.useState<TransactionsByMonth>({
       totalExpenses: 0,
      totalIncome: 0,
    });

    const db=useSQLiteContext();

    useEffect(()=>{
        db.withTransactionAsync(async()=>await getData())
    },[db, isFocused]);

    async function getData() {
  const { transactions, todayTransactions,categories, monthlySummary } = await getAllAppData(db);
  console.log("Fetched today's transactions:", todayTransactions);
  setTransactions(transactions);
setTodayTransactions(todayTransactions);
  setCategories(categories);
  setTransactionsByMonth(monthlySummary);
  }
    async function deleteTransaction(id:number) {
        db.withTransactionAsync(async ()=>{
            await db.runAsync(`DELETE FROM Transactions WHERE id = ?;`, [id]);
      await getData();
        })
    }
  async function deleteCategory(id:number) {
        db.withTransactionAsync(async ()=>{
            await db.runAsync(`DELETE FROM Categories WHERE id = ?;`, [id]);
      await getData();
        })
    }
      async function insertTransaction(transaction: Transaction) {
    db.withTransactionAsync(async () => {
      await db.runAsync(
        `
        INSERT INTO Transactions (category_id, amount, date, description, type) VALUES (?, ?, ?, ?, ?);
      `,
        [
          transaction.category_id,
          transaction.amount,
          transaction.date,
          transaction.description,
          transaction.type,
        ]
      );
      await getData();
    });
  }

async function toggleTransactionType(id: number, newType: "Expense" | "Income") {
  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE Transactions SET type = ? WHERE id = ?`, [
      newType,
      id,
    ]);
  });
  await getData();
}
async function handleAddCategory(name: string, type: string) {
  await addCategory(db, name, type, (updatedCategories) => {
    setCategories(updatedCategories);
  });
}

  const testNavigateToCategories = () => {
    navigation.navigate('Categorise', {
      receiver: 'Test Receiver',
      amount: 100,
      ask:0
    });
  };

 const handleEditTransaction=(transaction:Transaction)=>{
  navigation.navigate('Categorise', {
      receiver: "undefined",
      amount: transaction.amount,
      ask:0,
    transactionId: transaction.id,
    initialCategory: categories.find(cat=>cat.id ===transaction.category_id)?.name,
    initialDescription: transaction.description,
    initialType: transaction.type,
    });
 }
   return (
  <FlatList
  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    data={todayTransactions}
    keyExtractor={(item) => item.id.toString()}
    renderItem={({ item }) => {
      const categoryForCurrentItem = categories.find(
        (cat) => cat.id === item.category_id
      );
      return (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.7}
          onLongPress={() => deleteTransaction(item.id)}
        >
          <TransactionsListItem
            transaction={item}
            categoryInfo={categoryForCurrentItem}
            onToggleType={toggleTransactionType}
            onEdit={handleEditTransaction}
          />
        </TouchableOpacity>
      );
    }}
    ListHeaderComponent={
      <>
        <AddTransaction
          insertTransaction={insertTransaction}
          deleteCategory={deleteCategory}
          cat={categories}
          addCategory={handleAddCategory}
        />

        <TransactionSummary
          totalExpenses={transactionsByMonth.totalExpenses}
          totalIncome={transactionsByMonth.totalIncome}
        />

        <Text style={{ fontSize: 22, fontWeight: "bold", marginVertical: 10, color: theme.text }}>
          All Transactions
        </Text>
      </>
    }
    contentContainerStyle={{ padding: 20,
    flexGrow: 1, backgroundColor: theme.background }}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
  />
);

}

export default Home

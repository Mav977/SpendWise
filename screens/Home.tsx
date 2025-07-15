import { View, Text, ScrollView, TextStyle, StyleSheet, Button, Platform, Linking, Alert, TouchableOpacity, RefreshControl, FlatList } from 'react-native'
import React, { useCallback, useEffect, useState,useLayoutEffect } from 'react'
import { Category, RootStackParamList, Transaction, TransactionsByMonth } from '../types';
import { useSQLiteContext } from 'expo-sqlite';
import Card from "../ui/Card"
import AddTransaction from '../ui/AddTransaction';
import * as IntentLauncher from 'expo-intent-launcher';
import NotificationListener from 'react-native-android-notification-listener';
import * as FileSystem from 'expo-file-system';
import { DeviceEventEmitter } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllAppData } from '../src/db/helpers';
import { addCategory } from '../src/db/addCategory';
import TransactionsListItem from "../components/TransactionListItem"


type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TabNavigation'>;


const Home = () => {
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
         backgroundColor: "rgba(115, 0, 255, 0.72)",
       },
       headerTitleStyle: {
         color: "#FFF",
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
      const status = await NotificationListener.getPermissionStatus();

      if (status !== 'authorized') {
        Alert.alert(
          "Notification Access Required",
          "To detect UPI messages, please grant Notification Access to this app.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Open Settings",
              onPress: () => {
                // Open notification access settings
                IntentLauncher.startActivityAsync(
                  IntentLauncher.ActivityAction.NOTIFICATION_LISTENER_SETTINGS
                );
              },
            },
          ],
          { cancelable: true }
        );
      } else {
        console.log("✅ Notification permission is already granted");
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
     const [transactionsByMonth, setTransactionsByMonth] =
    React.useState<TransactionsByMonth>({
      totalExpenses: 0,
      totalIncome: 0,
    });

    const db=useSQLiteContext();

    useEffect(()=>{db.withTransactionAsync(async()=>await getData())},[db]);

    async function getData() {
  const { transactions, categories, monthlySummary } = await getAllAppData(db);
  setTransactions(transactions);
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
    data={transactions}
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
        {/* <Card style={{ marginBottom: 16, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Debug Navigation
          </Text>
          <Button title="Test Categorise Screen" onPress={testNavigateToCategories} />
        </Card> */}
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

        <Text style={{ fontSize: 22, fontWeight: "bold", marginVertical: 10 }}>
          All Transactions
        </Text>
      </>
    }
    contentContainerStyle={{ padding: 20,
    flexGrow: 1, backgroundColor: '#F2E7FF' }}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
  />
);

}

function TransactionSummary({
  totalIncome,
  totalExpenses,
}: TransactionsByMonth) {
  const savings = totalIncome - totalExpenses;
  const readablePeriod = new Date().toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });

  // Function to determine the style based on the value (positive or negative)
  const getMoneyTextStyle = (value: number): TextStyle=> ({
    fontWeight: "bold",
    color: value < 0 ? "#ff4500" : "#2e8b57", // Red for negative, custom green for positive
  });

  // Helper function to format monetary values
  const formatMoney = (value: number) => {
    const absValue = Math.abs(value).toFixed(2);
    return `Rs ${value < 0 ? "-" : ""}${absValue}`;
  };
    return (
    
      <Card style={styles.container}>
        <Text style={styles.periodTitle}>Summary for {readablePeriod}</Text>
        
        <Text style={styles.summaryText}>
          Income:{" "}
          <Text style={getMoneyTextStyle(totalIncome)}>
            {formatMoney(totalIncome)}
          </Text>
        </Text>
        <Text style={styles.summaryText}>
          Total Expenses:{" "}
          <Text style={getMoneyTextStyle(totalExpenses)}>
            {formatMoney(totalExpenses)}
          </Text>
        </Text>
        <Text style={styles.summaryText}>
          Savings:{" "}
          <Text style={getMoneyTextStyle(savings)}>{formatMoney(savings)}</Text>
        </Text>
      </Card>
    
  );
}
const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingBottom: 7,
  },
  blur: {
    width: "100%",
    height: 110,
    position: "absolute",
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#00000010",
    padding: 16,
  },
  periodTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
  // Removed moneyText style since we're now generating it dynamically
});
export default Home
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ToastAndroid,
  Platform,
  Linking,
  Alert,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useState,
  useLayoutEffect,
} from "react";
import {
  Category,
  RootStackParamList,
  Transaction,
  TransactionsByMonth,
} from "../types";
import { useSQLiteContext } from "expo-sqlite";
import Card from "../ui/Card";
import AddTransaction from "../ui/AddTransaction";
import * as IntentLauncher from "expo-intent-launcher";
import NotificationListener from "react-native-android-notification-listener";
import * as FileSystem from "expo-file-system";
import { DeviceEventEmitter } from "react-native";
import * as Notifications from "expo-notifications";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getAllAppData } from "../src/db/helpers";
import { addCategory } from "../src/db/addCategory";
import TransactionsListItem from "../components/TransactionListItem";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TabNavigation"
>;

function groupTransactionsByMonth(transactions: Transaction[]) {
  const groups: { [key: string]: Transaction[] } = {};
  transactions.forEach((txn) => {
    const date = new Date(txn.date);
    const monthKey = date.toLocaleString("default", { month: "long", year: "numeric" });
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(txn);
  });
  return groups;
}

const Home = () => {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      getData();
    }
  }, [isFocused]);
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
    });
  }, [navigation]);
  useEffect(() => {
    Notifications.requestPermissionsAsync().then(({ granted }) => {
      if (!granted) {
        alert("Notification permission not granted");
      }
    });
  }, []);
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "transactionInserted",
      () => {
        getData();
      }
    );
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const checkNotificationAccess = async () => {
      if (Platform.OS === "android") {
        try {
          const status = await NotificationListener.getPermissionStatus();
          if (status !== "authorized") {
            ToastAndroid.show("Permission denied!", ToastAndroid.LONG);
            setTimeout(() => {
              Alert.alert(
                "Notification Access Required",
                "To detect UPI messages, please grant Notification Access to this app.\n\nIMPORTANT: Among the 2 Spendwise apps, choose the second one.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Open Settings",
                    onPress: () => {
                      IntentLauncher.startActivityAsync(
                        IntentLauncher.ActivityAction
                          .NOTIFICATION_LISTENER_SETTINGS
                      );
                    },
                  },
                ],
                { cancelable: true }
              );
            }, 500);
          }
        } catch (e) {
          setTimeout(() => {
            Alert.alert(
              "Notification Access Required",
              "Could not verify notification access. Please grant access manually.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => {
                    IntentLauncher.startActivityAsync(
                      IntentLauncher.ActivityAction
                        .NOTIFICATION_LISTENER_SETTINGS
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [transactionsByMonth, setTransactionsByMonth] =
    React.useState<TransactionsByMonth>({
      totalExpenses: 0,
      totalIncome: 0,
    });

  const db = useSQLiteContext();

  useEffect(() => {
    db.withTransactionAsync(async () => await getData());
  }, [db]);

  async function getData() {
    const { transactions, allTransactions, categories, monthlySummary } =
      await getAllAppData(db);

    setAllTransactions(allTransactions);
    const filtered = allTransactions.filter(
      (txn) => txn.pending_cat === 0
    );
    setFilteredTransactions(filtered);
    setCategories(categories);
    setTransactionsByMonth(monthlySummary);
  }
  async function deleteTransaction(id: number) {
    db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM Transactions WHERE id = ?;`, [id]);
      await getData();
    });
  }
  async function deleteCategory(id: number) {
    if (id === 13) {
      alert("This category cannot be deleted.");
      return;
    }
    db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM Categories WHERE id = ?;`, [id]);
      await getData();
    });
  }

  async function insertTransaction(transaction: Transaction) {
    db.withTransactionAsync(async () => {
      await db.runAsync(
        `
        INSERT INTO Transactions (category_id, amount, date, description, type, pending_cat) VALUES (?, ?, ?, ?, ?, ?);
      `,
        [
          transaction.category_id,
          transaction.amount,
          transaction.date,
          transaction.description,
          transaction.type,
          transaction.pending_cat,
        ]
      );
      await getData();
    });
  }

  async function toggleTransactionType(
    id: number,
    newType: "Expense" | "Income"
  ) {
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

  const handleEditTransaction = (transaction: Transaction) => {
    navigation.navigate("Categorise", {
      amount: transaction.amount,
      ask: 0,
      transactionId: transaction.id,
      initialCategory: categories.find(
        (cat) => cat.id === transaction.category_id
      )?.name,
      initialDescription: transaction.description,
      initialType: transaction.type,
    });
  };

  // Group transactions by month and flatten for FlatList
  const sectionedTransactions = React.useMemo(() => {
    const grouped = groupTransactionsByMonth(filteredTransactions);
    const result: Array<{ type: "header" | "item"; month?: string; txn?: Transaction }> = [];
    Object.entries(grouped).forEach(([month, txns]) => {
      result.push({ type: "header", month });
      txns.forEach((txn) => result.push({ type: "item", txn }));
    });
    return result;
  }, [filteredTransactions]);

  return (
    <FlatList
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      data={sectionedTransactions}
      keyExtractor={(item, idx) =>
        item.type === "header"
          ? `header-${item.month}-${idx}`
          : `txn-${item.txn?.id}`
      }
      renderItem={({ item }) => {
        if (item.type === "header") {
          return (
            <View style={{ marginTop: 18, marginBottom: 6 }}>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "#ccc",
                  marginBottom: 4,
                }}
              />
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#7340ff" }}>
                {item.month}
              </Text>
            </View>
          );
        }
        // Transaction item
        const txn = item.txn!;
        const categoryForCurrentItem = categories.find(
          (cat) => cat.id === txn.category_id
        );
        return (
          <TouchableOpacity
            key={txn.id}
            activeOpacity={0.7}
            onLongPress={() => deleteTransaction(txn.id)}
          >
            <TransactionsListItem
              transaction={txn}
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

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold' }}>
              All Transactions
            </Text>
            <MaterialCommunityIcons
              name="information"
              size={15}
              color="#666"
              style={{ marginLeft: 80 }}
            />
            <Text style={{ color: '#666', marginLeft: 4, fontSize: 11 }}>
              Long press to delete
            </Text>
          </View>
        </>
      }
      contentContainerStyle={{
        padding: 20,
        flexGrow: 1,
        backgroundColor: "#F2E7FF",
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
};

function TransactionSummary({
  totalIncome,
  totalExpenses,
}: TransactionsByMonth) {
  const savings = totalIncome - totalExpenses;
  const readablePeriod = new Date().toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });

  const getMoneyTextStyle = (value: number): any => ({
    fontWeight: "bold",
    color: value < 0 ? "#ff4500" : "#2e8b57",
  });

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
});
export default Home;
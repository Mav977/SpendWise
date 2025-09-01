import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import Card from "../ui/Card";
import { getDB } from "../db";
import { getAllAppData } from "../src/db/helpers";
import {
  Category,
  RootStackParamList,
  Transaction,
  UPICategory,
} from "../types";
import AnalyticsListItem from "../components/AnalyticsListItem";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-gifted-charts";

const Analytics = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Analytics",
      headerStyle: { backgroundColor: "rgba(115, 0, 255, 0.72)" },
      headerTintColor: "#fff",
    });
  }, [navigation]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alltransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [upiList, setUpiList] = useState<UPICategory[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) getData();
  }, [isFocused]);

  async function getData() {
    const db = await getDB();
    const { transactions, allTransactions, categories } = await getAllAppData(
      db
    );

    db.getAllAsync("SELECT * FROM UPICategory").then((rows) =>
      setUpiList(rows as UPICategory[])
    );

    setTransactions(transactions);
    setAllTransactions(allTransactions);
    setCategories(categories);
  }

  async function DeleteUpiData(id: number) {
    const db = await getDB();
    await db.runAsync("DELETE FROM UPICategory WHERE id = ?", [id]);
    getData();
  }

  const sumValues = (arr: Transaction[]) =>
    arr.reduce((acc, curr) => acc + curr.amount, 0);

  const totalMonthlyExpense = sumValues(
    transactions.filter((t) => t.type === "Expense")
  );

  const sortedCategories = categories
    .map((cat) => {
      const catTransactions = transactions.filter(
        (t) => t.category_id === cat.id
      );
      const total = sumValues(catTransactions);
      const percentage = totalMonthlyExpense
        ? Number(((total / totalMonthlyExpense) * 100).toFixed(1))
        : 0;
      return { ...cat, total, percentage };
    })
    .sort((a, b) => b.total - a.total)
    .filter((cat) => cat.total > 0);

  const screenWidth = Dimensions.get("window").width;

  /** Get 12 months from first transaction */
  function getMonthlyExpenses(transactions: Transaction[]) {
    if (!transactions.length) return [];

    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstTxDate = new Date(sortedTx[0].date);
    const startMonth = firstTxDate.getMonth();
    const startYear = firstTxDate.getFullYear();

    const monthlyExpenses = Array(12).fill(0);
    const monthLabels: string[] = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(startYear, startMonth + i, 1);
      monthLabels.push(date.toLocaleString("default", { month: "short" }));

      transactions.forEach((t) => {
        const txDate = new Date(t.date);
        if (
          t.type === "Expense" &&
          txDate.getMonth() === date.getMonth() &&
          txDate.getFullYear() === date.getFullYear()
        ) {
          monthlyExpenses[i] += t.amount;
        }
      });
    }

    return monthlyExpenses.map((value, i) => ({
      value,
      labelComponent: () => (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: "#000" }}>{monthLabels[i]}</Text>
        </View>
      ),
    }));
  }

  const monthlyData = getMonthlyExpenses(alltransactions);
  const maxY = Math.max(...monthlyData.map((d) => d.value)) * 1.2 || 1;

  // Y-axis labels multiples of 5K
  const generateYAxisLabelTexts = () => {
    if (maxY <= 0) return [];
    const maxKValue = Math.ceil(maxY / 1000);
    const maxRoundedToFive = Math.ceil(maxKValue / 5) * 5;
    const stepSize = Math.max(5, Math.ceil(maxRoundedToFive / 5));
    const labels: string[] = [];
    for (let i = 0; i <= maxRoundedToFive; i += stepSize) {
      labels.push(i === 0 ? "0" : i + "K");
    }
    return labels;
  };
  const yAxisLabelTexts = generateYAxisLabelTexts();

  const renderDataPoints = monthlyData.map((d, i, arr) => ({
    ...d,
    showDataPointLabel: true,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: "#F2E7FF" }}>
      <SegmentedControl
        values={["Top Categories", "UPI Merchants"]}
        selectedIndex={selectedIndex}
        tintColor="#EEE"
        backgroundColor="#FFFFFF"
        fontStyle={{ color: "#000" }}
        onChange={(event) =>
          setSelectedIndex(event.nativeEvent.selectedSegmentIndex)
        }
        style={{ marginBottom: 16, marginHorizontal: 16, borderRadius: 8 }}
      />

      {selectedIndex === 0 && (
        <View style={{ flex: 1 }}>
          {sortedCategories.length > 0 ? (
            <FlatList
              style={{ marginBottom: 30 }}
              data={sortedCategories}
              keyExtractor={(item) => item.id.toString()}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={({ item }) => {
                const allTransactions = alltransactions.filter(
                  (t) => t.category_id === item.id
                );

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate("Transactions", {
                        Transaction: allTransactions,
                      })
                    }
                    onLongPress={async () => {
                      if (item.id === 13) {
                        alert("This category cannot be deleted.");
                        return;
                      }
                      const db = await getDB();
                      await db.runAsync("DELETE FROM Categories WHERE id = ?", [
                        item.id,
                      ]);
                      getData();
                    }}
                  >
                    <AnalyticsListItem
                      amount={item.total}
                      category={item}
                      percentage={item.percentage}
                    />
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{
                padding: 20,
                backgroundColor: "#F2E7FF",
              }}
              ListHeaderComponent={
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      textAlign: "center",
                      marginBottom: 10,
                    }}
                  >
                    Monthly Analysis
                  </Text>

                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      padding: 16,
                      marginHorizontal: 10,
                      marginBottom: 20,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 10 }}
                    >
                      <LineChart
                        areaChart={false}
                        data={renderDataPoints}
                        startFillColor="rgb(46, 217, 255)"
                        startOpacity={0.8}
                        endFillColor="rgb(203, 241, 250)"
                        endOpacity={0.3}
                        color="#7300FF"
                        spacing={60}
                        hideDataPoints={false}
                        showValuesAsDataPointsText
                        isAnimated
                        animationDuration={2500}
                        width={Math.max(
                          renderDataPoints.length * 60,
                          screenWidth - 40
                        )}
                        height={200}
                        maxValue={maxY}
                        yAxisLabelTexts={yAxisLabelTexts}
                        yAxisColor="#666"
                        yAxisTextStyle={{ color: "#666", fontSize: 12 }}
                        yAxisLabelWidth={40}
                        showYAxisIndices={true}
                        noOfSections={yAxisLabelTexts.length - 1}
                      />
                    </ScrollView>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 8,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="information"
                        size={20}
                        color="#666"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={{ color: "#666", fontSize: 14 }}>
                        Long press on a category to delete it.
                      </Text>
                    </View>
                  </View>
                </View>
              }
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#F2E7FF",
              }}
            >
              <Text style={{ textAlign: "center", fontSize: 16, color: "#888" }}>
                No categories found with transaction data.
              </Text>
            </View>
          )}
        </View>
      )}

      {selectedIndex === 1 && (
        <View style={{ flex: 1 }}>
          {upiList.length > 0 ? (
            <FlatList
              data={upiList}
              keyExtractor={(item) => item.id.toString()}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              contentContainerStyle={{
                padding: 16,
                backgroundColor: "#F2E7FF",
                paddingBottom: 40,
              }}
              renderItem={({ item }) => (
                <Card style={{ marginHorizontal: 10, padding: 15 }}>
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 16,
                      color: "#7300FF",
                    }}
                  >
                    {item.receiver}
                  </Text>
                  <Text style={{ color: "#555", marginTop: 4 }}>
                    {item.description}
                  </Text>
                  <Text
                    style={{
                      marginTop: 8,
                      fontStyle: "italic",
                      color: item.type === "Expense" ? "#c0392b" : "#27ae60",
                      fontWeight: "500",
                    }}
                  >
                    {item.type}
                  </Text>
                  <View style={{ alignItems: "flex-end", marginTop: 12 }}>
                    <TouchableOpacity onPress={() => DeleteUpiData(item.id)}>
                      <MaterialCommunityIcons
                        name="delete"
                        size={24}
                        color="#d33535ff"
                      />
                    </TouchableOpacity>
                  </View>
                </Card>
              )}
            />
          ) : (
            <View
              style={{
                flex: 1,
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#F2E7FF",
              }}
            >
              <Text style={{ textAlign: "center", fontSize: 16, color: "#888" }}>
                No UPI merchants saved yet.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default Analytics;

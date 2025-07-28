import { View, Text, FlatList, TouchableOpacity } from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import Card from "../ui/Card";
import { categoryColors } from "../constants";
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [upiList, setUpiList] = useState<UPICategory[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  async function getData() {
    const db = await getDB();
    const { transactions, categories } = await getAllAppData(db);
    db.getAllAsync("SELECT * FROM UPICategory").then((rows) =>
      setUpiList(rows as UPICategory[])
    );
    setTransactions(transactions);
    setCategories(categories);
  }

  async function DeleteUpiData(id: number) {
    const db = await getDB();
    await db.runAsync("DELETE FROM UPICategory WHERE id = ?", [id]);
    getData();
  }

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      getData();
    }
  }, [isFocused]);

  function sumValues(arr: Transaction[]) {
    return arr.reduce((acc, curr) => acc + curr.amount, 0);
  }

  const sortedCategories = categories
    .map((cat) => {
      const catTransactions = transactions.filter(
        (t) => t.category_id === cat.id
      );
      const total = sumValues(catTransactions);
      return { ...cat, total };
    })
    .sort((a, b) => b.total - a.total)
    .filter((cat) => cat.total > 0);

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
                const allTransactions = transactions.filter(
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
                    //on long press to delete category
                    onLongPress={async () => {
                      if (item.id === 40) {
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
                    <AnalyticsListItem amount={item.total} category={item} />
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
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
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
              <Text
                style={{ textAlign: "center", fontSize: 16, color: "#888" }}
              >
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
              <Text
                style={{ textAlign: "center", fontSize: 16, color: "#888" }}
              >
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

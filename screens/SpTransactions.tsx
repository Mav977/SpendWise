import { View, Text, FlatList } from "react-native";
import React, { useLayoutEffect } from "react";
import { RootStackParamList, Transaction } from "../types";
import TransactionListItem from "../components/TransactionListItem";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type SpTransactionsRouteProp = RouteProp<RootStackParamList, "Transactions">;

function SpTransactions() {
  const route = useRoute<SpTransactionsRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { transactions, category, emoji } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Transactions",
      headerStyle: { backgroundColor: "rgba(115, 0, 255, 0.72)" },
      headerTintColor: "#fff",
    });
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F2E7FF" }}>
      <View
        style={{
          padding: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>
          {category.name}
        </Text>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>
      <FlatList
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          return (
            <TransactionListItem
              transaction={item}
              categoryInfo={category}
              onToggleType={() => {}}
              onEdit={(transaction) => {
                navigation.navigate("Categorise", {
                  amount: transaction.amount,
                  ask: 0,
                  transactionId: transaction.id,
                  initialCategory: category.name,
                  initialDescription: transaction.description,
                  initialType: transaction.type,
                });
              }}
            />
          );
        }}
        contentContainerStyle={{
          padding: 20,
          flexGrow: 1,
          backgroundColor: "#F2E7FF",
        }}
      />
    </View>
  );
}

export default SpTransactions

import { View, Text, FlatList, useColorScheme } from "react-native";
import React, { useLayoutEffect } from "react";
import { RootStackParamList, Transaction } from "../types";
import TransactionListItem from "../components/TransactionListItem";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors } from "../styles/theme";

type SpTransactionsRouteProp = RouteProp<RootStackParamList, "Transactions">;

function SpTransactions() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const route = useRoute<SpTransactionsRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { transactions, category, emoji } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Transactions",
      headerStyle: { backgroundColor: theme.tint },
      headerTintColor: theme.buttonText,
    });
  }, [navigation, theme]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          padding: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
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
          backgroundColor: theme.background,
        }}
      />
    </View>
  );
}

export default SpTransactions

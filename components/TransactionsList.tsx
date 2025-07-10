import { FlatList, View, TouchableOpacity } from "react-native";
import React from "react";
import { Category, Transaction } from "../types";
import TransactionsListItem from "./TransactionListItem";

const TransactionsList = ({
  categories,
  transactions,
  deleteTransaction,
}: {
  categories: Category[];
  transactions: Transaction[];
  deleteTransaction: (id: number) => Promise<void>;
}) => {
  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ gap: 15 }}
      renderItem={({ item }) => {
        const categoryInfo = categories.find(
          (category) => category.id === item.category_id
        );
        return (
          <TouchableOpacity
            activeOpacity={0.7}
            onLongPress={() => deleteTransaction(item.id)}
          >
            <TransactionsListItem
              transaction={item}
              categoryInfo={categoryInfo}
            />
          </TouchableOpacity>
        );
      }}
    />
  );
};

export default TransactionsList;

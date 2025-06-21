import { View, Text, TouchableOpacity } from "react-native";
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
     <View style={{gap:15}}>
    {
        transactions.map((transaction)=>{
            const categoryForCurrentItem=categories.find(
                (category)=>category.id===transaction.category_id
            )
            return(
                <TouchableOpacity
                key={transaction.id}
                activeOpacity={0.7}
                onLongPress={()=>deleteTransaction(transaction.id)}
                >
                <TransactionsListItem
                    transaction={transaction}
                    categoryInfo={categoryForCurrentItem}
                />
                </TouchableOpacity>
            )
        })
    }
  </View>);
};

export default TransactionsList;

import { View, Text, FlatList, TouchableOpacity } from "react-native";
import React, { useLayoutEffect, useState, useEffect } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, Transaction } from "../types";
import * as SQLite from "expo-sqlite";
import { getDB } from "../db";
import { getAllAppData } from "../src/db/helpers";

// Open or create the database


const PendingTxns = () => {
    const isFocused = useIsFocused();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pendingTxns, setPendingTransactions] = useState<Transaction[]>([]);
  async function deleteTransaction(id:number) {
    const db= await getDB();
        db.withTransactionAsync(async ()=>{
            await db.runAsync(`DELETE FROM Transactions WHERE id = ?;`, [id]);
     //refresh page
        const { transactions } = await getAllAppData(db);
                const pending = transactions.filter((txn) => txn.pending_cat === 1);
                setPendingTransactions(pending);
        })
    }
  // Set header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Pending Transactions",
      headerStyle: { backgroundColor: "rgba(115, 0, 255, 0.72)" },
      headerTintColor: "#fff",
    });
  }, [navigation]);

  // Load pending transactions from DB
  useEffect(() => {
    if (isFocused) {
     console.log("Pending transactions focused");
      async function getPending() {
        const db = await getDB();
        const { transactions } = await getAllAppData(db);
        const pending = transactions.filter((txn) => txn.pending_cat === 1);
        setPendingTransactions(pending);
      }
      getPending();
    }
  }, [isFocused]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F2E7FF", padding: 16 }}>
      {pendingTxns.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No pending transactions 🎉
        </Text>
      ) : (
        <FlatList
          data={pendingTxns}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Categorise", {
                  receiver: item.description,
                  amount: item.amount,
                  ask: 0,
                  transactionId: item.id,
                })
              }
              onLongPress={() => deleteTransaction(item.id)}
              style={{
                backgroundColor: "#fff",
                padding: 12,
                borderRadius: 12,
                marginBottom: 10,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                ₹{item.amount} to {item.description}
              </Text>
              <Text style={{ color: "gray", marginTop: 4 }}>
                {new Date(item.date).toDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default PendingTxns;

import {
  View,
  Text,
  TextInput,
  Button,
  Switch,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as SQLite from "expo-sqlite";
import { getDB } from "../db";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import AddCategory from "../components/AddCategory";
import { Category } from "../types";
import { addCategory } from "../src/db/addCategory";
import { getAllAppData } from "../src/db/helpers";

const CategoriseScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { receiver, amount, ask } = route.params as {
    receiver: string;
    amount: number;
    ask: number;
  };
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [alwaysAsk, setAlwaysAsk] = useState(false);
  const [transactionType, setTransactionType] = useState<"Expense" | "Income">(
    "Expense"
  );
  useEffect(() => {
    setAlwaysAsk(ask ? true : false);
    const getCategories = async () => {
      const db = await getDB();
      const updatedData = await getAllAppData(db);

      setCategories(updatedData.categories);
    };
    getCategories();
  }, []);

  const handleAddCategory = async (name: string, type: string) => {
    const db = await getDB();
    await addCategory(db, name, type, (updatedCategories) => {
      setCategories(updatedCategories);
      setCategory(name);
    });
  };
  const handleSave = async () => {
    const db = await getDB();

    await db.withTransactionAsync(async () => {
      const existing = await db.getAllAsync(
        `SELECT * FROM UPICategory WHERE receiver = ?`,
        [receiver]
      );

      if (existing.length > 0) {
        // Receiver already exists — update
        await db.runAsync(
          `UPDATE UPICategory
       SET category = ?, description = ?, alwaysAsk = ?
       WHERE receiver = ?`,
          [category, description, alwaysAsk ? 1 : 0, receiver]
        );
      } else {
        // New receiver — insert
        await db.runAsync(
          `INSERT INTO UPICategory (receiver, category, description, alwaysAsk)
       VALUES (?, ?, ?, ?)`,
          [receiver, category, description, alwaysAsk ? 1 : 0]
        );
      }

      const cat = await db.getAllAsync(
        "SELECT id FROM Categories WHERE name = ?",
        [category]
      );

      if (cat.length > 0) {
        await db.runAsync(
          `INSERT INTO Transactions (category_id, amount, date, description, type)
           VALUES (?, ?, ?, ?, ?)`,
          
          [
            //@ts-ignore
            cat[0].id,
            amount,
            Date.now(),
            description || receiver,
            transactionType,
          ]
        );
      }
    });

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Receiver: <Text style={styles.value}>{receiver}</Text>
      </Text>
      <Text style={styles.label}>
        Amount: <Text style={styles.value}>₹{amount}</Text>
      </Text>
      <Text style={styles.label}>Transaction Type</Text>
      <SegmentedControl
        values={["Expense", "Income"]}
        selectedIndex={transactionType === "Expense" ? 0 : 1}
        onChange={(event) => {
          const selected =
            event.nativeEvent.selectedSegmentIndex === 0 ? "Expense" : "Income";
          setTransactionType(selected);
        }}
        style={{ marginBottom: 16 }}
      />
      <AddCategory
        categoryType={transactionType}
        addCategory={handleAddCategory}
      />
      <TextInput
        style={styles.input}
        placeholder="Category"
        value={category}
        onChangeText={(text) => {
          setCategory(text);
          setShowSuggestions(true);
        }}
        onBlur={() => setShowSuggestions(false)}
        placeholderTextColor="#000"
      />
      {showSuggestions && category.length > 0 && (
        <View
          style={{ backgroundColor: "#fff", borderRadius: 8, marginBottom: 10 }}
        >
          {categories
            .filter(
              (cat) =>
                cat.name.toLowerCase().includes(category.toLowerCase()) &&
                cat.type === transactionType
            )
            .map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  setCategory(cat.name);
                  setShowSuggestions(false);
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderBottomColor: "#ddd",
                  borderBottomWidth: 1,
                }}
              >
                <Text style={{ fontSize: 16 }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Description of the merchant"
        value={description}
        onChangeText={setDescription}
        placeholderTextColor="#000"
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Always Ask</Text>
        <Switch value={alwaysAsk} onValueChange={setAlwaysAsk} />
      </View>

      <View style={styles.buttonWrapper}>
        <Button title="Save" onPress={handleSave} color="#007AFF" />
      </View>
    </View>
  );
};

export default CategoriseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#EEE",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: "#333",
  },
  value: {
    fontWeight: "bold",
    color: "#000",
  },
  input: {
    height: 50,
    borderColor: "#999", // darker gray
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginVertical: 10,
    backgroundColor: "#fff",
    color: "#000",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  buttonWrapper: {
    marginTop: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
});

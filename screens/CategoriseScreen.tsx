import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getDB } from "../db";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import AddCategory from "../components/AddCategory";
import { Category, Transaction } from "../types";
import { addCategory } from "../src/db/addCategory";
import { getAllAppData } from "../src/db/helpers";
import { fetchAi } from "../src/utils/fetchAI";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Colors
const PURPLE_COLOR = "rgba(115, 0, 255, 0.72)";
const LIGHT_PURPLE_BACKGROUND = "rgb(223, 197, 250)";

const CategoriseScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  let {
    receiver,
    amount,
    ask,
    transactionId,
    initialCategory,
    initialDescription,
    initialType,
  } = route.params as {
    receiver: string;
    amount: number;
    ask: number;
    transactionId: number;
    initialCategory: string;
    initialDescription: string;
    initialType: "Expense" | "Income";
  };

  const decodedReceiver = decodeURIComponent(receiver);
  receiver = decodedReceiver;

  const [amountValue, setAmountValue] = useState(amount.toString());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState(initialCategory || "");
  const [description, setDescription] = useState(initialDescription || "");
  const [alwaysAsk, setAlwaysAsk] = useState(false);
  const [transactionType, setTransactionType] = useState<"Expense" | "Income">(
    initialType || "Expense"
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isloading, setisloading] = useState(false);
  const [show, setshow] = useState(false);
  const aiFetchAttemptedRef = useRef(false);

  useEffect(() => {
    setAlwaysAsk(ask ? true : false);
    const getCategories = async () => {
      const db = await getDB();
      const updatedData = await getAllAppData(db);
      setCategories(updatedData.categories);
      setTransactions(updatedData.allTransactions);
    };
    getCategories();
  }, []);

  useEffect(() => {
    const isPending = transactions.some(
      (t) => t.id === transactionId && t.pending_cat === 1
    );
    if (isPending && categories.length > 0 && !aiFetchAttemptedRef.current) {
      aiFetchAttemptedRef.current = true;

      const fetchFromAi = async () => {
        setisloading(true);
        setshow(false);

        const tosendAI = `₹ ${amount},${receiver}`;
        const categoryNames = categories.map((item) => item.name);

        try {
          const ai = await fetchAi(tosendAI, categoryNames);

          if (!ai || !ai.category) {
            console.warn("Ai is not available");
          } else {
            const aiCategory = ai.category;
            if (
              categoryNames.some(
                (c) => c.toLowerCase() === aiCategory.toLowerCase()
              )
            ) {
              setCategory(aiCategory);
            }
            const aiDescription = ai.description;
            setDescription(aiDescription);
            const aiType = ai.type;
            setTransactionType(aiType);
            setshow(true);
          }
        } catch (error) {
          console.error("Error fetching AI suggestions:", error);
          setshow(false);
        } finally {
          setisloading(false);
        }
      };
      fetchFromAi();
    }
  }, [categories, receiver, amount]);

  const handleAddCategory = async (name: string, type: string) => {
    const db = await getDB();
    await addCategory(db, name, type, (updatedCategories) => {
      setCategories(updatedCategories);
      setCategory(name);
    });
  };

  const handleSave = async () => {
    const db = await getDB();
    const numericAmount = parseFloat(amountValue) || 0;

    await db.withTransactionAsync(async () => {
      if (receiver || description) {
        const existing = await db.getAllAsync(
          `SELECT * FROM UPICategory WHERE receiver = ? OR description = ?`,
          [receiver, description]
        );

        if (existing.length > 0) {
          await db.runAsync(
            `UPDATE UPICategory
             SET category = ?, description = ?, alwaysAsk = ?
             WHERE receiver = ? OR description = ?`,
            [category, description, alwaysAsk ? 1 : 0, receiver, description]
          );
        } else {
          await db.runAsync(
            `INSERT INTO UPICategory (receiver, category, description, alwaysAsk, type)
             VALUES (?, ?, ?, ?, ?)`,
            [receiver, category, description, alwaysAsk ? 1 : 0, transactionType]
          );
        }
      }

      const cat = await db.getAllAsync(
        "SELECT id FROM Categories WHERE name = ?",
        [category]
      );

      if (cat.length > 0) {
        if (transactionId) {
          const existingTransaction = (await db.getFirstAsync(
            `SELECT date FROM Transactions WHERE id = ?`,
            [transactionId]
          )) as { date?: number } | undefined;

          const originalDate = existingTransaction?.date ?? Date.now();

          await db.runAsync(
            `UPDATE Transactions
             SET category_id = ?, amount = ?, date = ?, description = ?, type = ?, pending_cat = 0
             WHERE id = ?`,
            [
              //@ts-ignore
              cat[0].id,
              numericAmount,
              originalDate,
              description || receiver,
              transactionType,
              transactionId,
            ]
          );
        } else {
          await db.runAsync(
            `INSERT INTO Transactions (category_id, amount, date, description, type, pending_cat)
             VALUES (?, ?, ?, ?, ?, 0)`,
            [
              //@ts-ignore
              cat[0].id,
              numericAmount,
              Date.now(),
              description || receiver,
              transactionType,
            ]
          );
        }
      }
    });
    navigation.goBack();
  };

  const categoryExists = categories.some(
    (catObj) =>
      catObj.name.trim().toLowerCase() === category.trim().toLowerCase() &&
      catObj.type === transactionType
  );

  return (
    <View style={styles.container}>
      {receiver && (
        <Text style={styles.label}>
          Receiver:{" "}
          <Text style={styles.value}>
            {receiver == "undefined" ? description : receiver}
          </Text>
        </Text>
      )}

     <View style={{ position: "relative", marginBottom: 10 }}>
  <Text style={styles.label}>Amount</Text>
  <View style={styles.amountInputWrapper}>
    <Text style={styles.amountPrefix}>₹</Text>
    <TextInput
      style={styles.amountInput}
      placeholder="Enter amount"
      value={amountValue}
      onChangeText={(text) =>
        setAmountValue(text.replace(/[^0-9.]/g, ""))
      }
      keyboardType="numeric"
      placeholderTextColor="#000"
    />
  </View>
</View>

      <Text style={styles.label}>Transaction Type</Text>
      <SegmentedControl
        values={["Expense", "Income"]}
        selectedIndex={transactionType === "Expense" ? 0 : 1}
        onChange={(event) => {
          const selected =
            event.nativeEvent.selectedSegmentIndex === 0 ? "Expense" : "Income";
          setTransactionType(selected);
        }}
        style={styles.segmentedControl}
        backgroundColor={LIGHT_PURPLE_BACKGROUND}
        tintColor={PURPLE_COLOR}
      />

      {isloading && (
        <View style={styles.aiSuggestionContainer}>
          <ActivityIndicator size="small" color={PURPLE_COLOR} />
          <Text style={styles.aiLoadingText}>Loading AI suggestions....</Text>
        </View>
      )}

      {show && !isloading && (
        <View style={styles.aiSuggestionContainer}>
          <MaterialCommunityIcons
            name="robot-outline"
            size={20}
            color={PURPLE_COLOR}
          />
          <Text style={styles.aiSuggestionText}>AI suggestions:</Text>
        </View>
      )}

      {/* Category Input */}
      <View style={{ position: "relative", marginBottom: 10 }}>
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
        {category.length > 0 && (
          <TouchableOpacity
            style={{
              position: "absolute",
              right: 18,
              top: 23,
            }}
            onPress={() => setCategory("")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close-circle" size={22} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

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

      {!categoryExists && category.trim().length > 0 && (
        <TouchableOpacity
          style={{
            backgroundColor: "#7340ff",
            paddingVertical: 8,
            borderRadius: 8,
            alignItems: "center",
            marginBottom: 10,
            alignSelf: "flex-end",
            paddingHorizontal: 16,
          }}
          onPress={async () => {
            await handleAddCategory(category.trim(), transactionType);
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Save Category "{category.trim()}"
          </Text>
        </TouchableOpacity>
      )}

      {/* Description Input */}
      <View style={{ position: "relative", marginBottom: 10 }}>
        <TextInput
          style={styles.input}
          placeholder="Merchant name"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#000"
        />
        {description.length > 0 && (
          <TouchableOpacity
            style={{
              position: "absolute",
              right: 18,
              top: 23,
              zIndex: 2,
            }}
            onPress={() => setDescription("")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close-circle" size={22} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      {/* Always Ask Switch */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Always Ask</Text>
        <Switch
          value={alwaysAsk}
          onValueChange={setAlwaysAsk}
          thumbColor={alwaysAsk ? PURPLE_COLOR : "#f4f3f4"}
          trackColor={{ false: "#767577", true: PURPLE_COLOR }}
        />
      </View>
      <View style={{ flexDirection: "row", marginVertical: 2 }}>
        <MaterialCommunityIcons name="information" size={15} color="#666" />
        <Text style={{ color: "#666", marginLeft: 4, fontSize: 11 }}>
          When enabled, you will be asked to categorise this transaction every
          time. Useful for merchants like Amazon with varied purchases.
        </Text>
      </View>

      {/* Save Button */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CategoriseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F2E7FE",
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
    borderColor: "#999",
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
  saveButton: {
    backgroundColor: PURPLE_COLOR,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  amountInputWrapper: {
  flexDirection: "row",
  alignItems: "center",
  borderColor: "#999",
  borderWidth: 1,
  borderRadius: 10,
  backgroundColor: "#fff",
  paddingHorizontal: 10,
  height: 50,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
},
amountPrefix: {
  fontSize: 18,
  fontWeight: "bold",
  marginRight: 6,
  color: "#000",
},
amountInput: {
  flex: 1,
  height: "100%",
  fontSize: 16,
  color: "#000",
},

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  buttonWrapper: {
    marginTop: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  aiSuggestionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  aiLoadingText: {
    marginLeft: 8,
    fontSize: 16,
    fontStyle: "italic",
    color: "#555",
  },
  aiSuggestionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: PURPLE_COLOR,
  },
  segmentedControl: {
    marginBottom: 16,
    height: 40,
  },
});

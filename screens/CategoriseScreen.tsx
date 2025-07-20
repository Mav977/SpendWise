import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as SQLite from "expo-sqlite";
import { getDB } from "../db";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import AddCategory from "../components/AddCategory";
import { Category, RootStackParamList } from "../types";
import { addCategory } from "../src/db/addCategory";
import { getAllAppData } from "../src/db/helpers";
import { fetchAi } from "../src/utils/fetchAI";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/theme";

type CategoriseScreenRouteProp = RouteProp<RootStackParamList, "Categorise">;

const CategoriseScreen = () => {
  const route = useRoute<CategoriseScreenRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
  const colorScheme = useColorScheme();
  console.log(colorScheme);
  const theme = Colors[colorScheme ?? 'light'];
  const decodedReceiver = decodeURIComponent(receiver);
  receiver = decodedReceiver; // Use the decoded receiver for display
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState(initialCategory || "");
  const [description, setDescription] = useState(initialDescription || "");
  const [alwaysAsk, setAlwaysAsk] = useState(false);
  const [transactionType, setTransactionType] = useState<"Expense" | "Income">(
    initialType || "Expense" // Pre-fill if editing
  );
  const [isloading, setisloading] = useState(false);
  const [show, setshow] = useState(false);
  const aiFetchAttemptedRef = useRef(false);

  useEffect(() => {
    setAlwaysAsk(ask ? true : false);
    const getCategories = async () => {
      const db = await getDB();
      const updatedData = await getAllAppData(db);
      setCategories(updatedData.categories);
      // const rows = await db.getAllAsync(
      //   "SELECT * FROM UPICategory"
      // );
      // console.log("UPICategory rows:", rows);
    };
    getCategories();
  }, []);

  useEffect(() => {
    if (
      transactionId === undefined &&
      categories.length > 0 &&
      !aiFetchAttemptedRef.current
    ) {
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

    await db.withTransactionAsync(async () => {
      if (receiver || description) {
        const existing = await db.getFirstAsync<{ id: number }>(
          `SELECT id FROM UPICategory WHERE receiver = ?`,
          [receiver]
        );

        if (existing) {
          await db.runAsync(
            `UPDATE UPICategory SET category = ?, description = ?, alwaysAsk = ? WHERE id = ?`,
            [category, description, alwaysAsk ? 1 : 0, existing.id]
          );
        } else {
          await db.runAsync(
            `INSERT INTO UPICategory (receiver, category, description, alwaysAsk, type) VALUES (?, ?, ?, ?, ?)`,
            [receiver, category, description, alwaysAsk ? 1 : 0, transactionType]
          );
        }
      }

      const cat = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM Categories WHERE name = ?",
        [category]
      );

      if (cat) {
        if (transactionId) {
          await db.runAsync(
            `UPDATE Transactions SET category_id = ?, amount = ?, date = ?, description = ?, type = ? WHERE id = ?`,
            [
              cat.id,
              amount,
              Date.now(),
              description || receiver,
              transactionType,
              transactionId,
            ]
          );
        } else {
          await db.runAsync(
            `INSERT INTO Transactions (category_id, amount, date, description, type) VALUES (?, ?, ?, ?, ?)`,
            [cat.id, amount, Date.now(), description || receiver, transactionType]
          );
        }
      }
    });
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {receiver && receiver !== "undefined" && (
        <Text style={[styles.label, { color: theme.text }]}>
          Receiver: <Text style={[styles.value, { color: theme.text }]}>{description || receiver}</Text>
        </Text>
      )}
      <Text style={[styles.label, { color: theme.text }]}>
        Amount: <Text style={[styles.value, { color: theme.text }]}>₹{amount}</Text>
      </Text>
      <Text style={[styles.label, { color: theme.text }]}>Transaction Type</Text>
      <SegmentedControl
        values={["Expense", "Income"]}
        selectedIndex={transactionType === "Expense" ? 0 : 1}
        onChange={(event) => {
          const selected =
            event.nativeEvent.selectedSegmentIndex === 0 ? "Expense" : "Income";
          setTransactionType(selected);
        }}
        style={styles.segmentedControl}
        backgroundColor={theme.background}
        tintColor={theme.tint}
      />
      <AddCategory
        categoryType={transactionType}
        addCategory={handleAddCategory}
      />
      {isloading && (
        <View style={styles.aiSuggestionContainer}>
          <ActivityIndicator size="small" color={theme.tint} />
          <Text style={[styles.aiLoadingText, { color: theme.text }]}>Loading AI suggestions....</Text>
        </View>
      )}
      {show && !isloading && (
        <View style={styles.aiSuggestionContainer}>
          <MaterialCommunityIcons
            name="robot-outline"
            size={20}
            color={theme.tint}
          />
          <Text style={[styles.aiSuggestionText, { color: theme.tint }]}>AI suggestions:</Text>
        </View>
      )}

      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text, shadowColor: theme.shadow }]}
        placeholder="Category"
        value={category}
        onChangeText={(text) => {
          setCategory(text);
          setShowSuggestions(true);
        }}
        onBlur={() => setShowSuggestions(false)}
        placeholderTextColor={theme.placeholder}
      />
      {showSuggestions && category.length > 0 && (
        <View
          style={{ backgroundColor: theme.card, borderRadius: 8, marginBottom: 10 }}
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
                  borderBottomColor: theme.border,
                  borderBottomWidth: 1,
                }}
              >
                <Text style={{ fontSize: 16, color: theme.text }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text, shadowColor: theme.shadow }]}
        placeholder="Merchant name"
        value={description}
        onChangeText={setDescription}
        placeholderTextColor={theme.placeholder}
      />

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: theme.text }]}>Always Ask</Text>
        <Switch
          value={alwaysAsk}
          onValueChange={setAlwaysAsk}
          thumbColor={alwaysAsk ? theme.tint : theme.tabIconDefault}
          trackColor={{ false: theme.tabIconDefault, true: theme.tint }}
        />
      </View>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.tint }]} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { color: theme.buttonText }]}>Save</Text>
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
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  value: {
    fontWeight: "bold",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginVertical: 10,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
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
  },
  aiSuggestionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  segmentedControl: {
    marginBottom: 16,
    height: 40,
  },
});

import { View, Text, TouchableOpacity, TextInput, Button } from "react-native";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Category, Transaction } from "../types";
import { useSQLiteContext } from "expo-sqlite";
import { MaterialIcons } from "@expo/vector-icons";
import Card from "./Card";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import AddCategory from "../components/AddCategory";

const AddTransaction = ({
  insertTransaction,
  deleteCategory,
  cat,
  addCategory,
}: {
  insertTransaction: (transaction: Transaction) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  cat: Category[];
  addCategory: (name: string, type: string) => Promise<void>;
}) => {
  const [isAddingTransaction, setIsAddingTransaction] =
    React.useState<boolean>(false);
  const [currentTab, setCurrentTab] = React.useState<number>(0);

  const [typeSelected, setTypeSelected] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("Expense");
  const [categoryId, setCategoryId] = React.useState<number>(1);
  const db = useSQLiteContext();
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  useEffect(() => {
    setShowAllCategories(false);
    setCategory(currentTab === 0 ? "Expense" : "Income");
  }, [currentTab]);

  const categories = cat.filter(
    (category) => category.type === (currentTab === 0 ? "Expense" : "Income")
  );
  async function handleSave() {
    const transactionToInsert = {
      amount: Number(amount),
      description,
      category_id: categoryId,
      date: new Date().getTime(),
      type: currentTab === 0 ? "Expense" : "Income",
    };
    console.log("Inserting transaction:", transactionToInsert);
    // @ts-ignore
    await insertTransaction(transactionToInsert);
    setAmount("");
    setDescription("");
    setCategory("Expense");
    setCategoryId(1);
    setCurrentTab(0);
    setIsAddingTransaction(false);
    setTypeSelected("");
  }
  const categoriesToShow = categories;
  const hasMoreCategories = false;
  return (
    <View style={{ marginBottom: 15 }}>
      {isAddingTransaction ? (
        <View>
          <Card>
            <TextInput
              placeholder="Rs.Amount"
              placeholderTextColor="#CCC"
              style={{
                fontSize: 32,
                marginBottom: 15,
                fontWeight: "bold",
                color: "#000",
              }}
              keyboardType="numeric"
              onChangeText={(text) => {
                // Remove any non-numeric characters before setting the state
                const numericValue = text.replace(/[^0-9.]/g, "");
                setAmount(numericValue);
              }}
            />
            <TextInput
              placeholder="Merchant name"
              placeholderTextColor="#CCC"
              style={{ fontSize: 18, marginBottom: 15, color: "#000" }}
              onChangeText={setDescription}
            />
            <Text style={{ marginBottom: 6 }}>Select a entry type</Text>
            <SegmentedControl
              values={["Expense", "Income"]}
              selectedIndex={currentTab}
              tintColor="#EEE"
              backgroundColor="#FFFFFF"
              fontStyle={{ color: "#000" }}
              onChange={(event) => {
                setCurrentTab(event.nativeEvent.selectedSegmentIndex);
              }}
            />
            <AddCategory
              categoryType={currentTab === 0 ? "Expense" : "Income"}
              addCategory={addCategory}
            ></AddCategory>
            {categoriesToShow.map((cat) => (
              <CategoryButton
                key={cat.name}
                // @ts-ignore
                id={cat.id}
                title={cat.name}
                isSelected={typeSelected === cat.name}
                setTypeSelected={setTypeSelected}
                setCategoryId={setCategoryId}
                deleteCategory={deleteCategory}
              />
            ))}
            {hasMoreCategories && !showAllCategories && (
              <TouchableOpacity
                onPress={() => setShowAllCategories(true)}
                style={{
                  height: 40,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#E0E0E0", // A slightly different background for the "show more" button
                  borderRadius: 15,
                  marginBottom: 6,
                  marginTop: 6,
                }}
              >
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
            )}
            {hasMoreCategories && showAllCategories && (
              <TouchableOpacity
                onPress={() => setShowAllCategories(false)}
                style={{
                  height: 40,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#E0E0E0",
                  borderRadius: 15,
                  marginBottom: 6,
                  marginTop: 6,
                }}
              >
                <MaterialIcons
                  name="keyboard-arrow-up"
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
            )}
          </Card>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginTop: 20,
              paddingHorizontal: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setIsAddingTransaction(false);

                setAmount("");
                setDescription("");
                setCategory("Expense");
                setCategoryId(1);
                setCurrentTab(0);
                setShowAllCategories(false);
                setTypeSelected("");
              }}
              style={{
                backgroundColor: "#e74c3c",
                paddingVertical: 10,
                paddingHorizontal: 25,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: "rgb(154, 68, 247)",
                paddingVertical: 10,
                paddingHorizontal: 25,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <AddButton setIsAddingTransaction={setIsAddingTransaction} />
      )}
    </View>
  );
};
function CategoryButton({
  id,
  title,
  isSelected,
  setTypeSelected,
  setCategoryId,
  deleteCategory,
}: {
  id: number;
  title: string;
  isSelected: boolean;
  setTypeSelected: Dispatch<SetStateAction<string>>;
  setCategoryId: Dispatch<SetStateAction<number>>;
  deleteCategory: (id: number) => Promise<void>;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        setTypeSelected(title);
        setCategoryId(id);
      }}
      onLongPress={() => deleteCategory(id)}
      activeOpacity={0.6}
      style={{
        height: 40,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isSelected ? "#007BFF20" : "#00000020",
        borderRadius: 15,
        marginBottom: 6,
        marginTop: 6,
      }}
    >
      <Text
        style={{
          fontWeight: "700",
          color: isSelected ? "#007BFF" : "#000000",
          marginLeft: 5,
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
function AddButton({
  setIsAddingTransaction,
}: {
  setIsAddingTransaction: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <TouchableOpacity
      onPress={() => setIsAddingTransaction(true)}
      activeOpacity={0.6}
      style={{
        height: 40,
        flexDirection: "row",
        alignItems: "center",

        justifyContent: "center",
        backgroundColor: "rgba(115, 0, 255, 0.3)",
        borderRadius: 15,
      }}
    >
      <MaterialIcons name="add-circle-outline" size={24} color="#7300FF" />
      <Text style={{ fontWeight: "700", color: "#7300FF", marginLeft: 5 }}>
        New Entry
      </Text>
    </TouchableOpacity>
  );
}

export default AddTransaction;

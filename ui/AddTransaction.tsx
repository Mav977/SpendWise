import { View, Text, TouchableOpacity, TextInput, Button } from "react-native";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Category, Transaction } from "../types";
import { useSQLiteContext } from "expo-sqlite";
import { MaterialIcons } from "@expo/vector-icons";
import Card from "./Card";
import SegmentedControl from "@react-native-segmented-control/segmented-control";

const AddTransaction = ({
  insertTransaction,
  deleteCategory,
  cat, // Add this prop
}: {
  insertTransaction: (transaction: Transaction) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  cat: Category[]; // Add this prop type
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
    // @ts-ignore
    await insertTransaction({
      category_id: categoryId,
      amount: Number(amount),
      date: new Date().getTime() / 1000,
      description,
      type: currentTab === 0 ? "Expense" : "Income",
    });
    setAmount("");
    setDescription("");
    setCategory("Expense");
    setCategoryId(1);
    setCurrentTab(0);
    setIsAddingTransaction(false);
  }
  const categoriesToShow = showAllCategories
    ? categories
    : categories.slice(0, 6);
  const hasMoreCategories = categories.length > 6;
  return (
    <View style={{ marginBottom: 15 }}>
      {isAddingTransaction ? (
        <View>
          <Card>
            <TextInput
              placeholder="Rs.Amount"
              style={{ fontSize: 32, marginBottom: 15, fontWeight: "bold" }}
              keyboardType="numeric"
              onChangeText={(text) => {
                // Remove any non-numeric characters before setting the state
                const numericValue = text.replace(/[^0-9.]/g, "");
                setAmount(numericValue);
              }}
            />
            <TextInput
              placeholder="Description"
              style={{ marginBottom: 15 }}
              onChangeText={setDescription}
            />
            <Text style={{ marginBottom: 6 }}>Select a entry type</Text>
            <SegmentedControl
              values={["Expense", "Income"]}
              selectedIndex={currentTab}
              onChange={(event) => {
                setCurrentTab(event.nativeEvent.selectedSegmentIndex);
              }}
            />
            {/* <TouchableOpacity
              onPress={() => {
                
              }}
              style={{
                height: 40,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#00000010",
                borderRadius: 15,
                marginBottom: 6,
                marginTop: 6,
              }}
            >
              <MaterialIcons name="add" size={20} color="#007BFF" />
              <Text>Add Category</Text>
            </TouchableOpacity> */}
            
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
                backgroundColor: "#2ecc71",
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
        backgroundColor: "#007BFF20",
        borderRadius: 15,
      }}
    >
      <MaterialIcons name="add-circle-outline" size={24} color="#007BFF" />
      <Text style={{ fontWeight: "700", color: "#007BFF", marginLeft: 5 }}>
        New Entry
      </Text>
    </TouchableOpacity>
  );
}

export default AddTransaction;

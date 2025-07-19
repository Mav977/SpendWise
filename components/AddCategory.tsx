import { View, Text, TextInput, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { MaterialIcons } from "@expo/vector-icons";

const AddCategory = ({
  categoryType,
  addCategory,
}: {
  categoryType: string;
  addCategory: (name: string, type: string) => Promise<void>;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const handleSave = () => {
    const name = newCategory.trim();
    if (!name) return;
    addCategory(name, categoryType);
    setNewCategory("");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNewCategory("");
    setIsEditing(false);
  };

  if (isEditing) {
    return(
    <View>
      <TextInput
        placeholder="New Category"
        value={newCategory}
        onChangeText={setNewCategory}
        style={{
            borderColor: "#ccc",
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
            marginTop: 10,
          }}
      />
   <View
  style={{
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
    gap: 10,
  }}
>
  <TouchableOpacity
    onPress={handleCancel}
    style={{
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#ccc",
      backgroundColor: "#f8f8f8",
    }}
  >
    <Text style={{ color: "#555", fontWeight: "500" }}>Cancel</Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={handleSave}
    style={{
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 6,
      backgroundColor: "#007BFF20",
      borderWidth: 1,
      borderColor: "#007BFF",
    }}
  >
    <Text style={{ color: "#007BFF", fontWeight: "500" }}>Save</Text>
  </TouchableOpacity>
</View>

    </View>);
  }
  return (
    <TouchableOpacity onPress={()=>setIsEditing(true)} style={{flexDirection:"row", height:40, alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#00000010",
        borderRadius: 15,
        marginBottom: 6,
        marginTop: 6,}}>
     <MaterialIcons name="add" size={20} color="#007BFF" />
      <Text style={{ fontWeight: "700", color: "#007BFF", marginLeft: 5 }}>
        Add Category
      </Text>
    </TouchableOpacity>
  );
};

export default AddCategory;

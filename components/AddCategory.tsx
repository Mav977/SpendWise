import { View, Text, TextInput, TouchableOpacity, useColorScheme } from "react-native";
import React, { useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../styles/theme";

const AddCategory = ({
  categoryType,
  addCategory,
}: {
  categoryType: string;
  addCategory: (name: string, type: string) => Promise<void>;
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
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
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
            marginTop: 10,
            color: theme.text,
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
      borderColor: theme.border,
      backgroundColor: theme.background,
    }}
  >
    <Text style={{ color: theme.text, fontWeight: "500" }}>Cancel</Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={handleSave}
    style={{
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 6,
      backgroundColor: theme.tint,
      borderWidth: 1,
      borderColor: theme.tint,
    }}
  >
    <Text style={{ color: theme.buttonText, fontWeight: "500" }}>Save</Text>
  </TouchableOpacity>
</View>

    </View>);
  }
  return (
    <TouchableOpacity onPress={()=>setIsEditing(true)} style={{flexDirection:"row", height:40, alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.tint,
        borderRadius: 15,
        marginBottom: 6,
        marginTop: 6,}}>
     <MaterialIcons name="add" size={20} color={theme.buttonText} />
      <Text style={{ fontWeight: "700", color: theme.buttonText, marginLeft: 5 }}>
        Add Category
      </Text>
    </TouchableOpacity>
  );
};

export default AddCategory;

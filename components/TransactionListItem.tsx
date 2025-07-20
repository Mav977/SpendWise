import { View, Text, StyleSheet, Button, TouchableOpacity, useColorScheme } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import React from "react";
import { Colors } from "../styles/theme";
import { Category, Transaction } from "../types";
import Card from "../ui/Card";
import { categoryEmojies, categoryColors } from "../constants";
import { AutoSizeText, ResizeTextMode } from "react-native-auto-size-text";

interface TransactionListItemProps {
  transaction: Transaction;
  categoryInfo?: Category | undefined;
  onToggleType?: (id: number, newType: "Expense" | "Income") => void;
  onEdit?: (transaction:Transaction) =>void
}
const TransactionListItem = ({
  transaction,
  categoryInfo,
  onToggleType,
  onEdit,
}: TransactionListItemProps) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
    const iconName=transaction.type === "Expense" ? "minuscircle" : "pluscircle";
    const color = transaction.type === "Expense" ? "red" : "green";
    const categoryColor = categoryColors[categoryInfo?.name ?? "Default"];
  const emoji = categoryEmojies[categoryInfo?.name ?? "Default"];
    return (
    <Card>
      <View style={styles.row}>
        <View style={{ width: "50%", gap: 3 }}>
          <Amount
            amount={transaction.amount}
            color={color}
            iconName={iconName}
          />
        </View>

        <TransactionInfo
          id={transaction.id}
          date={transaction.date}
          description={transaction.description}
          theme={theme}
        />
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.background }]}
          onPress={() => onEdit?.(transaction)}
        >
          <Text style={[styles.editText, { color: theme.text }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};
function Amount({iconName,color,amount}:{
    iconName: "minuscircle" | "pluscircle";
    color: string;
    amount: number;
})
{
    return (
        <View style={styles.row}>
        <AntDesign name={iconName} size={24} color={color} />
        <AutoSizeText
        fontSize={32}
        mode={ResizeTextMode.max_lines}
        numberOfLines={1}
        style={[styles.amount, { maxWidth: "80%" }]}
        >
        Rs.{amount}
      </AutoSizeText>
        </View>
    );
}



function TransactionInfo({
  id,
  date,
  description,
  theme,
}: {
  id: number;
  date: number;
  description: string;
  theme: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{ fontSize: 16, fontWeight: "bold", color: theme.text }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {description}
      </Text>
      
      <Text style={{ fontSize: 12, color: "gray" }}>
        {new Date(date).toDateString()}
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
   flipText: {
    fontSize: 12,
    color: "#333",
  },
  flipButton: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingVertical: 2,
    paddingHorizontal: 10,
    backgroundColor: "#eeeeee",
    borderRadius: 10,
  },
  amount: {
    fontSize: 32,
    fontWeight: "800",
  },
  row: {
   
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryContainer: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 12,
  },
  actionsRow: {
  flexDirection: "row",
  justifyContent: "flex-end",
  marginTop: 8,
  gap: 10,
},
editButton: {
  paddingVertical: 2,
  paddingHorizontal: 10,
  borderRadius: 10,
  justifyContent:"center",
  alignItems:"center",
  marginTop:10
},
editText: {
  fontSize: 12,
  fontWeight:"bold"
},

});
export default TransactionListItem;

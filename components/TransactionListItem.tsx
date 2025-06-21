import { View, Text, StyleSheet } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import React from "react";
import { Category, Transaction } from "../types";
import Card from "../ui/Card";
import { categoryEmojies, categoryColors } from "../constants";
import { AutoSizeText, ResizeTextMode } from "react-native-auto-size-text";

interface TransactionListItemProps {
  transaction: Transaction;
  categoryInfo: Category | undefined;
}
const TransactionListItem = ({
  transaction,
  categoryInfo,
}: TransactionListItemProps) => {
    const iconName=transaction.type === "Expense" ? "minuscircle" : "pluscircle";
    const color = transaction.type === "Expense" ? "red" : "green";
    const categoryColor = categoryColors[categoryInfo?.name ?? "Default"];
  const emoji = categoryEmojies[categoryInfo?.name ?? "Default"];
    return (
    <Card>
    <View style={styles.row}>
   <View style={{width:'50%',gap:3}}>
     <Amount
            amount={transaction.amount}
            color={color}
            iconName={iconName}
          />
            <CategoryItem
            categoryColor={categoryColor}
            categoryInfo={categoryInfo}
            emoji={emoji}
          />
   </View>
          
          <TransactionInfo
          id={transaction.id}
          date={transaction.date}
          description={transaction.description}
          />
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


function CategoryItem({
    categoryInfo,
    emoji,
    categoryColor,
}: {
  categoryColor: string;
  categoryInfo: Category | undefined;
  emoji: string;
})  {
    return(
        <View style={[styles.categoryContainer,{backgroundColor: categoryColor+'40'}]}>
        <Text>
            {emoji} {categoryInfo?.name}
        </Text>
    </View>
    )
    
}


function TransactionInfo({id,date,description}:{id:number,date:number,description:string}) {
    return(
        <View>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{description}</Text>
      <Text>Transaction number {id}</Text>
      <Text style={{ fontSize: 12, color: "gray" }}>
        {new Date(date).toDateString()} 
        </Text>
        </View>
    )
}

const styles = StyleSheet.create({
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
});
export default TransactionListItem;

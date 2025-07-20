import { View, Text, StyleSheet, TextStyle, useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../styles/theme";
import Card from "../ui/Card";
import { TransactionsByMonth } from "../types";

function TransactionSummary({
  totalIncome,
  totalExpenses,
}: TransactionsByMonth) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const savings = totalIncome - totalExpenses;
  const readablePeriod = new Date().toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });

  // Function to determine the style based on the value (positive or negative)
  const getMoneyTextStyle = (value: number): TextStyle => ({
    fontWeight: "bold",
    color: value < 0 ? "#ff4500" : "#2e8b57", // Red for negative, custom green for positive
  });

  // Helper function to format monetary values
  const formatMoney = (value: number) => {
    const absValue = Math.abs(value).toFixed(2);
    return `Rs ${value < 0 ? "-" : ""}${absValue}`;
  };
  return (
    <Card style={styles.container}>
      <Text style={[styles.periodTitle, { color: theme.text }]}>Summary for {readablePeriod}</Text>

      <Text style={[styles.summaryText, { color: theme.text }]}>
        Income:{" "}
        <Text style={getMoneyTextStyle(totalIncome)}>
          {formatMoney(totalIncome)}
        </Text>
      </Text>
      <Text style={styles.summaryText}>
        Expenses:{" "}
        <Text style={getMoneyTextStyle(totalExpenses)}>
          {formatMoney(totalExpenses)}
        </Text>
      </Text>
      <Text style={[styles.summaryText, { color: theme.text }]}>
        Savings:{" "}
        <Text style={getMoneyTextStyle(savings)}>{formatMoney(savings)}</Text>
      </Text>
    </Card>
  );
}
const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingBottom: 7,
  },
  periodTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default TransactionSummary;

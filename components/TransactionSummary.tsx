import { View, Text, StyleSheet, TextStyle } from "react-native";
import React from "react";
import Card from "../ui/Card";
import { TransactionsByMonth } from "../types";

function TransactionSummary({
  totalIncome,
  totalExpenses,
}: TransactionsByMonth) {
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
      <Text style={styles.periodTitle}>Summary for {readablePeriod}</Text>

      <Text style={styles.summaryText}>
        Income:{" "}
        <Text style={getMoneyTextStyle(totalIncome)}>
          {formatMoney(totalIncome)}
        </Text>
      </Text>
      <Text style={styles.summaryText}>
        Total Expenses:{" "}
        <Text style={getMoneyTextStyle(totalExpenses)}>
          {formatMoney(totalExpenses)}
        </Text>
      </Text>
      <Text style={styles.summaryText}>
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
    color: "#333",
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
});

export default TransactionSummary;

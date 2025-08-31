import { View, Text, FlatList, ScrollView, Dimensions, Alert } from 'react-native';
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import TransactionListItem from '../components/TransactionListItem';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LineChart } from "react-native-gifted-charts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

function SpTransactions() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { Transaction } = route.params as { Transaction: Transaction[] };

  const screenWidth = Dimensions.get("window").width;

  // Generate monthly data for this category
  const getMonthlyData = useMemo(() => {
    if (!Transaction.length) return [];

    const sortedTx = [...Transaction].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstTxDate = new Date(sortedTx[0].date);
    const lastTxDate = new Date(sortedTx[sortedTx.length - 1].date);

    const startMonth = firstTxDate.getMonth();
    const startYear = firstTxDate.getFullYear();
    const endMonth = lastTxDate.getMonth();
    const endYear = lastTxDate.getFullYear();

    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    const monthsToShow = Math.max(6, Math.min(totalMonths, 12));

    const monthlyTotals = Array(monthsToShow).fill(0);
    const monthLabels: string[] = [];

    for (let i = 0; i < monthsToShow; i++) {
      const date = new Date(startYear, startMonth + i, 1);
      monthLabels.push(date.toLocaleString("default", { month: "short" }));

      Transaction.forEach((t) => {
        const txDate = new Date(t.date);
        if (txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear()) {
          monthlyTotals[i] += t.amount;
        }
      });
    }

    return monthlyTotals.map((value, i) => ({
      value,
      month: monthLabels[i],
      year: new Date(startYear, startMonth + i, 1).getFullYear(),
      showDataPointLabel: true, // show value as text on chart
    }));
  }, [Transaction]);

  // Dynamic Y-axis with minimum 10 labels
  const chartData = useMemo(() => {
    if (!getMonthlyData.length) {
      return {
        maxValue: 20000,
        yAxisLabels: ['0', '1K', '2K', '3K', '4K', '5K', '6K', '7K', '8K', '9K', '10K', '12K', '14K', '16K', '18K', '20K']
      };
    }

    const dataValues = getMonthlyData.map(d => d.value).filter(v => isFinite(v) && v >= 0);
    const maxDataValue = dataValues.length > 0 ? Math.max(...dataValues) : 0;
    
    // Calculate chart max with padding
    const chartMax = maxDataValue * 1.3; // 30% padding
    
    // Convert to thousands and round up
    const maxInThousands = Math.max(10, Math.ceil(chartMax / 1000)); // minimum 10K
    
    // Generate at least 10 labels with smaller steps
    const totalLabels = Math.max(10, 15); // aim for 15 labels
    const stepInThousands = Math.max(1, Math.ceil(maxInThousands / (totalLabels - 1)));
    const actualMax = stepInThousands * (totalLabels - 1);
    
    const labels: string[] = [];
    for (let i = 0; i <= totalLabels - 1; i++) {
      const value = i * stepInThousands;
      labels.push(value === 0 ? '0' : value + 'K');
    }
    
    return {
      maxValue: actualMax * 1000, // convert back to actual value
      yAxisLabels: labels
    };
  }, [getMonthlyData]);

  // Handle data point press
  const handleDataPointClick = (pointData: any, index: number) => {
    if (!getMonthlyData[index]) return;

    const d = getMonthlyData[index];
    const formattedAmount = d.value.toLocaleString('en-IN');

    const trendText = index === 0
      ? "First month of data"
      : d.value <= getMonthlyData[index - 1].value
        ? `Decreased by ₹${(getMonthlyData[index - 1].value - d.value).toLocaleString('en-IN')}`
        : `Increased by ₹${(d.value - getMonthlyData[index - 1].value).toLocaleString('en-IN')}`;

    Alert.alert(`${d.month} ${d.year}`, `Amount: ₹${formattedAmount}\n${trendText}`, [{ text: "OK" }]);
  };

  const totalAmount = Transaction.reduce((sum, t) => sum + t.amount, 0);
  const averagePerMonth = getMonthlyData.length > 0 ? totalAmount / getMonthlyData.length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#F2E7FF" }}>
      <FlatList
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        data={Transaction}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TransactionListItem transaction={item} />}
        contentContainerStyle={{ padding: 20, flexGrow: 1, backgroundColor: "#F2E7FF" }}
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            {/* Summary */}
            <View style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#7300FF",
                textAlign: "center",
                marginBottom: 12
              }}>
                Overview
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Total</Text>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: "#e74c3c" }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Transactions</Text>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: "#7300FF" }}>
                    {Transaction.length}
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Avg/Month</Text>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: "#27ae60" }}>
                    ₹{Math.round(averagePerMonth).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

          {getMonthlyData.length > 0 && (
  <View style={{
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }}>
    <Text style={{
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 16,
      color: "#7300FF"
    }}>
      Monthly Trend
    </Text>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
      <LineChart
        areaChart
        data={getMonthlyData}
        thickness={3}
        spacing={60}
        hideDataPoints={false}
        showValuesAsDataPointsText
        isAnimated
        animationDuration={1500}
        width={Math.max(getMonthlyData.length * 60, screenWidth - 60)}
        height={180}
        maxValue={chartData.maxValue}
        yAxisLabelTexts={chartData.yAxisLabels}
        yAxisColor="#666"
        yAxisLabelWidth={35}
        showVerticalLines
        verticalLinesColor="rgba(115,0,255,0.2)"
        xAxisColor="#666"
        xAxisLabelTexts={getMonthlyData.map(d => d.month)}
        
        // Line and area styling
        color="#7300FF"
        dataPointsColor="#7300FF"
        dataPointsRadius={5}
        
        // Gradient fill for area
        startFillColor="rgba(115, 0, 255, 0.4)"
        endFillColor="rgba(115, 0, 255, 0.05)"
        startOpacity={0.4}
        endOpacity={0.05}
        
        // Alternative: solid area fill
        // areaChartColor="rgba(115, 0, 255, 0.2)"
        
        onPress={handleDataPointClick}
      />
    </ScrollView>

    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
      <MaterialCommunityIcons name="information" size={16} color="#666" style={{ marginRight: 4 }} />
      <Text style={{ color: "#666", fontSize: 12 }}>Tap on chart points for details</Text>
    </View>
  </View>
)}

            <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 10, color: "#333" }}>
              All Transactions
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
            <MaterialCommunityIcons name="receipt" size={60} color="#ccc" />
            <Text style={{ textAlign: "center", fontSize: 16, color: "#888", marginTop: 16 }}>
              No transactions found for this category
            </Text>
          </View>
        }
      />
    </View>
  );
}

export default SpTransactions;
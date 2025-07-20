import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import React from 'react';
import { Colors } from '../styles/theme';
import { Category } from '../types';
import Card from '../ui/Card';
import { categoryColors } from '../constants';

const AnalyticsListItem = ({ amount, category }: { amount: number, category: Category }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const categoryStripColor = categoryColors[category.name] || "rgb(255, 255, 0)";

  return (
    <Card style={styles.card}>
      <View style={[styles.colorStrip, { backgroundColor: categoryStripColor }]} />
      <View style={styles.contentContainer}>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: theme.text }]}>{category.name}</Text>
        </View>
        <Text style={[styles.amount, { color: theme.text }]}>
          Rs {amount.toFixed(2)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  colorStrip: {
    width: 10,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginLeft: 8,
    flex: 1,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryType: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AnalyticsListItem;

import { View, Text, FlatList } from 'react-native'
import React, { useLayoutEffect } from 'react'
import { Category, RootStackParamList, Transaction } from '../types';
import TransactionListItem from '../components/TransactionListItem';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { getAllAppData } from '../src/db/helpers';


type SpTransactionsRouteProp = RouteProp<RootStackParamList, "Transactions">;

function SpTransactions() {
  const route = useRoute<SpTransactionsRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { transactions } = route.params;
  const [categories, setCategories] = React.useState<Category[]>([]);
  const db = useSQLiteContext();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Transactions",
      headerStyle: { backgroundColor: "rgba(115, 0, 255, 0.72)" },
      headerTintColor: "#fff",
    });
  }, [navigation]);

  React.useEffect(() => {
    async function setup() {
      const { categories } = await getAllAppData(db);
      setCategories(categories);
    }
    setup();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#F2E7FF" }}>
      <FlatList
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const categoryForCurrentItem = categories.find(
            (cat) => cat.id === item.category_id
          );
          return (
            <TransactionListItem
              transaction={item}
              categoryInfo={categoryForCurrentItem}
              onToggleType={() => {}}
              onEdit={() => {}}
            />
          );
        }}
        contentContainerStyle={{
          padding: 20,
          flexGrow: 1,
          backgroundColor: "#F2E7FF",
        }}
      />
    </View>
  )
}

export default SpTransactions

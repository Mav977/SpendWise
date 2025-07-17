import { View, Text, FlatList } from 'react-native'
import React from 'react'
import { Transaction } from '../types';
import TransactionListItem from '../components/TransactionListItem';
import { useNavigation, useRoute } from '@react-navigation/native';


function SpTransactions() {
  const route = useRoute();
   const navigation = useNavigation();
   const {Transaction} = route.params as {Transaction: Transaction[]};
  return (
   <View>
      <FlatList
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        data={Transaction}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          
          return (
             // Assuming you have a way to get the category info for the transaction
              <TransactionListItem
            transaction={item}
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
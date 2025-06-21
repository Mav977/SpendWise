import { View, Text, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Category, Transaction } from '../types';
import { useSQLiteContext } from 'expo-sqlite';
import TransactionsList from '../components/TransactionsList';

const Home = () => {
    //useState<Category[]>([]); means categories is an array of type Category (taken from types.ts)
    const [categories,setCategories]=useState<Category[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const db=useSQLiteContext();
    useEffect(()=>{db.withTransactionAsync(async()=>await getData())},[db]);

    async function getData() {
        const result= await db.getAllAsync<Transaction>('SELECT * FROM Transactions ORDER BY date DESC');
        setTransactions(result);
        const categoriesResult = await db.getAllAsync<Category>('SELECT * FROM Categories');
        setCategories(categoriesResult);
    }
    async function deleteTransaction(id:number) {
        db.withTransactionAsync(async ()=>{
            await db.runAsync(`DELETE FROM Transactions WHERE id = ?;`, [id]);
      await getData();
        })
    }
    return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingVertical:15}}>
        <TransactionsList 
        categories={categories} 
        transactions={transactions}
        deleteTransaction={deleteTransaction}
        />
    </ScrollView>
  )
}

// function TransactionSummary({transactionsByMonth}:any) {
    
// }
export default Home
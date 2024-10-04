import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { globalStyles } from '../styles/global';
import { useNavigation } from '@react-navigation/native';

export default function ReceiptHistory() {
  // State to store the receipts fetched from the server
  const [receipts, setReceipts] = useState([]);
  // State to manage the loading indicator
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    // Function to fetch receipts from the server
    const fetchReceipts = async () => {
      try {
        // Get the username stored in AsyncStorage
        const user = await AsyncStorage.getItem('user');
        console.log("Username from AsyncStorage:", user);
                
        // Make a GET request to the server to get receipts based on the username
        const response = await fetch(`http://192.168.68.108:5000/get_receipts?username=${user}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Parse the server's response
        const data = await response.json();
        console.log("Data received from server:", data);  // Log the received data to check the server response

        if (response.ok) {
          // Sort the receipts by date in descending order
          const sortedReceipts = data.receipts.sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log("Sorted receipts:", sortedReceipts);  
          // Update the receipts state with the sorted data
          setReceipts(sortedReceipts);
        } else {
          console.error('Error fetching receipts:', data.error);
        }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          console.log("Loading state set to false");
          // Once data fetching is done, set loading to false
          setLoading(false);
        }
      }

    // Call the fetchReceipts function when the component mounts
    fetchReceipts();
  }, []);
  
  // Show an ActivityIndicator while loading data
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={globalStyles.container}>
      <Header />
      <Text style={globalStyles.HistoryTitle}>Your Receipt History</Text>
      <ScrollView contentContainerStyle={globalStyles.list}>
        {receipts.map((receipt, index) => (
          // Display each receipt in a TouchableOpacity that navigates to the Show screen when pressed
          <TouchableOpacity 
            key={index} 
            style={globalStyles.receiptItem} 
            onPress={() => navigation.navigate("Show", { GenerateRandomPassword : receipt.receiptCode })}
          >
            <Text>Receipt Code: {receipt.receiptCode}</Text>
            {/* Display the receipt date in a localized format */}
            <Text>Date: {new Date(receipt.date).toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}  

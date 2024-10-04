import React, { useState } from 'react';
import { View, Button, Text, TextInput } from 'react-native';
import { globalStyles } from '../styles/global';
import { useNavigation } from '@react-navigation/native';

function AddProduct({ route }) {
  // State variables to store user input
  const [newProductName, setNewProductName] = useState('');
  const [newProductAmount, setNewProductAmount] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  
  const navigation = useNavigation();
  // Extract the password passed through route params (optional chaining ensures it doesn't break if not present)
  const password = route.params && route.params.GenerateRandomPassword ? route.params.GenerateRandomPassword : null;

  // Function to handle the press of the "Add" button
  const handleAddButtonPress = async () => {
    // Validate that the product name is a string, amount and price are numbers, and none of the fields are empty
    if (typeof newProductName === 'string' && !isNaN(newProductAmount) && !isNaN(newProductPrice) &&
        newProductName && newProductAmount && newProductPrice) {

      try {
        console.log(password); // Log the password for debugging purposes
        
        // Create the product object to be sent to the server
        const productToAdd = {
          name: newProductName,
          amount: parseInt(newProductAmount),  // Convert amount to integer
          price: parseFloat(newProductPrice),  // Convert price to float
          password: password  // Include the password if it exists
        };

        // Send a POST request to the server with the product data
        const response = await fetch('http://192.168.68.108:5000/add_product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productToAdd)  // Send the product data as JSON
        });

        // Parse the server's response
        const data = await response.json();

        // Handle potential errors returned from the server
        if (response.status === 400) {
          alert(data.error);  // Show an alert with the error message
        } else {
          // Navigate back to the "Show" screen with the same password
          navigation.navigate("Show", {
            GenerateRandomPassword: password,
          });
        }

      } catch (error) {
        // Handle any other errors (e.g., network issues)
        alert('There is a problem with the product details');
      }
      
    } else {
      // Show an alert if validation fails (e.g., fields are empty or incorrectly filled)
      alert('The fields are empty or you filled them in incorrectly');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Product Name:</Text>
        <TextInput
          style={globalStyles.input}  // Apply global input styling
          placeholder="Enter Product Name..."  // Placeholder text
          value={newProductName}  // Bind the input value to the state
          onChangeText={text => setNewProductName(text)}  // Update the state when text changes
        />
        <Text>Product Amount:</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Enter Product Amount..."
          value={newProductAmount}
          onChangeText={text => setNewProductAmount(text)}
        />
        <Text>Product Price:</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Enter Product Price..."
          value={newProductPrice}
          onChangeText={text => setNewProductPrice(text)}
        />
        {/* Button to trigger the product addition process */}
        <Button title="Add" onPress={handleAddButtonPress} />
        
        {/* Additional button to close the form and navigate back to "Show" screen */}
        <View style={{ marginTop: 20 }}>
          <Button title="Close" onPress={() =>  navigation.navigate("Show", {
            GenerateRandomPassword: password,
          })} />
        </View>
      </View>
    </View>
  );
}

export default AddProduct;

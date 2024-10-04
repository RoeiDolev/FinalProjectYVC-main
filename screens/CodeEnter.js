import React, { useState } from 'react';
import { View, Button, Text, TouchableWithoutFeedback, TextInput, Keyboard } from 'react-native';
import { globalStyles } from '../styles/global';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';

function CodeEnter() {
    const [code, setcode] = useState('');  // State to store the entered code
    const navigation = useNavigation();  // Hook for navigation

    // Function to check if the entered code exists in the database
    const checkCodeInDatabase = async () => {
      try {
        // Fetch request to check if the receipt code exists
        const response = await fetch(`http://192.168.68.108:5000/check_code?receipt_code=${code}`, { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
    
        const data = await response.json();
    
        // If the code exists, navigate to the "Show" page with the code as a parameter
        if (data.exists) {
          console.log(code);
          navigation.navigate("Show", { GenerateRandomPassword: code });
        } else {
          alert("Invalid Code", "The code you entered is not valid.");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error", "Something went wrong. Please try again later.");
      }
    };

    return (
      // TouchableWithoutFeedback to dismiss the keyboard when tapping outside the input field
      <TouchableWithoutFeedback onPress={() => {
        Keyboard.dismiss();  // Dismiss the keyboard when clicking outside
      }}>
        <View style={globalStyles.container}>
          <Header /> 
          <View style={globalStyles.back}>
            <Text>Enter a Code</Text>
            <TextInput 
              style={globalStyles.input} 
              value={code} 
              onChangeText={setcode}  // Update the code state when the text changes
              placeholder='Enter Code Here...'
            />
            <View style={globalStyles.buttonContainer}>
              <Button 
                title='Enter' 
                style={globalStyles.button} 
                onPress={checkCodeInDatabase}  // Call the function to check the code
              />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
}

export default CodeEnter;

import React, { useState } from 'react';
import { View, Text, Button, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Header from '../components/Header';
import { globalStyles } from '../styles/global';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function LoginPage() {
  const [UserName, SetUserName] = useState('');  // State for storing the entered username
  const [Password, SetPassword] = useState('');  // State for storing the entered password
  const navigation = useNavigation();  // Hook for navigation

  // Function to check the user's login credentials
  const LoginCheck = async () => {
    try {
      console.log('Login data:', { username: UserName, password: Password });
        // Construct the URL with query parameters
        const url = `http://192.168.68.108:5000/check_user?username=${UserName}&password=${Password}`;
      
        // Sending a GET request to check user credentials
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      
        const data = await response.json();
        console.log('Response data:', data);
        console.log('Type of data:', typeof data);  // Log the type of data received
      
        // Handling different responses based on the backend's response
        if (data == "2") {
          console.log('Login successful.');
          // Store session information in AsyncStorage
          await AsyncStorage.setItem('isLoggedIn', JSON.stringify(true));
          await AsyncStorage.setItem('user', UserName);  // Store the username for session tracking
          console.log('Navigating to Scan...');
          // Navigate to the "Scan" page with the username as a parameter
          navigation.navigate("Scan", {
            user: UserName
          });
        } else if (data == "1") {
          alert("The password is incorrect");  // Incorrect password
        } else {
          alert("The username and password are incorrect");  // Incorrect username and password
        }
      } catch (error) {
        console.error('Error:', error);  // Log any errors that occur during the request
      }
  };
  

  return (
    // Dismiss the keyboard when tapping outside the input fields
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
    }}>
      <View style={globalStyles.container}>
        <Header />  
        <View style={globalStyles.back}>
          <Text>UserName</Text>
          <TextInput 
            style={globalStyles.input} 
            value={UserName} 
            onChangeText={SetUserName} 
            placeholder='Enter Username...' 
          />
          <Text>Password</Text>
          <TextInput 
            style={globalStyles.input} 
            value={Password} 
            onChangeText={SetPassword} 
            placeholder='Enter Password...' 
            secureTextEntry  // Hide the entered password
          />
          <View style={[globalStyles.buttonContainer, { marginLeft: 50 }]}>
            <Button 
              title='Login' 
              style={globalStyles.button} 
              onPress={LoginCheck}
            />
            <Button 
              title='Register' 
              style={globalStyles.button} 
              onPress={() => navigation.navigate("Register")}
            />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default LoginPage;



import React, { useState } from 'react';
import { View, Text, Button, TextInput, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import Header from '../components/Header';
import { globalStyles } from '../styles/global';
import { useNavigation } from '@react-navigation/native';

function Register() {
  const [RegisterUserName, SetRegistarUserName] = useState('');  // State for the entered username
  const [RegisterPassword, SetRegisterPassword] = useState('');  // State for the entered password
  const [RegisterEmail, setRegisterEmail] = useState('');  // State for the entered email
  const navigation = useNavigation();  // Hook for navigation

  // Function to validate user inputs (username, password, email)
  const validateInput = () => {
    // Validate username length
    if (RegisterUserName.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long.');
      return false;
    }

    // Validate password length
    if (RegisterPassword.trim().length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return false;
    }

    // Validate email format using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(RegisterEmail.trim())) {
      Alert.alert('Error', 'Invalid email format.');
      return false;
    }

    return true;
  };

  // Function to send the registration data to the backend server
  const insertData = async () => {
    if (!validateInput()) {
      return;  // If input validation fails, do not proceed
    }

    fetch('http://192.168.68.108:5000/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send the registration details in the request body
      body: JSON.stringify({
        email: RegisterEmail,
        username: RegisterUserName,
        password: RegisterPassword,
      }),
    })
    .then(response => response.json())
    .then((data) => {
      if (data.error) {
        Alert.alert('Error', data.error);  // Show error if received from the server
      } else {
        Alert.alert('Registration was successful');
        navigation.navigate("Login");  // Navigate to the Login screen after successful registration
      }
    })
    .catch((error) => {
      Alert.alert('Something did not work properly, please try again');  // Handle any network or server errors
      console.error('Error:', error);
    });
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
            value={RegisterUserName} 
            onChangeText={SetRegistarUserName} 
            placeholder='Enter Username...' 
          />
          <Text>Password</Text>
          <TextInput 
            style={globalStyles.input} 
            value={RegisterPassword} 
            onChangeText={SetRegisterPassword} 
            placeholder='Enter Password...' 
            secureTextEntry  // Hide password input
          />
          <Text>Email</Text>
          <TextInput 
            style={globalStyles.input} 
            value={RegisterEmail} 
            onChangeText={setRegisterEmail} 
            placeholder='Enter Email...' 
          />
  
          <View style={globalStyles.buttonContainer}>
            <Button 
              title='Register' 
              style={globalStyles.button} 
              onPress={insertData} 
            />
          </View>
          <View style={globalStyles.buttonContainer}>
            <Button 
              title='I have a user' 
              style={globalStyles.button} 
              onPress={() => navigation.navigate("Login")} 
            />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default Register;

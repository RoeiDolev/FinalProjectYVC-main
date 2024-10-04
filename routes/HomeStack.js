import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginPage from '../screens/LoginPage';
import ScanPage from '../screens/ScanPage';
import ShowReceipt from '../screens/ShowReceipt';
import AddProduct from '../screens/AddProduct';
import Code from '../screens/CodeEnter';
import Register from '../screens/Register';
import Camera from '../screens/Camera';
import History from '../screens/ReceiptsHistory';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  // State to manage whether the user is logged in or not
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  // Check login status using AsyncStorage when the component mounts
  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log('Checking login status...');
      try {
        // Retrieve login status from AsyncStorage
        const loggedIn = await AsyncStorage.getItem('isLoggedIn');
        console.log('Login status:', loggedIn);
        // If 'isLoggedIn' exists, parse it, otherwise set it to false
        setIsLoggedIn(loggedIn !== null ? JSON.parse(loggedIn) : false);
      } catch (error) {
        // Handle any errors and set login status to false
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Show a loading spinner while checking login status
  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? "Scan" : "Login"}>
        {/* Login Screen */}
        <Stack.Screen
          name="Login"
          component={LoginPage}
          options={{ headerShown: false }}
        />
        {/* Scan Screen */}
        <Stack.Screen
          name="Scan"
          component={ScanPage}
          options={{ headerShown: false }}
        />
        {/* Show Receipt Screen */}
        <Stack.Screen
          name="Show"
          component={ShowReceipt}
          options={{ headerShown: false }}
        />
        {/* Add Product Screen */}
        <Stack.Screen
          name="Add"
          component={AddProduct}
          options={{ headerShown: false }}
        />
        {/* Code Entry Screen */}
        <Stack.Screen
          name="Code"
          component={Code}
          options={{ headerShown: false }}
        />
        {/* Register Screen */}
        <Stack.Screen
          name="Register"
          component={Register}
          options={{ headerShown: false }}
        />
        {/* Camera Screen */}
        <Stack.Screen
          name="Camera"
          component={Camera}
          options={{ headerShown: false }}
        />
        {/* Receipts History Screen */}
        <Stack.Screen
          name="History"
          component={History}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}



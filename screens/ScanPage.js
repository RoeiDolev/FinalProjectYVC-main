import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Button, Text, Image } from 'react-native';
import { globalStyles } from '../styles/global';
import Header from '../components/Header';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

function CenterSquareScreen({ route }) {
  const [user, setUser] = useState(null);  // State to store user from AsyncStorage
  const cameraRef = useRef();  // Camera reference
  const navigation = useNavigation();
  const [password, setPassword] = useState('');  // Randomly generated password for uploads
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);  // Gallery permission status
  const [image, setImage] = useState(null);  // Selected or captured image URI
  const [hasCameraPermission, setHasCameraPermission] = useState(null);  // Camera permission status
  const [isCameraActive, setIsCameraActive] = useState(false);  // Flag for camera activity

  // Function to generate a random password
  function generateRandomPassword() {
    const length = 7;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
  
    return password;
  }

  // Function to upload image to the server
  const uploadImage = async (imageUri, password) => {
    try {
      const user = await AsyncStorage.getItem('user');  // Retrieve the user from AsyncStorage
      if (!user) {
        throw new Error('User not found in session');
      }

      const response = await fetch(imageUri);
      const blob = await response.blob();  // Convert image to blob for uploading

      // Prepare the form data to send
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'image.jpg', 
        type: blob.type,   
      });
      formData.append('receipt_code', password); 
      formData.append('user', user);

      // Send the image to the server
      const uploadResponse = await fetch('http://192.168.68.108:5000/upload_image', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Error Response Text:', errorText);
        throw new Error(`Server error: ${uploadResponse.status}`);
      }

      const data = await uploadResponse.json();
      console.log('Success:', data.items);  // Log the extracted items from the image
    } catch (error) {
      console.error('Error:', error);  // Log any errors that occur
    }
  };

  // Request media permissions and retrieve user from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const sessionUser = await AsyncStorage.getItem('user');
      if (sessionUser) {
        setUser(sessionUser);  // Set the user from AsyncStorage
      } else {
        navigation.navigate('Login');  // Redirect to login if no user found
      }

      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(galleryStatus.status === 'granted');  // Check for gallery permissions

      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');  // Check for camera permissions
    })();
  }, []);

  // Focus effect to manage camera state when the screen is active
  useFocusEffect(
    useCallback(() => {
      const activateCamera = async () => {
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(cameraStatus.status === 'granted');
        setIsCameraActive(true);  // Activate camera when screen is focused
      };

      const deactivateCamera = () => {
        setIsCameraActive(false);  // Deactivate camera when screen is unfocused
      };

      activateCamera();

      return () => deactivateCamera(); 
    }, [])
  );

  // Function to pick an image from the gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [100, 140],
      quality: 1,
    });
  
    if (!result.canceled) {
      setImage(result.assets[0].uri);  // Set the selected image URI
      saveCroppedImageToGallery(result.assets[0].uri);  // Save and upload the image
    }
  };

  // Function to save the cropped image to the gallery and upload it
  const saveCroppedImageToGallery = async (photo) => {
    try {
      await MediaLibrary.saveToLibraryAsync(photo);  // Save image to gallery
      const generatedPassword = generateRandomPassword();  // Generate random password for receipt
      setPassword(password);
      uploadImage(photo, generatedPassword);  // Upload the image with the generated password
      navigation.navigate("Show", {
        GenerateRandomPassword: generatedPassword  // Navigate to "Show" screen
      });
    } catch (error) {
      alert('Failed to save image to gallery');  // Handle any errors
    }
  };

  if (hasGalleryPermission === false || hasCameraPermission === false) {
    return <Text>No access to Camera or Gallery</Text>;  // Display if no permissions
  }

  return (
    <View style={globalStyles.container}>
      <Header />
      <Text style={globalStyles.helloText}>Hello {user || "Guest"}</Text>
      <View style={globalStyles.square}>
        {isCameraActive ? (
          <Camera style={globalStyles.camera} ref={cameraRef} />
        ) : (
          <Text style={{ fontSize: 24, textAlign: 'center', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            No access to camera
          </Text>
        )}
      </View>
      <View style={globalStyles.buttonContainer}>
        <Button title="Scan" onPress={() => navigation.navigate("Camera", {})}/>
        <Button title='Upload Image' onPress={() => pickImage()} />
      </View>
      <View style={globalStyles.buttonContainerCode}>
        <Button title="I have a code" onPress={() => navigation.navigate("Code", {})}/>
      </View>
    </View>
  );
}

export default CenterSquareScreen;

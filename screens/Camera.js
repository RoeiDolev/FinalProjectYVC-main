import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, Image, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { globalStyles } from '../styles/global';
import { Camera } from 'expo-camera';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function CameraComponent({ route }) {
    // Camera and photo-related states
    let cameraRef = useRef(null);
    const navigation = useNavigation();
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [password, setPassword] = useState(''); // Generated password for each photo
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraKey, setCameraKey] = useState(0); // Key to reset camera component

    // Function to generate a random password for each photo
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

    // Function to upload the captured image to the server
    const uploadImage = async (imageUri, password) => {
        try {
            const user = await AsyncStorage.getItem('user');
            if (!user) {
                throw new Error('Email not found in session');
            }

            const response = await fetch(imageUri);
            const blob = await response.blob();  // Convert image to blob for upload
    
            const formData = new FormData();
            formData.append('image', {
                uri: imageUri,
                name: 'image.jpg',
                type: blob.type,
            });
            formData.append('receipt_code', password);
            formData.append('user', user);
    
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
            console.error('Error:', error);
        }
    };

    // Request camera and media library permissions on component mount
    useEffect(() => {
        (async () => {
            const cameraPermission = await Camera.requestCameraPermissionsAsync();
            const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
            setHasCameraPermission(cameraPermission.status === 'granted');
            setHasMediaLibraryPermission(mediaLibraryPermission.status === 'granted');
        })();
    }, []);

    // Reset the camera when the component is focused
    useFocusEffect(
        useCallback(() => {
            setCameraKey(prevKey => prevKey + 1);
            setIsCameraActive(true);

            return () => {
                setIsCameraActive(false);
            };
        }, [])
    );

    if (hasCameraPermission === undefined) {
        return <Text>Requesting permission...</Text>;
    } else if (!hasCameraPermission) {
        return <Text>Permission for camera not granted. Please change this in settings.</Text>;
    }

    // Function to take a picture
    let takePicture = async () => {
        let options = {
            quality: 1,
            base64: true,
            exif: false,
            format: "jpg",
        };
        let newPhoto = await cameraRef.current.takePictureAsync(options);  // Capture the image
        setPhoto(newPhoto);  // Set the photo to the state
        const generatedPassword = generateRandomPassword();  // Generate a random password for the photo
        setPassword(generatedPassword);  // Set the password
    };

    // If a photo has been taken, show the preview screen
    if (photo) {
        let sharePicture = () => {
            shareAsync(photo.uri);  // Share the image using expo-sharing
        };

        let savePhoto = () => {
            MediaLibrary.saveToLibraryAsync(photo.uri).then(() => {
                setPhoto(null);
            });
            uploadImage(photo.uri, password);  // Upload the image after saving
            navigation.navigate("Show", {
                GenerateRandomPassword: password,  // Navigate to "Show" screen with password
            });
        };

        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: 'coral', alignItems: 'center' }}>
                <Image style={globalStyles.preview} source={{ uri: 'data:image/jpg;base64,' + photo.base64 }} />
                <View style={{ flexDirection: 'row', height: 90, justifyContent: 'space-between' }}>
                    <TouchableWithoutFeedback>
                        <TouchableOpacity onPress={sharePicture} style={{ marginRight: 50, marginTop: 20 }}>
                            <MaterialIcons name="share" size={44} color="black" />
                        </TouchableOpacity>
                    </TouchableWithoutFeedback>
                    {hasMediaLibraryPermission &&
                        <TouchableOpacity onPress={savePhoto} style={{ marginTop: 20 }}>
                            <MaterialIcons name="save" size={44} color="black" />
                        </TouchableOpacity>
                    }
                    <TouchableOpacity onPress={() => setPhoto(null)} style={{ marginLeft: 60, marginTop: 20 }}>
                        <MaterialIcons name="camera-alt" size={44} color="black" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Camera view
    return (
        <Camera key={cameraKey} style={globalStyles.container} ref={cameraRef}>
            <View style={globalStyles.CameraButton}>
                <TouchableOpacity onPress={takePicture} style={globalStyles.cameraButton}>
                    <View style={globalStyles.innerCircle}>
                        <MaterialIcons name="camera-alt" size={80} color="white" />
                    </View>
                </TouchableOpacity>
            </View>
        </Camera>
    );
}

export default CameraComponent;

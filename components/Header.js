import React, { useState } from "react";
import { Text, View, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { globalStyles } from '../styles/global';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native'; 
import { Ionicons } from '@expo/vector-icons'; 

export default function Header() {
    // State to manage the visibility of the modal (side menu)
    const [modalVisible, setModalVisible] = useState(false);
    const navigation = useNavigation(); // Hook for navigation
    const route = useRoute(); // Hook for getting the current route

    // Function to handle going back to the previous screen
    const handleGoBack = () => {
        navigation.goBack();
    };

    // Function to handle user logout
    const handleLogout = async () => {
        try {
            // Remove session data from AsyncStorage
            await AsyncStorage.removeItem('isLoggedIn');
            await AsyncStorage.removeItem('paramKey');
            console.log('Session cleared. Logging out.');
            // Close the modal and navigate to the Login screen
            setModalVisible(false); 
            navigation.navigate('Login');
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    };

    // Function to open the side menu
    const openMenu = () => {
        setModalVisible(true);
    };

    // Function to close the side menu
    const closeMenu = () => {
        setModalVisible(false);
    };

    // Function to navigate to the Receipts History screen
    const goToHistoricReceipts = () => {
        setModalVisible(false);  // Close the modal
        navigation.navigate('History');  // Navigate to the History screen
    };

    return (
        <View style={globalStyles.header}>
            {/* Menu button on the right side of the header */}
            <View style={globalStyles.rightContainer}>
                {route.name !== 'Login' && route.name !== 'Register' && (
                    <TouchableOpacity onPress={openMenu}>
                        <Ionicons name="menu" size={24} color="black" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Modal for side menu */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={closeMenu}
            >
                {/* Overlay that closes the menu when tapped */}
                <TouchableOpacity style={globalStyles.modalOverlay} onPress={closeMenu}>
                    {/* Side menu content */}
                    <View style={globalStyles.sideMenu}>
                        {/* Navigate to Receipts History */}
                        <TouchableOpacity onPress={goToHistoricReceipts}>
                            <Text style={[globalStyles.menuItem, style = {backgroundColor: 'white'}]}>Receipts History</Text>
                        </TouchableOpacity>
                        {/* Logout button */}
                        <TouchableOpacity onPress={handleLogout}>
                            <Text style={[globalStyles.menuItem, style = {backgroundColor: '#d50000', marginTop:50}]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Header title */}
            <Text style={globalStyles.title}>EasyReceipt</Text>

            {/* Back button on the left side of the header */}
            <View style={globalStyles.leftContainer}>
                {route.name !== 'Login' && route.name !== 'Scan' && (
                    <TouchableWithoutFeedback onPress={handleGoBack}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableWithoutFeedback>
                )}
            </View>
        </View>
    );
}

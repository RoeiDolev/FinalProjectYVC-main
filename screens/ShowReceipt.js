import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, Button, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { globalStyles } from '../styles/global';
import Header from '../components/Header';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';

function ShowReceipt({ route }) {
    const navigation = useNavigation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [originalProducts, setOriginalProducts] = useState([]);
    const [isCodeValid, setIsCodeValid] = useState(false);  // To track if receipt code is valid
    const sum = products.reduce((total, product) => total + product.Amount, 0);  // Sum of product amounts
    const [amountValues, setAmountValues] = useState([]);
    const [splitValues, setSplitValues] = useState([]);
    const [split_toValues, setSplitToValues] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const password = route.params && route.params.GenerateRandomPassword ? route.params.GenerateRandomPassword : null;  // Receipt code
    const [modalOpen, setModelOpen] = useState(false);  // Tip modal state
    const [Tip, SetTip] = useState(0);  // Tip value

    // Check if the receipt code is valid by polling the server
    useEffect(() => {
        let intervalId;
        let timeoutId;

        const checkCode = async () => {
            if (password) {
                try {
                    const response = await fetch(`http://192.168.68.108:5000/check_code?receipt_code=${password}`);
                    const data = await response.json();

                    if (data.exists) {
                        setIsCodeValid(true);
                        setLoading(false);
                        clearInterval(intervalId); 
                        clearTimeout(timeoutId); 
                    }
                } catch (error) {
                    console.error('Error checking code:', error);
                }
            }
        };

        if (password) {
            intervalId = setInterval(checkCode, 3000);  // Poll every 3 seconds
            timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                alert('I could not scan the receipt, please try again');
                navigation.navigate("Scan");  // Navigate to Scan screen if receipt check times out
            }, 30000);  // Timeout after 30 seconds
        }

        return () => {
            clearInterval(intervalId); 
            clearTimeout(timeoutId); 
        };
    }, [password, navigation]);

    // Fetch products from the server if the receipt code is valid
    useFocusEffect(
        useCallback(() => {
            const fetchProducts = async () => {
                try {
                    setLoading(true); 
                    const response = await fetch(`http://192.168.68.108:5000/get_products?receipt_code=${password}`);
                    const productsList = await response.json();
                    console.log('Products List:', productsList);
                    if (Array.isArray(productsList)) {
                        setProducts(productsList);
                        setOriginalProducts(productsList);
                        setLoading(false); 
                    } else {
                        console.error("Fetched data is not an array:", productsList);
                        setLoading(false); 
                    }
                } catch (error) {
                    console.error("Error fetching products: ", error);
                    setLoading(false); 
                }
            };
    
            if (isCodeValid) {
                fetchProducts();
            }
        }, [isCodeValid, password])
    );
    
    // Update the amount taken from a product
    const handleAmountChange = (value, productIndex) => {
        const updatedAmountValues = [...amountValues];
        updatedAmountValues[productIndex] = { value: value, index: productIndex };
        setAmountValues(updatedAmountValues);
    };

    // Update the split amount of a product
    const handleSplitChange = (value, productIndex) => {
        const updatedSplitValues = [...splitValues];
        updatedSplitValues[productIndex] = { value: value, index: productIndex };
        setSplitValues(updatedSplitValues);
    };

    // Update the split-to values for dividing a product
    const handleSplit_toChange = (value, productIndex) => {
        const updatedSplit_toValues = [...split_toValues];
        updatedSplit_toValues[productIndex] = { value: value, index: productIndex };
        setSplitToValues(updatedSplit_toValues);
    };

    if (loading) {
        return (
            <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>I am analyzing the receipt details, please wait...{"\n"}</Text>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <View style={{ backgroundColor: 'azure', flex: 1 }}>
            <Header navigation={navigation} />
            <Modal visible={modalOpen} animationType='fade' transparent={true}>
                <View style={globalStyles.model}>
                    <Text style={globalStyles.percentageSign}>TipPercentage</Text>
                    <View style={globalStyles.inputFade}>
                        <TextInput
                            style={globalStyles.input}
                            value={Tip !== 0 ? Tip.toString() : ''}
                            onChangeText={(text) => {
                                const newTip = parseFloat(text.replace('%', )); 
                                if (!isNaN(newTip)) {
                                    SetTip(newTip);
                                }
                                else(
                                    SetTip(" ")
                                )
                            }}
                            placeholder='Enter Percent of tip...'  
                            keyboardType='numeric'
                        />
                    </View>
                    <View style={globalStyles.buttonsFade}>
                        <Button title='Close' onPress={() => setModelOpen(false)} />
                        <Button
                            title='Calculate'
                            onPress={() => {
                                const tipAmount = parseFloat(Tip);
                                if (!isNaN(tipAmount)) {
                                    const tipPrice = totalPrice * (tipAmount / 100);
                                    const newTotal = totalPrice + tipPrice;
                                    setTotalPrice(newTotal);
                                    setModelOpen(false);
                                }
                            }}
                        />
                    </View>
                </View>
            </Modal>
            <Text style={globalStyles.text}>Receipt</Text>
            <Text style={globalStyles.text}>CodeToShare: {password}</Text>
            <ScrollView>
                {products.map((product, index) => (
                    <View key={index} style={globalStyles.products}>
                        <Text style={globalStyles.productsText}>name: {product.ProductName}</Text>
                        <Text style={globalStyles.productsText}>
                            amount: {product.Amount} 
                        </Text>
                        <Text style={globalStyles.productsText}>price: {product.Price}</Text>
                        <View style={globalStyles.buttonContainerReceipt}>
                            <Button 
                                title="I Took"
                                style={globalStyles.productsButtons}
                                onPress={() => {
                                    const selectedProduct = products[index];
                                    const newAmountValue = parseInt(amountValues[index]?.value) || 1;
                                    if (newAmountValue !== 0) {
                                        if (selectedProduct.Amount - newAmountValue >= 0) {
                                            const newTotal = totalPrice + newAmountValue * selectedProduct.Price;
                                            setProducts(prevProducts => {
                                                const updatedProducts = [...prevProducts];
                                                updatedProducts[index] = { 
                                                    ...updatedProducts[index], 
                                                    Amount: selectedProduct.Amount - newAmountValue 
                                                };
                                                return updatedProducts;
                                            });
                                            setTotalPrice(newTotal);
                                            setAmountValues([]);
                                        } else {
                                            alert("The amount is greater than the existing amount of products 😊");
                                        }
                                    } else {
                                        alert("A value greater than 0 must be entered");
                                    }
                                }}
                            />
                            <Dropdown
                                style={globalStyles.inputDropdown}
                                data={[...Array(products[index].Amount).keys()].map(value => ({ label: (value + 1).toString(), value: value + 1 }))}
                                value={amountValues[index]?.value || 1}
                                onChange={(value) => handleAmountChange(value.value, index)}
                                labelField="label"
                                valueField="value"
                                search
                            />
                        </View>
                        <View style={globalStyles.buttonContainerReceipt}>
                            <Button 
                                title="I Split" 
                                style={globalStyles.productsButtons}
                                onPress={() => {
                                    const selectedProduct = products[index];
                                    const newSplitValue = parseInt(splitValues[index]?.value) || 1;
                                    const newSplitToValue = parseInt(split_toValues[index]?.value) || 1;
                                    const newTotal = totalPrice + (selectedProduct.Price * newSplitValue) / newSplitToValue;
                                    if (newSplitValue !== 0) {
                                        if (selectedProduct.Amount - newSplitValue >= 0) { 
                                            if (newSplitToValue >= 1) {
                                                setProducts(prevProducts => {
                                                    const updatedProducts = [...prevProducts];
                                                    updatedProducts[index] = { 
                                                        ...updatedProducts[index], 
                                                        Amount: selectedProduct.Amount - newSplitValue
                                                    };
                                                    return updatedProducts;
                                                });
                                                setTotalPrice(newTotal);
                                                setSplitValues([]);
                                                setSplitToValues([]);
                                            } else {
                                                alert("A value greater than 1 must be entered in SplitTo");
                                            }
                                        } else {
                                            alert("The amount is greater than the existing amount of products 😊");
                                        }
                                    } else {
                                        alert("A value greater than 0 must be entered");
                                    }
                                }}
                            />
                            <Dropdown
                                style={globalStyles.inputDropdown}
                                data={[...Array(products[index].Amount).keys()].map(value => ({ label: (value + 1).toString(), value: value + 1 }))}
                                value={splitValues[index]?.value || 1}
                                onChange={(value) => handleSplitChange(value.value, index)}
                                labelField="label"
                                valueField="value"
                                search
                            />
                            <Text>Split_To</Text>
                            <Dropdown
                                style={globalStyles.inputDropdown}
                                data={[...Array((sum + 1)*5).keys()].map(value => ({ label:(value + 1 ).toString(), value: value + 1 }))}
                                value={split_toValues[index]?.value || 1}
                                onChange={(value) => handleSplit_toChange(value.value, index)}
                                labelField="label"
                                valueField="value"
                                search
                            />
                        </View>
                    </View>
                ))}
            </ScrollView>
            <View style={globalStyles.lowerButtons}>
                <Text style={globalStyles.TotalPriceText}>Total Price: {totalPrice.toFixed(2)}</Text>
            </View>
            <View style={[globalStyles.lowerButtons,{  flexDirection: 'row-reverse'}]}>
                <Button
                    title='reset'
                    style={globalStyles.button}
                    color='red'
                    onPress={handleReset = () => {
                        setProducts(originalProducts);
                        setTotalPrice(0);
                        setAmountValues([]);
                        setSplitValues([]);
                        setSplitToValues([]);
                        setTotalPrice(0);
                    }}
                />
                <Button title='Tip' style={globalStyles.button} onPress={() => setModelOpen(true)}/> 
                <Button title='add item' 
                    style={globalStyles.button}
                    color='green'
                    onPress={() => navigation.navigate("Add", {
                        GenerateRandomPassword: password,
                    })} 
                />
            </View>
        </View>
    );
}

export default ShowReceipt;

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Products from './screens/Products';
import CreateProductScreen from './screens/CreateProduct';
import ProductAnalytics from './screens/ProductAnalytics';

const Stack = createNativeStackNavigator();

export default function ProductNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      
      <Stack.Screen name="InventoryScreen" component={Products} />
      <Stack.Screen name="CreateProductScreen" component={CreateProductScreen as any} />
      <Stack.Screen name="ProductAnalytics" component={ProductAnalytics} />
    </Stack.Navigator>
  );
}

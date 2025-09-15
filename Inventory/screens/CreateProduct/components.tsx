// All imports will be at the top of the main file or in each respective component file if split.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Switch,
  ActivityIndicator,
  Platform, // Import Platform for OS-specific styles
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as api from "../../../../../services/api"
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Assuming types.ts is located at '../../../../constants/types'
import {
  Product,
  Category,
  Pricing,
  Variant,
  Option,
  Attribute,
  SizingGuide,
  CustomizationOption,
  Dimensions,
  Inventory,
  Shipping, // Import Shipping type
} from '../.././../../../constants/types';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../redux/userSlice';
import { useNavigation, useRoute } from '@react-navigation/native'; // Import useRoute

import { appStyles, componentStyles } from './styles';

// =============================================================================
// FILE: src/components/ProductFormComponents.tsx
// This file would contain all the individual React Native components for the form.
// =============================================================================

export interface ProductBasicInfoProps {
  product: Partial<Product>;
  handleChange: (field: keyof Product, value: any) => void;
}

export const ProductBasicInfo: React.FC<ProductBasicInfoProps> = ({ product, handleChange }) => (
  <View style={componentStyles.card}>
    <Text style={appStyles.sectionTitle}>Basic Info</Text>
    <View style={appStyles.inputGroup}>
      <Text style={appStyles.label}>Title *</Text>
      <TextInput
        style={appStyles.input}
        value={product.title}
        onChangeText={(value: string) => handleChange('title', value)}
        placeholder="e.g., Stylish Summer Dress"
        placeholderTextColor="#666"
      />
    </View>
    {/* <View style={appStyles.inputGroup}>
      <Text style={appStyles.label}>Product Handle (Auto Generated)</Text>
      <TextInput
        style={[appStyles.input, { backgroundColor: '#111', color: '#888' }]}
        value={product.handle}
        editable={false}
        placeholder="e.g., stylish-summer-dress"
        placeholderTextColor="#666"
      />
    </View> */}
    <View style={appStyles.inputGroup}>
      <Text style={appStyles.label}>Description *</Text>
      <TextInput
        style={[appStyles.input, appStyles.textArea]}
        value={product.description}
        onChangeText={(value: string) => handleChange('description', value)}
        multiline
        placeholder="Provide a detailed product description..."
        placeholderTextColor="#666"
      />
    </View>
    <View style={appStyles.inputGroup}>
      <Text style={appStyles.label}>Type *</Text>
      <View style={appStyles.picker}>
        <Picker
          selectedValue={product.product_type || ''}
          onValueChange={(itemValue: string) => {
            if (itemValue) {
              handleChange('product_type', itemValue);
            }
          }}
          style={{ color: '#fff' }}
          dropdownIconColor="#fff"
          itemStyle={componentStyles.pickerItem}
        >
          <Picker.Item label="Select Product Type..." value="" />
          {[
            "Shirts",
            "T-Shirts",
            "Pants",
            "Jeans",
            "Shorts",
            "Hoodies",
            "Sweatshirts",
            "Jackets",
            "Coats",
            "Suits",
            "Dresses",
            "Skirts",
            "Kurta",
            "Shalwar Kameez",
            "Tracksuits",
            "Active wear",
            "Watches",
            "Bags",
            "Jewellery",
            "Caps",
            "Shoes",
            "Belts"
            ].map((type : any) => (
            <Picker.Item key={type} label={type} value={type} />
          ))}
        </Picker>
      </View>
    </View>
  </View>
);

// Component for Categories
export interface ProductCategoriesProps {
  product: Partial<Product>;
  handleChange: (field: keyof Product, value: any) => void;
  dummyCategories: Category[];
}

export const ProductCategories: React.FC<ProductCategoriesProps> = ({ product, handleChange, dummyCategories }) => (
  <View style={componentStyles.card}>
    <Text style={appStyles.sectionTitle}>Categories *</Text>
    <View style={appStyles.inputGroup}>
      <Text style={appStyles.label}>Select Categories</Text>
      <View style={appStyles.picker}>
        <Picker
          selectedValue={''}
          onValueChange={(itemValue: string) => {
            const selectedCategory = dummyCategories.find((cat) => cat.id === itemValue);
            if (selectedCategory && !product.categories?.find((c) => c.id === selectedCategory.id)) {
              handleChange('categories', [...(product.categories || []), selectedCategory]);
            }
          }}
          style={{ color: '#fff' }}
          dropdownIconColor="#fff"
          itemStyle={componentStyles.pickerItem} // Apply style to Picker items
        >
          <Picker.Item label="Add Category..." value="" />
          {dummyCategories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
          ))}
        </Picker>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
        {product.categories?.map((cat, index) => (
          <TouchableOpacity
            key={index}
            style={componentStyles.tagChip}
            onPress={() => handleChange('categories', (product.categories || []).filter((c) => c.id !== cat.id))}
          >
            <Text style={componentStyles.tagText}>{cat.name}</Text>
            <Text style={componentStyles.closeButton}>x</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </View>
);

// ProductVideoUploader Component
export interface ProductVideoUploaderProps {
  pickedVideoUri: string;
  handleVideoPick: () => void;
  handleRemovePickedVideo: () => void;
}

export const ProductVideoUploader: React.FC<ProductVideoUploaderProps> = ({
  pickedVideoUri,
  handleVideoPick,
  handleRemovePickedVideo,
}) => (
  <View style={componentStyles.card}>
    <Text style={appStyles.sectionTitle}>Video</Text>
    <Text style={{ color: '#888', fontSize: 14, marginBottom: 15 }}>
      Add a single video to showcase your product (optional)
    </Text>
    
    {!pickedVideoUri ? (
      <TouchableOpacity style={appStyles.addButton} onPress={handleVideoPick}>
        <Icon name="video-plus" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={appStyles.buttonText}>Pick Video</Text>
      </TouchableOpacity>
    ) : (
      <View style={appStyles.videoPickerContainer}>
        <View style={appStyles.videoPreview}>
          {/* Video thumbnail/preview */}
          <View style={appStyles.videoThumbnail}>
            <Icon name="play-circle" size={48} color="#fff" />
            <Text style={appStyles.videoLabel}>Video Selected</Text>
          </View>
          <TouchableOpacity 
            style={appStyles.videoRemoveButton} 
            onPress={handleRemovePickedVideo}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>X</Text>
          </TouchableOpacity>
        </View>
        
        {/* Replace video button */}
        <TouchableOpacity 
          style={[appStyles.addButton, { marginTop: 10, backgroundColor: '#2A2A2A' }]} 
          onPress={handleVideoPick}
        >
          <Icon name="video-switch" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={appStyles.smallButtonText}>Replace Video</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

export interface ProductImageUploaderProps {
  pickedImageUris: string[];
  handleImagePick: () => void;
  handleRemovePickedImage: (uri: string) => void;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  pickedImageUris,
  handleImagePick,
  handleRemovePickedImage,
}) => (
  <View style={componentStyles.card}>
    <Text style={appStyles.sectionTitle}>Images *</Text>
    <TouchableOpacity style={appStyles.addButton} onPress={handleImagePick}>
      <Text style={appStyles.buttonText}>Pick Images</Text>
    </TouchableOpacity>
    <View style={appStyles.imagePickerContainer}>
      {pickedImageUris.map((uri, index) => (
        <View key={index} style={appStyles.imagePreview}>
          <Image source={{ uri }} style={appStyles.imageThumbnail} />
          <TouchableOpacity style={appStyles.imageRemoveButton} onPress={() => handleRemovePickedImage(uri)}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>X</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  </View>
);

export interface ProductPricingProps {
  product: Partial<Product>;
  handleChange: (field: keyof Product, value: any) => void;
}

export const ProductPricing: React.FC<ProductPricingProps> = ({ product, handleChange }) => (
  <View style={componentStyles.card}>
    <Text style={appStyles.sectionTitle}>Pricing *</Text>
    <View style={appStyles.inputGroup}>
      <Text style={appStyles.label}>Price (After Discount) *</Text>
      <TextInput
        style={appStyles.input}
        value={product.pricing?.price?.toString() === "0" ? undefined : product.pricing?.price?.toString()}
        onChangeText={(value: string) =>
          handleChange('pricing', { ...product.pricing, price: parseFloat(value) || 0 })
        }
        keyboardType="numeric"
        placeholder="e.g., 2500"
        placeholderTextColor="#666"
      />
    </View>

    <View style={appStyles.checkboxContainer}>
      <Switch
        trackColor={{ false: '#767577', true: 'white' }}
        thumbColor={product.pricing?.discounted ? 'red' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={(value: boolean) => handleChange('pricing', { ...product.pricing, discounted: value })}
        value={product.pricing?.discounted}
      />
      <Text style={appStyles.checkboxLabel}>Discounted Product</Text>
    </View>

    {product.pricing?.discounted && (
      <>
        <View style={appStyles.inputGroup}>
          <Text style={appStyles.label}>Discount Type</Text>
          <View style={appStyles.picker}>
            <Picker
              selectedValue={product.pricing?.discount_type}
              onValueChange={(itemValue: string) =>
                handleChange('pricing', { ...product.pricing, discount_type: itemValue })
              }
              style={{ color: '#fff' }}
              dropdownIconColor="#fff"
              itemStyle={componentStyles.pickerItem}
            >
              <Picker.Item label="Select Discount Type" value="" />
              <Picker.Item label="Percentage" value="percentage" />
              <Picker.Item label="Fixed Amount" value="fixed_amount" />
            </Picker>
          </View>
        </View>

        <View style={appStyles.inputGroup}>
          <Text style={appStyles.label}>Discount Value</Text>
          <TextInput
            style={appStyles.input}
            value={product.pricing?.discount_value?.toString()}
            onChangeText={(value: string) =>
              handleChange('pricing', { ...product.pricing, discount_value: parseFloat(value) || 0 })
            }
            keyboardType="numeric"
            placeholder="e.g., 10 (for 10% or $10)"
            placeholderTextColor="#666"
          />
        </View>
        <View style={appStyles.inputGroup}>
          <Text style={appStyles.label}>Compare at Price</Text>
          <TextInput
            style={[appStyles.input, { backgroundColor: '#111', color: '#888' }]}
            value={product.pricing?.compare_at_price?.toFixed(2)}
            editable={false}
          />
        </View>
      </>
    )}
  </View>
);

export interface ProductOptionsProps {
  product: Partial<Product>;
  newOptionValueInputs: string[];
  setNewOptionValueInputs: React.Dispatch<React.SetStateAction<string[]>>;
  handleAddOption: () => void;
  handleUpdateOption: (index: number, field: keyof Option, value: any) => void;
  handleRemoveOption: (index: number) => void;
  handleAddOptionValue: (optionIndex: number) => void;
  handleRemoveOptionValue: (optionIndex: number, valueToRemove: string) => void;
}

export const ProductOptions: React.FC<ProductOptionsProps> = ({
  product,
  newOptionValueInputs,
  setNewOptionValueInputs,
  handleAddOption,
  handleUpdateOption,
  handleRemoveOption,
  handleAddOptionValue,
  handleRemoveOptionValue,
}) => (
  <View style={componentStyles.card}>
    <Text style={appStyles.sectionTitle}>Options (e.g., Color, Size)</Text>
    {product.options?.map((option, index) => (
      <View key={index} style={componentStyles.optionContainer}>
        <View style={appStyles.inputGroup}>
          <Text style={appStyles.label}>Option Name</Text>
          <TextInput
            style={appStyles.input}
            value={option.name}
            onChangeText={(value: string) => handleUpdateOption(index, 'name', value)}
            placeholder="e.g., Color, Size"
            placeholderTextColor="#666"
          />
        </View>
        <View style={appStyles.checkboxContainer}>
          <Switch
            trackColor={{ false: '#767577', true: 'white' }}
            thumbColor={option.required ? 'red' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value: boolean) => handleUpdateOption(index, 'required', value)}
            value={option.required}
          />
          <Text style={appStyles.checkboxLabel}>Required?</Text>
        </View>

        <Text style={appStyles.label}>Option Values</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TextInput
            style={[appStyles.input, { flex: 1 }]}
            value={newOptionValueInputs[index]}
            onChangeText={(text: string) =>
              setNewOptionValueInputs(prev => {
                const newState = [...prev];
                newState[index] = text;
                return newState;
              })
            }
            placeholder="Add new value (e.g., Red, Small)"
            placeholderTextColor="#666"
            onSubmitEditing={() => handleAddOptionValue(index)}
          />
          <TouchableOpacity style={[appStyles.addButton, { marginLeft: 10, width: 80 }]} onPress={() => handleAddOptionValue(index)} >
            <Text style={appStyles.smallButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
          {option.values.map((value, valIndex) => (
            <TouchableOpacity
              key={valIndex}
              style={componentStyles.tagChip}
              onPress={() => handleRemoveOptionValue(index, value)}
            >
              <Text style={componentStyles.tagText}>{value}</Text>
              <Text style={componentStyles.closeButton}>x</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[appStyles.removeBtn, { marginTop: 15 }]} onPress={() => handleRemoveOption(index)}>
          <Text style={appStyles.smallButtonText}>Remove Option</Text>
        </TouchableOpacity>
      </View>
    ))}
    <TouchableOpacity style={appStyles.addButton} onPress={handleAddOption}>
      <Text style={appStyles.buttonText}>Add New Option</Text>
    </TouchableOpacity>
  </View>
);

export interface ProductVariantsProps {
  product: Partial<Product>;
  handleUpdateVariants: (updatedVariants: Variant[]) => void;
  handleRemoveVariant: (index: number) => void;
}

export const ProductVariants: React.FC<ProductVariantsProps> = ({
  product,
  handleUpdateVariants,
  handleRemoveVariant,
}) => {
  const handleUpdateVariant = useCallback((index: number, field: keyof Variant | 'quantity', value: any) => {
    const updatedVariants = [...(product.variants || [])];
    if (field === 'quantity') {
      updatedVariants[index].inventory = {
        ...(updatedVariants[index].inventory || {} as Inventory),
        quantity: parseFloat(value) || 0,
        in_stock: (parseFloat(value) || 0) > 0,
      };
    } else if (field === 'price') {
      updatedVariants[index].price = parseFloat(value) || 0;
    }
    else if (field === 'sku') {
      updatedVariants[index].sku = value;
    }
    handleUpdateVariants(updatedVariants);
  }, [product.variants, handleUpdateVariants]);

  return (
    <View style={componentStyles.card}>
      <Text style={appStyles.sectionTitle}>Product Variants</Text>
      {(product.options?.length === 0 || !product.options) && (
        <Text style={{ color: '#666', marginBottom: 20, textAlign: 'center' }}>
          Add product options (like Color, Size) to automatically generate variants here.
        </Text>
      )}
      {product.variants?.map((variant, index) => (
        <View key={variant.id} style={componentStyles.variantContainer}>
          <Text style={componentStyles.variantTitle}>Variant: {variant.title}</Text>
          <View style={componentStyles.variantRow}>
            {/* <View style={[appStyles.inputGroup, componentStyles.variantInput]}>
              <Text style={appStyles.label}>SKU</Text>
              <TextInput
                style={appStyles.input}
                value={variant.sku}
                onChangeText={(value: string) => handleUpdateVariant(index, 'sku', value)}
                placeholder="Auto-generated SKU"
                placeholderTextColor="#666"
              />
            </View> */}
            <View style={[appStyles.inputGroup, componentStyles.variantInput]}>
              <Text style={appStyles.label}>Price</Text>
              <TextInput
                style={appStyles.input}
                value={variant.price?.toString()}
                onChangeText={(value: string) => handleUpdateVariant(index, 'price', value)}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#666"
              />
            </View>
            <View style={[appStyles.inputGroup, componentStyles.variantInput]}>
              <Text style={appStyles.label}>Quantity</Text>
              <TextInput
                style={appStyles.input}
                value={variant.inventory?.quantity?.toString()}
                onChangeText={(value: string) => handleUpdateVariant(index, 'quantity', value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#666"
              />
            </View>
            <TouchableOpacity style={componentStyles.variantRemoveButton} onPress={() => handleRemoveVariant(index)}>
              <Icon name="delete" size={20} color="white" />

            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

export interface ProductAttributesProps {
  product: Partial<Product>;
  newAttributeName: string;
  setNewAttributeName: React.Dispatch<React.SetStateAction<string>>;
  newAttributeValue: string;
  setNewAttributeValue: React.Dispatch<React.SetStateAction<string>>;
  handleAddAttribute: () => void;
  handleRemoveAttribute: (index: number) => void;
}

export const ProductAttributes: React.FC<ProductAttributesProps> = ({
  product,
  newAttributeName,
  setNewAttributeName,
  newAttributeValue,
  setNewAttributeValue,
  handleAddAttribute,
  handleRemoveAttribute,
}) => (
  <View style={componentStyles.card}>
    <Text style={appStyles.sectionTitle}>Product Details (e.g., Material, Brand)</Text>
    {product.attributes?.map((attribute, index) => (
      <View key={index} style={componentStyles.attributeContainer}>
        <Text style={componentStyles.variantTitle}>
          {attribute.name}: {attribute.value}
        </Text>
        <TouchableOpacity style={appStyles.removeBtn} onPress={() => handleRemoveAttribute(index)}>
          <Text style={appStyles.smallButtonText}>Remove Detail</Text>
        </TouchableOpacity>
      </View>
    ))}
    <View style={appStyles.inputGroup}>
      <Text style={appStyles.label}>Detail Name</Text>
      <TextInput
        style={appStyles.input}
        value={newAttributeName}
        onChangeText={setNewAttributeName}
        placeholder="e.g., Fabric, Brand"
        placeholderTextColor="#666"
      />
    </View>
    <View style={appStyles.inputGroup}>
      <Text style={appStyles.label}>Detail Value</Text>
      <TextInput
        style={appStyles.input}
        value={newAttributeValue}
        onChangeText={setNewAttributeValue}
        placeholder="e.g., Cotton, Local Brand"
        placeholderTextColor="#666"
      />
    </View>
    <TouchableOpacity style={appStyles.addButton} onPress={handleAddAttribute}>
      <Text style={appStyles.buttonText}>Add Detail</Text>
    </TouchableOpacity>
  </View>
);
// Updated ProductSizingGuide component with fixes
export interface ProductSizingGuideProps {
  product: Partial<Product>;
  selectedSizingGuideType: string;
  sizeOptionValues: string[];
  handleSizingGuideChange: (field: keyof SizingGuide, value: any) => void;
  handleSizingGuideChartChange: (rowKey: string, colKey: string, value: string) => void;
  handleSizingGuideTypeChange: (type: string) => void;
  dummySizingGuides: Record<string, SizingGuide>;
}


export const ProductSizingGuide: React.FC<ProductSizingGuideProps> = ({
  product,
  selectedSizingGuideType,
  sizeOptionValues,
  handleSizingGuideChange,
  handleSizingGuideChartChange,
  handleSizingGuideTypeChange,
  dummySizingGuides,
}) => {
  const currentSizeChart = product.sizing_guide?.size_chart || {};
  const currentMeasurementUnit = product.sizing_guide?.measurement_unit || 'inch';
  
  // Get column keys from the selected sizing guide type or current chart
  const getColumnKeys = () => {
    if (selectedSizingGuideType && dummySizingGuides[selectedSizingGuideType]) {
      const dummyChart = dummySizingGuides[selectedSizingGuideType].size_chart;
      const firstRowKey = Object.keys(dummyChart)[0];
      if (firstRowKey && firstRowKey !== 'dummy_row') {
        return Object.keys(dummyChart[firstRowKey] || {});
      }
      // If it's dummy_row, get the keys from that
      return Object.keys(dummyChart['dummy_row'] || {});
    }
    
    // Fall back to existing chart keys
    const firstSizeValue = sizeOptionValues[0];
    if (firstSizeValue && currentSizeChart[firstSizeValue]) {
      return Object.keys(currentSizeChart[firstSizeValue]);
    }
    
    return [];
  };

  const columnKeys = getColumnKeys();

  const handleAddMeasurementColumn = () => {
    Alert.prompt(
      "Add New Measurement",
      "Enter the name of the new measurement (e.g., 'Bust', 'Thigh'):",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Add",
          onPress: (measurementName) => {
            if (measurementName && measurementName.trim()) {
              const updatedSizeChart = { ...currentSizeChart };
              sizeOptionValues.forEach(sizeValue => {
                updatedSizeChart[sizeValue] = {
                  ...(updatedSizeChart[sizeValue] || {}),
                  [measurementName.trim()]: 0,
                };
              });
              handleSizingGuideChange('size_chart', updatedSizeChart);
            }
          }
        }
      ]
    );
  };

  const handleRemoveMeasurementColumn = (colKeyToRemove: string) => {
    Alert.alert(
      "Remove Measurement",
      `Are you sure you want to remove the measurement '${colKeyToRemove}'?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          onPress: () => {
            const updatedSizeChart = { ...currentSizeChart };
            Object.keys(updatedSizeChart).forEach(rowKey => {
              const { [colKeyToRemove]: _, ...rest } = updatedSizeChart[rowKey] || {};
              updatedSizeChart[rowKey] = rest;
            });
            handleSizingGuideChange('size_chart', updatedSizeChart);
          }
        }
      ]
    );
  };

  const handleTypeChange = (type: string) => {
    if (type && dummySizingGuides[type]) {
      // When a type is selected, apply the preset
      const preset = dummySizingGuides[type];
      const presetColumnKeys = Object.keys(preset.size_chart['dummy_row'] || {});
      
      // Create new size chart with current size values and preset measurements
      const newSizeChart: { [key: string]: { [key: string]: number } } = {};
      sizeOptionValues.forEach(sizeValue => {
        newSizeChart[sizeValue] = {};
        presetColumnKeys.forEach(colKey => {
          newSizeChart[sizeValue][colKey] = 0;
        });
      });

      // Apply the preset
      handleSizingGuideChange('size_chart', newSizeChart);
      handleSizingGuideChange('size_fit', preset.size_fit);
      handleSizingGuideChange('measurement_unit', preset.measurement_unit);
    } else {
      // Clear the chart when no type is selected
      handleSizingGuideChange('size_chart', {});
      handleSizingGuideChange('size_fit', '');
    }
    
    handleSizingGuideTypeChange(type);
  };

  return (
    <View style={componentStyles.card}>
      <Text style={appStyles.sectionTitle}>Sizing Guide *</Text>

      <View style={appStyles.inputGroup}>
        <Text style={appStyles.label}>Sizing Guide Type *</Text>
        <View style={appStyles.picker}>
          <Picker
            selectedValue={selectedSizingGuideType}
            onValueChange={(itemValue: string) => handleTypeChange(itemValue)}
            style={{ color: '#fff' }}
            dropdownIconColor="#fff"
            itemStyle={componentStyles.pickerItem}
          >
            <Picker.Item label="Select Type (Required)" value="" />
            {Object.keys(dummySizingGuides).map((type) => (
              <Picker.Item 
                key={type} 
                label={type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                value={type} 
              />
            ))}
          </Picker>
        </View>
      </View>

      {sizeOptionValues.length === 0 ? (
        <Text style={{ color: '#666', marginBottom: 20, textAlign: 'center' }}>
          Add a "Size" option in Product Options to create a sizing guide.
        </Text>
      ) : !selectedSizingGuideType ? (
        <Text style={{ color: '#ff6b6b', marginBottom: 20, textAlign: 'center', fontSize: 14 }}>
          Please select a sizing guide type to continue.
        </Text>
      ) : (
        <>
          <View style={appStyles.inputGroup}>
            <Text style={appStyles.label}>Measurement Unit</Text>
            <View style={appStyles.picker}>
              <Picker
                selectedValue={currentMeasurementUnit}
                onValueChange={(itemValue: string) => handleSizingGuideChange('measurement_unit', itemValue)}
                style={{ color: '#fff' }}
                dropdownIconColor="#fff"
                itemStyle={componentStyles.pickerItem}
              >
                <Picker.Item label="Inch" value="inch" />
                <Picker.Item label="CM" value="cm" />
              </Picker>
            </View>
          </View>

          <View style={appStyles.inputGroup}>
            <Text style={appStyles.label}>Size Fit Description *</Text>
            <TextInput
              style={[appStyles.input, appStyles.textArea]}
              value={product.sizing_guide?.size_fit}
              onChangeText={(value: string) => handleSizingGuideChange('size_fit', value)}
              multiline
              placeholder="e.g., 'Regular fit. True to size.'"
              placeholderTextColor="#666"
            />
          </View>

          {columnKeys.length > 0 && (
            <>
              <Text style={appStyles.label}>Size Chart *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                  {/* Header Row */}
                  <View style={componentStyles.sizeChartRow}>
                    <View style={componentStyles.sizeChartCellHeader}>
                      <Text style={componentStyles.sizeChartInputHeader}>Size</Text>
                    </View>
                    {columnKeys.map((colKey, colIndex) => (
                      <TouchableOpacity
                        key={colIndex}
                        onLongPress={() => handleRemoveMeasurementColumn(colKey)}
                        style={componentStyles.sizeChartCellHeader}
                      >
                        <Text style={componentStyles.sizeChartInputHeader}>
                          {colKey} ({currentMeasurementUnit})
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity 
                      onPress={handleAddMeasurementColumn} 
                      style={[componentStyles.sizeChartCellHeader, { backgroundColor: '#2A2A2A' }]}
                    >
                      <Text style={componentStyles.sizeChartInputHeader}>+ Add</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Data Rows */}
                  {sizeOptionValues.map((rowKey, rowIndex) => (
                    <View key={rowIndex} style={componentStyles.sizeChartRow}>
                      <View style={componentStyles.sizeChartCellHeader}>
                        <Text style={componentStyles.sizeChartInputHeader}>{rowKey}</Text>
                      </View>
                      {columnKeys.map((colKey, colIndex) => (
                        <TextInput
                          key={colIndex}
                          style={componentStyles.sizeChartCell}
                          value={currentSizeChart[rowKey]?.[colKey]?.toString() === "0" ? undefined : currentSizeChart[rowKey]?.[colKey]?.toString() || undefined}
                          onChangeText={(value) => handleSizingGuideChartChange(rowKey, colKey, value)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#666"
                        />
                      ))}
                      {/* Empty cell to align with add button */}
                      <View style={[componentStyles.sizeChartCell, { backgroundColor: 'transparent' }]} />
                    </View>
                  ))}
                </View>
              </ScrollView>

              <Text style={{ color: '#888', fontSize: 16, marginTop: 10, textAlign: 'center' }}>
                Long press on measurement headers to remove them
              </Text>
            </>
          )}
        </>
      )}
    </View>
  );
};

export interface ProductTagsCollectionsProps {
  product: Partial<Product>;
  newTag: string;
  setNewTag: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  newCollection: string;
  setNewCollection: React.Dispatch<React.SetStateAction<string>>;
  handleAddCollection: () => void;
  handleRemoveCollection: (collection: string) => void;
}

export const ProductTagsCollections: React.FC<ProductTagsCollectionsProps> = ({
  product,
  newTag,
  setNewTag,
  handleAddTag,
  handleRemoveTag,
  newCollection,
  setNewCollection,
  handleAddCollection,
  handleRemoveCollection,
}) => (
  <View style={componentStyles.card}>
    <Text style={appStyles.sectionTitle}>Tags & Collections</Text>
    <View style={appStyles.inputGroup}>
      <Text style={appStyles.label}>Add Tags</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <TextInput
          style={[appStyles.input, { flex: 1 }]}
          value={newTag}
          onChangeText={setNewTag}
          placeholder="Add new tag (e.g., summer, sale)"
          placeholderTextColor="#666"
          onSubmitEditing={handleAddTag}
        />
        <TouchableOpacity style={[appStyles.addButton, { marginLeft: 10, width: 80 }]} onPress={handleAddTag}>
          <Text style={appStyles.smallButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
        {product.tags?.map((tag, index) => (
          <TouchableOpacity key={index} style={componentStyles.tagChip} onPress={() => handleRemoveTag(tag)}>
            <Text style={componentStyles.tagText}>{tag}</Text>
            <Text style={componentStyles.closeButton}>x</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* <View style={appStyles.inputGroup}>
      <Text style={appStyles.label}>Product Collections</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <TextInput
          style={[appStyles.input, { flex: 1 }]}
          value={newCollection}
          onChangeText={setNewCollection}
          placeholder="Add to collection (e.g., Summer 2024)"
          placeholderTextColor="#666"
          onSubmitEditing={handleAddCollection}
        />
        <TouchableOpacity style={[appStyles.addButton, { marginLeft: 10, width: 80 }]} onPress={handleAddCollection}>
          <Text style={appStyles.smallButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
        {product.collections?.map((collection, index) => (
          <TouchableOpacity
            key={index}
            style={componentStyles.tagChip}
            onPress={() => handleRemoveCollection(collection)}
          >
            <Text style={componentStyles.tagText}>{collection}</Text>
            <Text style={componentStyles.closeButton}>x</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View> */}
  </View>
);

export interface ProductCustomizationOptionsProps {
  product: Partial<Product>;
  newCustomOptionName: string;
  setNewCustomOptionName: React.Dispatch<React.SetStateAction<string>>;
  newCustomOptionValueInput: string;
  setNewCustomOptionValueInput: React.Dispatch<React.SetStateAction<string>>;
  handleAddCustomizationOption: () => void;
  handleUpdateCustomizationOption: (index: number, field: keyof CustomizationOption, value: any) => void;
  handleRemoveCustomizationOption: (index: number) => void;
  handleAddCustomOptionValue: (optionIndex: number) => void;
  handleRemoveCustomOptionValue: (optionIndex: number, valueToRemove: string) => void;
}

export const ProductCustomizationOptions: React.FC<ProductCustomizationOptionsProps> = ({
  product,
  newCustomOptionName,
  setNewCustomOptionName,
  newCustomOptionValueInput,
  setNewCustomOptionValueInput,
  handleAddCustomizationOption,
  handleUpdateCustomizationOption,
  handleRemoveCustomizationOption,
  handleAddCustomOptionValue,
  handleRemoveCustomOptionValue,
}) => (
  <View style={componentStyles.card}>
    <Text style={appStyles.sectionTitle}>Customization Options</Text>
    <View style={appStyles.checkboxContainer}>
      <Switch
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={product.is_customizable ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={(value: boolean) => {}}
        value={product.is_customizable}
      />
      <Text style={appStyles.checkboxLabel}>Is Customizable?</Text>
    </View>

    {product.is_customizable && (
      <>
        {product.customization_options?.map((option, index) => (
          <View key={index} style={componentStyles.optionContainer}>
            <View style={appStyles.inputGroup}>
              <Text style={appStyles.label}>Option Name</Text>
              <TextInput
                style={appStyles.input}
                value={option.name}
                onChangeText={(value: string) => handleUpdateCustomizationOption(index, 'name', value)}
                placeholder="e.g., Engraving, Gift Wrap"
                placeholderTextColor="#666"
              />
            </View>
            <View style={appStyles.inputGroup}>
              <Text style={appStyles.label}>Additional Price</Text>
              <TextInput
                style={appStyles.input}
                value={option.additional_price?.toString()}
                onChangeText={(value: string) => handleUpdateCustomizationOption(index, 'additional_price', parseFloat(value) || 0)}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#666"
              />
            </View>
            <View style={appStyles.checkboxContainer}>
              <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={option.required ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(value: boolean) => handleUpdateCustomizationOption(index, 'required', value)}
                value={option.required}
              />
              <Text style={appStyles.checkboxLabel}>Required?</Text>
            </View>
            <Text style={appStyles.label}>Values (if applicable)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <TextInput
                style={[appStyles.input, { flex: 1 }]}
                value={newCustomOptionValueInput}
                onChangeText={setNewCustomOptionValueInput}
                placeholder="Add new value (e.g., Gold, Silver)"
                placeholderTextColor="#666"
                onSubmitEditing={() => handleAddCustomOptionValue(index)}
              />
              <TouchableOpacity style={[appStyles.addButton, { marginLeft: 10, width: 80 }]} onPress={() => handleAddCustomOptionValue(index)} >
                <Text style={appStyles.smallButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
              {option.options.map((value, valIndex) => (
                <TouchableOpacity
                  key={valIndex}
                  style={componentStyles.tagChip}
                  onPress={() => handleRemoveCustomOptionValue(index, value)}
                >
                  <Text style={componentStyles.tagText}>{value}</Text>
                  <Text style={componentStyles.closeButton}>x</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[appStyles.removeBtn, { marginTop: 15 }]} onPress={() => handleRemoveCustomizationOption(index)} >
              <Text style={appStyles.smallButtonText}>Remove Custom Option</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={appStyles.addButton} onPress={handleAddCustomizationOption}>
          <Text style={appStyles.buttonText}>Add New Custom Option</Text>
        </TouchableOpacity>
      </>
    )}
  </View>
);

// New Shipping Information Component
export interface ProductShippingInfoProps {
  product: Partial<Product>;
  handleChange: (field: keyof Product, value: any) => void;
}

export const ProductShippingInfo: React.FC<ProductShippingInfoProps> = ({ product, handleChange }) => {
  // Ensure shippingDetails and dimensions are never null/undefined
  const shippingDetails: Shipping = product.shipping_details || {} as Shipping;
  const dimensions: Dimensions = shippingDetails.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' }; // Provide default Dimensions if null

  const handleShippingChange = useCallback((field: keyof Shipping, value: any) => {
    handleChange('shipping_details', { ...shippingDetails, [field]: value });
  }, [shippingDetails, handleChange]);

  const handleDimensionsChange = useCallback((field: keyof Dimensions, value: any) => {
    handleChange('shipping_details', {
      ...shippingDetails,
      dimensions: { ...dimensions, [field]: parseFloat(value) || 0 },
    });
  }, [shippingDetails, dimensions, handleChange]);

  const handleShippingRatesChange = useCallback((zone: string, value: string) => {
    handleChange('shipping_details', {
      ...shippingDetails,
      shipping_rates: { ...(shippingDetails.shipping_rates || {}), [zone]: parseFloat(value) || 0 }, // Ensure shipping_rates is not null
    });
  }, [shippingDetails, handleChange]);

  const handleAddShippingZone = () => {
    Alert.prompt(
      "Add Shipping Zone",
      "Enter the new shipping zone:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: (zone) => {
            if (zone && !(shippingDetails.shipping_zones || []).includes(zone)) {
              handleShippingChange('shipping_zones', [...(shippingDetails.shipping_zones || []), zone]);
            }
          }
        }
      ]
    );
  };

  const handleRemoveShippingZone = (zoneToRemove: string) => {
    handleShippingChange('shipping_zones', (shippingDetails.shipping_zones || []).filter(z => z !== zoneToRemove));
    // Also remove the rate associated with this zone
    if (shippingDetails.shipping_rates) {
      const newRates = { ...shippingDetails.shipping_rates };
      delete newRates[zoneToRemove];
      handleChange('shipping_details', { ...shippingDetails, shipping_rates: newRates });
    }
  };

  const handleAddShippingMethod = () => {
    Alert.prompt(
      "Add Shipping Method",
      "Enter the new shipping method (e.g., Standard, Express):",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: (method) => {
            if (method && !(shippingDetails.shipping_methods || []).includes(method)) {
              handleShippingChange('shipping_methods', [...(shippingDetails.shipping_methods || []), method]);
            }
          }
        }
      ]
    );
  };

  const handleRemoveShippingMethod = (methodToRemove: string) => {
    handleShippingChange('shipping_methods', (shippingDetails.shipping_methods || []).filter(m => m !== methodToRemove));
  };


  return (
    <View style={componentStyles.card}>
      <Text style={appStyles.sectionTitle}>Shipping Information</Text>

      {shippingDetails.requires_shipping && (
        <>
          <View style={appStyles.inputGroup}>
            <Text style={appStyles.label}>Weight</Text>
            <TextInput
              style={appStyles.input}
              value={shippingDetails.weight?.toString()}
              onChangeText={(value: string) => handleShippingChange('weight', parseFloat(value) || 0)}
              keyboardType="numeric"
              placeholder="e.g., 0.5"
              placeholderTextColor="#666"
            />
          </View>

          <View style={appStyles.inputGroup}>
            <Text style={appStyles.label}>Weight Unit</Text>
            <View style={appStyles.picker}>
              <Picker
                selectedValue={shippingDetails.weight_unit}
                onValueChange={(itemValue: string) => handleShippingChange('weight_unit', itemValue)}
                style={{ color: '#fff' }}
                dropdownIconColor="#fff"
                itemStyle={componentStyles.pickerItem}
              >
                <Picker.Item label="Grams" value="grams" />
                <Picker.Item label="KG" value="kg" />
                <Picker.Item label="Lbs" value="lbs" />
              </Picker>
            </View>
          </View>

          <Text style={appStyles.label}>Dimensions</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
            <View style={[appStyles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={appStyles.label}>Length</Text>
              <TextInput
                style={appStyles.input}
                value={dimensions.length?.toString()}
                onChangeText={(value: string) => handleDimensionsChange('length', value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#666"
              />
            </View>
            <View style={[appStyles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={appStyles.label}>Width</Text>
              <TextInput
                style={appStyles.input}
                value={dimensions.width?.toString()}
                onChangeText={(value: string) => handleDimensionsChange('width', value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#666"
              />
            </View>
            <View style={[appStyles.inputGroup, { flex: 1 }]}>
              <Text style={appStyles.label}>Height</Text>
              <TextInput
                style={appStyles.input}
                value={dimensions.height?.toString()}
                onChangeText={(value: string) => handleDimensionsChange('height', value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#666"
              />
            </View>
          </View>
          <View style={appStyles.inputGroup}>
            <Text style={appStyles.label}>Dimension Unit</Text>
            <View style={appStyles.picker}>
              <Picker
                selectedValue={dimensions.unit}
                onValueChange={(itemValue: string) => handleDimensionsChange('unit', itemValue)}
                style={{ color: '#fff' }}
                dropdownIconColor="#fff"
                itemStyle={componentStyles.pickerItem}
              >
                <Picker.Item label="CM" value="cm" />
                <Picker.Item label="Inch" value="inch" />
              </Picker>
            </View>
          </View>

          <View style={appStyles.inputGroup}>
            <Text style={appStyles.label}>Shipping Class</Text>
            <View style={appStyles.picker}>
              <Picker
                selectedValue={shippingDetails.shipping_class}
                onValueChange={(itemValue: string) => handleShippingChange('shipping_class', itemValue)}
                style={{ color: '#fff' }}
                dropdownIconColor="#fff"
                itemStyle={componentStyles.pickerItem}
              >
                <Picker.Item label="Standard" value="standard" />
                <Picker.Item label="Express" value="express" />
                <Picker.Item label="Free" value="free" />
              </Picker>
            </View>
          </View>

          <View style={appStyles.checkboxContainer}>
            <Switch
              trackColor={{ false: '#767577', true: 'white' }}
              thumbColor={shippingDetails.free_shipping ? 'red' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(value: boolean) => handleShippingChange('free_shipping', value)}
              value={shippingDetails.free_shipping}
            />
            <Text style={appStyles.checkboxLabel}>Free Shipping (you bear cost) ?</Text>
          </View>

          <View style={appStyles.inputGroup}>
            <Text style={appStyles.label}>Handling Time (in hours)</Text>
            <TextInput
              style={appStyles.input}
              value={shippingDetails.handling_time?.toString()}
              onChangeText={(value: string) => handleShippingChange('handling_time', parseInt(value) || 0)}
              keyboardType="numeric"
              placeholder="e.g., 1"
              placeholderTextColor="#666"
            />
          </View>

        </>
      )}
    </View>
  );
};


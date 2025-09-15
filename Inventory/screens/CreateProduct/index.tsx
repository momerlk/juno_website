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

import { ProductFormHooks } from './useProductForm';

import { 
  ProductAttributes, 
  ProductBasicInfo, 
  ProductVideoUploader,
  ProductCustomizationOptions, 
  ProductImageUploader, 
  ProductSizingGuide,
  ProductCategories,
  ProductPricing,
  ProductOptions,
  ProductTagsCollections,
  ProductVariants,
  ProductShippingInfo,
} from './components';

const createProductAPI = async (token : string, productData: Product): Promise<boolean> => {
  const resp = await api.Seller.CreateProduct(token, productData);

  if (resp.ok){
    Alert.alert("Success" , "Product created successfully!");
    return true;
  } else {
    Alert.alert("Failure", `Failed to create product. status = ${resp.status}, error = ${resp.body}`);
    return false;
  }

};

const updateProductAPI = async (token: string, productData: Product): Promise<boolean> => {
  const resp = await api.Seller.UpdateProduct(token, productData);

  if (resp.ok){
    Alert.alert("Success" , "Product updated successfully!");
    return true;
  } else {
    Alert.alert("Failure", `Failed to updated product. status = ${resp.status}, error = ${resp.body}`);
    return false;
  }
};



const uploadImageAPI = async (imageUri: string): Promise<string> => {
  if(imageUri.startsWith('http')){
    return imageUri;
  }
  return api.uploadFileAndGetUrl(imageUri, api.COMPRESSION_PRESETS.high_quality);
};

// Updated uploadVideoAPI function
const uploadVideoAPI = async (videoUri: string): Promise<string> => {
  if(videoUri.startsWith('http')){
    return videoUri;
  }
  return api.uploadFileAndGetUrl(videoUri, api.COMPRESSION_PRESETS.high_quality); // Assuming you have video compression preset
};

// Dummy Data - These would typically come from an API or a constants file
const dummyCategories: Category[] = [
  { id: 'gender1', name: 'Woman', slug: 'woman' },
  { id: 'gender2', name: 'Man', slug: 'man' },
  { id: 'gender3', name: 'Unisex', slug: 'unisex' },
];

const dummySizingGuides: Record<string, SizingGuide> = {
  'top_wear': {
    size_chart: {
      'dummy_row': { 'Chest': 0, 'Shoulder': 0, 'Length': 0, 'Sleeve Length': 0 },
    },
    size_fit: 'Regular fit for tops.',
    measurement_unit: 'inch', // Fixed to inch
    size_conversion: {}, // Added missing property
  },
  'bottom_wear': {
    size_chart: {
      'dummy_row': { 'Waist': 0, 'Hips': 0, 'Inseam': 0, 'Length': 0 },
    },
    size_fit: 'Comfort fit for bottoms.',
    measurement_unit: 'inch', // Fixed to inch
    size_conversion: {}, // Added missing property
  },
};





// =============================================================================
// FILE: CreateProduct.tsx
// This is the main screen component.
// =============================================================================

// Define the ProductAction enum directly within the file or import from a utils file
enum ProductAction {
  Create = 'create',
  Update = 'update',
}

interface CreateProductScreenRouteParams {
  product?: Product;
  mode?: ProductAction;
}

const CreateProductScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { product: initialProduct, mode = ProductAction.Create } = route.params as CreateProductScreenRouteParams || {};

  const {
    product,
    setProduct,
    loading,
    setLoading,
    pickedImageUris,
    setPickedImageUris,
    pickedVideoUri,
    setPickedVideoUri,
    handleChange,
  } = ProductFormHooks.useProductForm(initialProduct);

  const { handleImagePick, handleRemovePickedImage } = ProductFormHooks.useImageHandling(
    pickedImageUris,
    setPickedImageUris
  );

  const { handleVideoPick, handleRemovePickedVideo } = ProductFormHooks.useVideoHandling(
    pickedVideoUri,
    setPickedVideoUri
  );

  const {
    newOptionValueInputs,
    setNewOptionValueInputs,
    handleAddOption,
    handleUpdateOption,
    handleRemoveOption,
    handleAddOptionValue,
    handleRemoveOptionValue,
  } = ProductFormHooks.useOptionsHandling(product, handleChange);

  const { handleUpdateVariants, handleRemoveVariant } = ProductFormHooks.useVariantGeneration(
    product,
    handleChange,
    product.handle || '',
    product.pricing?.price || 0,
  );

  const {
    newAttributeName,
    setNewAttributeName,
    newAttributeValue,
    setNewAttributeValue,
    handleAddAttribute,
    handleRemoveAttribute,
  } = ProductFormHooks.useAttributesHandling(product, handleChange);

  const {
    selectedSizingGuideType,
    sizeOptionValues,
    handleSizingGuideChange,
    handleSizingGuideChartChange,
    handleSizingGuideTypeChange,
  } = ProductFormHooks.useSizingGuideHandling(product, handleChange);

  const {
    newTag,
    setNewTag,
    handleAddTag,
    handleRemoveTag,
    newCollection,
    setNewCollection,
    handleAddCollection,
    handleRemoveCollection,
  } = ProductFormHooks.useTagsAndCollections(product, handleChange);

  const {
    newCustomOptionName,
    setNewCustomOptionName,
    newCustomOptionValueInput,
    setNewCustomOptionValueInput,
    handleAddCustomizationOption,
    handleUpdateCustomizationOption,
    handleRemoveCustomizationOption,
    handleAddCustomOptionValue,
    handleRemoveCustomOptionValue,
  } = ProductFormHooks.useCustomizationHandling(product, handleChange);

  const user = useSelector(selectUser);

  // Updated handleSubmit function with sizing guide validation
  const handleSubmit = async () => {
    // Check basic required fields
    if (!product.title || !product.description || !product.product_type || !product.pricing?.price || product.categories?.length === 0) {
      Alert.alert("Missing Information", "Please fill in all required fields (Title, Description, Product Type, Price, Categories).");
      return;
    }

    // Check if there's a size option (which requires sizing guide)
    const hasSizeOption = product.options?.some(opt => opt.name.toLowerCase() === 'size');
    
    if (hasSizeOption) {
      // Sizing guide is required when there's a size option
      const sizingGuide = product.sizing_guide;
      
      if (!sizingGuide || 
          !sizingGuide.size_fit?.trim() || 
          !Object.keys(sizingGuide.size_chart || {}).length ||
          Object.values(sizingGuide.size_chart || {}).every(row => 
            Object.values(row as any).every(val => val === 0)
          )) {
        Alert.alert(
          "Sizing Guide Required", 
          "Since you have size options, please complete the sizing guide with proper measurements."
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Upload images first
      const uploadedImageUrls = await Promise.all(
        pickedImageUris.map((uri) => uploadImageAPI(uri))
      );

      // Upload video if exists
      let uploadedVideoUrl = '';
      if (pickedVideoUri && pickedVideoUri.length > 0) {
        uploadedVideoUrl = await uploadVideoAPI(pickedVideoUri);
      }

      // calculates compare at price
      if(product.pricing.discounted === true){
        if (product.pricing.compare_at_price === undefined || product.pricing.compare_at_price === 0){
          // percentage
          if (product.pricing.discount_type === 'percentage'){
            product.pricing.compare_at_price = product.pricing.price / (1 - ((product.pricing.discount_value || 0) / 100));
          }
          // fixed
          else if (product.pricing.discount_type === 'fixed_amount'){ // Corrected from 'fixed' to 'fixed_amount'
            product.pricing.compare_at_price = product.pricing.price + (product.pricing.discount_value || 0);
          }
        }
        else {
          // Update discounted_price only if discounted is true and compare_at_price is set
          if (product.pricing.compare_at_price) {
            product.pricing.discounted_price = product.pricing.price;
          }
        }
      }
      else {
        // Reset discount related fields if not discounted
        product.pricing.discount_type = undefined;
        product.pricing.discount_value = undefined;
        product.pricing.compare_at_price = undefined;
        product.pricing.discounted_price = undefined;
      }

      const finalProduct: Product = {
        ...(product as Product),
        images: uploadedImageUrls,
        video_url: uploadedVideoUrl,

        updated_at: new Date().toISOString(),
        seller_id: user.data?.id! || product.seller_id!, // Ensure seller_id is set
      };

      let success = false;
      if (mode === ProductAction.Create) {
        success = await createProductAPI(user?.token || "", finalProduct);
      } else {
        success = await updateProductAPI(user?.token || "", finalProduct);
      }

      if (success) {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Error", `An error occurred: ${error}`);
      console.error("Product submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={appStyles.container}>
      <View style={appStyles.header}>
        <Text style={appStyles.headerTitle}>
          {mode === ProductAction.Create ? 'Create New Product' : 'Update Product'}
        </Text>
      </View>

      <View style={appStyles.formContainer}>
        <ProductBasicInfo product={product} handleChange={handleChange} />
        <ProductCategories product={product} handleChange={handleChange} dummyCategories={dummyCategories} />
         <ProductVideoUploader
          pickedVideoUri={pickedVideoUri}
          handleVideoPick={handleVideoPick}
          handleRemovePickedVideo={handleRemovePickedVideo}
        />
        <ProductImageUploader
          pickedImageUris={pickedImageUris}
          handleImagePick={handleImagePick}
          handleRemovePickedImage={handleRemovePickedImage}
        />
        <ProductPricing product={product} handleChange={handleChange} />
        <ProductOptions
          product={product}
          newOptionValueInputs={newOptionValueInputs}
          setNewOptionValueInputs={setNewOptionValueInputs}
          handleAddOption={handleAddOption}
          handleUpdateOption={handleUpdateOption}
          handleRemoveOption={handleRemoveOption}
          handleAddOptionValue={handleAddOptionValue}
          handleRemoveOptionValue={handleRemoveOptionValue}
        />
        <ProductVariants
          product={product}
          handleUpdateVariants={handleUpdateVariants}
          handleRemoveVariant={handleRemoveVariant}
        />
        <ProductSizingGuide
          product={product}
          selectedSizingGuideType={selectedSizingGuideType}
          sizeOptionValues={sizeOptionValues}
          handleSizingGuideChange={handleSizingGuideChange}
          handleSizingGuideChartChange={handleSizingGuideChartChange}
          handleSizingGuideTypeChange={handleSizingGuideTypeChange}
          dummySizingGuides={dummySizingGuides}
        />
        <ProductTagsCollections
          product={product}
          newTag={newTag}
          setNewTag={setNewTag}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          newCollection={newCollection}
          setNewCollection={setNewCollection}
          handleAddCollection={handleAddCollection}
          handleRemoveCollection={handleRemoveCollection}
        />
        {/* <ProductAttributes
          product={product}
          newAttributeName={newAttributeName}
          setNewAttributeName={setNewAttributeName}
          newAttributeValue={newAttributeValue}
          setNewAttributeValue={setNewAttributeValue}
          handleAddAttribute={handleAddAttribute}
          handleRemoveAttribute={handleRemoveAttribute}
        /> */}
        <ProductShippingInfo product={product} handleChange={handleChange} />

        <TouchableOpacity
          style={[appStyles.button, loading && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={appStyles.buttonText}>{loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            `${mode === ProductAction.Create ? 'Create Product' : 'Update Product'}`
          )}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export default CreateProductScreen;
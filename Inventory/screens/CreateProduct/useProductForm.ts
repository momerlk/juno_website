// All imports will be at the top of the main file or in each respective component file if split.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
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
// FILE: src/hooks/useProductForm.ts
// =============================================================================
export namespace ProductFormHooks {

  // Helper function for deep merging objects
  function deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const output = { ...target } as T;

    if (target && typeof target === 'object' && source && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          const targetValue = (target as any)[key];
          const sourceValue = (source as any)[key];

          if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) && targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
            // Recursively merge if both are objects
            (output as any)[key] = deepMerge(targetValue, sourceValue);
          } else if (sourceValue !== undefined) {
            // Otherwise, just assign the source value
            (output as any)[key] = sourceValue;
          }
        }
      });
    }
    return output;
  }

  export const useProductForm = (initialProduct?: Product) => {
    const defaultProductState: Product = {
      id: '', // Will be generated on creation
      handle: '',
      title: '',
      description: '',
      seller_id: 'seller123',
      seller_name: 'Fashion Hub',
      categories: [],
      product_type: '',
      pricing: { price: 0, currency: 'PKR', discounted: false },
      images: [],
      variants: [],
      options: [],
      tags: [],
      inventory: {
        quantity: 0,
        allow_out_of_stock: false,
        restock_date: '',
        low_stock_threshold: 0,
        track_inventory: true,
        in_stock: true,
        inventory_policy: 'deny',
        inventory_management: 'manual',
        sku: '',
        barcode: '',
        location_id: '',
        reserved_quantity: 0,
        committed_quantity: 0,
        available_quantity: 0,
      },
      shipping_details: {
        weight: 0,
        weight_unit: 'grams',
        shipping_class: 'standard',
        free_shipping: false,
        handling_time: 0,
        dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
        shipping_zones: [],
        requires_shipping: true,
        shipping_methods: [],
        shipping_rates: {},
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      collections: [],
      attributes: [],
      sizing_guide: {
        size_chart: {},
        size_conversion: {},
        size_fit: '',
        measurement_unit: 'inch',
      },
      season: '',
      occasion: [],
      style_tags: [],
      care_instructions: '',
      rating: 0,
      review_count: 0,
      is_customizable: false,
      customization_options: [],
      is_ready_to_wear: true,
      wash_care: '',
      return_eligibility: true,
      video_url: '',
      view_count: 0,
      purchase_count: 0,
      is_trending: false,
      is_featured: false,
    };

    const [product, setProduct] = useState<Partial<Product>>(
      initialProduct ? deepMerge(defaultProductState, initialProduct) : defaultProductState
    );

    const [loading, setLoading] = useState<boolean>(false);
    const [pickedImageUris, setPickedImageUris] = useState<string[]>(product.images || []);
    const [pickedVideoUri, setPickedVideoUri] = useState<string>(product.video_url || "");


    const handleChange = useCallback((field: keyof Product, value: any) => {
      setProduct((prev) => ({ ...prev, [field]: value }));
    }, []);

    // Automatic handle generation
    useEffect(() => {
      if (product.title) {
        const handle = product.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .trim();
        setProduct((prev) => ({ ...prev, handle }));
      } else {
        setProduct((prev) => ({ ...prev, handle: '' }));
      }
    }, [product.title]);

    // Calculate overall inventory from variants
    const totalInventory = useMemo(() => {
      return (product.variants || []).reduce((sum, variant) => sum + (variant.inventory?.quantity || 0), 0);
    }, [product.variants]);

    useEffect(() => {
      setProduct(prev => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          quantity: totalInventory,
          available_quantity: totalInventory,
          in_stock: totalInventory > 0,
        } as Inventory, // Asserting type to Inventory
      }));
    }, [totalInventory]);

    // Update shipping weight based on the default variant's weight
    useEffect(() => {
      const defaultVariant = product.variants?.find(v => v.is_default);
      if (defaultVariant && defaultVariant.weight !== undefined) {
        handleChange('shipping_details', {
          ...product.shipping_details,
          weight: defaultVariant.weight,
        });
      }
    }, [product.variants, handleChange]);


    return {
      product,
      setProduct,
      loading,
      setLoading,
      pickedImageUris,
      setPickedImageUris,
      pickedVideoUri,
      setPickedVideoUri,
      handleChange,
    };
  };

  export const useImageHandling = (
    pickedImageUris: string[],
    setPickedImageUris: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    useEffect(() => {
      (async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        }
      })();
    }, []);

    const handleImagePick = async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri);
        setPickedImageUris((prev) => [...prev, ...newImages]);
      }
    };

    const handleRemovePickedImage = useCallback((imageUri: string) => {
      setPickedImageUris((prev) => prev.filter((uri) => uri !== imageUri));
    }, []);

    return { handleImagePick, handleRemovePickedImage };
  };

  // Hook for video handling
  export const useVideoHandling = (
    pickedVideoUri: string,
    setPickedVideoUri: React.Dispatch<React.SetStateAction<string>>
    ) => {
    useEffect(() => {
        (async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        }
        })();
    }, []);

    const handleVideoPick = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
        quality: 1,
        videoMaxDuration: 60, // 60 seconds max
        });

        if (!result.canceled && result.assets.length > 0) {
        setPickedVideoUri(result.assets[0].uri);
        }
    };

    const handleRemovePickedVideo = useCallback(() => {
        setPickedVideoUri('');
    }, [setPickedVideoUri]);

    return { handleVideoPick, handleRemovePickedVideo };
    };


  export const useOptionsHandling = (
    product: Partial<Product>,
    handleChange: (field: keyof Product, value: any) => void
  ) => {
    const [newOptionValueInputs, setNewOptionValueInputs] = useState<string[]>(
      product.options?.map(() => '') || []
    );

    const handleAddOption = useCallback(() => {
      const newOption: Option = { name: '', values: [], required: false };
      handleChange('options', [...(product.options || []), newOption]);
      setNewOptionValueInputs(prev => [...prev, '']);
    }, [product.options, handleChange]);

    const handleUpdateOption = useCallback((index: number, field: keyof Option, value: any) => {
      const updatedOptions = [...(product.options || [])];
      updatedOptions[index] = { ...updatedOptions[index], [field]: value };
      handleChange('options', updatedOptions);
    }, [product.options, handleChange]);

    const handleRemoveOption = useCallback((index: number) => {
      handleChange('options', (product.options || []).filter((_, i) => i !== index));
      setNewOptionValueInputs(prev => prev.filter((_, i) => i !== index));
    }, [product.options, handleChange]);

    const handleAddOptionValue = useCallback((optionIndex: number) => {
      const valueToAdd = newOptionValueInputs[optionIndex]?.trim();
      if (valueToAdd) {
        const updatedOptions = [...(product.options || [])];
        const currentOption = { ...updatedOptions[optionIndex] };
        if (!currentOption.values.includes(valueToAdd)) {
          currentOption.values = [...currentOption.values, valueToAdd];
          updatedOptions[optionIndex] = currentOption;
          handleChange('options', updatedOptions);
        }
        setNewOptionValueInputs(prev => {
          const newState = [...prev];
          newState[optionIndex] = '';
          return newState;
        });
      }
    }, [newOptionValueInputs, product.options, handleChange]);

    const handleRemoveOptionValue = useCallback((optionIndex: number, valueToRemove: string) => {
      const updatedOptions = [...(product.options || [])];
      updatedOptions[optionIndex].values = updatedOptions[optionIndex].values.filter(v => v !== valueToRemove);
      handleChange('options', updatedOptions);
    }, [product.options, handleChange]);

    return {
      newOptionValueInputs,
      setNewOptionValueInputs,
      handleAddOption,
      handleUpdateOption,
      handleRemoveOption,
      handleAddOptionValue,
      handleRemoveOptionValue,
    };
  };

  export const useVariantGeneration = (
    product: Partial<Product>,
    handleChange: (field: keyof Product, value: any) => void,
    productHandle: string,
    productPrice: number,
  ) => {
    const handleUpdateVariants = useCallback((updatedVariants: Variant[]) => {
      handleChange('variants', updatedVariants);
    }, [handleChange]);

    const handleRemoveVariant = useCallback((index: number) => {
      handleChange('variants', (product.variants || []).filter((_, i) => i !== index));
    }, [product.variants, handleChange]);

    const generateVariantCombinations = useCallback(() => {
      if (!product.options || product.options.length === 0) {
        return [];
      }

      const combinations: Record<string, string>[] = [];
      const generate = (index: number, currentCombination: Record<string, string>) => {
        if (index === product.options!.length) {
          combinations.push({ ...currentCombination });
          return;
        }

        const option = product.options![index];
        if (option.values.length === 0) {
          generate(index + 1, currentCombination);
          return;
        }

        option.values.forEach(value => {
          currentCombination[option.name] = value;
          generate(index + 1, currentCombination);
        });
      };

      generate(0, {});
      return combinations;
    }, [product.options]);

    useEffect(() => {
      const newCombinations = generateVariantCombinations();
      const existingVariants = product.variants || [];

      const generatedVariants: Variant[] = newCombinations
        .map((combo, index) => {
          const title = Object.values(combo).join(' / ');
          const optionKey = Object.keys(combo).sort().map(key => `${key}:${combo[key]}`).join('|');

          // Try to find an existing variant with the same options to preserve its data
          const existingVariant = existingVariants.find(v => {
            const existingOptionKey = Object.keys(v.options).sort().map(key => `${key}:${v.options[key]}`).join('|');
            return existingOptionKey === optionKey;
          });

          const skuSuffix = Object.values(combo)
            .map(val => val.toLowerCase().replace(/[^a-z0-9]/g, ''))
            .join('-');
          const autoGeneratedSku = `${productHandle || 'product'}-${skuSuffix}`.substring(0, 50);

          return {
            id: existingVariant?.id || `var_${Date.now()}_${index}`,
            sku: existingVariant?.sku || autoGeneratedSku, // Preserve existing SKU or generate new
            title: title,
            options: combo,
            price: existingVariant?.price || productPrice, // Preserve existing price or use product price
            compare_at_price: existingVariant?.compare_at_price,
            weight: existingVariant?.weight || 0,
            dimensions: existingVariant?.dimensions,
            images: existingVariant?.images,
            inventory: existingVariant?.inventory || { // Preserve existing inventory or initialize
              quantity: 0,
              allow_out_of_stock: false,
              restock_date: '',
              low_stock_threshold: 0,
              track_inventory: true,
              in_stock: true,
              inventory_policy: 'deny',
              inventory_management: 'manual',
              sku: existingVariant?.sku || autoGeneratedSku, // Variant SKU
              barcode: '',
              location_id: '',
              reserved_quantity: 0,
              committed_quantity: 0,
              available_quantity: 0,
            },
            position: existingVariant?.position || index + 1,
            is_default: existingVariant?.is_default || (index === 0),
            available: existingVariant?.available || true,
          };
        });

      // Ensure at least one variant is marked as default if none exist or if options change
      let hasDefault = generatedVariants.some(v => v.is_default);
      if (!hasDefault && generatedVariants.length > 0) {
        generatedVariants[0].is_default = true;
      }

      handleUpdateVariants(generatedVariants);

    }, [product.options, generateVariantCombinations, handleUpdateVariants, productHandle, productPrice]);


    return { handleUpdateVariants, handleRemoveVariant };
  };

  export const useAttributesHandling = (
    product: Partial<Product>,
    handleChange: (field: keyof Product, value: any) => void
  ) => {
    const [newAttributeName, setNewAttributeName] = useState<string>('');
    const [newAttributeValue, setNewAttributeValue] = useState<string>('');

    const handleAddAttribute = useCallback(() => {
      if (newAttributeName.trim() && newAttributeValue.trim()) {
        handleChange('attributes', [
          ...(product.attributes || []),
          {
            name: newAttributeName.trim(),
            value: newAttributeValue.trim(),
            visible: true,
            variant: false,
          },
        ]);
        setNewAttributeName('');
        setNewAttributeValue('');
      }
    }, [newAttributeName, newAttributeValue, product.attributes, handleChange]);

    const handleRemoveAttribute = useCallback((index: number) => {
      handleChange('attributes', (product.attributes || []).filter((_, i) => i !== index));
    }, [product.attributes, handleChange]);

    return { newAttributeName, setNewAttributeName, newAttributeValue, setNewAttributeValue, handleAddAttribute, handleRemoveAttribute };
  };

  // Updated useSizingGuideHandling hook with fixes
    export const useSizingGuideHandling = (
    product: Partial<Product>,
    handleChange: (field: keyof Product, value: any) => void
    ) => {
    const [selectedSizingGuideType, setSelectedSizingGuideType] = useState<string>('');

    const sizeOptionValues = useMemo(() => {
        const sizeOpt = product.options?.find(opt => opt.name.toLowerCase() === 'size');
        return sizeOpt ? sizeOpt.values : [];
    }, [product.options]);

    // Auto-detect sizing guide type based on measurement keys
    const detectSizingGuideType = useCallback((sizeChart: { [key: string]: { [key: string]: number } }) => {
        if (!sizeChart || Object.keys(sizeChart).length === 0) {
        return '';
        }

        // Get all measurement keys from the size chart
        const allMeasurementKeys = new Set<string>();
        Object.values(sizeChart).forEach(measurements => {
        Object.keys(measurements).forEach(key => allMeasurementKeys.add(key.toLowerCase()));
        });

        // Define measurement patterns for each type
        const topWearMeasurements = ['chest', 'shoulder', 'sleeve length', 'sleeve', 'length'];
        const bottomWearMeasurements = ['waist', 'hips', 'inseam', 'length'];

        // Check for top wear indicators
        const hasTopWearMeasurements = topWearMeasurements.some(measurement =>
        allMeasurementKeys.has(measurement)
        );

        // Check for bottom wear indicators
        const hasBottomWearMeasurements = bottomWearMeasurements.some(measurement =>
        allMeasurementKeys.has(measurement)
        );

        // Return the detected type
        if (hasTopWearMeasurements && !hasBottomWearMeasurements) {
        return 'top_wear';
        } else if (hasBottomWearMeasurements && !hasTopWearMeasurements) {
        return 'bottom_wear';
        } else if (hasTopWearMeasurements && hasBottomWearMeasurements) {
        // If both are present, prioritize based on count
        const topCount = topWearMeasurements.filter(m => allMeasurementKeys.has(m)).length;
        const bottomCount = bottomWearMeasurements.filter(m => allMeasurementKeys.has(m)).length;
        return topCount >= bottomCount ? 'top_wear' : 'bottom_wear';
        }

        return '';
    }, []);

    // Initialize sizing guide when product loads or when editing existing product
    useEffect(() => {
        if (product.sizing_guide && Object.keys(product.sizing_guide.size_chart || {}).length > 0) {
        // Auto-detect the type from existing sizing guide
        const detectedType = detectSizingGuideType(product.sizing_guide.size_chart || {});
        if (detectedType && detectedType !== selectedSizingGuideType) {
            setSelectedSizingGuideType(detectedType);
        }
        } else if (!product.sizing_guide) {
        // Initialize empty sizing guide if none exists
        handleChange('sizing_guide', {
            size_chart: {},
            size_conversion: {},
            size_fit: '',
            measurement_unit: 'inch'
        });
        }
    }, [product.sizing_guide, detectSizingGuideType, selectedSizingGuideType, handleChange]);

    // Update size chart when size option values change
    useEffect(() => {
        if (sizeOptionValues.length > 0 && selectedSizingGuideType) {
        const currentSizingGuide = product.sizing_guide || {
            size_chart: {},
            size_conversion: {},
            size_fit: '',
            measurement_unit: 'inch'
        };

        const currentSizeChart = currentSizingGuide.size_chart || {};
        const dummyGuide = dummySizingGuides[selectedSizingGuideType];
        
        if (dummyGuide) {
            const defaultColKeys = Object.keys(dummyGuide.size_chart['dummy_row'] || {});
            const newSizeChart: { [key: string]: { [key: string]: number } } = {};

            sizeOptionValues.forEach(sizeValue => {
            const existingRow = currentSizeChart[sizeValue];
            if (existingRow && Object.keys(existingRow).length > 0) {
                // Preserve existing data but ensure all required columns exist
                newSizeChart[sizeValue] = { ...existingRow };
                defaultColKeys.forEach(colKey => {
                if (!(colKey in newSizeChart[sizeValue])) {
                    newSizeChart[sizeValue][colKey] = 0;
                }
                });
            } else {
                // Create new row with default columns
                const newRow: { [key: string]: number } = {};
                defaultColKeys.forEach(colKey => {
                newRow[colKey] = 0;
                });
                newSizeChart[sizeValue] = newRow;
            }
            });

            // Only update if the chart actually changed
            const chartChanged = JSON.stringify(currentSizeChart) !== JSON.stringify(newSizeChart);
            if (chartChanged) {
            handleChange('sizing_guide', {
                ...currentSizingGuide,
                size_chart: newSizeChart,
            });
            }
        }
        }
    }, [sizeOptionValues, selectedSizingGuideType, product.sizing_guide, handleChange]);

    const handleSizingGuideChange = useCallback((field: keyof SizingGuide, value: any) => {
        const currentGuide = product.sizing_guide || {
        size_chart: {},
        size_conversion: {},
        size_fit: '',
        measurement_unit: 'inch'
        };
        
        handleChange('sizing_guide', { ...currentGuide, [field]: value });
    }, [product.sizing_guide, handleChange]);

    const handleSizingGuideChartChange = useCallback((rowKey: string, colKey: string, value: string) => {
        const currentGuide = product.sizing_guide || {
        size_chart: {},
        size_conversion: {},
        size_fit: '',
        measurement_unit: 'inch'
        };

        const updatedSizingGuide = {
        ...currentGuide,
        size_chart: {
            ...currentGuide.size_chart,
            [rowKey]: {
            ...(currentGuide.size_chart?.[rowKey] || {}),
            [colKey]: parseFloat(value) || 0,
            },
        },
        };

        // Auto-detect type when chart changes (if not already set)
        if (!selectedSizingGuideType) {
        const detectedType = detectSizingGuideType(updatedSizingGuide.size_chart);
        if (detectedType) {
            setSelectedSizingGuideType(detectedType);
        }
        }

        handleChange('sizing_guide', updatedSizingGuide);
    }, [product.sizing_guide, handleChange, detectSizingGuideType, selectedSizingGuideType]);

    const handleSizingGuideTypeChange = useCallback((type: string) => {
        setSelectedSizingGuideType(type);
        
        if (!type) {
        // Clear sizing guide when no type is selected
        handleChange('sizing_guide', {
            size_chart: {},
            size_conversion: {},
            size_fit: '',
            measurement_unit: 'inch'
        });
        }
        // Note: The actual preset application is handled in the component
        // to avoid timing issues with state updates
    }, [handleChange]);

    return {
        selectedSizingGuideType,
        sizeOptionValues,
        handleSizingGuideChange,
        handleSizingGuideChartChange,
        handleSizingGuideTypeChange,
    };
    };

  export const useTagsAndCollections = (
    product: Partial<Product>,
    handleChange: (field: keyof Product, value: any) => void
  ) => {
    const [newTag, setNewTag] = useState<string>('');
    const [newCollection, setNewCollection] = useState<string>('');

    const handleAddTag = useCallback(() => {
      if (newTag.trim() && !product.tags?.includes(newTag.trim())) {
        handleChange('tags', [...(product.tags || []), newTag.trim()]);
        setNewTag('');
      }
    }, [newTag, product.tags, handleChange]);

    const handleRemoveTag = useCallback((tagToRemove: string) => {
      handleChange('tags', (product.tags || []).filter((tag) => tag !== tagToRemove));
    }, [product.tags, handleChange]);

    const handleAddCollection = useCallback(() => {
      if (newCollection.trim() && !product.collections?.includes(newCollection.trim())) {
        handleChange('collections', [...(product.collections || []), newCollection.trim()]);
        setNewCollection('');
      }
    }, [newCollection, product.collections, handleChange]);

    const handleRemoveCollection = useCallback((collectionToRemove: string) => {
      handleChange('collections', (product.collections || []).filter((col) => col !== collectionToRemove));
    }, [product.collections, handleChange]);

    return {
      newTag,
      setNewTag,
      handleAddTag,
      handleRemoveTag,
      newCollection,
      setNewCollection,
      handleAddCollection,
      handleRemoveCollection,
    };
  };

  export const useCustomizationHandling = (
    product: Partial<Product>,
    handleChange: (field: keyof Product, value: any) => void
  ) => {
    const [newCustomOptionName, setNewCustomOptionName] = useState<string>('');
    const [newCustomOptionValueInput, setNewCustomOptionValueInput] = useState<string>('');

    const handleAddCustomizationOption = useCallback(() => {
      if (newCustomOptionName.trim()) {
        handleChange('customization_options', [
          ...(product.customization_options || []),
          { name: newCustomOptionName.trim(), options: [], required: false },
        ]);
        setNewCustomOptionName('');
      }
    }, [newCustomOptionName, product.customization_options, handleChange]);

    const handleUpdateCustomizationOption = useCallback((index: number, field: keyof CustomizationOption, value: any) => {
      const updatedOptions = [...(product.customization_options || [])];
      updatedOptions[index] = { ...updatedOptions[index], [field]: value };
      handleChange('customization_options', updatedOptions);
    }, [product.customization_options, handleChange]);

    const handleRemoveCustomizationOption = useCallback((index: number) => {
      handleChange('customization_options', (product.customization_options || []).filter((_, i) => i !== index));
    }, [product.customization_options, handleChange]);

    const handleAddCustomOptionValue = useCallback((optionIndex: number) => {
      const valueToAdd = newCustomOptionValueInput.trim();
      if (valueToAdd) {
        const updatedOptions = [...(product.customization_options || [])];
        const currentOption = { ...updatedOptions[optionIndex] };
        if (!currentOption.options.includes(valueToAdd)) {
          currentOption.options = [...currentOption.options, valueToAdd];
          updatedOptions[optionIndex] = currentOption;
          handleChange('customization_options', updatedOptions);
        }
        setNewCustomOptionValueInput('');
      }
    }, [newCustomOptionValueInput, product.customization_options, handleChange]);

    const handleRemoveCustomOptionValue = useCallback((optionIndex: number, valueToRemove: string) => {
      const updatedOptions = [...(product.customization_options || [])];
      updatedOptions[optionIndex].options = updatedOptions[optionIndex].options.filter(v => v !== valueToRemove);
      handleChange('customization_options', updatedOptions);
    }, [product.customization_options, handleChange]);

    return {
      newCustomOptionName,
      setNewCustomOptionName,
      newCustomOptionValueInput,
      setNewCustomOptionValueInput,
      handleAddCustomizationOption,
      handleUpdateCustomizationOption,
      handleRemoveCustomizationOption,
      handleAddCustomOptionValue,
      handleRemoveCustomOptionValue,
    };
  };
}
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Product interfaces based on your data structure
export interface Product {
  _id?: any;
  id: string;
  handle: string;
  title: string;
  description: string;
  short_description?: string;
  seller_id: string;
  seller_name: string;
  seller_logo?: string;
  categories: Category[];
  product_type: string;
  pricing: Pricing;
  images: string[];
  variants: Variant[];
  options: Option[];
  tags: string[];
  inventory: any;
  shipping_details: any;
  status: string;
  created_at: any;
  updated_at: any;
  published_at?: any;
  collections: string[];
  attributes?: Attribute[];
  sizing_guide?: any;
  season?: string;
  occasion?: string[];
  style_tags?: string[];
  care_instructions?: string;
  rating: number;
  review_count: number;
  reviews?: string[];
  is_customizable: boolean;
  customization_options?: CustomizationOption[];
  is_ready_to_wear: boolean;
  wash_care?: string;
  return_eligibility: boolean;
  video_url?: string;
  view_count: number;
  purchase_count: number;
  is_trending: boolean;
  is_featured: boolean;
}

export interface Variant {
  id: string;
  sku: string;
  title: string;
  options: Record<string, string>;
  price: number;
  compare_at_price?: number;
  weight?: number;
  dimensions?: Dimensions;
  images?: string[];
  inventory: any;
  position: number;
  is_default: boolean;
  available: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
}

export interface Option {
  name: string;
  values: string[];
  required: boolean;
}

export interface Pricing {
  price: number;
  compare_at_price?: number;
  currency: string;
  discounted: boolean;
  discount_type?: string;
  discount_value?: number;
  discounted_price?: number;
}

export interface Attribute {
  name: string;
  value: string;
  visible: boolean;
  variant: boolean;
}

export interface CustomizationOption {
  name: string;
  options: string[];
  additional_price?: number;
  required: boolean;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

interface InventoryProductItemProps {
  product: Product;
  onUpdateInventory: (productId: string, variantId: string, newQuantity: number) => void;
  onUpdatePrice: (productId: string, variantId: string, newPrice: number) => void;
  onToggleAvailability: (productId: string, variantId: string) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

import { useNavigation } from '@react-navigation/native';

const InventoryProductItem: React.FC<InventoryProductItemProps> = ({
  product,
  onUpdateInventory,
  onUpdatePrice,
  onToggleAvailability,
  onEditProduct,
  onDeleteProduct,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  const [tempPrice, setTempPrice] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigation = useNavigation<any>();

  const getTotalInventory = () => {
    return product.variants.reduce((total, variant) => {
      return total + (variant.inventory?.quantity || 0);
    }, 0);
  };

  const getStockStatus = () => {
    const totalStock = getTotalInventory();
    if (totalStock === 0) return { status: 'Out of Stock', color: '#ff4444' };
    if (totalStock < 10) return { status: 'Low Stock', color: '#ff9500' };
    return { status: 'In Stock', color: '#00cc44' };
  };

  const handleInventoryUpdate = (variantId: string, newQuantity: number) => {
    if (newQuantity >= 0) {
      onUpdateInventory(product.id, variantId, newQuantity);
    }
  };

  const handlePriceUpdate = (variantId: string, newPrice: number) => {
    if (newPrice >= 0) {
      onUpdatePrice(product.id, variantId, newPrice);
    }
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteProduct(product.id)
        },
      ]
    );
  };

  const startEditingVariant = (variant: Variant) => {
    setEditingVariant(variant.id);
    setTempQuantity(variant.inventory?.quantity?.toString() || '0');
    setTempPrice(variant.price.toString());
  };

  const saveVariantChanges = (variantId: string) => {
    const quantity = parseInt(tempQuantity) || 0;
    const price = parseFloat(tempPrice) || 0;
    
    handleInventoryUpdate(variantId, quantity);
    handlePriceUpdate(variantId, price);
    setEditingVariant(null);
  };

  const stockStatus = getStockStatus();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: product.images[0] || 'https://via.placeholder.com/80' }} 
          style={styles.productImage} 
        />
        
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={styles.productSeller}>{product.seller_name}</Text>
          <Text style={styles.productSKU}>SKU: {product.handle}</Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: stockStatus.color }]}>
              <Text style={styles.statusText}>{stockStatus.status}</Text>
            </View>
            <Text style={styles.totalStock}>{getTotalInventory()} units</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setExpanded(!expanded)}
          >
            <Icon 
              name={expanded ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEditProduct(product)}
          >
            <Icon name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ProductAnalytics', { productId: product.id })}
          >
            <Icon name="chart-line" size={20} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDeleteProduct}
          >
            <Icon name="delete" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.sectionTitle}>Variants</Text>
          
          {product.variants.map((variant) => (
            <View key={variant.id} style={styles.variantItem}>
              <View style={styles.variantHeader}>
                <Text style={styles.variantTitle}>{variant.title}</Text>
                <View style={styles.variantOptions}>
                  {Object.entries(variant.options).map(([key, value]) => (
                    <Text key={key} style={styles.optionText}>
                      {key}: {value}
                    </Text>
                  ))}
                </View>
              </View>

              {editingVariant === variant.id ? (
                <View style={styles.editRow}>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Quantity</Text>
                    <TextInput
                      style={styles.editInput}
                      value={tempQuantity}
                      onChangeText={setTempQuantity}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Price</Text>
                    <TextInput
                      style={styles.editInput}
                      value={tempPrice}
                      onChangeText={setTempPrice}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  </View>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => saveVariantChanges(variant.id)}
                  >
                    <Icon name="check" size={20} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditingVariant(null)}
                  >
                    <Icon name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.variantDetails}>
                  <View style={styles.variantInfo}>
                    <Text style={styles.variantPrice}>
                      {product.pricing.currency} {variant.price.toLocaleString()}
                    </Text>
                    <Text style={styles.variantStock}>
                      Stock: {variant.inventory?.quantity || 0}
                    </Text>
                  </View>
                  
                  <View style={styles.variantActions}>
                    <TouchableOpacity
                      style={[
                        styles.availabilityButton,
                        { backgroundColor: variant.available ? '#00cc44' : '#ff4444' }
                      ]}
                      onPress={() => onToggleAvailability(product.id, variant.id)}
                    >
                      <Text style={styles.availabilityText}>
                        {variant.available ? 'Available' : 'Unavailable'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.editVariantButton}
                      onPress={() => startEditingVariant(variant)}
                    >
                      <Icon name="pencil" size={16} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
          
          <View style={styles.productStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Views</Text>
              <Text style={styles.statValue}>{product.view_count}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Sales</Text>
              <Text style={styles.statValue}>{product.purchase_count}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Rating</Text>
              <Text style={styles.statValue}>{product.rating}/5</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={[styles.statValue, { color: product.status === 'active' ? '#00cc44' : '#ff4444' }]}>
                {product.status}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  productSeller: {
    color: '#AEAEB2',
    fontSize: 14,
    marginBottom: 4,
  },
  productSKU: {
    color: '#636366',
    fontSize: 12,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalStock: {
    color: '#AEAEB2',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  actionButton: {
    padding: 8,
  },
  expandedContent: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  variantItem: {
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  variantHeader: {
    marginBottom: 10,
  },
  variantTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  variantOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionText: {
    color: '#E5E5EA',
    fontSize: 12,
    backgroundColor: '#48484A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  variantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  variantInfo: {
    flex: 1,
  },
  variantPrice: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  variantStock: {
    color: '#AEAEB2',
    fontSize: 12,
    marginTop: 4,
  },
  variantActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  availabilityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editVariantButton: {
    padding: 8,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  editField: {
    flex: 1,
  },
  editLabel: {
    color: '#AEAEB2',
    fontSize: 12,
    marginBottom: 5,
  },
  editInput: {
    backgroundColor: '#3A3A3C',
    color: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 8,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#AEAEB2',
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InventoryProductItem;
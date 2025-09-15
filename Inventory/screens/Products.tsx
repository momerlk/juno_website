import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Product } from '../../../../constants/types';
import * as api from "../../../../services/api";
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../redux/userSlice';
import ProductItem from '../components/ProductItem';
import { StatusBar } from 'expo-status-bar';
import Loading from '../../../../components/Loading';
import Search, { SearchOverlay} from "../../../../components/search";
import { useNavigation } from '@react-navigation/native';

// Advanced fuzzy search function with scoring
const fuzzySearch = (items : any, query : any) => {
  if (!query || query.trim() === '') return items;
  
  const searchTerm = query.toLowerCase().trim();
  const searchWords = searchTerm.split(' ').filter((word : any) => word.length > 0);
  
  const searchResults = items.map((item : any) => {
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    
    let score = 0;
    
    // Calculate score for each search word
    searchWords.forEach((word : any) => {
      // Exact match in title (highest priority)
      if (title.includes(word)) {
        score += 10;
        // Bonus for exact match at start of title
        if (title.startsWith(word)) score += 5;
      }
      
      // Exact match in description
      if (description.includes(word)) {
        score += 5;
      }
      
      // Fuzzy match in title
      if (fuzzyMatch(title, word)) {
        score += 3;
      }
      
      // Fuzzy match in description
      if (fuzzyMatch(description, word)) {
        score += 2;
      }
    });
    
    return { ...item, searchScore: score };
  });
  
  // Filter items with score > 0 and sort by score (descending)
  return searchResults
    .filter((item : any) => item.searchScore > 0)
    .sort((a : any, b : any) => b.searchScore - a.searchScore);
};

// Helper function for fuzzy matching
const fuzzyMatch = (text : string, search : any) => {
  let searchIndex = 0;
  for (let i = 0; i < text.length && searchIndex < search.length; i++) {
    if (text[i] === search[searchIndex]) {
      searchIndex++;
    }
  }
  return searchIndex === search.length;
};

// Memoized ProductItem to prevent unnecessary re-renders
const MemoizedProductItem = React.memo(({ item, onUpdateInventory, onUpdatePrice, onToggleAvailability, onEditProduct, onDeleteProduct } : any) => (
  <ProductItem
    product={item}
    onUpdateInventory={onUpdateInventory}
    onUpdatePrice={onUpdatePrice}
    onToggleAvailability={onToggleAvailability}
    onEditProduct={onEditProduct}
    onDeleteProduct={onDeleteProduct}
  />
));

// Empty component for better performance
const EmptyComponent = React.memo(() => (
  <View style={styles.emptyContainer}>
    <Text style={styles.noItemsText}>
      No items currently. Add Items to Cart and then refresh.
    </Text>
  </View>
));

// Loading footer component
const LoadingFooter = React.memo(() => (
  <View style={styles.loadingFooter}>
    <Text style={styles.loadingText}>Loading more products...</Text>
  </View>
));

export default function Inventory() {
  const [items, setItems] = React.useState<Product[]>([]);
  const [refreshing, setRefreshing] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMorePages, setHasMorePages] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const user = useSelector(selectUser);
  const navigation = useNavigation<any>();

  // Memoized filtered items based on search query
  const filteredItems = useMemo(() => {
    return fuzzySearch(items, query);
  }, [items, query]);

  const handleGetProducts = useCallback(async (page = 1, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // TODO: Use dynamic token instead of hardcoded
      const response = await api.Seller.GetProducts(
        user.token, 
        page
      );
      
      if (!response.ok) {
        console.log("failed to get seller products");
      } else {
        if (response.body === null) {
          // No more pages available
          setHasMorePages(false);
        } else {
          if (isRefresh || page === 1) {
            // First page or refresh - replace all items
            setItems(response.body);
            setCurrentPage(1);
            setHasMorePages(true);
          } else {
            // Append new items to existing ones
            setItems(prevItems => {
              // Filter out duplicates based on id
              const existingIds = new Set(prevItems.map(item => item.id));
              const newItems = response.body.filter((item: Product) => !existingIds.has(item.id));
              return [...prevItems, ...newItems];
            });
            setCurrentPage(page);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    handleGetProducts(1, true);
  }, [handleGetProducts]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMorePages) {
      handleGetProducts(currentPage + 1, false);
    }
  }, [loadingMore, hasMorePages, currentPage, handleGetProducts]);

  useEffect(() => {
    handleGetProducts(1, true);
  }, []);

  // Handle search with pagination reset
  const handleSearch = useCallback((searchQuery : any) => {
    setQuery(searchQuery);
    setIsModalVisible(false);
    // Reset pagination when searching
    if (searchQuery.trim() === '') {
      // If clearing search, reload first page
      handleGetProducts(1, true);
    }
  }, [handleGetProducts]);

  // Memoized callback functions to prevent re-renders
  const handleUpdateInventory = useCallback(async (productId : any, variantId : any, newQuantity : any) => {
    const resp = await api.Seller.UpdateInventory(user.token, [{
      product_id : productId,
      variant_id : variantId,
      quantity_change : newQuantity,
      reason : "updating inventory upon request of seller"
    }])
    if (resp.ok){
      console.log("Updated inventory")
    } else {
      alert("Failed to update inventory")
      console.log(`response status = ${resp.status} , body = ${resp.body}`)
    }
    // TODO: Implement actual inventory update logic
  }, []);

  const handleUpdatePrice = useCallback((productId : any, variantId : any, newPrice : any) => {
    // TODO: Implement price update logic
  }, []);

  const handleToggleAvailability = useCallback((productId : any, variantId : any) => {
    // TODO: Implement availability toggle logic
  }, []);

  const handleEditProduct = useCallback((product : any) => {
    navigation.navigate("CreateProductScreen", { product });
  }, [navigation]);

  const handleDeleteProduct = useCallback((productId : any) => {
    api.Seller.DeleteProduct(user.token, productId)
  }, []);

  const handleCreateProduct = useCallback(() => {
    navigation.navigate("CreateProductScreen");
  }, [navigation]);

  const handleTrackOrder = useCallback(() => {
    navigation.navigate('OrderList');
  }, [navigation]);

  // Memoized render function for FlatList items
  const renderItem = useCallback(({ item } : {item : Product}) => (
    <MemoizedProductItem
      item={item}
      onUpdateInventory={handleUpdateInventory}
      onUpdatePrice={handleUpdatePrice}
      onToggleAvailability={handleToggleAvailability}
      onEditProduct={handleEditProduct}
      onDeleteProduct={handleDeleteProduct}
    />
  ), [handleUpdateInventory, handleUpdatePrice, handleToggleAvailability, handleEditProduct, handleDeleteProduct]);

  // Memoized key extractor
  const keyExtractor = useCallback((item : Product) => item.id, []);

  // Memoized refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
  ), [refreshing, handleRefresh]);

  // Memoized footer component
  const renderFooter = useCallback(() => {
    if (!loadingMore || !hasMorePages) return null;
    return <LoadingFooter />;
  }, [loadingMore, hasMorePages]);

  // Show loading only when initially loading and no items exist
  if (refreshing && items.length === 0) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
        <SearchOverlay
          visible={isModalVisible}
          query={query}
          onSearch={handleSearch}
          onClose={() => setIsModalVisible(false)}
          onQueryChange={setQuery}
        />

      <View style={styles.searchContainer}>
        <Search 
          query={query} 
          onPress={() => setIsModalVisible(true)} 
        />
        
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={filteredItems.length === 0 && query ? 
          () => (
            <View style={styles.emptyContainer}>
              <Text style={styles.noItemsText}>
                No products found matching "{query}"
              </Text>
            </View>
          ) : EmptyComponent
        }
        // Virtualization optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 150, // Adjust based on your ProductItem height
          offset: 150 * index,
          index,
        })}
        // Performance optimizations
        keyboardShouldPersistTaps="handled"
        disableVirtualization={false}
      />
      <View style={{paddingTop : 100}}/>


      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCreateProduct}
        >
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.checkoutButtonText}>Create Product</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop : 50,
  },
  header: {

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop : 30,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noItemsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingBottom: 35,
    backgroundColor: 'black',
  },
  checkoutButton: {
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 15,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
});
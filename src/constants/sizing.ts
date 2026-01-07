import { SizingGuide } from './types';

export const productTypes = ["T-Shirt", "Polo Shirt", "Shirt", "Kurta", "Shalwar Kameez", "Trousers", "Jeans", "Shorts", "Jacket", "Zipper", "Hoodie", "Sweatshirt", "Dupatta", "Scarf", "Bag", "Shoe", "Sandal", "Belt", "Watch", "Accessory"];

export const apparelTypes = ["T-Shirt", "Polo Shirt", "Shirt", "Kurta", "Shalwar Kameez", "Trousers", "Jeans", "Shorts", "Jacket", "Zipper", "Hoodie", "Sweatshirt", "Shoe", "Sandal"];

export const dummySizingGuides: Record<string, SizingGuide> = {
  'top_wear': {
    size_chart: { 'dummy_row': { 'Chest': -1, 'Shoulder': -1, 'Length': -1, 'Sleeve Length': -1 } },
    size_fit: 'Regular fit for tops.',
    measurement_unit: 'inch',
  },
  'bottom_wear': {
    size_chart: { 'dummy_row': { 'Waist': -1, 'Hips': -1, 'Inseam': -1, 'Length': -1 } },
    size_fit: 'Comfort fit for bottoms.',
    measurement_unit: 'inch',
  },
  'shalwar_kameez': {
    size_chart: { 'dummy_row': { 'Chest': -1, 'Shoulder': -1, 'Kameez Length': -1, 'Sleeve Length': -1, 'Waist': -1, 'Hips': -1, 'Shalwar Length': -1 } },
    size_fit: 'Traditional fit.',
    measurement_unit: 'inch',
  },
  'footwear': {
    size_chart: { 'dummy_row': { 'Foot Length': -1 } },
    size_fit: 'Standard shoe sizing. Please provide measurements in CM.',
    measurement_unit: 'cm',
  },
};

export const productTypeToSizingGuide: Record<string, string> = {
    "T-Shirt": "top_wear",
    "Polo Shirt": "top_wear",
    "Shirt": "top_wear",
    "Kurta": "top_wear",
    "Jacket": "top_wear",
    "Zipper": "top_wear",
    "Hoodie": "top_wear",
    "Sweatshirt": "top_wear",
    "Trousers": "bottom_wear",
    "Jeans": "bottom_wear",
    "Shorts": "bottom_wear",
    "Shalwar Kameez": "shalwar_kameez",
    "Shoe": "footwear",
    "Sandal": "footwear",
};
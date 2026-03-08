// Mock wardrobe items
export const initialWardrobeItems = [
  {
    id: 1,
    name: 'Classic White Tee',
    category: 'Upperwear',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
    status: 'available',
    notes: 'Everyday essential',
  },
  {
    id: 2,
    name: 'Navy Crew Sweater',
    category: 'Upperwear',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop',
    status: 'available',
    notes: '',
  },
  {
    id: 3,
    name: 'Chambray Shirt',
    category: 'Upperwear',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop',
    status: 'available',
    notes: 'Semi-formal',
  },
  {
    id: 4,
    name: 'Black Slim Jeans',
    category: 'Lowerwear',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop',
    status: 'available',
    notes: '',
  },
  {
    id: 5,
    name: 'Khaki Chinos',
    category: 'Lowerwear',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=300&fit=crop',
    status: 'available',
    notes: 'Smart casual',
  },
  {
    id: 6,
    name: 'Grey Joggers',
    category: 'Lowerwear',
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=300&h=300&fit=crop',
    status: 'laundry',
    notes: 'Comfort wear',
  },
  {
    id: 7,
    name: 'White Sneakers',
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
    status: 'available',
    notes: 'Goes with everything',
  },
  {
    id: 8,
    name: 'Chelsea Boots',
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=300&h=300&fit=crop',
    status: 'available',
    notes: '',
  },
  {
    id: 9,
    name: 'Leather Watch',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=300&fit=crop',
    status: 'available',
    notes: 'Brown strap',
  },
  {
    id: 10,
    name: 'Canvas Backpack',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
    status: 'available',
    notes: '',
  },
  {
    id: 11,
    name: 'Denim Jacket',
    category: 'Outerwear',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&h=300&fit=crop',
    status: 'available',
    notes: 'Vintage wash',
  },
  {
    id: 12,
    name: 'Wool Overcoat',
    category: 'Outerwear',
    image: 'https://images.unsplash.com/photo-1544923246-77307dd270b1?w=300&h=300&fit=crop',
    status: 'laundry',
    notes: 'Dry clean only',
  },
];

// Mock shopping products
export const mockShoppingProducts = [
  {
    id: 101,
    name: 'Relaxed Fit Linen Shirt',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&h=300&fit=crop',
    category: 'Upperwear',
  },
  {
    id: 102,
    name: 'Slim Tailored Trousers',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop',
    category: 'Lowerwear',
  },
  {
    id: 103,
    name: 'Minimalist Leather Belt',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 104,
    name: 'Suede Desert Boots',
    price: 119.99,
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=300&h=300&fit=crop',
    category: 'Shoes',
  },
  {
    id: 105,
    name: 'Cashmere Blend Sweater',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a95?w=300&h=300&fit=crop',
    category: 'Upperwear',
  },
  {
    id: 106,
    name: 'Waterproof Parka',
    price: 159.99,
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=300&h=300&fit=crop',
    category: 'Outerwear',
  },
  {
    id: 107,
    name: 'Canvas Tote Bag',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 108,
    name: 'Running Sneakers',
    price: 99.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
    category: 'Shoes',
  },
];

// Style preference options
export const styleOptions = [
  'Casual', 'Formal', 'Streetwear', 'Athletic', 'Minimalist',
  'Bohemian', 'Vintage', 'Preppy', 'Smart Casual', 'Athleisure',
];

// Color options
export const colorOptions = [
  { name: 'Black', hex: '#1d1d1f' },
  { name: 'White', hex: '#f5f5f7' },
  { name: 'Navy', hex: '#1d3557' },
  { name: 'Grey', hex: '#8d99ae' },
  { name: 'Beige', hex: '#d4c5a9' },
  { name: 'Olive', hex: '#606c38' },
  { name: 'Burgundy', hex: '#7c2d3e' },
  { name: 'Terracotta', hex: '#c97c5d' },
  { name: 'Sage', hex: '#9caf88' },
  { name: 'Dusty Rose', hex: '#c9a9a6' },
];

export const clothingCategories = [
  'Upperwear', 'Lowerwear', 'Shoes', 'Accessories', 'Outerwear',
];

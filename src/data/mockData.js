// Mock wardrobe items (prices in ₹)
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

// Mock shopping products — Indian e-commerce (prices in ₹)
// Buy links are generated dynamically in ShoppingSuggestions component with per-item budget sliders
export const mockShoppingProducts = [
  // --- Upperwear ---
  {
    id: 101,
    name: 'Relaxed Fit Linen Shirt',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&h=300&fit=crop',
    category: 'Upperwear',
  },
  {
    id: 105,
    name: 'Cashmere Blend Sweater',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a95?w=300&h=300&fit=crop',
    category: 'Upperwear',
  },
  // --- Lowerwear ---
  {
    id: 102,
    name: 'Slim Tailored Trousers',
    price: 1999,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop',
    category: 'Lowerwear',
  },
  // --- Shoes ---
  {
    id: 104,
    name: 'Suede Desert Boots',
    price: 3499,
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=300&h=300&fit=crop',
    category: 'Shoes',
  },
  {
    id: 108,
    name: 'Running Sports Sneakers',
    price: 2999,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
    category: 'Shoes',
  },
  // --- Outerwear ---
  {
    id: 106,
    name: 'Waterproof Parka Jacket',
    price: 4999,
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=300&h=300&fit=crop',
    category: 'Outerwear',
  },
  // --- Accessories ---
  {
    id: 103,
    name: 'Minimalist Leather Belt',
    price: 799,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 107,
    name: 'Canvas Tote Bag',
    price: 699,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 109,
    name: 'Aviator Sunglasses',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 110,
    name: 'Analog Wrist Watch',
    price: 2999,
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 111,
    name: 'Leather Bifold Wallet',
    price: 899,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 112,
    name: 'Snapback Cap',
    price: 499,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 113,
    name: 'Wool Knit Scarf',
    price: 999,
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 114,
    name: 'Silver Cufflinks Set',
    price: 1499,
    image: 'https://images.unsplash.com/photo-1590548784585-643d2b9f2925?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 115,
    name: 'Silk Printed Tie',
    price: 799,
    image: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=300&h=300&fit=crop',
    category: 'Accessories',
  },
  {
    id: 116,
    name: 'Travel Laptop Backpack',
    price: 1799,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
    category: 'Accessories',
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

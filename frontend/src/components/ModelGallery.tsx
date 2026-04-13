/* import React, { useState, useEffect, useRef } from 'react';
const [selectedModel, setSelectedModel] = useState<any>(null);
const [showGallery, setShowGallery] = useState(false);

// Add this interface definition
interface ModelExample {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
  featured: boolean;
  prompt: string;
  style: string;
  downloads: number;
  likes: number;
}



const MODEL_EXAMPLES: ModelExample[] = [
  {
    id: '1',
    title: 'Tropical Bird Display',
    description: 'Beautiful tropical bird with detailed feathers on wooden base',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop',
    category: 'Nature',
    tags: ['bird', 'tropical', 'display', 'realistic'],
    featured: true,
    prompt: 'A vibrant tropical bird with detailed feathers mounted on wooden display base',
    style: 'realistic',
    downloads: 1247,
    likes: 892
  },
  {
    id: '2',
    title: 'Chibi Snow Character',
    description: 'Cute anime-style character in blue winter hoodie',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    category: 'Characters',
    tags: ['anime', 'chibi', 'winter', 'cute'],
    prompt: 'Kawaii anime character with blue hoodie and winter theme',
    style: 'anime',
    downloads: 2156,
    likes: 1543
  },
  {
    id: '3',
    title: 'Strawberry Layer Cake',
    description: 'Delicious multi-layer cake with strawberries and cream',
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop',
    category: 'Food',
    tags: ['cake', 'strawberry', 'dessert', 'layered'],
    prompt: 'A beautiful layered cake with strawberries and cream frosting',
    style: 'realistic',
    downloads: 876,
    likes: 654
  },
  {
    id: '4',
    title: 'Baby Dragon',
    description: 'Adorable green baby dragon with tiny wings and friendly smile',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    category: 'Fantasy',
    tags: ['dragon', 'baby', 'fantasy', 'cute'],
    featured: true,
    prompt: 'A cute baby dragon with green scales, small wings, and friendly expression',
    style: 'cartoon',
    downloads: 3421,
    likes: 2876
  },
  {
    id: '5',
    title: 'Royal Panda King',
    description: 'Majestic panda wearing golden crown and royal robes',
    imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=300&h=300&fit=crop',
    category: 'Animals',
    tags: ['panda', 'royal', 'crown', 'fantasy'],
    prompt: 'A dignified panda wearing a golden crown and royal ceremonial robes',
    style: 'fantasy',
    downloads: 1987,
    likes: 1432
  },
  {
    id: '6',
    title: 'Modern Wooden Chair',
    description: 'Elegant curved wooden chair with leather seat',
    imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=300&h=300&fit=crop',
    category: 'Furniture',
    tags: ['chair', 'wooden', 'modern', 'furniture'],
    prompt: 'A sleek wooden chair with curved backrest and leather cushion',
    style: 'realistic',
    downloads: 743,
    likes: 521
  },
  {
    id: '7',
    title: 'Vintage Teal Armchair',
    description: 'Classic button-tufted armchair in rich teal upholstery',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop',
    category: 'Furniture',
    tags: ['armchair', 'vintage', 'teal', 'tufted'],
    prompt: 'A vintage button-tufted armchair in teal velvet with wooden frame',
    style: 'vintage',
    downloads: 654,
    likes: 432
  },
  {
    id: '8',
    title: 'Traditional Rocking Chair',
    description: 'Classic wooden rocking chair with smooth curved runners',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop',
    category: 'Furniture',
    tags: ['rocking chair', 'wooden', 'traditional', 'classic'],
    prompt: 'A traditional wooden rocking chair with elegant curved design',
    style: 'classic',
    downloads: 567,
    likes: 398
  },
  {
    id: '9',
    title: 'Pirate Treasure Chest',
    description: 'Weathered wooden treasure chest filled with gold and gems',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    category: 'Objects',
    tags: ['treasure', 'chest', 'pirate', 'vintage'],
    prompt: 'An old weathered treasure chest overflowing with gold coins and jewels',
    style: 'fantasy',
    downloads: 1876,
    likes: 1345
  },
  {
    id: '10',
    title: 'Magical Unicorn',
    description: 'Enchanting unicorn with rainbow mane and crystal horn',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    category: 'Fantasy',
    tags: ['unicorn', 'magical', 'rainbow', 'fantasy'],
    featured: true,
    prompt: 'A magical unicorn with flowing rainbow mane and sparkling crystal horn',
    style: 'fantasy',
    downloads: 4532,
    likes: 3987
  },
  {
    id: '11',
    title: 'Tiger Cub',
    description: 'Playful orange tiger cub with distinctive black stripes',
    imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=300&h=300&fit=crop',
    category: 'Animals',
    tags: ['tiger', 'cub', 'wildlife', 'realistic'],
    prompt: 'A playful tiger cub with bright orange fur and bold black stripes',
    style: 'realistic',
    downloads: 1234,
    likes: 987
  },
  {
    id: '12',
    title: 'Professional Headphones',
    description: 'High-end studio headphones in deep blue with premium padding',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    category: 'Electronics',
    tags: ['headphones', 'audio', 'professional', 'blue'],
    prompt: 'Professional studio headphones in deep blue with padded ear cups',
    style: 'modern',
    downloads: 892,
    likes: 643
  },
  {
    id: '13',
    title: 'Red Fox',
    description: 'Alert red fox with bushy tail and bright amber eyes',
    imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=300&h=300&fit=crop',
    category: 'Animals',
    tags: ['fox', 'red', 'wildlife', 'nature'],
    prompt: 'A beautiful red fox with fluffy tail and alert amber eyes',
    style: 'realistic',
    downloads: 1543,
    likes: 1187
  },
  {
    id: '14',
    title: 'Fresh Apple Half',
    description: 'Crisp red apple cut in half showing white flesh and seeds',
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop',
    category: 'Food',
    tags: ['apple', 'fruit', 'fresh', 'healthy'],
    prompt: 'A fresh red apple cut in half revealing the crisp white flesh',
    style: 'realistic',
    downloads: 456,
    likes: 321
  },
  {
    id: '15',
    title: 'Glass Elephant Art',
    description: 'Delicate glass elephant sculpture with amber accents',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    category: 'Art',
    tags: ['elephant', 'glass', 'sculpture', 'artistic'],
    prompt: 'An elegant glass elephant sculpture with amber and clear glass details',
    style: 'artistic',
    downloads: 789,
    likes: 567
  },
  {
    id: '16',
    title: 'Forest Cabin',
    description: 'Cozy wooden cabin with moss-covered roof in pine forest',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=300&fit=crop',
    category: 'Architecture',
    tags: ['cabin', 'wooden', 'forest', 'rustic'],
    prompt: 'A cozy log cabin with green moss roof nestled among tall pine trees',
    style: 'realistic',
    downloads: 1098,
    likes: 834
  }
]; 
export default ModelGallery;*/
export {};
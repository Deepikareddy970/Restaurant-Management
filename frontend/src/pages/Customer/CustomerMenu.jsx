import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import {
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  CheckSquare,
  Sparkles,
  Star
} from 'lucide-react';

const FEATURED_ITEMS = [
  {
    id: 'f1',
    name: 'Paneer Butter Masala',
    price: 180,
    category: 'Veg Main Course',
    img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80',
  },
  {
    id: 'f2',
    name: 'Butter Chicken (Half)',
    price: 220,
    category: 'Non Veg Main Course',
    img: 'https://www.indianhealthyrecipes.com/wp-content/uploads/2022/07/chicken-butter-masala-recipe.jpg',
  },
  {
    id: 'f3',
    name: 'Chicken Dum Biryani (Single)',
    price: 160,
    category: 'Rice Dishes',
    img: 'https://vismaifood.com/storage/app/uploads/public/e12/7b7/127/thumb__1200_0_0_0_auto.jpg',
  },
  {
    id: 'f4',
    name: 'Paneer Tikka',
    price: 180,
    category: 'Veg Starter',
    img: 'https://c.ndtvimg.com/2023-09/2fugrm2_paneer-tikka_625x300_18_September_23.jpg'
  },
  {
    id: 'f5',
    name: 'Tandoori Chicken (Half)',
    price: 220,
    category: 'Non Veg Starter',
    img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80',
  },
  {
    id: 'f6',
    name: 'Veg Biryani',
    price: 140,
    category: 'Rice Dishes',
    img: 'https://www.cookingcarnival.com/wp-content/uploads/2025/09/Vegetable-Dum-Biryani-5-500x500.jpg',
  },
  {
    id: 'f7',
    name: 'Chicken Tikka',
    price: 200,
    category: 'Non Veg Starter',
    img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80',
  },
  {
    id: 'f8',
    name: 'Mutton Dum Biryani (Single)',
    price: 220,
    category: 'Rice Dishes',
    img: 'https://media-cdn.tripadvisor.com/media/photo-s/1c/27/e0/67/mutton-dum-biryani.jpg',
  },
  {
    id: 'f9',
    name: 'Prawn Ghee Roast',
    price: 240,
    category: 'Sea Food',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNQ6YsMakboobLkNOkEdV0HXRM6KkCBfZTl9Sb0XHZS-BHnesR5EMiDqen&s=10',
  },
  {
    id: 'f10',
    name: 'Chicken Lollypop (6pc) Wet',
    price: 200,
    category: 'Non Veg Chinese Appetizers',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxzxRygtklQbufkySE8eYIiCHdGEFQbMIHOLbJTtupqRPEb2t7Cv1DKQmM&s=10',
  },
];

const MENU_ITEMS = [
  // Appetizers
  { id: 'a1', name: 'Garden Salad', price: 60, category: 'Appetizers' },
  { id: 'a2', name: 'Kachumber Salad', price: 80, category: 'Appetizers' },
  { id: 'a3', name: 'Veg Raita', price: 80, category: 'Appetizers' },
  { id: 'a4', name: 'Bondi Raita', price: 80, category: 'Appetizers' },
  { id: 'a5', name: 'Pineapple Raita (Seasonal)', price: 120, category: 'Appetizers' },
  { id: 'a6', name: 'Roasted Pappad', price: 30, category: 'Appetizers' },
  { id: 'a7', name: 'Chicken Salad', price: 150, category: 'Appetizers' },
  { id: 'a8', name: 'Boiled Egg Salad', price: 100, category: 'Appetizers' },
  { id: 'a9', name: 'Masala Pappad', price: 40, category: 'Appetizers' },
  { id: 'a10', name: 'Peanut-Masala Pappad', price: 80, category: 'Appetizers' },

  // Beverages
  { id: 'b1', name: 'Mineral Water', price: 20, category: 'Beverages' },
  { id: 'b2', name: 'Soft Drinks', price: 20, category: 'Beverages' },
  { id: 'b3', name: 'Masala Cold Drink', price: 30, category: 'Beverages' },
  { id: 'b4', name: 'Soda (Sweet/Salt)', price: 30, category: 'Beverages' },
  { id: 'b5', name: 'Tea', price: 10, category: 'Beverages' },
  { id: 'b6', name: 'Coffee', price: 20, category: 'Beverages' },

  // Veg Starter
  { id: 'vs1', name: 'Chat-Pate Tandoori Aloo', price: 120, category: 'Veg Starter' },
  { id: 'vs2', name: 'Mushroom Tikka', price: 160, category: 'Veg Starter' },
  { id: 'vs3', name: 'Veg Gilafi Seekh Kebab', price: 140, category: 'Veg Starter' },
  { id: 'vs4', name: 'Tandoori Pineapple Tikka (Seasonal)', price: 150, category: 'Veg Starter' },
  { id: 'vs5', name: 'Tandoori Gobi', price: 130, category: 'Veg Starter' },
  { id: 'vs6', name: 'Paneer Tikka', price: 180, category: 'Veg Starter' },
  { id: 'vs7', name: 'Paneer Pahadi', price: 180, category: 'Veg Starter' },
  { id: 'vs8', name: 'Paneer Lasooni', price: 180, category: 'Veg Starter' },
  { id: 'vs9', name: 'Paneer Malai', price: 180, category: 'Veg Starter' },
  { id: 'vs10', name: 'Soyachap Tikka', price: 160, category: 'Veg Starter' },
  { id: 'vs11', name: 'Soyachap Pahadi', price: 160, category: 'Veg Starter' },
  { id: 'vs12', name: 'Soyachap Lasooni', price: 160, category: 'Veg Starter' },
  { id: 'vs13', name: 'Soyachap Malai', price: 160, category: 'Veg Starter' },
  { id: 'vs14', name: 'Veg Platter', price: 250, category: 'Veg Starter' },

  // Non Veg Starter
  { id: 'nvs1', name: 'Tandoori Chicken (Half)', price: 220, category: 'Non Veg Starter' },
  { id: 'nvs2', name: 'Tandoori Chicken (Full)', price: 400, category: 'Non Veg Starter' },
  { id: 'nvs3', name: 'Afghani Tandoori Chicken (Half)', price: 220, category: 'Non Veg Starter' },
  { id: 'nvs4', name: 'Afghani Tandoori Chicken (Full)', price: 400, category: 'Non Veg Starter' },
  { id: 'nvs5', name: 'Chicken Malai', price: 220, category: 'Non Veg Starter' },
  { id: 'nvs6', name: 'Chicken Tangdi', price: 200, category: 'Non Veg Starter' },
  { id: 'nvs7', name: 'Chicken Tikka', price: 200, category: 'Non Veg Starter' },
  { id: 'nvs8', name: 'Chicken Banjara', price: 200, category: 'Non Veg Starter' },
  { id: 'nvs9', name: 'Chicken Sheekh Kabab', price: 220, category: 'Non Veg Starter' },
  { id: 'nvs10', name: 'Chicken Achari Kabab', price: 220, category: 'Non Veg Starter' },
  { id: 'nvs11', name: 'Mutton Sheekh Kabab', price: 240, category: 'Non Veg Starter' },
  { id: 'nvs12', name: 'Mutton Chaap', price: 240, category: 'Non Veg Starter' },
  { id: 'nvs13', name: 'Mutton Bhooti Kabab', price: 240, category: 'Non Veg Starter' },
  { id: 'nvs14', name: 'Mutton Raan (Special)', price: 800, category: 'Non Veg Starter' },
  { id: 'nvs15', name: 'Tangdi Kabab', price: 240, category: 'Non Veg Starter' },
  { id: 'nvs16', name: 'Reshmi Kabab', price: 220, category: 'Non Veg Starter' },
  { id: 'nvs17', name: 'Fish Tikka Ajwayani', price: 220, category: 'Non Veg Starter' },
  { id: 'nvs18', name: 'Fish Achari Tikka', price: 220, category: 'Non Veg Starter' },
  { id: 'nvs19', name: 'Fish Lasooni Tikka', price: 220, category: 'Non Veg Starter' },
  { id: 'nvs20', name: 'Fish Hariyali Tikka', price: 220, category: 'Non Veg Starter' },
  { id: 'nvs21', name: 'Apollo Fish', price: 250, category: 'Non Veg Starter' },
  { id: 'nvs22', name: 'Chicken Platter', price: 450, category: 'Non Veg Starter' },
  { id: 'nvs23', name: 'Non-Veg Platter (Mix)', price: 600, category: 'Non Veg Starter' },

  // Sea Food
  { id: 'sf1', name: 'Fish (Choice of Sauce)', price: 180, category: 'Sea Food' },
  { id: 'sf2', name: 'Prawn (Choice of Sauce)', price: 200, category: 'Sea Food' },
  { id: 'sf3', name: 'Apollo Fish (Choice of Sauce)', price: 220, category: 'Sea Food' },
  { id: 'sf4', name: 'Fish Pakoda', price: 180, category: 'Sea Food' },
  { id: 'sf5', name: 'Golden Fried Prawn', price: 200, category: 'Sea Food' },
  { id: 'sf6', name: 'Prawn 65', price: 200, category: 'Sea Food' },
  { id: 'sf7', name: 'Fish 65', price: 180, category: 'Sea Food' },
  { id: 'sf8', name: 'Chilli Garlic Prawn', price: 220, category: 'Sea Food' },
  { id: 'sf9', name: 'Prawn Ghee Roast', price: 240, category: 'Sea Food' },

  // Soup
  { id: 'so1', name: 'Veg Manchow Soup', price: 60, category: 'Soup' },
  { id: 'so2', name: 'Hot N Sour Soup', price: 60, category: 'Soup' },
  { id: 'so3', name: 'Sweet Corn Soup', price: 70, category: 'Soup' },
  { id: 'so4', name: 'Tom Yum Soup', price: 80, category: 'Soup' },
  { id: 'so5', name: 'Tomato Soup', price: 60, category: 'Soup' },
  { id: 'so6', name: 'Lemon Coriander Soup', price: 60, category: 'Soup' },
  { id: 'so7', name: 'Veg Noodle Soup', price: 60, category: 'Soup' },
  { id: 'so8', name: 'Chicken Sweet Corn Soup', price: 100, category: 'Soup' },
  { id: 'so9', name: 'Chicken Noodles Soup', price: 110, category: 'Soup' },
  { id: 'so10', name: 'Chicken Lemon Coriander Soup', price: 110, category: 'Soup' },
  { id: 'so11', name: 'Chicken Manchow Soup', price: 100, category: 'Soup' },
  { id: 'so12', name: 'Mix Hot & Sour Soup', price: 120, category: 'Soup' },
  { id: 'so13', name: 'Mutton Ukad Soup', price: 150, category: 'Soup' },

  // Veg Chinese Appetizers
  { id: 'vc1', name: 'Crispy Corn', price: 160, category: 'Veg Chinese Appetizers' },
  { id: 'vc2', name: 'Chilli Potato', price: 140, category: 'Veg Chinese Appetizers' },
  { id: 'vc3', name: 'Gobi Chilli', price: 120, category: 'Veg Chinese Appetizers' },
  { id: 'vc4', name: 'Gobi Manchurian', price: 120, category: 'Veg Chinese Appetizers' },
  { id: 'vc5', name: 'Mushroom Chilli', price: 160, category: 'Veg Chinese Appetizers' },
  { id: 'vc6', name: 'Mushroom Manchurian', price: 160, category: 'Veg Chinese Appetizers' },
  { id: 'vc7', name: 'Paneer Chilli', price: 180, category: 'Veg Chinese Appetizers' },
  { id: 'vc8', name: 'Paneer Manchurian', price: 180, category: 'Veg Chinese Appetizers' },
  { id: 'vc9', name: 'Paneer Hot Garlic', price: 180, category: 'Veg Chinese Appetizers' },
  { id: 'vc10', name: 'Paneer Schezwan', price: 180, category: 'Veg Chinese Appetizers' },
  { id: 'vc11', name: 'Baby-Corn Chilli', price: 140, category: 'Veg Chinese Appetizers' },
  { id: 'vc12', name: 'Baby-Corn Manchurian', price: 140, category: 'Veg Chinese Appetizers' },
  { id: 'vc13', name: 'Veg Spring-Roll', price: 160, category: 'Veg Chinese Appetizers' },
  { id: 'vc14', name: 'Finger Chips', price: 80, category: 'Veg Chinese Appetizers' },
  { id: 'vc15', name: 'Boiled Veg', price: 150, category: 'Veg Chinese Appetizers' },
  { id: 'vc16', name: 'Aloo 65', price: 120, category: 'Veg Chinese Appetizers' },
  { id: 'vc17', name: 'Paneer Majestic', price: 180, category: 'Veg Chinese Appetizers' },
  { id: 'vc18', name: 'Cheese Corn Nuggets', price: 180, category: 'Veg Chinese Appetizers' },
  { id: 'vc19', name: 'Nepolian Fingers', price: 160, category: 'Veg Chinese Appetizers' },
  { id: 'vc20', name: 'Paneer Satay', price: 200, category: 'Veg Chinese Appetizers' },
  { id: 'vc21', name: 'Paneer Pakoda', price: 150, category: 'Veg Chinese Appetizers' },
  { id: 'vc22', name: 'Cheese Ball / Cheese Fingers', price: 180, category: 'Veg Chinese Appetizers' },
  { id: 'vc23', name: 'Paneer Cheese Combo', price: 200, category: 'Veg Chinese Appetizers' },
  { id: 'vc24', name: 'Veg Crispy', price: 150, category: 'Veg Chinese Appetizers' },
  { id: 'vc25', name: 'American Corn', price: 160, category: 'Veg Chinese Appetizers' },
  { id: 'vc26', name: 'Paneer 65', price: 180, category: 'Veg Chinese Appetizers' },
  { id: 'vc27', name: 'Mushroom 65', price: 160, category: 'Veg Chinese Appetizers' },

  // Non Veg Chinese Appetizers
  { id: 'nvc1', name: 'Chicken Pakoda', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc2', name: 'Chicken Lollypop (6pc) Dry', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc3', name: 'Chicken Lollypop (6pc) Wet', price: 200, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc4', name: 'Chicken Crispy', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc5', name: 'Chicken Salt & Pepper', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc6', name: 'Chicken Spring Roll', price: 220, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc7', name: 'Chicken 65', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc8', name: 'Chicken Chilli', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc9', name: 'Chicken Manchurian', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc10', name: 'Chicken Hot & Garlic', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc11', name: 'Chicken KFC (8pc)', price: 200, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc12', name: 'Fish Finger (8pc)', price: 200, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc13', name: 'Lemon Fish', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc14', name: 'Tawa Fish', price: 220, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc15', name: 'Fish Manchurian', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc16', name: 'Prawn Manchurian', price: 220, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc17', name: 'Chicken Schezwan Chilli', price: 200, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc18', name: 'Chicken Hot Garlic Sauce', price: 200, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc19', name: 'Fish Chilli', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc20', name: 'Fish Garlic', price: 180, category: 'Non Veg Chinese Appetizers' },
  { id: 'nvc21', name: 'Prawn Salt & Pepper', price: 200, category: 'Non Veg Chinese Appetizers' },

  // Chinese Main Course
  { id: 'cm1', name: 'Veg Manchurian', price: 120, category: 'Chinese Main Course' },
  { id: 'cm2', name: 'Veg Thai Curry (Red/Green)', price: 180, category: 'Chinese Main Course' },
  { id: 'cm3', name: 'Chicken Thai Curry (Red/Green)', price: 200, category: 'Chinese Main Course' },
  { id: 'cm4', name: 'Prawn Thai Curry', price: 240, category: 'Chinese Main Course' },
  { id: 'cm5', name: 'Fish Choice of Gravy', price: 200, category: 'Chinese Main Course' },
  { id: 'cm6', name: 'Prawn Choice of Gravy', price: 220, category: 'Chinese Main Course' },
  { id: 'cm7', name: 'Veg Noodles', price: 80, category: 'Chinese Main Course' },
  { id: 'cm8', name: 'Chicken Noodles', price: 120, category: 'Chinese Main Course' },
  { id: 'cm9', name: 'Veg Chopsuey', price: 140, category: 'Chinese Main Course' },
  { id: 'cm10', name: 'Non-Veg Chopsuey', price: 180, category: 'Chinese Main Course' },
  { id: 'cm11', name: 'Atta Noodles (Veg)', price: 120, category: 'Chinese Main Course' },
  { id: 'cm12', name: 'Atta Noodles (Chicken)', price: 150, category: 'Chinese Main Course' },
  { id: 'cm13', name: 'Atta Noodles (Mix)', price: 180, category: 'Chinese Main Course' },
  { id: 'cm14', name: 'Hakka Noodles (Veg)', price: 120, category: 'Chinese Main Course' },
  { id: 'cm15', name: 'Hakka Noodles (Chicken)', price: 140, category: 'Chinese Main Course' },
  { id: 'cm16', name: 'Hakka Noodles (Mix)', price: 180, category: 'Chinese Main Course' },
  { id: 'cm17', name: 'Veg Fried Rice', price: 100, category: 'Chinese Main Course' },
  { id: 'cm18', name: 'Veg Schezwan Fried Rice', price: 120, category: 'Chinese Main Course' },
  { id: 'cm19', name: 'Egg Fried Rice', price: 120, category: 'Chinese Main Course' },
  { id: 'cm20', name: 'Chicken Fried Rice', price: 140, category: 'Chinese Main Course' },
  { id: 'cm21', name: 'Chicken Schezwan Fried Rice', price: 160, category: 'Chinese Main Course' },
  { id: 'cm22', name: 'Paneer Choice of Gravy', price: 180, category: 'Chinese Main Course' },
  { id: 'cm23', name: 'Mushroom Choice of Gravy', price: 160, category: 'Chinese Main Course' },
  { id: 'cm24', name: 'Chicken Choice of Gravy', price: 180, category: 'Chinese Main Course' },
  { id: 'cm25', name: 'Mix Fried Rice', price: 180, category: 'Chinese Main Course' },
  { id: 'cm26', name: 'Mix Schezwan Fried Rice', price: 200, category: 'Chinese Main Course' },

  // Veg Main Course
  { id: 'vm1', name: 'Paneer Masala', price: 160, category: 'Veg Main Course' },
  { id: 'vm2', name: 'Paneer Butter Masala', price: 180, category: 'Veg Main Course' },
  { id: 'vm3', name: 'Paneer Malhai', price: 200, category: 'Veg Main Course' },
  { id: 'vm4', name: 'Paneer Matar', price: 180, category: 'Veg Main Course' },
  { id: 'vm5', name: 'Paneer Tikka Masala', price: 200, category: 'Veg Main Course' },
  { id: 'vm6', name: 'Paneer Makhani', price: 200, category: 'Veg Main Course' },
  { id: 'vm7', name: 'Mutter Paneer', price: 160, category: 'Veg Main Course' },
  { id: 'vm8', name: 'Paneer Pasandida', price: 200, category: 'Veg Main Course' },
  { id: 'vm9', name: 'Mushroom Kadai', price: 160, category: 'Veg Main Course' },
  { id: 'vm10', name: 'Paneer Kadai', price: 180, category: 'Veg Main Course' },
  { id: 'vm11', name: 'Punjabi Rajima', price: 150, category: 'Veg Main Course' },
  { id: 'vm12', name: 'Punjabi Kadhi Pakora', price: 140, category: 'Veg Main Course' },
  { id: 'vm13', name: 'Chana Masala', price: 120, category: 'Veg Main Course' },
  { id: 'vm14', name: 'Kaju Masala', price: 200, category: 'Veg Main Course' },
  { id: 'vm15', name: 'Paneer Tawa', price: 180, category: 'Veg Main Course' },
  { id: 'vm16', name: 'Shahi Paneer', price: 180, category: 'Veg Main Course' },
  { id: 'vm17', name: 'Kofta Lasuni', price: 200, category: 'Veg Main Course' },
  { id: 'vm18', name: 'Kofta Nargisi', price: 200, category: 'Veg Main Course' },
  { id: 'vm19', name: 'Kofta Paneer', price: 200, category: 'Veg Main Course' },
  { id: 'vm20', name: 'Cheese Samsara Kofta', price: 200, category: 'Veg Main Course' },
  { id: 'vm21', name: 'Veg Kadai', price: 150, category: 'Veg Main Course' },
  { id: 'vm22', name: 'Mix Veg', price: 150, category: 'Veg Main Course' },
  { id: 'vm23', name: 'Veg Patiala', price: 200, category: 'Veg Main Course' },
  { id: 'vm24', name: 'Mushroom Masala', price: 160, category: 'Veg Main Course' },
  { id: 'vm25', name: 'Veg Lahori', price: 180, category: 'Veg Main Course' },
  { id: 'vm26', name: 'Veg Jalfrezi', price: 180, category: 'Veg Main Course' },
  { id: 'vm27', name: 'Veg Navratan Korma', price: 200, category: 'Veg Main Course' },
  { id: 'vm28', name: 'Methi Matar Malai', price: 220, category: 'Veg Main Course' },

  // Non Veg Main Course
  { id: 'nvm1', name: 'Palak Chicken (Seasonal)', price: 200, category: 'Non Veg Main Course' },
  { id: 'nvm2', name: 'Chicken Tikka Masala', price: 220, category: 'Non Veg Main Course' },
  { id: 'nvm3', name: 'Kadai Chicken', price: 180, category: 'Non Veg Main Course' },
  { id: 'nvm4', name: 'Chicken Masala', price: 180, category: 'Non Veg Main Course' },
  { id: 'nvm5', name: 'Chicken Lahori', price: 200, category: 'Non Veg Main Course' },
  { id: 'nvm6', name: 'Chicken Keema Masala', price: 200, category: 'Non Veg Main Course' },
  { id: 'nvm7', name: 'Chicken Rara', price: 200, category: 'Non Veg Main Course' },
  { id: 'nvm8', name: 'Chicken Do Pyaza', price: 180, category: 'Non Veg Main Course' },
  { id: 'nvm9', name: 'Prawn Do Pyaza', price: 200, category: 'Non Veg Main Course' },
  { id: 'nvm10', name: 'Butter Chicken (Half)', price: 220, category: 'Non Veg Main Course' },
  { id: 'nvm11', name: 'Butter Chicken (Full)', price: 420, category: 'Non Veg Main Course' },
  { id: 'nvm12', name: 'Murg Mushlam (Half)', price: 250, category: 'Non Veg Main Course' },
  { id: 'nvm13', name: 'Murg Mushlam (Full)', price: 450, category: 'Non Veg Main Course' },
  { id: 'nvm14', name: 'Chicken Muglai', price: 180, category: 'Non Veg Main Course' },
  { id: 'nvm15', name: 'Chicken Kolhapuri', price: 200, category: 'Non Veg Main Course' },
  { id: 'nvm16', name: 'Chicken Patiala', price: 180, category: 'Non Veg Main Course' },
  { id: 'nvm17', name: 'Chicken Korma', price: 220, category: 'Non Veg Main Course' },
  { id: 'nvm18', name: 'Chicken Changeji', price: 200, category: 'Non Veg Main Course' },
  { id: 'nvm19', name: 'Mutton Masala', price: 220, category: 'Non Veg Main Course' },
  { id: 'nvm20', name: 'Mutton Home Style', price: 220, category: 'Non Veg Main Course' },
  { id: 'nvm21', name: 'Mutton Champ Masala', price: 220, category: 'Non Veg Main Course' },
  { id: 'nvm22', name: 'Mutton Keema Masala', price: 250, category: 'Non Veg Main Course' },
  { id: 'nvm23', name: 'Mutton Dopyaza', price: 220, category: 'Non Veg Main Course' },
  { id: 'nvm24', name: 'Mutton Sukha', price: 250, category: 'Non Veg Main Course' },
  { id: 'nvm25', name: 'Mutton Rogan Sosh', price: 240, category: 'Non Veg Main Course' },
  { id: 'nvm26', name: 'Fish Curry', price: 120, category: 'Non Veg Main Course' },
  { id: 'nvm27', name: 'Fish Masala', price: 120, category: 'Non Veg Main Course' },
  { id: 'nvm28', name: 'Fish Mustard', price: 120, category: 'Non Veg Main Course' },
  { id: 'nvm29', name: 'Prawn Curry', price: 220, category: 'Non Veg Main Course' },
  { id: 'nvm30', name: 'Prawn Masala', price: 220, category: 'Non Veg Main Course' },
  { id: 'nvm31', name: 'Prawn Kadai Tawa', price: 220, category: 'Non Veg Main Course' },

  // Rice Dishes
  { id: 'r1', name: 'Veg Pulao', price: 120, category: 'Rice Dishes' },
  { id: 'r2', name: 'Matar Pulao', price: 110, category: 'Rice Dishes' },
  { id: 'r3', name: 'Veg Biryani', price: 140, category: 'Rice Dishes' },
  { id: 'r4', name: 'Dal Khichdi', price: 120, category: 'Rice Dishes' },
  { id: 'r5', name: 'Steamed Rice', price: 60, category: 'Rice Dishes' },
  { id: 'r6', name: 'Paneer Biryani', price: 160, category: 'Rice Dishes' },
  { id: 'r7', name: 'Mushroom Biryani', price: 150, category: 'Rice Dishes' },
  { id: 'r8', name: 'Jeera Rice', price: 80, category: 'Rice Dishes' },
  { id: 'r9', name: 'Chicken Fry Biryani (Single)', price: 160, category: 'Rice Dishes' },
  { id: 'r10', name: 'Chicken Fry Biryani (Family)', price: 420, category: 'Rice Dishes' },
  { id: 'r11', name: 'Chicken Dum Biryani (Single)', price: 160, category: 'Rice Dishes' },
  { id: 'r12', name: 'Chicken Dum Biryani (Family)', price: 420, category: 'Rice Dishes' },
  { id: 'r13', name: 'Mutton Dum Biryani (Single)', price: 220, category: 'Rice Dishes' },
  { id: 'r14', name: 'Mutton Dum Biryani (Family)', price: 550, category: 'Rice Dishes' },
  { id: 'r15', name: 'Prawn Dum Biryani (Single)', price: 220, category: 'Rice Dishes' },
  { id: 'r16', name: 'Prawn Dum Biryani (Family)', price: 550, category: 'Rice Dishes' },
  { id: 'r17', name: 'Fish Biryani (Single)', price: 180, category: 'Rice Dishes' },
  { id: 'r18', name: 'Fish Biryani (Family)', price: 450, category: 'Rice Dishes' },
  { id: 'r19', name: 'Pakhala (Veg)', price: 80, category: 'Rice Dishes' },
  { id: 'r20', name: 'Pakhala (Fish)', price: 120, category: 'Rice Dishes' },

  // Bread Dishes
  { id: 'br1', name: 'Tandoori Roti', price: 15, category: 'Bread Dishes' },
  { id: 'br2', name: 'Butter Roti', price: 20, category: 'Bread Dishes' },
  { id: 'br3', name: 'Naan', price: 30, category: 'Bread Dishes' },
  { id: 'br4', name: 'Butter Naan', price: 40, category: 'Bread Dishes' },
  { id: 'br5', name: 'Garlic Naan', price: 50, category: 'Bread Dishes' },
  { id: 'br6', name: 'Cheese Naan', price: 60, category: 'Bread Dishes' },
  { id: 'br7', name: 'Kashmiri Naan', price: 80, category: 'Bread Dishes' },
  { id: 'br8', name: 'Lachha Paratha', price: 40, category: 'Bread Dishes' },
  { id: 'br9', name: 'Aloo Paratha (Tandoori)', price: 50, category: 'Bread Dishes' },
  { id: 'br10', name: 'Pudina Paratha', price: 50, category: 'Bread Dishes' },
  { id: 'br11', name: 'Methi Paratha', price: 50, category: 'Bread Dishes' },
  { id: 'br12', name: 'Onion Paratha', price: 60, category: 'Bread Dishes' },
  { id: 'br13', name: 'Paneer Paratha', price: 80, category: 'Bread Dishes' },
  { id: 'br14', name: 'Roti Basket', price: 250, category: 'Bread Dishes' },

  // Egg Dishes
  { id: 'e1', name: 'Boiled Egg (2 Pcs)', price: 30, category: 'Egg Dishes' },
  { id: 'e2', name: 'Egg Bhurji', price: 60, category: 'Egg Dishes' },
  { id: 'e3', name: 'Egg Bhurji Curry', price: 80, category: 'Egg Dishes' },
  { id: 'e4', name: 'Egg Curry', price: 80, category: 'Egg Dishes' },
  { id: 'e5', name: 'Egg Masala', price: 100, category: 'Egg Dishes' },
  { id: 'e6', name: 'Egg Do-Pyaza', price: 80, category: 'Egg Dishes' },
  { id: 'e7', name: 'Egg Butter Masala', price: 100, category: 'Egg Dishes' },
  { id: 'e8', name: 'Egg Omelette', price: 40, category: 'Egg Dishes' },
  { id: 'e9', name: 'Egg Keema', price: 80, category: 'Egg Dishes' },
  { id: 'e10', name: 'Egg Pulusu', price: 80, category: 'Egg Dishes' },
];

const CATEGORIES = [
  'All',
  'Appetizers',
  'Beverages',
  'Veg Starter',
  'Non Veg Starter',
  'Sea Food',
  'Soup',
  'Veg Chinese Appetizers',
  'Non Veg Chinese Appetizers',
  'Chinese Main Course',
  'Veg Main Course',
  'Non Veg Main Course',
  'Rice Dishes',
  'Bread Dishes',
  'Egg Dishes',
];

const CustomerMenu = () => {
  const { addToast } = useSocket();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    addToast(`${item.name} added to cart.`, 'success');
  };

  const updateQuantity = (itemId, amount) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + amount } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    addToast('Item removed from cart.', 'info');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    try {
      const itemsPayload = cart.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));
      const res = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: itemsPayload,
          totalAmount: cartTotal,
          paymentMethod,
          paymentStatus: 'Paid',
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Checkout successful! Tracking order.', 'success');
        setCart([]);
        navigate(`/customer/tracker?orderId=${data.order.id || data.order._id}`);
      } else {
        addToast(data.message || 'Checkout failed.', 'error');
      }
    } catch (err) {
      addToast('Connection failed during checkout.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMenu =
    category === 'All' ? MENU_ITEMS : MENU_ITEMS.filter((i) => i.category === category);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Menu */}
      <div className="lg:col-span-2 space-y-6">

        {/* Banner */}
        <div className="p-6 rounded-3xl bg-indigo-600 dark:bg-indigo-950 text-white relative overflow-hidden shadow-lg shadow-indigo-600/15">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-12 -translate-y-12" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-8 translate-y-8" />
          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              <span>Guramrit Multi-Cuisine Restaurant</span>
            </h1>
            <p className="text-xs text-indigo-100 mt-1">
              Authentic flavours — Veg, Non-Veg, Chinese, Biryani & more · JK Pur, Odisha
            </p>
          </div>
        </div>

        {/* Featured Dishes */}
        <div>
          <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            Featured Dishes
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {FEATURED_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-40 glass-panel rounded-2xl overflow-hidden flex flex-col"
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-24 object-cover"
                />
                <div className="p-2.5 flex flex-col gap-2 flex-1">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      ₹{item.price}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition duration-150"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition duration-200 ${category === c
                ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Menu List */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              {category === 'All' ? 'All Items' : category}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {filteredMenu.length} items
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-100"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {item.name}
                  </p>
                  {category === 'All' && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.category}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 w-14 text-right">
                    ₹{item.price}
                  </span>
                  <button
                    onClick={() => addToCart(item)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition duration-150 whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="p-6 rounded-3xl glass-panel h-fit sticky top-20 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-indigo-500" />
            <span>My Table Cart</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingCart className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Cart is empty. Add dishes to checkout.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0 text-xs">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">₹{item.price} each</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500 uppercase tracking-wider">Subtotal</span>
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                ₹{cartTotal}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Method</p>
              {[
                { value: 'COD', label: 'Cash on Delivery' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Card', label: 'Credit / Debit Card' },
              ].map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition duration-150 ${paymentMethod === method.value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <span>{method.label}</span>
                  {paymentMethod === method.value && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 transition duration-150"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Place Table Order</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerMenu;

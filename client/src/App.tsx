import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// --- 1. IMPORT CÁC COMPONENT CỦA WEB BÁN HÀNG ---
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import TopProductsPage from './pages/TopProductsPage';
import FlashSalePage from './pages/FlashSalePage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrderPage from './pages/OrderPage';
import AdminPage from './pages/AdminPage';
import UserProfilePage from './pages/UserProfilePage';
import HelpPage from './pages/HelpPage';
import AboutPage from './pages/AboutPage';
import SearchResultsPage from './pages/SearchResultsPage';
import PolicyPage from './pages/PolicyPage';
import Toast from './components/Toast';

// --- 2. IMPORT TÍNH NĂNG 3D (MỚI) ---
import VirtualTryOn from "./features/virtual-tryon/VirtualTryOn";

// --- 3. IMPORT CONTEXTS ---
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// --- DỮ LIỆU MẪU (FALLBACK DATA) ---
const fallbackUsers = [
  { id: 1, email: "admin", password: "123", role: "admin" },
  { id: 2, email: "user", password: "123", role: "user" },
];

const initTopSearch = [
  { id: 101, category: "Áo Thun", name: "Áo Thun Form Rộng", price: "99.000 đ", sold: "Bán 45k+ / tháng", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop" },
  { id: 102, category: "Quần Jeans", name: "Quần Jean Ống Suông", price: "185.000 đ", sold: "Bán 50k+ / tháng", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop" },
  { id: 103, category: "Váy & Đầm", name: "Váy Hoa Nhí Vintage", price: "120.000 đ", sold: "Bán 32k+ / tháng", img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop" },
  { id: 104, category: "Phụ Kiện", name: "Túi Tote Vải Canvas", price: "45.000 đ", sold: "Bán 88k+ / tháng", img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&h=600&fit=crop" },
  { id: 105, category: "Áo Croptop", name: "Áo Croptop Kiểu", price: "79.000 đ", sold: "Bán 60k+ / tháng", img: "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=500&h=600&fit=crop" },
  { id: 106, category: "Phụ Kiện", name: "Giày Sneaker Trắng", price: "150.000 đ", sold: "Bán 25k+ / tháng", img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop" },
  { id: 107, category: "Áo Sơ Mi", name: "Áo Sơ Mi Công Sở", price: "320.000 đ", sold: "Bán 28k+ / tháng", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop" },
  { id: 108, category: "Áo Khoác", name: "Áo Khoác Jean", price: "550.000 đ", sold: "Bán 22k+ / tháng", img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop" },
  { id: 109, category: "Giày Sneaker", name: "Giày Sneaker Đen", price: "490.000 đ", sold: "Bán 38k+ / tháng", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop" },
  { id: 110, category: "Hoodie", name: "Hoodie Oversize", price: "520.000 đ", sold: "Bán 35k+ / tháng", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop" },
  { id: 111, category: "Chân Váy", name: "Chân Váy Xếp Ly", price: "350.000 đ", sold: "Bán 18k+ / tháng", img: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop" },
  { id: 112, category: "Áo Len", name: "Áo Len Cardigan", price: "480.000 đ", sold: "Bán 26k+ / tháng", img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=600&fit=crop" },
];

const fallbackSuggestions = [
  {
    id: 1,
    category: "Áo Thun",
    name: 'Áo Thun Cotton Premium',
    price: 299000,
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
    discount: 30,
    sold: 1234,
    variants: [
      {
        color: 'grey',
        hex: '#E0E0E0',
        name: 'Xám',
        img: '/assets/clothes/ao_xam.png'
      }
    ]
  },
  {
    id: 2,
    category: "Quần Jeans",
    name: 'Quần Jean Ống Rộng',
    price: 450000,
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop',
    discount: 25,
    sold: 856
  },
  {
    id: 3,
    category: "Váy & Đầm",
    name: 'Váy Hoa Nhí Vintage',
    price: 380000,
    img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop',
    discount: 40,
    sold: 632
  },
  {
    id: 4,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Công Sở',
    price: 320000,
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop',
    discount: 20,
    sold: 945
  },
  {
    id: 5,
    category: "Áo Khoác",
    name: 'Áo Khoác Jean Unisex',
    price: 550000,
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop',
    discount: 35,
    sold: 723
  },
  {
    id: 6,
    category: "Phụ Kiện",
    name: 'Túi Tote Canvas',
    price: 180000,
    img: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&h=600&fit=crop',
    discount: 15,
    sold: 1567
  },
  {
    id: 7,
    category: "Giày Sneaker",
    name: 'Giày Sneaker Trắng Basic',
    price: 420000,
    img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop',
    discount: 30,
    sold: 1089
  },
  {
    id: 8,
    category: "Áo Croptop",
    name: 'Áo Croptop Dây Rút',
    price: 250000,
    img: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=500&h=600&fit=crop',
    discount: 25,
    sold: 934
  },
  {
    id: 9,
    category: "Quần Short",
    name: 'Quần Short Kaki Nam',
    price: 280000,
    img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=600&fit=crop',
    discount: 20,
    sold: 678
  },
  {
    id: 10,
    category: "Chân Váy",
    name: 'Chân Váy Xếp Ly',
    price: 350000,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
    discount: 28,
    sold: 512
  },
  {
    id: 11,
    category: "Áo Len",
    name: 'Áo Len Cardigan',
    price: 480000,
    img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=600&fit=crop',
    discount: 35,
    sold: 845
  },
  {
    id: 12,
    category: "Hoodie",
    name: 'Hoodie Oversize',
    price: 520000,
    img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
    discount: 32,
    sold: 1123
  },
  {
    id: 13,
    category: "Áo Thun",
    name: 'Áo Thun Form Rộng Unisex',
    price: 195000,
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=600&fit=crop',
    discount: 15,
    sold: 2456
  },
  {
    id: 14,
    category: "Quần Jeans",
    name: 'Quần Jean Skinny',
    price: 420000,
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=600&fit=crop',
    discount: 28,
    sold: 987
  },
  {
    id: 15,
    category: "Váy & Đầm",
    name: 'Đầm Maxi Dài',
    price: 580000,
    img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=600&fit=crop',
    discount: 35,
    sold: 654
  },
  {
    id: 16,
    category: "Áo Khoác",
    name: 'Blazer Nữ Công Sở',
    price: 680000,
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop',
    discount: 40,
    sold: 432
  },
  {
    id: 17,
    category: "Áo Thun",
    name: 'Áo Thun Polo Nam',
    price: 280000,
    img: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&h=600&fit=crop',
    discount: 18,
    sold: 1789
  },
  {
    id: 18,
    category: "Quần Short",
    name: 'Quần Short Jean Rách',
    price: 320000,
    img: 'https://images.unsplash.com/photo-1591195851383-2b18e6a8c7b2?w=500&h=600&fit=crop',
    discount: 22,
    sold: 876
  },
  {
    id: 19,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Lụa',
    price: 450000,
    img: 'https://images.unsplash.com/photo-1589992568513-f927e3c3b26e?w=500&h=600&fit=crop',
    discount: 30,
    sold: 543
  },
  {
    id: 20,
    category: "Chân Váy",
    name: 'Chân Váy Jean Mini',
    price: 290000,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
    discount: 25,
    sold: 1234
  },
  {
    id: 21,
    category: "Phụ Kiện",
    name: 'Mũ Bucket Trơn',
    price: 85000,
    img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=600&fit=crop',
    discount: 10,
    sold: 3210
  },
  {
    id: 22,
    category: "Giày Sneaker",
    name: 'Giày Thể Thao Đen',
    price: 490000,
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop',
    discount: 35,
    sold: 1567
  },
  {
    id: 23,
    category: "Áo Len",
    name: 'Áo Len Cổ Lọ',
    price: 395000,
    img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=600&fit=crop',
    discount: 20,
    sold: 765
  },
  {
    id: 24,
    category: "Hoodie",
    name: 'Hoodie Zip Nam Nữ',
    price: 560000,
    img: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500&h=600&fit=crop',
    discount: 38,
    sold: 892
  },
  {
    id: 25,
    category: "Váy & Đầm",
    name: 'Váy Midi Xòe',
    price: 420000,
    img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&h=600&fit=crop',
    discount: 28,
    sold: 654
  },
  {
    id: 26,
    category: "Áo Croptop",
    name: 'Áo Crop Tay Dài',
    price: 230000,
    img: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=500&h=600&fit=crop',
    discount: 15,
    sold: 1456
  },
  {
    id: 27,
    category: "Quần Jeans",
    name: 'Quần Jean Baggy Cao Cấp',
    price: 520000,
    img: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=500&h=600&fit=crop',
    discount: 32,
    sold: 543
  },
  {
    id: 28,
    category: "Phụ Kiện",
    name: 'Kính Mát UV400',
    price: 150000,
    img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&h=600&fit=crop',
    discount: 20,
    sold: 2890
  },
  {
    id: 29,
    category: "Áo Khoác",
    name: 'Áo Khoác Dù Nam',
    price: 380000,
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop',
    discount: 25,
    sold: 1123
  },
  {
    id: 30,
    category: "Giày Sneaker",
    name: 'Giày Sneaker Chunky',
    price: 650000,
    img: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&h=600&fit=crop',
    discount: 40,
    sold: 876
  },
  {
    id: 31,
    category: "Áo Thun",
    name: 'Áo Thun Oversize Hàn Quốc',
    price: 245000,
    img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&h=600&fit=crop',
    discount: 20,
    sold: 1890
  },
  {
    id: 32,
    category: "Váy & Đầm",
    name: 'Váy Babydoll Phong Cách Hàn',
    price: 390000,
    img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop',
    discount: 30,
    sold: 1245
  },
  {
    id: 33,
    category: "Quần Jeans",
    name: 'Quần Jean Straight Nhật Bản',
    price: 480000,
    img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=600&fit=crop',
    discount: 25,
    sold: 765
  },
  {
    id: 34,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Trắng Minimalist',
    price: 365000,
    img: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=600&fit=crop',
    discount: 18,
    sold: 1567
  },
  {
    id: 35,
    category: "Áo Khoác",
    name: 'Áo Khoác Bomber Ulzzang',
    price: 620000,
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop',
    discount: 35,
    sold: 543
  },
  {
    id: 36,
    category: "Phụ Kiện",
    name: 'Túi Đeo Chéo Mini Hàn Quốc',
    price: 195000,
    img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=600&fit=crop',
    discount: 15,
    sold: 2340
  },
  {
    id: 37,
    category: "Áo Croptop",
    name: 'Crop Top Dáng Ngắn Style Hàn',
    price: 215000,
    img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop',
    discount: 22,
    sold: 1678
  },
  {
    id: 38,
    category: "Chân Váy",
    name: 'Chân Váy Tennis Hàn Quốc',
    price: 310000,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
    discount: 28,
    sold: 1432
  },
  {
    id: 39,
    category: "Hoodie",
    name: 'Hoodie Nỉ Form Rộng',
    price: 495000,
    img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
    discount: 30,
    sold: 987
  },
  {
    id: 40,
    category: "Quần Short",
    name: 'Quần Short Jean Rách Vintage',
    price: 285000,
    img: 'https://images.unsplash.com/photo-1591195851383-2b18e6a8c7b2?w=500&h=600&fit=crop',
    discount: 20,
    sold: 1123
  },
  {
    id: 41,
    category: "Áo Len",
    name: 'Áo Len Cardigan Dài',
    price: 445000,
    img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=600&fit=crop',
    discount: 25,
    sold: 876
  },
  {
    id: 42,
    category: "Giày Sneaker",
    name: 'Giày Sneaker Platform',
    price: 580000,
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop',
    discount: 32,
    sold: 1456
  },
  {
    id: 43,
    category: "Váy & Đầm",
    name: 'Đầm Dài Hoa Nhí Vintage',
    price: 520000,
    img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=600&fit=crop',
    discount: 35,
    sold: 678
  },
  {
    id: 44,
    category: "Áo Thun",
    name: 'Áo Thun Basic Cổ Tròn',
    price: 165000,
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=600&fit=crop',
    discount: 12,
    sold: 2890
  },
  {
    id: 45,
    category: "Phụ Kiện",
    name: 'Balo Canvas Minimalist',
    price: 340000,
    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop',
    discount: 20,
    sold: 1765
  },
  {
    id: 46,
    category: "Áo Khoác",
    name: 'Áo Khoác Jeans Wash Nhẹ',
    price: 590000,
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop',
    discount: 38,
    sold: 654
  },
  {
    id: 47,
    category: "Quần Jeans",
    name: 'Quần Jean Ống Loe Retro',
    price: 465000,
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=600&fit=crop',
    discount: 28,
    sold: 987
  },
  {
    id: 48,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Oversize Unisex',
    price: 385000,
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop',
    discount: 22,
    sold: 1234
  },
  {
    id: 49,
    category: "Chân Váy",
    name: 'Chân Váy Bút Chì Công Sở',
    price: 325000,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
    discount: 18,
    sold: 1543
  },
  {
    id: 50,
    category: "Hoodie",
    name: 'Hoodie Zip Basic',
    price: 475000,
    img: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500&h=600&fit=crop',
    discount: 30,
    sold: 1098
  },
  {
    id: 51,
    category: "Áo Thun",
    name: 'Áo Thun Tie Dye Hàn Quốc',
    price: 195000,
    img: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=500&h=600&fit=crop',
    discount: 18,
    sold: 1567
  },
  {
    id: 52,
    category: "Áo Thun",
    name: 'Áo Thun Graphic Streetwear',
    price: 275000,
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
    discount: 25,
    sold: 2134
  },
  {
    id: 53,
    category: "Áo Thun",
    name: 'Áo Thun Nữ Cotton Mềm',
    price: 155000,
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=600&fit=crop',
    discount: 15,
    sold: 3456
  },
  {
    id: 54,
    category: "Áo Thun",
    name: 'Áo Thun Polo Nam Cao Cấp',
    price: 285000,
    img: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&h=600&fit=crop',
    discount: 20,
    sold: 1876
  },
  {
    id: 55,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Kẻ Sọc Vintage',
    price: 395000,
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=600&fit=crop',
    discount: 28,
    sold: 987
  },
  {
    id: 56,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Denim Nam',
    price: 425000,
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop',
    discount: 22,
    sold: 1234
  },
  {
    id: 57,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Nữ Dáng Suông',
    price: 365000,
    img: 'https://images.unsplash.com/photo-1589992281143-8e0f0d0a3665?w=500&h=600&fit=crop',
    discount: 30,
    sold: 1543
  },
  {
    id: 58,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Linen Trắng',
    price: 445000,
    img: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=600&fit=crop',
    discount: 25,
    sold: 876
  },
  {
    id: 59,
    category: "Áo Khoác",
    name: 'Áo Khoác Cardigan Len',
    price: 525000,
    img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=600&fit=crop',
    discount: 32,
    sold: 654
  },
  {
    id: 60,
    category: "Áo Khoác",
    name: 'Áo Khoác Nỉ Hoodie',
    price: 495000,
    img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
    discount: 35,
    sold: 1765
  },
  {
    id: 61,
    category: "Áo Khoác",
    name: 'Áo Khoác Gió Thể Thao',
    price: 385000,
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop',
    discount: 28,
    sold: 2345
  },
  {
    id: 62,
    category: "Áo Khoác",
    name: 'Áo Blazer Nữ Công Sở',
    price: 680000,
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop',
    discount: 38,
    sold: 543
  },
  {
    id: 63,
    category: "Áo Khoác",
    name: 'Áo Khoác Phao Lông Vũ',
    price: 750000,
    img: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&h=600&fit=crop',
    discount: 40,
    sold: 432
  },
  {
    id: 64,
    category: "Quần Jeans",
    name: 'Quần Jean Rách Gối',
    price: 395000,
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop',
    discount: 25,
    sold: 1876
  },
  {
    id: 65,
    category: "Quần Jeans",
    name: 'Quần Jean Mom Fit',
    price: 445000,
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=600&fit=crop',
    discount: 30,
    sold: 1432
  },
  {
    id: 66,
    category: "Quần Jeans",
    name: 'Quần Jean Wide Leg',
    price: 485000,
    img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=600&fit=crop',
    discount: 28,
    sold: 987
  },
  {
    id: 67,
    category: "Quần Jeans",
    name: 'Quần Jean Đen Slimfit',
    price: 425000,
    img: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=500&h=600&fit=crop',
    discount: 22,
    sold: 2234
  },
  {
    id: 68,
    category: "Váy & Đầm",
    name: 'Đầm Suông Hoa Nhí',
    price: 395000,
    img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=600&fit=crop',
    discount: 32,
    sold: 1234
  },
  {
    id: 69,
    category: "Váy & Đầm",
    name: 'Váy Midi Xòe Công Sở',
    price: 445000,
    img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop',
    discount: 28,
    sold: 876
  },
  {
    id: 70,
    category: "Váy & Đầm",
    name: 'Đầm Dạ Hội Sang Trọng',
    price: 850000,
    img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&h=600&fit=crop',
    discount: 45,
    sold: 345
  },
  {
    id: 71,
    category: "Váy & Đầm",
    name: 'Váy Len Dáng Dài',
    price: 525000,
    img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop',
    discount: 35,
    sold: 654
  },
  {
    id: 72,
    category: "Chân Váy",
    name: 'Chân Váy Jean A',
    price: 295000,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
    discount: 20,
    sold: 1987
  },
  {
    id: 73,
    category: "Chân Váy",
    name: 'Chân Váy Xếp Ly Dài',
    price: 345000,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
    discount: 25,
    sold: 1543
  },
  {
    id: 74,
    category: "Chân Váy",
    name: 'Chân Váy Kaki Công Sở',
    price: 315000,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
    discount: 18,
    sold: 2134
  },
  {
    id: 75,
    category: "Chân Váy",
    name: 'Chân Váy Lưng Cao',
    price: 285000,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
    discount: 22,
    sold: 1876
  },
  {
    id: 76,
    category: "Phụ Kiện",
    name: 'Túi Xách Tote Canvas',
    price: 245000,
    img: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&h=600&fit=crop',
    discount: 20,
    sold: 2345
  },
  {
    id: 77,
    category: "Phụ Kiện",
    name: 'Dây Nịt Da Cao Cấp',
    price: 195000,
    img: 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=500&h=600&fit=crop',
    discount: 15,
    sold: 1765
  },
  {
    id: 78,
    category: "Phụ Kiện",
    name: 'Khăn Choàng Lụa Họa Tiết',
    price: 175000,
    img: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&h=600&fit=crop',
    discount: 18,
    sold: 1432
  },
  {
    id: 79,
    category: "Phụ Kiện",
    name: 'Vòng Tay Bạc S925',
    price: 325000,
    img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=600&fit=crop',
    discount: 25,
    sold: 987
  },
  {
    id: 80,
    category: "Phụ Kiện",
    name: 'Mũ Lưỡi Trai Thêu Logo',
    price: 125000,
    img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=600&fit=crop',
    discount: 12,
    sold: 3456
  },
  {
    id: 81,
    category: "Áo Thun",
    name: 'Áo Thun Cotton Trơn',
    price: 135000,
    img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&h=600&fit=crop',
    discount: 15,
    sold: 4234
  },
  {
    id: 82,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Flannel Kẻ Caro',
    price: 375000,
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop',
    discount: 25,
    sold: 1654
  },
  {
    id: 83,
    category: "Áo Khoác",
    name: 'Áo Khoác Da PU Biker',
    price: 780000,
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop',
    discount: 42,
    sold: 432
  },
  {
    id: 84,
    category: "Quần Jeans",
    name: 'Quần Jean Boyfriend Rách',
    price: 455000,
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop',
    discount: 30,
    sold: 1345
  },
  {
    id: 85,
    category: "Váy & Đầm",
    name: 'Váy Liền Công Sở Đen',
    price: 495000,
    img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&h=600&fit=crop',
    discount: 32,
    sold: 876
  },
  {
    id: 86,
    category: "Chân Váy",
    name: 'Chân Váy Tutu Lưới',
    price: 265000,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
    discount: 20,
    sold: 1987
  },
  {
    id: 87,
    category: "Phụ Kiện",
    name: 'Giày Sandal Nữ Đế Xuồng',
    price: 325000,
    img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=600&fit=crop',
    discount: 28,
    sold: 1543
  },
  {
    id: 88,
    category: "Áo Thun",
    name: 'Áo Thun Raglan Tay Lỡ',
    price: 185000,
    img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&h=600&fit=crop',
    discount: 18,
    sold: 2876
  },
  {
    id: 89,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Satin Bóng',
    price: 425000,
    img: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=600&fit=crop',
    discount: 30,
    sold: 987
  },
  {
    id: 90,
    category: "Áo Khoác",
    name: 'Áo Khoác Dạ Dài Coat',
    price: 950000,
    img: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&h=600&fit=crop',
    discount: 45,
    sold: 234
  },
  {
    id: 91,
    category: "Quần Jeans",
    name: 'Quần Jean Cargo Túi Hộp',
    price: 515000,
    img: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=500&h=600&fit=crop',
    discount: 28,
    sold: 765
  },
  {
    id: 92,
    category: "Váy & Đầm",
    name: 'Đầm Xòe Cổ Vuông Vintage',
    price: 465000,
    img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=600&fit=crop',
    discount: 35,
    sold: 1234
  },
  {
    id: 93,
    category: "Chân Váy",
    name: 'Chân Váy Denim Xẻ Tà',
    price: 335000,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
    discount: 22,
    sold: 1654
  },
  {
    id: 94,
    category: "Phụ Kiện",
    name: 'Túi Đeo Hông Mini Bag',
    price: 215000,
    img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=600&fit=crop',
    discount: 18,
    sold: 2345
  },
  {
    id: 95,
    category: "Áo Thun",
    name: 'Áo Thun Ringer Retro',
    price: 205000,
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
    discount: 20,
    sold: 1987
  },
  {
    id: 96,
    category: "Áo Sơ Mi",
    name: 'Áo Sơ Mi Vạt Dài Asymmetric',
    price: 395000,
    img: 'https://images.unsplash.com/photo-1589992281143-8e0f0d0a3665?w=500&h=600&fit=crop',
    discount: 26,
    sold: 1432
  },
  {
    id: 97,
    category: "Áo Khoác",
    name: 'Áo Khoác Parka Lông Thú',
    price: 1250000,
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop',
    discount: 50,
    sold: 123
  },
  {
    id: 98,
    category: "Quần Jeans",
    name: 'Quần Jean Đen Wash Nhẹ',
    price: 435000,
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=600&fit=crop',
    discount: 24,
    sold: 1765
  },
  {
    id: 99,
    category: "Váy & Đầm",
    name: 'Đầm Maxi Slit Quyến Rũ',
    price: 625000,
    img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop',
    discount: 38,
    sold: 654
  },
  {
    id: 100,
    category: "Phụ Kiện",
    name: 'Kính Râm Aviator Cổ Điển',
    price: 285000,
    img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=600&fit=crop',
    discount: 25,
    sold: 2134
  }
];
const initCategories = [
  { id: 1001, name: "Áo Thun", img: "https://down-vn.img.susercontent.com/file/sg-11134201-22100-3051405021iv33_tn" },
  { id: 1002, name: "Áo Sơ Mi", img: "https://down-vn.img.susercontent.com/file/cn-11134207-7r98o-lm193z6e1086e3_tn" },
  { id: 1003, name: "Áo Khoác", img: "https://down-vn.img.susercontent.com/file/sg-11134201-22120-7469736467kvf4_tn" },
  { id: 1004, name: "Quần Jeans", img: "https://down-vn.img.susercontent.com/file/sg-11134201-22120-5643425557kv6d_tn" },
  { id: 1005, name: "Váy & Đầm", img: "https://down-vn.img.susercontent.com/file/cn-11134207-7r98o-lmg020294192b6_tn" },
  { id: 1006, name: "Chân Váy", img: "https://down-vn.img.susercontent.com/file/cn-11134207-7r98o-ll943805391295_tn" },
  { id: 1007, name: "Phụ Kiện", img: "https://down-vn.img.susercontent.com/file/vn-11134207-7qukw-lf522039201942_tn" },
];

const initBanners = {
  big: [
    "https://cf.shopee.vn/file/vn-50009109-c8c772213d4eb0c102a2815c32d9136c_xxhdpi",
    "https://cf.shopee.vn/file/vn-50009109-7756e18722421c4558e8b0b5550a2995_xxhdpi",
    "https://cf.shopee.vn/file/vn-50009109-ca7d751537233ba49a37e199f36f339c_xxhdpi"
  ],
  smallTop: "https://cf.shopee.vn/file/vn-50009109-1a8df9e82936a71e721c5db605021571_xhdpi",
  smallBottom: "https://cf.shopee.vn/file/vn-50009109-00569106043234b68e77a10271b0586e_xhdpi"
};

const formatPrice = (price: any) => {
  if (typeof price === 'string') return price;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

function App() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [suggestionProducts, setSuggestionProducts] = useState(fallbackSuggestions);
  const [topSearch, setTopSearch] = useState(initTopSearch);
  const [topProducts, setTopProducts] = useState(initTopSearch);
  const [categories, setCategories] = useState(initCategories);
  const [users, setUsers] = useState(fallbackUsers);
  const [bannerData, setBannerData] = useState(initBanners);
  const [flashSaleProducts, setFlashSaleProducts] = useState<any[]>([
    {
      id: 2001,
      name: 'Áo Thun Oversize Hàn Quốc',
      img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&h=600&fit=crop',
      price: 245000,
      category: 'Áo Thun',
      description: 'Áo thun oversize phong cách Hàn Quốc, chất liệu cotton 100%',
      discount: 35,
      stock: 45,
      sold: 18,
      originalPrice: 377000
    },
    {
      id: 2002,
      name: 'Váy Babydoll Phong Cách Hàn',
      img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop',
      price: 390000,
      category: 'Váy & Đầm',
      description: 'Váy babydoll ngọt ngào, chất vải lụa mềm mại',
      discount: 40,
      stock: 30,
      sold: 22,
      originalPrice: 650000
    },
    {
      id: 2003,
      name: 'Quần Jean Straight Nhật Bản',
      img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=600&fit=crop',
      price: 480000,
      category: 'Quần Jeans',
      description: 'Quần jean straight fit phong cách Nhật, form dáng chuẩn',
      discount: 30,
      stock: 38,
      sold: 15,
      originalPrice: 686000
    },
    {
      id: 2004,
      name: 'Áo Khoác Bomber Ulzzang',
      img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop',
      price: 620000,
      category: 'Áo Khoác',
      description: 'Áo khoác bomber phong cách ulzzang Hàn Quốc',
      discount: 45,
      stock: 25,
      sold: 28,
      originalPrice: 1129000
    },
    {
      id: 2005,
      name: 'Túi Đeo Chéo Mini Hàn Quốc',
      img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=600&fit=crop',
      price: 195000,
      category: 'Phụ Kiện',
      description: 'Túi đeo chéo mini size, thiết kế trẻ trung',
      discount: 25,
      stock: 60,
      sold: 45,
      originalPrice: 260000
    },
    {
      id: 2006,
      name: 'Crop Top Dáng Ngắn Style Hàn',
      img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop',
      price: 215000,
      category: 'Áo Croptop',
      description: 'Crop top dáng ngắn, chất vải thun co giãn tốt',
      discount: 30,
      stock: 50,
      sold: 32,
      originalPrice: 307000
    },
    {
      id: 2007,
      name: 'Chân Váy Tennis Hàn Quốc',
      img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
      price: 310000,
      category: 'Chân Váy',
      description: 'Chân váy tennis cổ điển, phối đồ đa dạng',
      discount: 35,
      stock: 42,
      sold: 27,
      originalPrice: 477000
    },
    {
      id: 2008,
      name: 'Hoodie Nỉ Form Rộng',
      img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
      price: 495000,
      category: 'Hoodie',
      description: 'Hoodie nỉ bông form rộng thoải mái, giữ ấm tốt',
      discount: 40,
      stock: 35,
      sold: 24,
      originalPrice: 825000
    },
    {
      id: 2009,
      name: 'Quần Short Jean Rách Vintage',
      img: 'https://images.unsplash.com/photo-1591195851383-2b18e6a8c7b2?w=500&h=600&fit=crop',
      price: 285000,
      category: 'Quần Short',
      description: 'Quần short jean rách phong cách vintage năng động',
      discount: 28,
      stock: 48,
      sold: 19,
      originalPrice: 396000
    },
    {
      id: 2010,
      name: 'Áo Len Cardigan Dài',
      img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=600&fit=crop',
      price: 445000,
      category: 'Áo Len',
      description: 'Áo len cardigan dáng dài thanh lịch',
      discount: 32,
      stock: 28,
      sold: 21,
      originalPrice: 654000
    },
    {
      id: 2011,
      name: 'Giày Sneaker Platform',
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop',
      price: 580000,
      category: 'Giày Sneaker',
      description: 'Giày sneaker đế platform tăng chiều cao tự nhiên',
      discount: 38,
      stock: 32,
      sold: 26,
      originalPrice: 935000
    },
    {
      id: 2012,
      name: 'Đầm Dài Hoa Nhí Vintage',
      img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=600&fit=crop',
      price: 520000,
      category: 'Váy & Đầm',
      description: 'Đầm dài họa tiết hoa nhí phong cách vintage',
      discount: 42,
      stock: 22,
      sold: 18,
      originalPrice: 897000
    },
    {
      id: 2013,
      name: 'Áo Thun Basic Cổ Tròn',
      img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=600&fit=crop',
      price: 165000,
      category: 'Áo Thun',
      description: 'Áo thun basic cổ tròn, chất liệu cotton thoáng mát',
      discount: 20,
      stock: 80,
      sold: 56,
      originalPrice: 206000
    },
    {
      id: 2014,
      name: 'Balo Canvas Minimalist',
      img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop',
      price: 340000,
      category: 'Phụ Kiện',
      description: 'Balo canvas phong cách tối giản, nhiều ngăn tiện dụng',
      discount: 25,
      stock: 40,
      sold: 31,
      originalPrice: 453000
    },
    {
      id: 2015,
      name: 'Áo Khoác Jeans Wash Nhẹ',
      img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop',
      price: 590000,
      category: 'Áo Khoác',
      description: 'Áo khoác jeans wash nhẹ, phong cách retro',
      discount: 48,
      stock: 20,
      sold: 16,
      originalPrice: 1135000
    },
    {
      id: 2016,
      name: 'Quần Jean Ống Loe Retro',
      img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=600&fit=crop',
      price: 465000,
      category: 'Quần Jeans',
      description: 'Quần jean ống loe phong cách retro 70s',
      discount: 35,
      stock: 36,
      sold: 23,
      originalPrice: 716000
    },
    {
      id: 2017,
      name: 'Áo Sơ Mi Oversize Unisex',
      img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop',
      price: 385000,
      category: 'Áo Sơ Mi',
      description: 'Áo sơ mi oversize unisex, phong cách streetwear',
      discount: 30,
      stock: 44,
      sold: 29,
      originalPrice: 550000
    },
    {
      id: 2018,
      name: 'Chân Váy Bút Chì Công Sở',
      img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
      price: 325000,
      category: 'Chân Váy',
      description: 'Chân váy bút chì công sở thanh lịch, dáng chuẩn',
      discount: 25,
      stock: 52,
      sold: 34,
      originalPrice: 433000
    },
    {
      id: 2019,
      name: 'Hoodie Zip Basic',
      img: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500&h=600&fit=crop',
      price: 475000,
      category: 'Hoodie',
      description: 'Hoodie zip cơ bản, dễ phối đồ hàng ngày',
      discount: 32,
      stock: 38,
      sold: 25,
      originalPrice: 699000
    },
    {
      id: 2020,
      name: 'Áo Sơ Mi Lụa Cao Cấp',
      img: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=600&fit=crop',
      price: 450000,
      category: 'Áo Sơ Mi',
      description: 'Áo sơ mi lụa cao cấp, sang trọng và mềm mại',
      discount: 40,
      stock: 26,
      sold: 20,
      originalPrice: 750000
    }
  ]);

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [toast, setToast] = useState<{ message: string, type: string } | null>(null);

  // Debug search keyword changes
  useEffect(() => {
    console.log('🔍 Search keyword changed to:', searchKeyword);
  }, [searchKeyword]);

  // --- KHÔI PHỤC CURRENTUSER TỪ LOCALSTORAGE KHI COMPONENT MOUNT ---
  useEffect(() => {
    const savedCurrentUser = localStorage.getItem('currentUser');
    if (savedCurrentUser) {
      try {
        setCurrentUser(JSON.parse(savedCurrentUser));
      } catch (e) {
        console.error("Lỗi parse currentUser:", e);
      }
    }

    // Load categories từ localStorage
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error("Lỗi parse categories:", e);
      }
    }
    
    // Load products từ localStorage - NẾU KHÔNG CÓ THÌ DÙNG FALLBACK
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        // Chỉ set nếu có ít nhất 1 sản phẩm
        if (parsed && parsed.length > 0) {
          setSuggestionProducts(parsed);
        } else {
          // Nếu rỗng, dùng fallback và lưu lại
          localStorage.setItem('products', JSON.stringify(fallbackSuggestions));
        }
      } catch (e) {
        console.error("Lỗi parse products:", e);
        localStorage.setItem('products', JSON.stringify(fallbackSuggestions));
      }
    } else {
      // Nếu chưa có, lưu fallback vào localStorage
      localStorage.setItem('products', JSON.stringify(fallbackSuggestions));
    }
    
    // Load banner từ localStorage
    const savedBanner = localStorage.getItem('bannerData');
    if (savedBanner) {
      try {
        setBannerData(JSON.parse(savedBanner));
      } catch (e) {
        console.error("Lỗi parse banner:", e);
      }
    }
    
    // Load topProducts từ localStorage
    const savedTopProducts = localStorage.getItem('topProducts');
    if (savedTopProducts) {
      try {
        setTopProducts(JSON.parse(savedTopProducts));
      } catch (e) {
        console.error("Lỗi parse topProducts:", e);
      }
    } else {
      // Nếu chưa có, dùng initTopSearch làm default
      localStorage.setItem('topProducts', JSON.stringify(initTopSearch));
    }
    
    // Load topSearch từ localStorage
    const savedTopSearch = localStorage.getItem('topSearch');
    if (savedTopSearch) {
      try {
        setTopSearch(JSON.parse(savedTopSearch));
      } catch (e) {
        console.error("Lỗi parse topSearch:", e);
      }
    } else {
      // Nếu chưa có, lưu initTopSearch
      localStorage.setItem('topSearch', JSON.stringify(initTopSearch));
    }
    
    // Load users từ localStorage
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        setUsers(parsedUsers);
      } catch (e) {
        console.error("Lỗi parse users:", e);
      }
    }
    
    // Load flashSaleProducts từ localStorage - NẾU KHÔNG CÓ THÌ DÙNG DEFAULT
    const savedFlashSale = localStorage.getItem('flashSaleProducts');
    if (savedFlashSale) {
      try {
        const parsed = JSON.parse(savedFlashSale);
        if (parsed && parsed.length > 0) {
          setFlashSaleProducts(parsed);
        }
      } catch (e) {
        console.error("Lỗi parse flashSaleProducts:", e);
      }
    }
  }, []);

  // --- FETCH API TỪ SERVER ---
  useEffect(() => {
    // 1. Lấy Sản Phẩm
    fetch('http://localhost:3000/api/products')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const formattedData = data.map((item: any) => ({
            ...item,
            id: item._id, // Map _id của Mongo sang id
            price: item.price
          }));
          setSuggestionProducts(formattedData);
          localStorage.setItem('products', JSON.stringify(formattedData));
        }
      })
      .catch(err => console.error("Lỗi lấy sản phẩm (Có thể do chưa bật Server Nodejs):", err));

    // 2. Lấy Người Dùng
    fetch('http://localhost:3000/api/users')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const formattedUsers = data.map((u: any) => ({ ...u, id: u._id }));
          setUsers(prev => {
            const updated = [...prev, ...formattedUsers];
            localStorage.setItem('users', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(err => console.error("Lỗi lấy user:", err));
  }, []);

  const showToast = (message: string, type = 'success') => { setToast({ message, type }); };

  // Chuẩn bị dữ liệu hiển thị (Format giá)
  const displayProducts = suggestionProducts.map(p => ({
    ...p,
    priceDisplay: formatPrice(p.price)
  }));

  // Tất cả sản phẩm bao gồm: topProducts, displayProducts, và flashSaleProducts
  const allProducts = [
    ...topProducts,
    ...displayProducts,
    ...flashSaleProducts.map(p => ({ ...p, priceDisplay: formatPrice(p.price) }))
  ];

  // --- CÁC HÀM XỬ LÝ LOGIC ---
  const handleAddToCart = (product: any, size: string) => {
    setCartItems(prev => {
      const exist = prev.find(item => item.id === product.id && item.size === size);
      if (exist) {
        return prev.map(item => (item.id === product.id && item.size === size) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, size, quantity: 1, cartId: Date.now() }];
    });
    showToast("Đã thêm vào giỏ hàng!", 'success');
  };

  const handleUpdateQuantity = (cartId: number, amount: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (cartId: number) => { setCartItems(prev => prev.filter(item => item.cartId !== cartId)); };

  const handleCheckoutSuccess = (totalAmount: number) => {
    const newOrder = { items: cartItems, total: totalAmount, date: new Date().toISOString() };
    setOrders([...orders, newOrder]);
    setCartItems([]);
    showToast("Đặt hàng thành công!", 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    showToast("Đã đăng xuất thành công!", "info");
  };

  const filteredProducts = displayProducts.filter(p => {
    const productName = p.name.toLowerCase();
    const keyword = searchKeyword.toLowerCase();
    return productName.includes(keyword);
  });

  // Debug log
  console.log('Search keyword:', searchKeyword);
  console.log('Display products count:', displayProducts.length);
  console.log('Filtered products count:', filteredProducts.length);
  if (searchKeyword) {
    console.log('Sample filtered products:', filteredProducts.slice(0, 3).map(p => p.name));
  }

  // --- RENDER GIAO DIỆN ---
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div>
            {/* Header luôn hiển thị ở trên cùng */}
            <Header
              cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              onSearch={setSearchKeyword}
              showToast={showToast}
            />

          {/* --- CẤU HÌNH ROUTER (ĐỊNH TUYẾN) --- */}
          <Routes>
            {/* 1. TRANG CHỦ */}
            <Route path="/" element={
              <HomePage 
                products={filteredProducts}
                categories={categories}
                topSearch={topSearch}
                bannerData={bannerData}
                flashSaleProducts={flashSaleProducts}
                onBuy={handleAddToCart}
              />
            } />

            {/* Tạo trang tìm kiếm */}
            <Route path="/search" element={
              <SearchResultsPage 
                allProducts={allProducts}
                onBuy={handleAddToCart}
                showToast={showToast}
              />
            } />

            {/* 2. TRANG ADMIN */}
            <Route path="/admin" element={
              <AdminPage
                products={suggestionProducts} setProducts={setSuggestionProducts}
                topSearch={topSearch} setTopSearch={setTopSearch}
                topProducts={topProducts} setTopProducts={setTopProducts}
                categories={categories} setCategories={setCategories}
                users={users} setUsers={setUsers}
                bannerData={bannerData} setBannerData={setBannerData}
                flashSaleProducts={flashSaleProducts} setFlashSaleProducts={setFlashSaleProducts}
                currentUser={currentUser} showToast={showToast}
              />
            } />

            {/* 3. CÁC TRANG CHỨC NĂNG KHÁC */}
            <Route path="/category/:id" element={<CategoryPage products={displayProducts} categories={categories} />} />
            
            {/* 3a. TRANG SẢN PHẨM BÁN CHẠY */}
            <Route path="/top-products" element={<TopProductsPage products={topProducts} onBuy={handleAddToCart} categories={categories} />} />

            {/* 3b. TRANG FLASH SALE */}
            <Route path="/flash-sale" element={<FlashSalePage flashSaleProducts={flashSaleProducts} onBuy={handleAddToCart} />} />

            {/* TRANG CHI TIẾT SẢN PHẨM */}
            <Route path="/product/:id" element={<ProductDetailPage products={allProducts} flashSaleProducts={flashSaleProducts} onAddToCart={handleAddToCart} showToast={showToast} />} />

            {/* TRANG ĐĂNG NHẬP/ĐĂNG KÝ */}
            <Route path="/login" element={<LoginPage showToast={showToast} />} />
            
            {/* TRANG GIỎ HÀNG & THANH TOÁN */}
            <Route path="/checkout" element={<CheckoutPage cartItems={cartItems} onRemove={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} onCheckoutSuccess={handleCheckoutSuccess} showToast={showToast} />} />
            
            {/* TRANG CÁ NHÂN NGƯỜI DÙNG */}
            <Route path="/profile" element={<UserProfilePage showToast={showToast} />} />
            
            {/* TRANG ĐƠN HÀNG (CŨ - GIỮ LẠI ĐỂ TƯƠNG THÍCH) */}
            <Route path="/orders" element={<OrderPage orders={orders} />} />

            {/* TRANG 3D VIRTUAL TRY-ON */}
            <Route path="/try-on" element={<VirtualTryOn />} />

            {/* TRANG TRUNG TÂM TRỢ GIÚP */}
            <Route path="/help" element={<HelpPage />} />

            {/* TRANG GIỚI THIỆU */}
            <Route path="/about" element={<AboutPage />} />

            {/* TRANG CHÍNH SÁCH */}
            <Route path="/guide" element={<PolicyPage />} />
            <Route path="/sell-guide" element={<PolicyPage />} />
            <Route path="/payment" element={<PolicyPage />} />
            <Route path="/shipping" element={<PolicyPage />} />
            <Route path="/return-policy" element={<PolicyPage />} />
            <Route path="/privacy" element={<PolicyPage />} />
            <Route path="/terms" element={<PolicyPage />} />
            <Route path="/cookies" element={<PolicyPage />} />

          </Routes>

          {/* Thông báo (Toast) hiển thị đè lên trên cùng */}
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          
          {/* Footer luôn hiển thị ở cuối */}
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
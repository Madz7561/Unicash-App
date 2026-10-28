import React from 'react';
import {
  Utensils,
  Home,
  Bus,
  BookOpen,
  Smartphone,
  HeartPulse,
  Coffee,
  MoreHorizontal,
  Wallet,
  TrendingDown,
  TrendingUp,
  EggFried,
  Moon,
  HandCoins,
  Receipt,
  CookingPot,
} from 'lucide-react';

export default function CategoryIcon({ categoryId, size = 18, className = '' }) {
  switch (categoryId) {
    case 'breakfast':
      return <EggFried size={size} className={className} />;
    case 'lunch':
      return <Utensils size={size} className={className} />;
    case 'dinner':
      return <Moon size={size} className={className} />;
    case 'lent':
      return <HandCoins size={size} className={className} />;
    case 'borrowed':
      return <Receipt size={size} className={className} />;
    case 'food':
      return <CookingPot size={size} className={className} />;
    case 'boarding':
      return <Home size={size} className={className} />;
    case 'transport':
      return <Bus size={size} className={className} />;
    case 'academic':
      return <BookOpen size={size} className={className} />;
    case 'reload':
      return <Smartphone size={size} className={className} />;
    case 'personal':
      return <HeartPulse size={size} className={className} />;
    case 'entertainment':
      return <Coffee size={size} className={className} />;
    case 'income':
      return <TrendingUp size={size} className={className} />;
    default:
      return <MoreHorizontal size={size} className={className} />;
  }
}

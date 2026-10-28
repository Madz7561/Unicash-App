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
} from 'lucide-react';

export default function CategoryIcon({ categoryId, size = 18, className = '' }) {
  switch (categoryId) {
    case 'food':
      return <Utensils size={size} className={className} />;
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

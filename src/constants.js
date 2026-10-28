export const CATEGORIES = {
  food: {
    id: 'food',
    nameEn: 'Food & Meals',
    nameSi: 'කෑම බීම / කැන්ටිම',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    icon: 'Utensils',
  },
  transport: {
    id: 'transport',
    nameEn: 'Transport (Bus/Train)',
    nameSi: 'ප්‍රවාහන / බස් / කෝච්චි',
    color: '#0ea5e9',
    bgColor: 'rgba(14, 165, 233, 0.15)',
    icon: 'Bus',
  },
  academic: {
    id: 'academic',
    nameEn: 'Studies & Printouts',
    nameSi: 'පොත්පත් / ප්‍රින්ට්අවුට්',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    icon: 'BookOpen',
  },
  reload: {
    id: 'reload',
    nameEn: 'Mobile & Internet',
    nameSi: 'රිලෝඩ් / ඩේටා පැකේජ්',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    icon: 'Smartphone',
  },
  boarding: {
    id: 'boarding',
    nameEn: 'Boarding / Rent',
    nameSi: 'බෝඩිං / කාමර කුලී',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    icon: 'Home',
  },
  personal: {
    id: 'personal',
    nameEn: 'Personal Needs',
    nameSi: 'පෞද්ගලික වියදම්',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    icon: 'HeartPulse',
  },
  entertainment: {
    id: 'entertainment',
    nameEn: 'Outing & Tea',
    nameSi: 'යාලුවොත් එක්ක තේ බීම',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    icon: 'Coffee',
  },
  other: {
    id: 'other',
    nameEn: 'Other',
    nameSi: 'වෙනත් වියදම්',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.15)',
    icon: 'MoreHorizontal',
  },
};

export const QUICK_ADD_EXPENSES = [
  { labelEn: 'Canteen Lunch', labelSi: 'කැන්ටිමේ දවල් කෑම', amount: 200, category: 'food' },
  { labelEn: 'Tea & Bun', labelSi: 'තේ සහ බනිස්', amount: 90, category: 'food' },
  { labelEn: 'Dinner', labelSi: 'රාත්‍රී ආහාරය', amount: 300, category: 'food' },
  { labelEn: 'Bus / Train', labelSi: 'බස් / කෝච්චි', amount: 70, category: 'transport' },
  { labelEn: 'Printout', labelSi: 'ප්‍රින්ට්අවුට් / ෆොටෝකොපි', amount: 50, category: 'academic' },
  { labelEn: 'Reload', labelSi: 'ෆෝන් රිලෝඩ්', amount: 150, category: 'reload' },
];

export const QUICK_ADD_INCOME = [
  { labelEn: 'From Home', labelSi: 'ගෙදරින් එව්වා', amount: 2000 },
  { labelEn: 'From Home', labelSi: 'ගෙදරින් එව්වා', amount: 3000 },
  { labelEn: 'From Home', labelSi: 'ගෙදරින් එව්වා', amount: 5000 },
  { labelEn: 'From Home', labelSi: 'ගෙදරින් එව්වා', amount: 10000 },
];

export const INITIAL_SETTINGS = {
  currency: 'Rs.',
  language: 'en', // 'en' default as requested
  darkMode: true,
};

export const INITIAL_TRANSACTIONS = [
  {
    id: 't-1',
    type: 'income',
    amount: 8000,
    category: 'other',
    note: 'Starting Cash in Hand',
    date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0],
  },
  {
    id: 't-2',
    type: 'expense',
    amount: 250,
    category: 'food',
    note: 'Canteen Lunch',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
  },
  {
    id: 't-3',
    type: 'expense',
    amount: 140,
    category: 'transport',
    note: 'Bus Fare',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
  },
  {
    id: 't-4',
    type: 'expense',
    amount: 200,
    category: 'food',
    note: 'Canteen Lunch & Tea',
    date: new Date().toISOString().split('T')[0],
  },
];

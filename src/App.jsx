import React, { useState, useEffect, useRef } from 'react';
import {
  INITIAL_SETTINGS,
  CATEGORIES,
  QUICK_ADD_EXPENSES,
  QUICK_ADD_INCOME,
} from './constants';
import CategoryIcon from './components/CategoryIcon';
import Charts from './components/Charts';
import {
  fetchNetworkInfo,
  loginApi,
  registerApi,
  fetchUserDataApi,
  saveUserDataApi,
} from './apiService';
import {
  Plus,
  Trash2,
  Calendar,
  Settings,
  PieChart,
  Sun,
  Moon,
  Download,
  Search,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  AlertTriangle,
  Clock,
  Smartphone,
  Copy,
  Check,
  Share2,
  LogOut,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronDown,
  PhoneCall,
  MessageSquare,
  Users,
  HandCoins,
  CheckCircle2,
  MessageCircle,
  Send,
  Sparkles,
  Receipt,
  Landmark,
  CreditCard,
  ArrowLeftRight,
  Banknote,
} from 'lucide-react';
import './App.css';

const AVATARS = ['🎓', '⚡', '🎒', '☕', '🚀', '💡', '🦁', '🌸', '💻', '🎧'];

export default function App() {
  // Current logged in user profile: { id, username, name, avatar }
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('unicash_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auth screen mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regAvatar, setRegAvatar] = useState('🎓');
  const [regBalance, setRegBalance] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Active user data
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);

  // Active navigation tab: 'wallet' | 'loans' | 'analytics' | 'settings'
  const [activeTab, setActiveTab] = useState('wallet');

  // Input form state (Expenses / Cash additions)
  const [entryType, setEntryType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('lunch');
  const [entryAccount, setEntryAccount] = useState('cash'); // 'cash' | 'bank'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all'); // 'all' | 'cash' | 'bank'

  // Loan & Debt Modal state (Tracking both Lent & Borrowed money)
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanType, setLoanType] = useState('lent'); // 'lent' | 'borrowed'
  const [loanFriendName, setLoanFriendName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanNote, setLoanNote] = useState('');
  const [loanPhone, setLoanPhone] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanPaymentSource, setLoanPaymentSource] = useState('cash'); // 'cash' | 'bank' | 'direct_bill' | 'none'
  const [debtDirectionFilter, setDebtDirectionFilter] = useState('all'); // 'all' | 'lent' | 'borrowed'
  const [loanFilter, setLoanFilter] = useState('all'); // 'all' | 'pending' | 'settled'
  const [loanSearch, setLoanSearch] = useState('');

  // Edit current balance directly
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceEditTarget, setBalanceEditTarget] = useState('cash'); // 'cash' | 'bank'
  const [directBalanceInput, setDirectBalanceInput] = useState('');

  // ATM Transfer Modal (Bank to Cash in Hand / Deposit)
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDirection, setTransferDirection] = useState('bank-to-cash'); // 'bank-to-cash' | 'cash-to-bank'

  // Toast feedback state
  const [toastMsg, setToastMsg] = useState('');

  // User menu dropdown & iPhone modal
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({
    ip: '172.20.10.6',
    port: 5173,
    url: 'http://172.20.10.6:5173',
    tunnelUrl: 'https://korean-planet-valuable-jet.trycloudflare.com',
  });
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'

  const lastUpdatedRef = useRef(0);
  const isSavingRef = useRef(false);
  const toastTimeoutRef = useRef(null);

  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMsg(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg('');
    }, 3500);
  };

  // Fetch server network info (if local server is running)
  useEffect(() => {
    fetchNetworkInfo().then(data => {
      if (data && data.url) setNetworkInfo(data);
    });
  }, []);

  // Save active user in localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('unicash_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('unicash_auth_user');
    }
  }, [currentUser]);

  // Load user data when currentUser is logged in
  useEffect(() => {
    if (!currentUser) return;

    const loadUserData = async () => {
      try {
        setSyncStatus('syncing');
        const data = await fetchUserDataApi(currentUser.id);
        if (data) {
          setTransactions(data.transactions || []);
          setSettings(data.settings || INITIAL_SETTINGS);
          setLoans(data.loans || []);
          lastUpdatedRef.current = data.lastUpdated || Date.now();
          setSyncStatus('synced');
        } else {
          setSyncStatus('offline');
        }
      } catch {
        setSyncStatus('offline');
      }
    };

    loadUserData();

    // 2-Way Sync polling from Firebase Cloud Database
    const interval = setInterval(async () => {
      if (isSavingRef.current || !currentUser) return;
      try {
        const data = await fetchUserDataApi(currentUser.id);
        if (data && (data.lastUpdated || 0) > lastUpdatedRef.current) {
          lastUpdatedRef.current = data.lastUpdated || Date.now();
          setTransactions(data.transactions || []);
          if (data.settings) setSettings(data.settings);
          if (data.loans) setLoans(data.loans);
          setSyncStatus('synced');
        }
      } catch {
        setSyncStatus('offline');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Save current user data to Firebase Cloud Database
  const saveUserData = async (newTx, newStg, newLoans) => {
    if (!currentUser) return;
    try {
      setSyncStatus('syncing');
      isSavingRef.current = true;
      const txToSave = newTx !== undefined ? newTx : transactions;
      const stgToSave = newStg !== undefined ? newStg : settings;
      const loansToSave = newLoans !== undefined ? newLoans : loans;

      const payload = {
        id: currentUser.id,
        transactions: txToSave,
        settings: stgToSave,
        loans: loansToSave,
        lastUpdated: Date.now(),
      };
      lastUpdatedRef.current = payload.lastUpdated;

      const success = await saveUserDataApi(payload);
      if (success) setSyncStatus('synced');
      else setSyncStatus('offline');
    } catch {
      setSyncStatus('offline');
    } finally {
      setTimeout(() => { isSavingRef.current = false; }, 500);
    }
  };

  // Auth: Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const data = await loginApi(authUsername.trim(), authPassword.trim());
      if (data.success) {
        setCurrentUser(data.user);
        setTransactions(data.data.transactions || []);
        setSettings(data.data.settings || INITIAL_SETTINGS);
        setLoans(data.data.loans || []);
        lastUpdatedRef.current = data.data.lastUpdated || Date.now();
        setAuthUsername('');
        setAuthPassword('');
      } else {
        setAuthError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setAuthError('Connection error: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Register handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authPassword.length < 4) {
      setAuthError('Password must be at least 4 characters');
      return;
    }

    if (authPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setAuthLoading(true);

    try {
      const data = await registerApi({
        username: authUsername.trim(),
        password: authPassword.trim(),
        name: regName.trim(),
        avatar: regAvatar,
        initialBalance: parseFloat(regBalance) || 0,
      });

      if (data.success) {
        setCurrentUser(data.user);
        setTransactions(data.data.transactions || []);
        setSettings(data.data.settings || INITIAL_SETTINGS);
        setLoans(data.data.loans || []);
        lastUpdatedRef.current = data.data.lastUpdated || Date.now();
        setAuthUsername('');
        setAuthPassword('');
        setRegName('');
        setRegConfirmPassword('');
        setRegBalance('');
      } else {
        setAuthError(data.error || 'Registration failed');
      }
    } catch (err) {
      setAuthError('Error: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsUserMenuOpen(false);
    setAuthError('');
  };

  // Dark mode class on root
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-theme');
    }
  }, [settings.darkMode]);

  const todayStr = new Date().toISOString().split('T')[0];
  const currency = settings.currency || 'Rs.';
  const isSi = settings.language === 'si';

  // Totals calculations for active user
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // 1. Cash in Hand calculations (default is 'cash' for backward compatibility)
  const cashIncome = transactions
    .filter(t => t.type === 'income' && (t.account || 'cash') === 'cash')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const cashExpense = transactions
    .filter(t => t.type === 'expense' && (t.account || 'cash') === 'cash')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const cashBalance = cashIncome - cashExpense;

  // 2. Bank Account calculations (Reloads, Online payments, Transfers)
  const bankIncome = transactions
    .filter(t => t.type === 'income' && t.account === 'bank')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const bankExpense = transactions
    .filter(t => t.type === 'expense' && t.account === 'bank')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const bankBalance = bankIncome - bankExpense;

  // 3. Combined Total Net Balance
  const totalBalance = cashBalance + bankBalance;
  const currentBalance = cashBalance; // For cash survival estimate

  const todaySpent = transactions
    .filter(t => t.type === 'expense' && t.date === todayStr)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const recentExpenses = transactions.filter(t => t.type === 'expense');
  const uniqueDates = [...new Set(recentExpenses.map(t => t.date))];
  const numDaysActive = Math.max(1, uniqueDates.length);
  const avgDailySpend = Math.round(totalExpense / numDaysActive) || 450;

  const estimatedDaysLeft = cashBalance > 0 && avgDailySpend > 0
    ? Math.max(1, Math.floor(cashBalance / avgDailySpend))
    : 0;

  // ================= FRIEND DEBT CALCULATIONS =================
  // 1. Money Lent to Friends (Owed to Me)
  const lentLoans = loans.filter(l => (l.type || 'lent') === 'lent');
  const pendingLent = lentLoans.filter(l => l.status === 'pending');
  const settledLent = lentLoans.filter(l => l.status === 'settled');
  const totalPendingLent = pendingLent.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const totalSettledLent = settledLent.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const pendingLentFriendsCount = new Set(pendingLent.map(l => (l.friendName || '').trim().toLowerCase())).size;

  // 2. Money Borrowed from Friends (I Owe)
  const borrowedLoans = loans.filter(l => l.type === 'borrowed');
  const pendingBorrowed = borrowedLoans.filter(l => l.status === 'pending');
  const settledBorrowed = borrowedLoans.filter(l => l.status === 'settled');
  const totalPendingBorrowed = pendingBorrowed.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const totalSettledBorrowed = settledBorrowed.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const pendingBorrowedFriendsCount = new Set(pendingBorrowed.map(l => (l.friendName || '').trim().toLowerCase())).size;

  // 3. Net Balance & Open Debts Count
  const netFriendBalance = totalPendingLent - totalPendingBorrowed;
  const totalPendingDebtsCount = pendingLent.length + pendingBorrowed.length;

  // Add regular transaction (Expense or Income)
  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    const cat = CATEGORIES[category] || CATEGORIES.other;
    const isBank = entryAccount === 'bank';
    const defaultNote = entryType === 'income'
      ? (isSi ? (isBank ? 'ගෙදරින් Bank එකට දැම්මා' : 'ගෙදරින් ලැබුණු මුදල්') : (isBank ? 'Bank Deposit from Home' : 'Received from Home'))
      : (isSi ? cat.nameSi : cat.nameEn);

    const newTx = {
      id: 'tx-' + Date.now(),
      type: entryType,
      amount: amt,
      account: entryAccount,
      category: entryType === 'income' ? 'other' : category,
      date: todayStr,
      note: note.trim() || defaultNote,
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveUserData(updated, settings, loans);
    setAmount('');
    setNote('');
    showToast(entryType === 'expense' 
      ? `Spent ${currency} ${amt.toLocaleString()} via ${isBank ? '🏦 Bank' : '💵 Cash'}` 
      : `Added ${currency} ${amt.toLocaleString()} to ${isBank ? '🏦 Bank' : '💵 Cash'}`);
  };

  const handleQuickExpense = (item) => {
    const acc = item.account || (item.category === 'reload' ? 'bank' : 'cash');
    const newTx = {
      id: 'tx-' + Date.now(),
      type: 'expense',
      amount: item.amount,
      account: acc,
      category: item.category,
      date: todayStr,
      note: isSi ? item.labelSi : item.labelEn,
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveUserData(updated, settings, loans);
    showToast(`Quick Expense: ${item.labelEn} (${currency} ${item.amount} via ${acc === 'bank' ? '🏦 Bank' : '💵 Cash'})`);
  };

  const handleQuickIncome = (item) => {
    const acc = item.account || 'cash';
    const newTx = {
      id: 'tx-' + Date.now(),
      type: 'income',
      amount: item.amount,
      account: acc,
      category: 'other',
      date: todayStr,
      note: isSi ? item.labelSi : item.labelEn,
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveUserData(updated, settings, loans);
    showToast(`Added ${currency} ${item.amount.toLocaleString()} to ${acc === 'bank' ? '🏦 Bank' : '💵 Cash'}`);
  };

  const handleDirectBalanceSave = (e) => {
    e.preventDefault();
    const targetVal = parseFloat(directBalanceInput);
    if (isNaN(targetVal)) return;

    const isBank = balanceEditTarget === 'bank';
    const currentVal = isBank ? bankBalance : cashBalance;
    const difference = targetVal - currentVal;
    if (difference !== 0) {
      const adjustmentTx = {
        id: 'tx-' + Date.now(),
        type: difference > 0 ? 'income' : 'expense',
        amount: Math.abs(difference),
        account: isBank ? 'bank' : 'cash',
        category: 'other',
        date: todayStr,
        note: isSi
          ? (isBank 
              ? `බැංකු ශේෂය සකස් කිරීම (${currency} ${targetVal.toLocaleString()})`
              : `අතේ ඇති මුදල සකස් කිරීම (${currency} ${targetVal.toLocaleString()})`)
          : (isBank 
              ? `Direct Bank Balance Adjustment to ${currency} ${targetVal.toLocaleString()}`
              : `Direct Cash Balance Adjustment to ${currency} ${targetVal.toLocaleString()}`),
      };
      const updated = [adjustmentTx, ...transactions];
      setTransactions(updated);
      saveUserData(updated, settings, loans);
    }

    setIsEditingBalance(false);
    setDirectBalanceInput('');
    showToast(isSi 
      ? `${isBank ? 'බැංකු ශේෂය' : 'අතේ ඇති මුදල'} ${currency} ${targetVal.toLocaleString()} ලෙස සකසන ලදී` 
      : `${isBank ? 'Bank' : 'Cash'} balance set to ${currency} ${targetVal.toLocaleString()}`);
  };

  // ATM Cash Withdrawal or Cash Deposit
  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (transferDirection === 'bank-to-cash') {
      const bankTx = {
        id: 'tx-tf-bank-' + Date.now(),
        type: 'expense',
        amount: amt,
        account: 'bank',
        category: 'other',
        date: todayStr,
        note: isSi ? 'ATM එකෙන් මුදල් ගැනීම (Bank ➔ Cash)' : 'ATM Cash Withdrawal (Bank ➔ Cash)',
      };
      const cashTx = {
        id: 'tx-tf-cash-' + (Date.now() + 1),
        type: 'income',
        amount: amt,
        account: 'cash',
        category: 'other',
        date: todayStr,
        note: isSi ? 'ATM මුදල් පසුම්බියට (Cash in Hand)' : 'ATM Cash in Hand',
      };
      const updated = [cashTx, bankTx, ...transactions];
      setTransactions(updated);
      saveUserData(updated, settings, loans);
      showToast(isSi 
        ? `ATM මාරුව සාර්ථකයි! ${currency} ${amt.toLocaleString()} අතේ මුදලට එකතු විය.` 
        : `ATM transfer complete! Added ${currency} ${amt.toLocaleString()} to Cash in Hand.`);
    } else {
      const cashTx = {
        id: 'tx-tf-cash-' + Date.now(),
        type: 'expense',
        amount: amt,
        account: 'cash',
        category: 'other',
        date: todayStr,
        note: isSi ? 'බැංකුවට දැමූ මුදල් (Cash ➔ Bank)' : 'Cash Deposit to Bank',
      };
      const bankTx = {
        id: 'tx-tf-bank-' + (Date.now() + 1),
        type: 'income',
        amount: amt,
        account: 'bank',
        category: 'other',
        date: todayStr,
        note: isSi ? 'බැංකු තැන්පතුව (Bank Deposit)' : 'Bank Account Deposit',
      };
      const updated = [bankTx, cashTx, ...transactions];
      setTransactions(updated);
      saveUserData(updated, settings, loans);
      showToast(isSi 
        ? `තැන්පතුව සාර්ථකයි! ${currency} ${amt.toLocaleString()} බැංකුවට එකතු විය.` 
        : `Deposit complete! Added ${currency} ${amt.toLocaleString()} to Bank.`);
    }

    setTransferModalOpen(false);
    setTransferAmount('');
  };

  const handleDelete = (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveUserData(updated, settings, loans);
    showToast('Transaction removed');
  };

  // ================= FRIEND LOANS & DEBTS HANDLERS =================
  const handleAddLoanSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(loanAmount);
    if (!loanFriendName.trim() || isNaN(amt) || amt <= 0) return;

    const newLoan = {
      id: 'loan-' + Date.now(),
      type: loanType, // 'lent' or 'borrowed'
      friendName: loanFriendName.trim(),
      amount: amt,
      note: loanNote.trim(),
      phone: loanPhone.trim(),
      date: loanDate || todayStr,
      status: 'pending',
      paymentSource: loanPaymentSource, // 'cash' | 'bank' | 'direct_bill' | 'none'
      createdAt: Date.now(),
    };

    let updatedTx = transactions;

    if (loanType === 'lent') {
      // 🤝 I paid for friend / lent money
      if (loanPaymentSource === 'cash') {
        const tx = {
          id: 'tx-loan-' + Date.now(),
          type: 'expense',
          amount: amt,
          account: 'cash',
          category: 'lent',
          date: newLoan.date,
          note: `Paid for ${newLoan.friendName}${newLoan.note ? ` (${newLoan.note})` : ''}`,
          loanId: newLoan.id,
        };
        updatedTx = [tx, ...transactions];
      } else if (loanPaymentSource === 'bank') {
        const tx = {
          id: 'tx-loan-' + Date.now(),
          type: 'expense',
          amount: amt,
          account: 'bank',
          category: 'lent',
          date: newLoan.date,
          note: `Paid from Bank for ${newLoan.friendName}${newLoan.note ? ` (${newLoan.note})` : ''}`,
          loanId: newLoan.id,
        };
        updatedTx = [tx, ...transactions];
      }
      // If 'none', no wallet deduction
    } else {
      // 📥 Friend paid for me / I borrowed
      if (loanPaymentSource === 'cash') {
        const tx = {
          id: 'tx-borrow-' + Date.now(),
          type: 'income',
          amount: amt,
          account: 'cash',
          category: 'borrowed',
          date: newLoan.date,
          note: `Cash borrowed from ${newLoan.friendName}${newLoan.note ? ` (${newLoan.note})` : ''}`,
          loanId: newLoan.id,
        };
        updatedTx = [tx, ...transactions];
      } else if (loanPaymentSource === 'bank') {
        const tx = {
          id: 'tx-borrow-' + Date.now(),
          type: 'income',
          amount: amt,
          account: 'bank',
          category: 'borrowed',
          date: newLoan.date,
          note: `Bank transfer from ${newLoan.friendName}${newLoan.note ? ` (${newLoan.note})` : ''}`,
          loanId: newLoan.id,
        };
        updatedTx = [tx, ...transactions];
      }
      // If 'direct_bill', friend paid directly at counter/canteen, so physical cash is NOT falsely added!
    }

    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);
    setTransactions(updatedTx);
    saveUserData(updatedTx, settings, updatedLoans);

    // Reset form
    setLoanFriendName('');
    setLoanAmount('');
    setLoanNote('');
    setLoanPhone('');
    setLoanDate(todayStr);
    setLoanModalOpen(false);

    showToast(
      loanType === 'lent'
        ? `Recorded: Paid ${currency} ${amt.toLocaleString()} for ${newLoan.friendName} (Owed to you)`
        : `Recorded: ${newLoan.friendName} paid / lent ${currency} ${amt.toLocaleString()} (You owe friend)`
    );
  };

  const handleSettleLoan = (loanId) => {
    const target = loans.find(l => l.id === loanId);
    if (!target) return;

    const targetType = target.type || 'lent';
    const acc = target.paymentSource === 'bank' ? 'bank' : 'cash';
    let updatedTx = transactions;

    if (targetType === 'lent') {
      // Friend repaid me -> cash enters wallet (Income)
      const repaymentTx = {
        id: 'tx-repay-' + Date.now(),
        type: 'income',
        amount: target.amount,
        account: acc,
        category: 'lent',
        date: todayStr,
        note: `Repaid by ${target.friendName}${target.note ? ` (Settled: ${target.note})` : ''}`,
        loanId: target.id,
      };
      updatedTx = [repaymentTx, ...transactions];
      setTransactions(updatedTx);
      showToast(`Repaid! Added ${currency} ${target.amount.toLocaleString()} to ${acc === 'bank' ? '🏦 Bank' : '💵 Cash in Hand'}.`);
    } else {
      // I paid back friend -> cash leaves wallet (Expense)
      const payBackTx = {
        id: 'tx-payback-' + Date.now(),
        type: 'expense',
        amount: target.amount,
        account: acc,
        category: 'borrowed',
        date: todayStr,
        note: `Paid back loan to ${target.friendName}${target.note ? ` (${target.note})` : ''}`,
        loanId: target.id,
      };
      updatedTx = [payBackTx, ...transactions];
      setTransactions(updatedTx);
      showToast(`Settled! Paid back ${currency} ${target.amount.toLocaleString()} to ${target.friendName} from ${acc === 'bank' ? '🏦 Bank' : '💵 Cash in Hand'}.`);
    }

    const updatedLoans = loans.map(l =>
      l.id === loanId
        ? { ...l, status: 'settled', settledAt: Date.now(), settledDate: todayStr, settledAccount: acc }
        : l
    );
    setLoans(updatedLoans);
    saveUserData(updatedTx, settings, updatedLoans);
  };

  const handleDeleteLoan = (loanId) => {
    if (!confirm(isSi ? 'මෙම ණය සටහන මකා දැමීමට සහතිකද?' : 'Are you sure you want to delete this debt record?')) return;
    const updatedLoans = loans.filter(l => l.id !== loanId);
    setLoans(updatedLoans);
    saveUserData(transactions, settings, updatedLoans);
    showToast('Record deleted');
  };

  const handleRemindWhatsApp = (loan) => {
    const targetType = loan.type || 'lent';
    const text = targetType === 'lent'
      ? `Hey ${loan.friendName}! 👋 Friendly reminder from UniCash: you have ${currency} ${loan.amount.toLocaleString()}${loan.note ? ` for "${loan.note}"` : ''} to return when you get a chance. Thanks! 😊`
      : `Hey ${loan.friendName}! 👋 Letting you know I’ve returned the ${currency} ${loan.amount.toLocaleString()} I borrowed${loan.note ? ` for "${loan.note}"` : ''}. Thank you so much for the help! 😊`;

    let cleanPhone = (loan.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '94' + cleanPhone.slice(1);
    }

    if (cleanPhone.length >= 9) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
      showToast(`Opening WhatsApp chat with ${loan.friendName}...`);
    } else {
      navigator.clipboard.writeText(text);
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      showToast('Message copied! Select friend in WhatsApp to send.');
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Category', 'Amount', 'Note'],
      ...transactions.map(t => [t.date, t.type, t.category, t.amount, `"${t.note || ''}"`]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unicash-${currentUser.username}-${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = { user: currentUser, settings, transactions, loans };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unicash-backup-${currentUser.username}-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Resolve effective category (handles backward-compatibility for meal & debt notes)
  const getEffectiveCategory = (t) => {
    if (t.category === 'breakfast' || t.category === 'lunch' || t.category === 'dinner') return t.category;
    if (t.category === 'lent' || (t.loanId?.startsWith('loan-') && t.type === 'expense')) return 'lent';
    if (t.category === 'borrowed' || (t.loanId?.startsWith('loan-') && t.type === 'income')) return 'borrowed';
    const noteLower = (t.note || '').toLowerCase();
    if (noteLower.includes('breakfast') || noteLower.includes('උදෑසන')) return 'breakfast';
    if (noteLower.includes('lunch') || noteLower.includes('දවල්')) return 'lunch';
    if (noteLower.includes('dinner') || noteLower.includes('රාත්‍රී') || noteLower.includes('රෑ කෑම')) return 'dinner';
    if (noteLower.includes('lent to') || noteLower.includes('ණයට දුන්')) return 'lent';
    if (noteLower.includes('borrowed from') || noteLower.includes('ණයට ගත්')) return 'borrowed';
    return t.category || 'other';
  };

  // Filtered transactions for wallet tab
  const filtered = transactions.filter(t => {
    // 1. Account filter (cash vs bank)
    const acc = t.account || 'cash';
    if (selectedAccountFilter !== 'all' && acc !== selectedAccountFilter) {
      return false;
    }

    // 2. Category filter
    const effCat = getEffectiveCategory(t);
    if (selectedCategoryFilter !== 'all') {
      if (selectedCategoryFilter === 'lent' && effCat !== 'lent') return false;
      if (selectedCategoryFilter === 'borrowed' && effCat !== 'borrowed') return false;
      if (selectedCategoryFilter !== 'lent' && selectedCategoryFilter !== 'borrowed' && effCat !== selectedCategoryFilter) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const noteMatch = (t.note || '').toLowerCase().includes(q);
    const amtMatch = String(t.amount).includes(q);
    const cat = CATEGORIES[effCat] || CATEGORIES.other;
    const catMatch = (cat?.nameEn || '').toLowerCase().includes(q) || (cat?.nameSi || '').includes(q);
    const accMatch = (acc === 'bank' ? 'bank බැංකු reload රිලෝඩ්' : 'cash අතේ').toLowerCase().includes(q);
    return noteMatch || amtMatch || catMatch || accMatch;
  });

  // Filtered loans for Debts tab
  const filteredLoans = loans
    .filter(l => {
      const type = l.type || 'lent';
      if (debtDirectionFilter === 'lent') return type === 'lent';
      if (debtDirectionFilter === 'borrowed') return type === 'borrowed';
      return true;
    })
    .filter(l => {
      if (loanFilter === 'pending') return l.status === 'pending';
      if (loanFilter === 'settled') return l.status === 'settled';
      return true;
    })
    .filter(l => {
      if (!loanSearch.trim()) return true;
      const q = loanSearch.toLowerCase();
      const friendMatch = (l.friendName || '').toLowerCase().includes(q);
      const noteMatch = (l.note || '').toLowerCase().includes(q);
      const amtMatch = String(l.amount).includes(q);
      return friendMatch || noteMatch || amtMatch;
    });

  const onlineUrl = typeof window !== 'undefined' && window.location.origin.includes('trycloudflare.com')
    ? window.location.origin
    : (networkInfo.tunnelUrl || 'https://korean-planet-valuable-jet.trycloudflare.com');
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(onlineUrl)}`;

  // ================= SCREEN 1: SECURE LOGIN / REGISTRATION =================
  if (!currentUser) {
    return (
      <div className="simple-app auth-page-bg">
        <div className="auth-card">
          <div className="auth-brand-center">
            <img src="/app-icon.png" alt="UniCash" className="auth-logo-img" />
            <h2>UniCash</h2>
            <span className="auth-dev-pill">Developed by Madz system</span>
            <p className="auth-subtitle">
              {isSi
                ? 'විශ්වවිද්‍යාල ශිෂ්‍ය මුදල් සහ වියදම් කළමනාකරු'
                : 'Campus Student Expense & Wallet Tracker'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="auth-tabs-toggle">
            <button
              type="button"
              className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
            >
              <KeyRound size={15} />
              <span>{isSi ? 'ඇතුල් වන්න (Sign In)' : 'Sign In'}</span>
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
              }}
            >
              <Plus size={15} />
              <span>{isSi ? 'අලුත් ගිණුමක් (Register)' : 'Register'}</span>
            </button>
          </div>

          {authError && <div className="form-error-banner">{authError}</div>}

          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-form-body">
              <div className="form-field">
                <label>
                  <User size={14} className="inline-icon" />
                  {isSi ? 'පරිශීලක නාමය (Username)' : 'Username'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. kasun, madhushan..."
                  value={authUsername}
                  onChange={e => setAuthUsername(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              <div className="form-field">
                <label>
                  <Lock size={14} className="inline-icon" />
                  {isSi ? 'මුරපදය (Password)' : 'Password'}
                </label>
                <div className="password-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="clean-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-toggle-eye"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={authLoading} className="btn-auth-submit">
                {authLoading ? '...' : (isSi ? 'ඇතුල් වන්න (Log In)' : 'Log In')}
              </button>
            </form>
          )}

          {/* Register Form */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="auth-form-body">
              <div className="form-field">
                <label>{isSi ? 'ඔබගේ නම (Your Name) *' : 'Your Name *'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun, Supun, Madhushan..."
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              <div className="form-field">
                <label>{isSi ? 'Username (Login වීමට අලුත් Username එකක්) *' : 'Username *'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. kasun123"
                  value={authUsername}
                  onChange={e => setAuthUsername(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              <div className="form-field">
                <label>{isSi ? 'Avatar Emoji තෝරන්න' : 'Choose Avatar Emoji'}</label>
                <div className="avatar-picker-row">
                  {AVATARS.map(av => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setRegAvatar(av)}
                      className={`avatar-chip-btn ${regAvatar === av ? 'selected' : ''}`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>{isSi ? 'දැනට අතේ ඇති මුදල (Starting Cash)' : 'Starting Cash in Hand'}</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5000"
                  value={regBalance}
                  onChange={e => setRegBalance(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              <div className="form-field">
                <label>{isSi ? 'මුරපදය (Password) *' : 'Password *'}</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 4 characters"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              <div className="form-field">
                <label>{isSi ? 'මුරපදය නැවත තහවුරු කරන්න *' : 'Confirm Password *'}</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              <button type="submit" disabled={authLoading} className="btn-auth-submit">
                {authLoading ? '...' : (isSi ? 'ගිණුම සාදන්න (Create Account)' : 'Create Account')}
              </button>
            </form>
          )}

          {/* Privacy Guarantee Note */}
          <div className="auth-privacy-badge">
            <ShieldCheck size={18} className="shield-icon" />
            <span>
              {isSi
                ? 'ඔබගේ දත්ත 100% ආරක්ෂිතයි. කිසිවෙකුට ඔබගේ Username & Password නොමැතිව ඔබගේ මුදල් හෝ වියදම් බැලිය නොහැක.'
                : '100% Private & Secure. No one can view your wallet or expenses without your Username & Password.'}
            </span>
          </div>

          {/* Developer / Owner Credits */}
          <div className="auth-dev-credits">
            <div className="dev-credit-text">
              {isSi ? 'නිර්මාණය සහ හිමිකාරිත්වය: ' : 'Developed & Owned by '} <strong>Madz system</strong>
            </div>
            <div className="dev-contact-pills">
              <a href="tel:0762547960" className="dev-pill-btn" title="Call">
                <PhoneCall size={12} />
                <span>0762547960</span>
              </a>
              <a href="https://wa.me/94762547960" target="_blank" rel="noreferrer" className="dev-pill-btn wa-pill" title="WhatsApp">
                <MessageSquare size={12} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= SCREEN 2: ACTIVE LOGGED IN USER WALLET =================
  return (
    <div className={`simple-app ${settings.darkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="simple-wrapper">
        
        {/* Navigation Bar (Two-Row Clean Layout) */}
        <header className="simple-nav">
          <div className="nav-top-row">
            <div className="nav-brand">
              <img src="/app-icon.png" alt="UniCash Icon" className="nav-app-icon" />
              <div className="nav-brand-text">
                <span className="nav-brand-title">UniCash</span>
                <span className="nav-brand-dev">by Madz system</span>
              </div>
            </div>

            <div className="nav-actions">
              {/* User Profile Switcher Dropdown */}
              <div className="user-dropdown-wrap">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="btn-user-profile-nav"
                  title="Current User"
                >
                  <span className="user-nav-avatar">{currentUser.avatar || '🎓'}</span>
                  <span className="user-nav-name">{currentUser.name}</span>
                  <ChevronDown size={13} />
                </button>

                {isUserMenuOpen && (
                  <div className="user-menu-popover">
                    <div className="popover-user-info">
                      <span className="popover-avatar">{currentUser.avatar || '🎓'}</span>
                      <div>
                        <div className="popover-name">{currentUser.name}</div>
                        <div className="popover-sub">@{currentUser.username}</div>
                      </div>
                    </div>
                    <hr className="popover-divider" />
                    <button onClick={handleLogout} className="popover-menu-item text-danger">
                      <LogOut size={15} />
                      <span>{isSi ? 'ඉවත් වන්න (Logout)' : 'Logout'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* iPhone Connect Button */}
              <button
                onClick={() => setIsPhoneModalOpen(true)}
                className="btn-connect-phone"
                title={isSi ? 'iPhone එකට සම්බන්ධ කරන්න' : 'Connect iPhone'}
              >
                <Smartphone size={15} />
                <span className="hide-on-xs">iPhone</span>
                <span className={`sync-indicator-dot ${syncStatus}`} />
              </button>

              <button
                onClick={() => {
                  const newStg = { ...settings, language: settings.language === 'si' ? 'en' : 'si' };
                  setSettings(newStg);
                  saveUserData(transactions, newStg, loans);
                }}
                className="icon-btn-minimal"
                title="Language"
              >
                {isSi ? 'EN' : 'සිං'}
              </button>
              <button
                onClick={() => {
                  const newStg = { ...settings, darkMode: !settings.darkMode };
                  setSettings(newStg);
                  saveUserData(transactions, newStg, loans);
                }}
                className="icon-btn-minimal"
                title="Theme"
              >
                {settings.darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Row 2: Full Width & Evenly Distributed) */}
          <nav className="nav-tabs">
            <button
              onClick={() => setActiveTab('wallet')}
              className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            >
              <Wallet size={16} />
              <span>{isSi ? 'මුදල්' : 'Wallet'}</span>
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
            >
              <Users size={16} />
              <span>{isSi ? 'ණය' : 'Debts & IOUs'}</span>
              {totalPendingDebtsCount > 0 && (
                <span className="tab-counter-badge">{totalPendingDebtsCount}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            >
              <PieChart size={16} />
              <span>{isSi ? 'ප්‍රස්ථාර' : 'Charts'}</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <Settings size={16} />
              <span>{isSi ? 'සැකසුම්' : 'Settings'}</span>
            </button>
          </nav>
        </header>

        {/* ================= TAB 1: WALLET & EXPENSES ================= */}
        {activeTab === 'wallet' && (
          <main className="tab-content">
            
            {/* 1. Dual-Wallet Balance System (Cash in Hand & Bank Account) */}
            <section className="hero-balance-section">
              {/* Total Available Balance Banner */}
              <div className="total-net-card">
                <div className="total-net-left">
                  <div className="hero-title-with-badge">
                    <img src="/app-icon.png" alt="UniCash" className="hero-app-badge" />
                    <div>
                      <span className="hero-subtitle">
                        {isSi ? `💰 ${currentUser.name} ගේ මුළු ශේෂය` : `${currentUser.name}'s Total Balance`}
                      </span>
                      <span className="hero-tagline">@{currentUser.username} • Cash + Bank Available</span>
                    </div>
                  </div>
                  <div className="total-net-amount">
                    <span className="currency-mark">{currency}</span>
                    <span className="total-net-val">{totalBalance.toLocaleString()}</span>
                  </div>
                </div>

                <div className="total-net-breakdown">
                  <div className="breakdown-pill cash-pill">
                    <span className="pill-dot dot-cash"></span>
                    <span className="breakdown-label">{isSi ? 'අතේ මුදල්:' : 'Cash:'}</span>
                    <strong className="breakdown-val">{currency} {cashBalance.toLocaleString()}</strong>
                  </div>
                  <div className="breakdown-pill bank-pill">
                    <span className="pill-dot dot-bank"></span>
                    <span className="breakdown-label">{isSi ? 'බැංකුව:' : 'Bank:'}</span>
                    <strong className="breakdown-val">{currency} {bankBalance.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Dual Accounts Grid: Cash in Hand & Bank Account */}
              <div className="dual-accounts-grid">
                {/* Account 1: Cash in Hand */}
                <div className="account-card cash-account-card">
                  <div className="acc-card-header">
                    <div className="acc-card-title-group">
                      <div className="acc-icon-badge cash-badge">💵</div>
                      <div>
                        <h4 className="acc-name">{isSi ? 'අතේ ඇති මුදල' : 'Cash in Hand'}</h4>
                        <span className="acc-sub">{isSi ? 'පසුම්බිය • කැන්ටිම • බස්' : 'Physical Cash in Wallet'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBalanceEditTarget('cash');
                        setDirectBalanceInput(String(Math.max(0, cashBalance)));
                        setIsEditingBalance(true);
                      }}
                      className="btn-acc-edit"
                      title={isSi ? 'අතේ ඇති මුදල සකසන්න' : 'Set Exact Cash in Hand'}
                    >
                      <Edit3 size={12} />
                      <span>{isSi ? 'සකසන්න' : 'Edit'}</span>
                    </button>
                  </div>

                  <div className="acc-card-amount">
                    <span className="currency-mark-sub">{currency}</span>
                    <span className={`acc-amount-val ${cashBalance < 500 ? 'text-danger-warn' : ''}`}>
                      {cashBalance.toLocaleString()}
                    </span>
                  </div>

                  {/* Runway status */}
                  {cashBalance <= 0 ? (
                    <div className="acc-alert danger">
                      <AlertTriangle size={13} />
                      <span>{isSi ? 'අතේ මුදල් ඉවරයි! ATM එකෙන් ගන්න.' : 'Run out of cash! Withdraw from ATM'}</span>
                    </div>
                  ) : cashBalance < 1000 ? (
                    <div className="acc-alert warning">
                      <AlertTriangle size={13} />
                      <span>{isSi ? 'අතේ මුදල් අඩුයි! පරිස්සමෙන් වියදම් කරන්න.' : 'Low cash alert! Only essentials.'}</span>
                    </div>
                  ) : (
                    <div className="acc-hint">
                      <Clock size={13} />
                      <span>{isSi ? `දින ~${estimatedDaysLeft} කට ප්‍රමාණවත්` : `~${estimatedDaysLeft} days runway`}</span>
                    </div>
                  )}
                </div>

                {/* Account 2: Bank Account */}
                <div className="account-card bank-account-card">
                  <div className="acc-card-header">
                    <div className="acc-card-title-group">
                      <div className="acc-icon-badge bank-badge">🏦</div>
                      <div>
                        <h4 className="acc-name">{isSi ? 'බැංකු ගිණුම' : 'Bank Account'}</h4>
                        <span className="acc-sub">{isSi ? 'Online • Cards • රිලෝඩ්' : 'Commercial, BOC, Cards & Reloads'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBalanceEditTarget('bank');
                        setDirectBalanceInput(String(Math.max(0, bankBalance)));
                        setIsEditingBalance(true);
                      }}
                      className="btn-acc-edit"
                      title={isSi ? 'බැංකු ශේෂය සකසන්න' : 'Set Exact Bank Balance'}
                    >
                      <Edit3 size={12} />
                      <span>{isSi ? 'සකසන්න' : 'Edit'}</span>
                    </button>
                  </div>

                  <div className="acc-card-amount">
                    <span className="currency-mark-sub">{currency}</span>
                    <span className="acc-amount-val bank-color">
                      {bankBalance.toLocaleString()}
                    </span>
                  </div>

                  {/* ATM Quick Withdrawal action */}
                  <div className="acc-actions-row">
                    <button
                      type="button"
                      onClick={() => {
                        setTransferDirection('bank-to-cash');
                        setTransferAmount('');
                        setTransferModalOpen(true);
                      }}
                      className="btn-transfer-quick"
                      title="Withdraw Cash from ATM into Wallet"
                    >
                      <ArrowLeftRight size={13} />
                      <span>{isSi ? 'ATM සල්ලි ගැනීම (Bank ➔ Cash)' : 'ATM Withdrawal (Bank ➔ Cash)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Friend Debts / IOUs Dashboard Reminder Banner */}
            {totalPendingDebtsCount > 0 && (
              <div className="friend-loan-notice" onClick={() => setActiveTab('loans')}>
                <div className="loan-notice-left">
                  <div className="loan-notice-icon-box">
                    <Users size={18} />
                  </div>
                  <div>
                    <strong className="loan-notice-title">
                      {totalPendingLent > 0 && totalPendingBorrowed > 0 ? (
                        isSi
                          ? `ලැබීමට ${currency} ${totalPendingLent.toLocaleString()} • දීමට ${currency} ${totalPendingBorrowed.toLocaleString()}`
                          : `Owed to you: ${currency} ${totalPendingLent.toLocaleString()} • You owe: ${currency} ${totalPendingBorrowed.toLocaleString()}`
                      ) : totalPendingLent > 0 ? (
                        isSi
                          ? `යාලුවන්ට දුන් ණය: ${currency} ${totalPendingLent.toLocaleString()} ක් ලැබීමට ඇත`
                          : `Friends owe you ${currency} ${totalPendingLent.toLocaleString()}`
                      ) : (
                        isSi
                          ? `යාලුවන්ට ගෙවීමට ඇති ණය: ${currency} ${totalPendingBorrowed.toLocaleString()}`
                          : `You owe friends ${currency} ${totalPendingBorrowed.toLocaleString()}`
                      )}
                    </strong>
                    <span className="loan-notice-sub">
                      {totalPendingDebtsCount} {isSi ? 'ණය සටහනක් ක්‍රියාකාරීයි • විස්තර බලන්න' : `active debt${totalPendingDebtsCount > 1 ? 's' : ''} • Tap to view & settle`}
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-loan-notice-view">
                  <span>{isSi ? 'බලන්න' : 'View'}</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            )}

            {/* Direct Balance Edit Modal (Cash or Bank) */}
            {isEditingBalance && (
              <div className="mini-modal-overlay" onClick={() => setIsEditingBalance(false)}>
                <div className="mini-modal-card" onClick={e => e.stopPropagation()}>
                  <div className="modal-title-row">
                    <div className="title-with-icon">
                      <Edit3 size={20} className="text-accent" />
                      <h4>
                        {balanceEditTarget === 'bank'
                          ? (isSi ? 'බැංකු ගිණුමේ ශේෂය ඇතුළත් කරන්න' : 'Set Your Exact Bank Account Balance')
                          : (isSi ? 'අතේ ඇති මුදල ඇතුළත් කරන්න' : 'Set Your Exact Cash in Hand')}
                      </h4>
                    </div>
                    <button onClick={() => setIsEditingBalance(false)} className="btn-modal-close">✕</button>
                  </div>
                  <p className="modal-help">
                    {balanceEditTarget === 'bank'
                      ? (isSi
                          ? 'බැංකු ඇප් එකේ (Commercial / BOC / FriMi) මේ මොහොතේ ඇති සැබෑ මුදල සටහන් කරන්න:'
                          : 'Enter the exact current balance shown in your Bank App right now:')
                      : (isSi
                          ? 'පසුම්බියේ මේ මොහොතේ ඔබ සතුව ඇති සැබෑ මුදල සටහන් කරන්න:'
                          : 'Enter the exact physical cash amount you currently have in hand right now:')}
                  </p>
                  <form onSubmit={handleDirectBalanceSave}>
                    <div className="input-group direct-balance-input-wrap">
                      <span className="input-prefix">{currency}</span>
                      <input
                        type="number"
                        step="any"
                        required
                        autoFocus
                        value={directBalanceInput}
                        onChange={e => setDirectBalanceInput(e.target.value)}
                        className="clean-input font-large"
                        placeholder="e.g. 5000"
                      />
                    </div>
                    <div className="modal-actions-row">
                      <button
                        type="button"
                        onClick={() => setIsEditingBalance(false)}
                        className="btn-modal-cancel"
                      >
                        {isSi ? 'අවලංගුයි' : 'Cancel'}
                      </button>
                      <button type="submit" className="btn-modal-confirm">
                        {isSi ? 'තහවුරු කරන්න' : 'Save Balance'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ATM Transfer Modal (Bank to Cash / Deposit) */}
            {transferModalOpen && (
              <div className="mini-modal-overlay" onClick={() => setTransferModalOpen(false)}>
                <div className="mini-modal-card" onClick={e => e.stopPropagation()}>
                  <div className="modal-title-row">
                    <div className="title-with-icon">
                      <ArrowLeftRight size={22} className="text-accent" />
                      <h4>
                        {transferDirection === 'bank-to-cash'
                          ? (isSi ? 'ATM එකෙන් මුදල් ගැනීම (Bank ➔ Cash)' : 'ATM Cash Withdrawal (Bank ➔ Cash)')
                          : (isSi ? 'බැංකුවට මුදල් තැන්පත් කිරීම (Cash ➔ Bank)' : 'Cash Deposit (Cash ➔ Bank)')}
                      </h4>
                    </div>
                    <button onClick={() => setTransferModalOpen(false)} className="btn-modal-close">✕</button>
                  </div>

                  <p className="modal-help">
                    {transferDirection === 'bank-to-cash'
                      ? (isSi
                          ? 'බැංකු කාඩ්පතෙන් ATM එකෙන් මුදල් ගත් විට, බැංකු ශේෂය අඩුවී අතේ ඇති මුදල වැඩි වේ:'
                          : 'Transfer money from your bank account into your cash-in-hand wallet:')
                      : (isSi
                          ? 'අතේ ඇති මුදල් බැංකුවට තැන්පත් කළ විට, අතේ මුදල අඩුවී බැංකු ශේෂය වැඩි වේ:'
                          : 'Deposit cash into your bank account:')}
                  </p>

                  {/* Quick Amount presets */}
                  <div className="transfer-quick-amounts">
                    {[1000, 2000, 3000, 5000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        className="chip-quick-transfer"
                        onClick={() => setTransferAmount(String(amt))}
                      >
                        {currency} {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleTransferSubmit}>
                    <div className="input-group">
                      <span className="input-prefix">{currency}</span>
                      <input
                        type="number"
                        step="any"
                        required
                        autoFocus
                        placeholder="e.g. 2000, 5000..."
                        value={transferAmount}
                        onChange={e => setTransferAmount(e.target.value)}
                        className="clean-input font-large"
                      />
                    </div>

                    <div className="modal-actions-row">
                      <button
                        type="button"
                        onClick={() => setTransferModalOpen(false)}
                        className="btn-modal-cancel"
                      >
                        {isSi ? 'අවලංගුයි' : 'Cancel'}
                      </button>
                      <button type="submit" className="btn-modal-confirm">
                        {isSi ? 'මාරු කිරීම තහවුරු කරන්න' : 'Confirm Transfer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 2. Fast Transaction Entry */}
            <section className="transaction-input-section">
              <div className="entry-type-selector">
                <button
                  type="button"
                  className={`type-btn-toggle ${entryType === 'expense' ? 'active-exp' : ''}`}
                  onClick={() => setEntryType('expense')}
                >
                  <ArrowDownLeft size={16} />
                  <span>{isSi ? 'වියදම් කළා (Expense)' : 'Spent Money'}</span>
                </button>
                <button
                  type="button"
                  className={`type-btn-toggle ${entryType === 'income' ? 'active-inc' : ''}`}
                  onClick={() => setEntryType('income')}
                >
                  <ArrowUpRight size={16} />
                  <span>{isSi ? 'ගෙදරින් ලැබුණා (Received)' : 'Money Received'}</span>
                </button>
              </div>

              {/* Account Selector Pill Toggle (Cash vs Bank) */}
              <div className="account-selector-row">
                <span className="acc-selector-label">{isSi ? 'ගෙවූ ආකාරය (Account):' : 'Payment Account:'}</span>
                <div className="account-selector-pills">
                  <button
                    type="button"
                    className={`acc-pill ${entryAccount === 'cash' ? 'active-cash' : ''}`}
                    onClick={() => setEntryAccount('cash')}
                  >
                    <span>💵</span>
                    <span>{isSi ? 'අතේ මුදල් (Cash in Hand)' : 'Cash in Hand'}</span>
                  </button>
                  <button
                    type="button"
                    className={`acc-pill ${entryAccount === 'bank' ? 'active-bank' : ''}`}
                    onClick={() => setEntryAccount('bank')}
                  >
                    <span>🏦</span>
                    <span>{isSi ? 'බැංකුවෙන් / Online (Bank)' : 'Bank / Online / Card'}</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="add-form-row">
                <div className="input-group amount-group">
                  <span className="input-prefix">{currency}</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={isSi ? 'මුදල (Amount)' : 'Amount'}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="clean-input"
                  />
                </div>

                <div className="input-group flex-2">
                  <input
                    type="text"
                    placeholder={
                      entryType === 'expense'
                        ? (isSi ? 'මොනවටද? (උදා: දවල් කෑම, බස්, රිලෝඩ්...)' : 'What was it for? (e.g. Lunch, Bus, Reload)')
                        : (isSi ? 'විස්තරය (උදා: අම්මා දැම්මා, ගෙදරින් එව්වා...)' : 'Note (e.g. Sent by Parents)')
                    }
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="clean-input"
                  />
                </div>

                {entryType === 'expense' && (
                  <div className="input-group category-group">
                    <select
                      value={category}
                      onChange={e => {
                        const newCat = e.target.value;
                        setCategory(newCat);
                        if (newCat === 'reload') {
                          setEntryAccount('bank'); // Auto-switch to Bank for Mobile Reloads
                        }
                      }}
                      className="clean-select"
                    >
                      {Object.values(CATEGORIES).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.badge} {isSi ? c.nameSi : c.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className={`btn-add-submit ${entryType === 'income' ? 'btn-income-submit' : ''}`}
                >
                  <Plus size={18} />
                  <span>
                    {entryType === 'expense'
                      ? (isSi ? 'වියදම සටහන් කරන්න' : 'Add Expense')
                      : (isSi ? 'මුදල් එකතු කරන්න' : 'Add Cash')}
                  </span>
                </button>
              </form>

              {/* 1-Tap Quick Add Tags */}
              <div className="quick-tags-row">
                <span className="quick-tags-label">
                  {entryType === 'expense'
                    ? (isSi ? 'නිතර යන වියදම්:' : 'Quick Expenses:')
                    : (isSi ? 'ලැබුණු මුදල්:' : 'Quick Cash In:')}
                </span>

                {entryType === 'expense'
                  ? (
                    <>
                      {QUICK_ADD_EXPENSES.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuickExpense(item)}
                          className={`simple-chip ${item.account === 'bank' ? 'chip-bank-highlight' : ''}`}
                          title={item.account === 'bank' ? 'Paid via Bank Account' : 'Paid from Cash in Hand'}
                        >
                          <span>{item.account === 'bank' ? '🏦' : ''} {isSi ? item.labelSi : item.labelEn}</span>
                          <strong className="chip-price">+{item.amount}</strong>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setLoanType('lent');
                          setLoanPaymentSource('cash');
                          setLoanModalOpen(true);
                        }}
                        className="simple-chip chip-highlight-loan"
                        title="I paid for a friend or lent cash"
                      >
                        <ArrowUpRight size={13} />
                        <span>{isSi ? '+ 🤝 යාලුවා වෙනුවෙන් ගෙව්වා' : '+ Paid for Friend (Lent)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoanType('borrowed');
                          setLoanPaymentSource('direct_bill');
                          setLoanModalOpen(true);
                        }}
                        className="simple-chip chip-highlight-borrow"
                        title="Friend paid for me or I borrowed"
                      >
                        <ArrowDownLeft size={13} />
                        <span>{isSi ? '+ 📥 සල්ලි අමතක වෙලා ගත්තා' : '+ Friend Paid (Borrowed)'}</span>
                      </button>
                    </>
                  )
                  : QUICK_ADD_INCOME.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickIncome(item, item.account)}
                        className={`simple-chip income-chip ${item.account === 'bank' ? 'chip-bank-highlight' : ''}`}
                      >
                        <span>{item.account === 'bank' ? '🏦' : '💵'} {isSi ? item.labelSi : item.labelEn}</span>
                        <strong className="chip-price-inc">+{item.amount}</strong>
                      </button>
                    ))}
              </div>
            </section>

            {/* 3. Clean Transaction History */}
            <section className="transactions-simple-card">
              <div className="list-header-row">
                <div className="tx-header-title-group">
                  <h3>{isSi ? 'ගනුදෙනු ලැයිස්තුව (History)' : 'Recent Transactions'}</h3>
                  <span className="tx-count-badge">{filtered.length} {isSi ? 'ගනුදෙනු' : 'items'}</span>
                </div>
                
                <div className="search-box-minimal">
                  <Search size={14} className="search-icon-min" />
                  <input
                    type="text"
                    placeholder={isSi ? 'සොයන්න...' : 'Search transactions...'}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="search-input-min"
                  />
                </div>
              </div>

              {/* Account Filter Pills (All Accounts vs Cash in Hand vs Bank Account) */}
              <div className="tx-account-filter-bar">
                <button
                  type="button"
                  className={`tx-acc-btn ${selectedAccountFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedAccountFilter('all')}
                >
                  <span>⚡ {isSi ? 'සියලු ගිණුම්' : 'All Accounts'}</span>
                  <span className="acc-count">{transactions.length}</span>
                </button>
                <button
                  type="button"
                  className={`tx-acc-btn acc-cash-btn ${selectedAccountFilter === 'cash' ? 'active' : ''}`}
                  onClick={() => setSelectedAccountFilter('cash')}
                >
                  <span>💵 {isSi ? 'අතේ ඇති මුදල් (Cash)' : 'Cash in Hand'}</span>
                  <span className="acc-count">{transactions.filter(t => (t.account || 'cash') === 'cash').length}</span>
                </button>
                <button
                  type="button"
                  className={`tx-acc-btn acc-bank-btn ${selectedAccountFilter === 'bank' ? 'active' : ''}`}
                  onClick={() => setSelectedAccountFilter('bank')}
                >
                  <span>🏦 {isSi ? 'බැංකුව / Online (Bank)' : 'Bank Account'}</span>
                  <span className="acc-count">{transactions.filter(t => t.account === 'bank').length}</span>
                </button>
              </div>

              {/* Category Filter Pills (Breakfast, Lunch, Dinner, Lent, Borrowed, etc.) */}
              <div className="tx-category-filter-bar">
                {[
                  { id: 'all', badge: '⚡', nameEn: 'All', nameSi: 'සියල්ල' },
                  { id: 'breakfast', badge: '🍳', nameEn: 'Breakfast', nameSi: 'උදෑසන' },
                  { id: 'lunch', badge: '🍛', nameEn: 'Lunch', nameSi: 'දවල්' },
                  { id: 'dinner', badge: '🌙', nameEn: 'Dinner', nameSi: 'රාත්‍රී' },
                  { id: 'reload', badge: '📱', nameEn: 'Reload (බැංකු)', nameSi: 'රිලෝඩ්' },
                  { id: 'lent', badge: '🤝', nameEn: 'Lent (දුන්නා)', nameSi: 'ණයට දුන්' },
                  { id: 'borrowed', badge: '📥', nameEn: 'Borrowed (ගත්තා)', nameSi: 'ණයට ගත්' },
                  { id: 'transport', badge: '🚌', nameEn: 'Transport', nameSi: 'ප්‍රවාහන' },
                  { id: 'food', badge: '🍔', nameEn: 'Snacks', nameSi: 'ස්නැක්ස්' },
                  { id: 'academic', badge: '📚', nameEn: 'Studies', nameSi: 'පොත්පත්' },
                  { id: 'boarding', badge: '🏠', nameEn: 'Boarding', nameSi: 'බෝඩිං' },
                  { id: 'entertainment', badge: '☕', nameEn: 'Tea/Outing', nameSi: 'තේ බීම' },
                  { id: 'other', badge: '💡', nameEn: 'Other', nameSi: 'වෙනත්' },
                ].map(opt => {
                  const isActive = selectedCategoryFilter === opt.id;
                  const count = opt.id === 'all'
                    ? transactions.length
                    : transactions.filter(t => getEffectiveCategory(t) === opt.id).length;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(opt.id)}
                      className={`tx-cat-filter-chip ${isActive ? 'active' : ''}`}
                    >
                      <span className="filter-chip-emoji">{opt.badge}</span>
                      <span className="filter-chip-name">{isSi ? opt.nameSi : opt.nameEn}</span>
                      {count > 0 && <span className="filter-chip-count">{count}</span>}
                    </button>
                  );
                })}
              </div>

              {filtered.length === 0 ? (
                <div className="empty-simple">
                  <p>{isSi ? 'මෙම කාණ්ඩයේ ගනුදෙනු කිසිවක් නැත' : 'No transactions found in this filter'}</p>
                </div>
              ) : (
                <div className="simple-tx-list">
                  {filtered.map(t => {
                    const isIncome = t.type === 'income';
                    const effCat = getEffectiveCategory(t);
                    const cat = CATEGORIES[effCat] || CATEGORIES.other;
                    const isBankAcc = t.account === 'bank';
                    return (
                      <div key={t.id} className="simple-tx-item">
                        <div className="tx-left-col">
                          <div
                            className={`tx-cat-circle ${isIncome && effCat !== 'borrowed' ? 'circle-income' : ''}`}
                            style={{
                              backgroundColor: isIncome && effCat !== 'borrowed' ? 'rgba(16, 185, 129, 0.15)' : cat.bgColor,
                              color: isIncome && effCat !== 'borrowed' ? '#10b981' : cat.color,
                            }}
                          >
                            {isIncome && effCat !== 'borrowed' ? <ArrowUpRight size={16} /> : <CategoryIcon categoryId={effCat} size={15} />}
                          </div>
                          <div>
                            <div className="tx-item-title-row">
                              <span className="tx-item-title">{t.note}</span>
                              <span
                                className="tx-category-tag"
                                style={{
                                  backgroundColor: cat.bgColor,
                                  color: cat.color,
                                }}
                              >
                                {cat.badge} {isSi ? cat.nameSi : cat.nameEn}
                              </span>
                              <span className={`tx-account-tag ${isBankAcc ? 'acc-bank-tag' : 'acc-cash-tag'}`}>
                                {isBankAcc ? '🏦 Bank' : '💵 Cash'}
                              </span>
                            </div>
                            <div className="tx-item-date">{t.date}</div>
                          </div>
                        </div>

                        <div className="tx-right-col">
                          <span className={`tx-price ${isIncome ? 'income-color' : ''}`}>
                            {isIncome ? '+' : '-'}{currency} {Number(t.amount).toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="btn-trash-min"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        )}

        {/* ================= TAB 2: FRIEND DEBTS & IOUs (LENT & BORROWED) ================= */}
        {activeTab === 'loans' && (
          <main className="tab-content">
            <div className="loans-dashboard">
              {/* Header */}
              <div className="loans-header-card">
                <div>
                  <h3 className="loans-main-title">
                    <Users size={22} className="text-accent" />
                    <span>{isSi ? 'යාලුවන්ගේ ණය කළමනාකරු (IOU Tracker)' : 'Friend Debts & IOUs'}</span>
                  </h3>
                  <p className="loans-subtitle">
                    {isSi
                      ? 'යාලුවන්ට දුන් මුදල් (Lent) සහ යාලුවන්ගෙන් ණයට ගත් මුදල් (Borrowed) යන දෙකම එකම තැනකින් කළමනාකරණය කරන්න'
                      : 'Track cash you lent to friends (owed to you) and cash you borrowed from friends (you owe)'}
                  </p>
                </div>

                <div className="debts-action-buttons-group">
                  <button
                    onClick={() => {
                      setLoanType('lent');
                      setLoanModalOpen(true);
                    }}
                    className="btn-add-loan-primary btn-lent-action"
                  >
                    <ArrowUpRight size={16} />
                    <span>{isSi ? '+ යාලුවෙකුට දුන්නා (Lent)' : '+ I Lent Money'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setLoanType('borrowed');
                      setLoanModalOpen(true);
                    }}
                    className="btn-add-loan-primary btn-borrow-action"
                  >
                    <ArrowDownLeft size={16} />
                    <span>{isSi ? '+ යාලුවෙකුගෙන් ගත්තා' : '+ I Borrowed Money'}</span>
                  </button>
                </div>
              </div>

              {/* Stats Cards (Lent vs Borrowed vs Net Position) */}
              <div className="loans-stats-grid">
                {/* 1. Owed to You (Lent) */}
                <div className="loan-stat-card card-pending">
                  <div className="loan-stat-icon-wrap amber">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <span className="loan-stat-label">
                      {isSi ? 'යාලුවන්ගෙන් ලැබීමට ඇති මුදල' : 'Owed to You (Lent)'}
                    </span>
                    <div className="loan-stat-value amber-text">
                      {currency} {totalPendingLent.toLocaleString()}
                    </div>
                    <span className="loan-stat-sub">
                      {pendingLent.length} {isSi ? 'සටහනක්' : `pending`} ({pendingLentFriendsCount} {isSi ? 'දෙනෙක්' : `friends`})
                    </span>
                  </div>
                </div>

                {/* 2. You Owe (Borrowed) */}
                <div className="loan-stat-card card-borrowed">
                  <div className="loan-stat-icon-wrap purple">
                    <ArrowDownLeft size={20} />
                  </div>
                  <div>
                    <span className="loan-stat-label">
                      {isSi ? 'යාලුවන්ට ගෙවීමට ඇති මුදල' : 'You Owe (Borrowed)'}
                    </span>
                    <div className="loan-stat-value purple-text">
                      {currency} {totalPendingBorrowed.toLocaleString()}
                    </div>
                    <span className="loan-stat-sub">
                      {pendingBorrowed.length} {isSi ? 'සටහනක්' : `unpaid`} ({pendingBorrowedFriendsCount} {isSi ? 'දෙනෙකුට' : `friends`})
                    </span>
                  </div>
                </div>

                {/* 3. Net Debt Position */}
                <div className="loan-stat-card card-net">
                  <div className={`loan-stat-icon-wrap ${netFriendBalance >= 0 ? 'emerald' : 'rose'}`}>
                    <HandCoins size={20} />
                  </div>
                  <div>
                    <span className="loan-stat-label">
                      {isSi ? 'ශුද්ධ ණය ශේෂය (Net Position)' : 'Net Balance'}
                    </span>
                    <div className={`loan-stat-value ${netFriendBalance >= 0 ? 'emerald-text' : 'text-expense'}`}>
                      {netFriendBalance >= 0 ? '+' : ''}{currency} {netFriendBalance.toLocaleString()}
                    </div>
                    <span className="loan-stat-sub">
                      {netFriendBalance > 0
                        ? (isSi ? 'ඔබට ලැබීමට වැඩිපුර ඇත' : 'Net owed to you')
                        : netFriendBalance < 0
                        ? (isSi ? 'ඔබ ගෙවීමට වැඩිපුර ඇත' : 'Net you owe friends')
                        : (isSi ? 'සමබරයි' : 'All balanced')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toolbar: Direction Pills + Status Filter & Search */}
              <div className="loans-toolbar">
                {/* Direction Switcher (All / Lent / Borrowed) */}
                <div className="loan-filters-group">
                  <button
                    onClick={() => setDebtDirectionFilter('all')}
                    className={`loan-filter-btn ${debtDirectionFilter === 'all' ? 'active' : ''}`}
                  >
                    {isSi ? 'සියල්ල' : 'All'} ({loans.length})
                  </button>
                  <button
                    onClick={() => setDebtDirectionFilter('lent')}
                    className={`loan-filter-btn ${debtDirectionFilter === 'lent' ? 'active' : ''}`}
                  >
                    📤 {isSi ? 'දුන් ණය' : 'Lent'} ({lentLoans.length})
                  </button>
                  <button
                    onClick={() => setDebtDirectionFilter('borrowed')}
                    className={`loan-filter-btn ${debtDirectionFilter === 'borrowed' ? 'active' : ''}`}
                  >
                    📥 {isSi ? 'ගත් ණය' : 'Borrowed'} ({borrowedLoans.length})
                  </button>
                </div>

                {/* Status Switcher (Pending / Settled) */}
                <div className="loan-filters-group">
                  <button
                    onClick={() => setLoanFilter('all')}
                    className={`loan-filter-btn ${loanFilter === 'all' ? 'active' : ''}`}
                  >
                    {isSi ? 'සියලු තත්ත්ව' : 'All Status'}
                  </button>
                  <button
                    onClick={() => setLoanFilter('pending')}
                    className={`loan-filter-btn ${loanFilter === 'pending' ? 'active' : ''}`}
                  >
                    ⏳ {isSi ? 'ක්‍රියාකාරී' : 'Pending'} ({totalPendingDebtsCount})
                  </button>
                  <button
                    onClick={() => setLoanFilter('settled')}
                    className={`loan-filter-btn ${loanFilter === 'settled' ? 'active' : ''}`}
                  >
                    ✓ {isSi ? 'බේරුම් කළ' : 'Settled'}
                  </button>
                </div>

                <div className="search-box-minimal">
                  <Search size={14} className="search-icon-min" />
                  <input
                    type="text"
                    placeholder={isSi ? 'යාලුවාගේ නම සොයන්න...' : 'Search friend or reason...'}
                    value={loanSearch}
                    onChange={e => setLoanSearch(e.target.value)}
                    className="search-input-min"
                  />
                </div>
              </div>

              {/* Loans / Debts List */}
              {filteredLoans.length === 0 ? (
                <div className="loans-empty-card">
                  <HandCoins size={44} className="empty-loans-icon" />
                  <h4>{isSi ? 'ණය සටහන් කිසිවක් නැත' : 'No Debt Records Found'}</h4>
                  <p>
                    {isSi
                      ? 'යාලුවෙකුට මුදලක් දුන් විට හෝ යාලුවෙකුගෙන් මුදලක් ණයට ගත් විට පහත බොත්තම් වලින් සටහන් කරගන්න.'
                      : 'Record when you lend cash to a friend, or when you borrow from a friend for canteen meals or rent!'}
                  </p>
                  <div className="empty-card-actions">
                    <button
                      onClick={() => {
                        setLoanType('lent');
                        setLoanModalOpen(true);
                      }}
                      className="btn-add-loan-primary btn-lent-action"
                    >
                      <ArrowUpRight size={15} />
                      <span>{isSi ? '+ යාලුවෙකුට දුන්නා' : '+ I Lent Money'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setLoanType('borrowed');
                        setLoanModalOpen(true);
                      }}
                      className="btn-add-loan-primary btn-borrow-action"
                    >
                      <ArrowDownLeft size={15} />
                      <span>{isSi ? '+ යාලුවෙකුගෙන් ගත්තා' : '+ I Borrowed Money'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="loans-grid-list">
                  {filteredLoans.map(loan => {
                    const isPending = loan.status === 'pending';
                    const isBorrowed = loan.type === 'borrowed';
                    const initialLetter = (loan.friendName || 'F').trim().charAt(0).toUpperCase();

                    return (
                      <div
                        key={loan.id}
                        className={`loan-card ${
                          !isPending
                            ? 'border-settled'
                            : isBorrowed
                            ? 'border-borrowed'
                            : 'border-pending'
                        }`}
                      >
                        <div className="loan-card-top">
                          <div className="loan-friend-info">
                            <div className={`loan-avatar-initial ${isBorrowed ? 'avatar-borrowed' : 'avatar-lent'}`}>
                              {initialLetter}
                            </div>
                            <div>
                              <div className="friend-name-row">
                                <h4 className="loan-friend-name">{loan.friendName}</h4>
                                <span className={`debt-type-pill ${isBorrowed ? 'pill-borrowed' : 'pill-lent'}`}>
                                  {isBorrowed ? (isSi ? 'ගත් ණය' : 'Borrowed') : (isSi ? 'දුන් ණය' : 'Lent')}
                                </span>
                              </div>
                              <span className="loan-date-text">
                                <Calendar size={11} className="inline-icon" />
                                {loan.date}
                              </span>
                            </div>
                          </div>

                          <span className={`loan-status-badge ${
                            !isPending
                              ? 'badge-settled'
                              : isBorrowed
                              ? 'badge-borrowed'
                              : 'badge-pending'
                          }`}>
                            {!isPending
                              ? (isSi ? '✓ බේරුම් කළා' : '✓ Settled')
                              : isBorrowed
                              ? (isSi ? '🚨 ඔබ දිය යුතුයි' : '🚨 You Owe')
                              : (isSi ? '⏳ ලැබීමට ඇත' : '⏳ Owed to You')}
                          </span>
                        </div>

                        <div className="loan-card-mid">
                          <div className="loan-amount-row">
                            <span className={`loan-amount-val ${isBorrowed ? 'purple-text' : ''}`}>
                              {currency} {Number(loan.amount).toLocaleString()}
                            </span>
                            {loan.paymentSource === 'direct_bill' ? (
                              <span className="loan-wallet-tag tag-direct-bill" title="Friend paid bill directly (No cash added to wallet)">
                                <Receipt size={11} />
                                <span>{isSi ? 'බිලට යාලුවා ගෙව්වා (අතේ මුදල නොවෙයි)' : 'Direct Bill (No Cash Added)'}</span>
                              </span>
                            ) : loan.paymentSource === 'bank' ? (
                              <span className="loan-wallet-tag tag-bank" title="Bank account">
                                <Landmark size={11} />
                                <span>{isSi ? 'බැංකුවෙන්' : 'Bank Account'}</span>
                              </span>
                            ) : (loan.paymentSource === 'cash' || loan.deductedFromWallet) ? (
                              <span className="loan-wallet-tag tag-cash" title="Cash in Hand">
                                <Banknote size={11} />
                                <span>{isSi ? 'අතේ මුදලින්' : 'Cash in Hand'}</span>
                              </span>
                            ) : (
                              <span className="loan-wallet-tag tag-neutral" title="Record only">
                                <span>{isSi ? 'පසුම්බිය වෙනස් නොවූ' : 'Record Only'}</span>
                              </span>
                            )}
                          </div>

                          {loan.note && (
                            <p className="loan-note-text">
                              "{loan.note}"
                            </p>
                          )}
                        </div>

                        <div className="loan-card-bottom-actions">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleSettleLoan(loan.id)}
                                className={`btn-loan-action ${isBorrowed ? 'btn-settle-borrow' : 'btn-settle'}`}
                                title={isBorrowed ? 'I paid this money back to my friend' : 'Friend returned the money to me'}
                              >
                                <CheckCircle2 size={14} />
                                <span>
                                  {isBorrowed
                                    ? (isSi ? 'ආපසු ගෙව්වා (Paid Back)' : 'Mark as Paid Back')
                                    : (isSi ? 'ලැබුණා (Received)' : 'Mark as Repaid')}
                                </span>
                              </button>

                              <button
                                onClick={() => handleRemindWhatsApp(loan)}
                                className="btn-loan-action btn-remind"
                                title="WhatsApp chat / notification"
                              >
                                <MessageCircle size={14} />
                                <span>{isBorrowed ? (isSi ? 'පණිවිඩයක්' : 'Message') : (isSi ? 'මතක් කරන්න' : 'Remind')}</span>
                              </button>
                            </>
                          ) : (
                            <div className="loan-settled-info">
                              <CheckCircle2 size={13} className="text-emerald" />
                              <span>{isBorrowed ? (isSi ? 'ණය මුදල ආපසු ගෙවා ඇත' : 'Paid back in full') : (isSi ? 'ණය මුදල ආපසු ලැබී ඇත' : 'Repaid in full')}</span>
                            </div>
                          )}

                          <button
                            onClick={() => handleDeleteLoan(loan.id)}
                            className="btn-trash-min"
                            title="Delete record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        )}

        {/* ================= TAB 3: ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <main className="tab-content">
            <Charts
              transactions={transactions}
              currency={currency}
              language={settings.language}
            />
          </main>
        )}

        {/* ================= TAB 4: SETTINGS ================= */}
        {activeTab === 'settings' && (
          <main className="tab-content">
            <div className="settings-simple-card">
              <h3>{isSi ? '⚙️ සැකසුම් සහ වාර්තා' : '⚙️ Settings & Backup'}</h3>
              
              <div className="settings-form">
                <div className="settings-field">
                  <label>{isSi ? 'මුදල් ඒකකය (Currency Symbol):' : 'Currency Symbol:'}</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={e => {
                      const newStg = { ...settings, currency: e.target.value };
                      setSettings(newStg);
                      saveUserData(transactions, newStg, loans);
                    }}
                    className="clean-input"
                  />
                </div>

                <div className="settings-field">
                  <label>{isSi ? 'භාෂාව (Language):' : 'Language:'}</label>
                  <select
                    value={settings.language || 'en'}
                    onChange={e => {
                      const newStg = { ...settings, language: e.target.value };
                      setSettings(newStg);
                      saveUserData(transactions, newStg, loans);
                    }}
                    className="clean-select"
                  >
                    <option value="en">English (Default)</option>
                    <option value="si">සිංහල (Sinhala)</option>
                  </select>
                </div>
              </div>

              {/* Madz system Developer Info Card */}
              <div className="madz-system-card">
                <div className="madz-header">
                  <div className="madz-badge">⚡ Madz system</div>
                  <span className="madz-role">Creator & Administrator</span>
                </div>
                <p className="madz-bio">
                  {isSi
                    ? 'මෙම මෘදුකාංගය Madz system විසින් විශ්වවිද්‍යාල ශිෂ්‍ය වියදම් හා අයවැය කළමනාකරණය සඳහාම නිර්මාණය කරන ලද්දකි.'
                    : 'Created and engineered by Madz system for university student expense and cash tracking.'}
                </p>
                <div className="madz-contacts">
                  <a href="tel:0762547960" className="madz-contact-link">
                    <PhoneCall size={14} />
                    <span>0762547960 (Call)</span>
                  </a>
                  <a href="https://wa.me/94762547960" target="_blank" rel="noreferrer" className="madz-contact-link wa">
                    <MessageSquare size={14} />
                    <span>WhatsApp Support</span>
                  </a>
                </div>
              </div>

              {/* iPhone Connect section */}
              <div className="iphone-setting-box">
                <div className="iphone-setting-info">
                  <Smartphone size={24} className="text-accent" />
                  <div>
                    <h4>{isSi ? 'iPhone එකට සම්බන්ධ කරන්න' : 'Connect to iPhone'}</h4>
                    <p>{isSi ? 'ඔබගේ iPhone එකෙන් ඕනෑම වෙලාවක වියදම් බැලීමට සහ ඇතුළත් කිරීමට' : 'View and update your wallet live from your iPhone Safari'}</p>
                  </div>
                </div>
                <button onClick={() => setIsPhoneModalOpen(true)} className="btn-open-qr">
                  {isSi ? 'QR Code එක පෙන්වන්න' : 'Show QR Code'}
                </button>
              </div>

              {/* Account management */}
              <div className="account-mgmt-box">
                <div className="iphone-setting-info">
                  <User size={22} className="text-accent" />
                  <div>
                    <h4>{isSi ? 'ගිණුමෙන් ඉවත් වීම (Logout)' : 'Logout of Account'}</h4>
                    <p>{isSi ? `Logged in as @${currentUser.username}` : `Logged in as @${currentUser.username}`}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn-action-danger">
                  <LogOut size={15} />
                  <span>{isSi ? 'ඉවත් වන්න' : 'Logout'}</span>
                </button>
              </div>

              {/* Data & Backup */}
              <div className="settings-actions-group">
                <h4>{isSi ? 'දත්ත වාර්තා බාගත කිරීම (Reports & Backup)' : 'Reports & Backup'}</h4>
                <div className="buttons-row">
                  <button onClick={handleExportCSV} className="btn-action-outline">
                    <Download size={15} />
                    <span>Excel (CSV) {isSi ? 'බාගත කරන්න' : 'Download'}</span>
                  </button>
                  <button onClick={handleExportJSON} className="btn-action-outline">
                    <Download size={15} />
                    <span>JSON Backup {isSi ? 'බාගත කරන්න' : 'Download'}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(isSi ? 'මෙම ගිණුමේ සියලුම දත්ත මකා දැමීමට සහතිකද?' : 'Are you sure you want to clear your data?')) {
                        setTransactions([]);
                        setLoans([]);
                        saveUserData([], settings, []);
                      }
                    }}
                    className="btn-action-danger"
                  >
                    <Trash2 size={15} />
                    <span>{isSi ? 'ගිණුමේ දත්ත මකන්න' : 'Clear My Data'}</span>
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Madz system Official Footer */}
        <footer className="madz-app-footer">
          <p>
            UniCash • Engineered by <strong>Madz system</strong> • Contact: <a href="tel:0762547960">0762547960</a>
          </p>
        </footer>

      </div>

      {/* ================= MODAL: RECORD LENT OR BORROWED MONEY ================= */}
      {loanModalOpen && (
        <div className="mini-modal-overlay" onClick={() => setLoanModalOpen(false)}>
          <div className="mini-modal-card loan-record-modal compact-debt-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title-row">
              <div className="title-with-icon">
                <Users size={20} className="text-accent" />
                <h4>
                  {loanType === 'lent'
                    ? (isSi ? 'යාලුවාට ගෙවීම / ණය දීම' : 'Record Lent / Paid for Friend')
                    : (isSi ? 'යාලුවා මට ගෙවීම / ණය ගැනීම' : 'Record Borrowed / Friend Paid')}
                </h4>
              </div>
              <button onClick={() => setLoanModalOpen(false)} className="btn-modal-close">✕</button>
            </div>

            {/* Compact Segmented Mode Selector */}
            <div className="compact-debt-toggle">
              <button
                type="button"
                className={`compact-debt-btn ${loanType === 'lent' ? 'active-lent' : ''}`}
                onClick={() => {
                  setLoanType('lent');
                  if (loanPaymentSource === 'direct_bill') setLoanPaymentSource('cash');
                }}
              >
                <ArrowUpRight size={15} />
                <span>{isSi ? 'මම යාලුවාට ගෙව්වා' : 'I Paid for Friend (Lent)'}</span>
              </button>
              <button
                type="button"
                className={`compact-debt-btn ${loanType === 'borrowed' ? 'active-borrowed' : ''}`}
                onClick={() => {
                  setLoanType('borrowed');
                  setLoanPaymentSource('direct_bill');
                }}
              >
                <ArrowDownLeft size={15} />
                <span>{isSi ? 'යාලුවා මට ගෙව්වා' : 'Friend Paid Me (I Owe)'}</span>
              </button>
            </div>

            {/* Compact Quick Presets Bar */}
            <div className="compact-presets-bar">
              {loanType === 'lent' ? (
                <>
                  <button
                    type="button"
                    className="compact-preset-pill"
                    onClick={() => {
                      setLoanNote(isSi ? 'කැන්ටිමෙන් කෑම' : 'Canteen Lunch');
                      setLoanPaymentSource('cash');
                    }}
                  >
                    🍛 {isSi ? 'කැන්ටිම' : 'Canteen'}
                  </button>
                  <button
                    type="button"
                    className="compact-preset-pill"
                    onClick={() => {
                      setLoanNote(isSi ? 'ප්‍රින්ටවුට් / කොපි' : 'Printout / Copies');
                      setLoanPaymentSource('cash');
                    }}
                  >
                    📄 {isSi ? 'ප්‍රින්ට්' : 'Prints'}
                  </button>
                  <button
                    type="button"
                    className="compact-preset-pill"
                    onClick={() => {
                      setLoanNote(isSi ? 'අතට දුන් මුදල' : 'Cash Lent');
                      setLoanPaymentSource('cash');
                    }}
                  >
                    💵 {isSi ? 'අතට' : 'Cash'}
                  </button>
                  <button
                    type="button"
                    className="compact-preset-pill"
                    onClick={() => {
                      setLoanNote(isSi ? 'බස් ගාස්තු' : 'Bus Fare');
                      setLoanPaymentSource('cash');
                    }}
                  >
                    🚌 {isSi ? 'බස්' : 'Bus'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="compact-preset-pill highlight-canteen"
                    onClick={() => {
                      setLoanNote(isSi ? 'සල්ලි අමතක වෙලා කැන්ටිමට යාලුවා ගෙව්වා' : 'Friend paid Canteen');
                      setLoanPaymentSource('direct_bill');
                    }}
                  >
                    🍛 {isSi ? 'කැන්ටිමට යාලුවා ගෙව්වා' : 'Canteen Bill'}
                  </button>
                  <button
                    type="button"
                    className="compact-preset-pill"
                    onClick={() => {
                      setLoanNote(isSi ? 'අතට මුදල් ගත්තා' : 'Cash Borrowed');
                      setLoanPaymentSource('cash');
                    }}
                  >
                    💵 {isSi ? 'අතට මුදල්' : 'Cash'}
                  </button>
                  <button
                    type="button"
                    className="compact-preset-pill"
                    onClick={() => {
                      setLoanNote(isSi ? 'බස් එකට යාලුවා ගෙව්වා' : 'Bus Fare');
                      setLoanPaymentSource('direct_bill');
                    }}
                  >
                    🚌 {isSi ? 'බස් ගාස්තු' : 'Bus'}
                  </button>
                </>
              )}
            </div>

            <form onSubmit={handleAddLoanSubmit} className="compact-loan-form">
              {/* 2 Columns: Friend Name + Amount */}
              <div className="form-grid-2col">
                <div className="form-field">
                  <label>{isSi ? 'යාලුවාගේ නම *' : "Friend's Name *"}</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Kasun"
                    value={loanFriendName}
                    onChange={e => setLoanFriendName(e.target.value)}
                    className="clean-input clean-box-input"
                  />
                </div>

                <div className="form-field">
                  <label>{isSi ? 'මුදල *' : 'Amount *'}</label>
                  <div className="input-group">
                    <span className="input-prefix">{currency}</span>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 350"
                      value={loanAmount}
                      onChange={e => setLoanAmount(e.target.value)}
                      className="clean-input font-large"
                    />
                  </div>
                </div>
              </div>

              {/* Reason / Note */}
              <div className="form-field">
                <label>{isSi ? 'හේතුව / මොනවටද? (විකල්ප)' : 'Reason / Note (Optional)'}</label>
                <input
                  type="text"
                  placeholder={
                    loanType === 'lent'
                      ? 'e.g. Canteen lunch, prints...'
                      : 'e.g. Canteen meal, forgot wallet...'
                  }
                  value={loanNote}
                  onChange={e => setLoanNote(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              {/* Payment Account / Cash Source */}
              <div className="form-field compact-source-field">
                <label className="source-label">
                  {loanType === 'lent'
                    ? (isSi ? 'මුදල් ගෙවූ ගිණුම:' : 'Paid from:')
                    : (isSi ? 'මුදල් ගනුදෙනුව සිදුවූ ආකාරය:' : 'How paid / received:')}
                </label>

                {loanType === 'lent' ? (
                  <div className="compact-source-row">
                    <button
                      type="button"
                      className={`compact-src-pill ${loanPaymentSource === 'cash' ? 'active-src' : ''}`}
                      onClick={() => setLoanPaymentSource('cash')}
                    >
                      <Banknote size={14} />
                      <span>{isSi ? '💵 අතේ මුදලින්' : '💵 Cash'}</span>
                    </button>
                    <button
                      type="button"
                      className={`compact-src-pill ${loanPaymentSource === 'bank' ? 'active-src' : ''}`}
                      onClick={() => setLoanPaymentSource('bank')}
                    >
                      <Landmark size={14} />
                      <span>{isSi ? '🏦 බැංකුවෙන්' : '🏦 Bank'}</span>
                    </button>
                    <button
                      type="button"
                      className={`compact-src-pill ${loanPaymentSource === 'none' ? 'active-src' : ''}`}
                      onClick={() => setLoanPaymentSource('none')}
                    >
                      <span>{isSi ? '🚫 සටහනක් පමණි' : '🚫 Record Only'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="compact-source-row">
                    <button
                      type="button"
                      className={`compact-src-pill highlight-direct ${loanPaymentSource === 'direct_bill' ? 'active-src-borrowed' : ''}`}
                      onClick={() => setLoanPaymentSource('direct_bill')}
                      title="Friend paid canteen counter directly. No fake cash added to your wallet."
                    >
                      <Receipt size={14} />
                      <span>{isSi ? '🍛 Direct Bill (කැන්ටිමට)' : '🍛 Direct Bill'}</span>
                    </button>
                    <button
                      type="button"
                      className={`compact-src-pill ${loanPaymentSource === 'cash' ? 'active-src-borrowed' : ''}`}
                      onClick={() => setLoanPaymentSource('cash')}
                    >
                      <Banknote size={14} />
                      <span>{isSi ? '💵 අතට ගත්තා' : '💵 Cash in Hand'}</span>
                    </button>
                    <button
                      type="button"
                      className={`compact-src-pill ${loanPaymentSource === 'bank' ? 'active-src-borrowed' : ''}`}
                      onClick={() => setLoanPaymentSource('bank')}
                    >
                      <Landmark size={14} />
                      <span>{isSi ? '🏦 බැංකුවට' : '🏦 Bank'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2 Columns: Phone + Date */}
              <div className="form-grid-2col">
                <div className="form-field">
                  <label>{isSi ? 'දුරකථනය (WhatsApp)' : 'Phone (Optional)'}</label>
                  <input
                    type="text"
                    placeholder="077xxxxxxx"
                    value={loanPhone}
                    onChange={e => setLoanPhone(e.target.value)}
                    className="clean-input clean-box-input"
                  />
                </div>

                <div className="form-field">
                  <label>{isSi ? 'දිනය' : 'Date'}</label>
                  <input
                    type="date"
                    value={loanDate}
                    onChange={e => setLoanDate(e.target.value)}
                    className="clean-input clean-box-input"
                  />
                </div>
              </div>

              <div className="modal-actions-row compact-actions-row">
                <button
                  type="button"
                  onClick={() => setLoanModalOpen(false)}
                  className="btn-modal-cancel"
                >
                  {isSi ? 'අවලංගුයි' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`btn-modal-confirm ${loanType === 'borrowed' ? 'btn-borrow-confirm' : ''}`}
                >
                  {loanType === 'lent'
                    ? (isSi ? 'සටහන් කරන්න' : 'Save Record')
                    : (isSi ? 'ණය සටහන් කරන්න' : 'Save Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= IPHONE CONNECT MODAL ================= */}
      {isPhoneModalOpen && (
        <div className="mini-modal-overlay" onClick={() => setIsPhoneModalOpen(false)}>
          <div className="mini-modal-card iphone-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title-row">
              <div className="title-with-icon">
                <Smartphone size={22} className="text-accent" />
                <h4>{isSi ? 'iPhone එකෙන් භාවිතා කරන්න' : 'Open on iPhone'}</h4>
              </div>
              <button onClick={() => setIsPhoneModalOpen(false)} className="btn-modal-close">✕</button>
            </div>

            <p className="modal-help">
              {isSi
                ? 'ඔබගේ යාලුවන්ටත් මෙම Link එක දී තමන්ගේම Username & Password එකක් සාදාගෙන පෞද්ගලිකව වියදම් පාලනය කළ හැක:'
                : 'Share this link with your friends so they can create their own private accounts with Username & Password:'}
            </p>

            {/* App Icon Preview */}
            <div className="ios-icon-preview-card">
              <img src="/apple-touch-icon.png" alt="UniCash iOS App Icon" className="ios-preview-squircle" />
              <div className="ios-preview-desc">
                <strong>{isSi ? 'UniCash iPhone App Icon' : 'UniCash iOS App Icon'}</strong>
                <p>{isSi ? 'Home Screen එකට Add කළ පසු මෙම ලස්සන 3D Icon එක දිස්වේ' : 'This 3D icon will appear on your iPhone Home Screen'}</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="qr-container">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="qr-img"
              />
              <span className="qr-caption">
                📷 {isSi ? 'iPhone Camera එකෙන් Scan කරන්න' : 'Scan with iPhone Camera'}
              </span>
            </div>

            {/* Online Global Public Link */}
            <div className="link-section-title">
              🌐 {isSi ? 'Online Web Link එක (ලෝකයේ ඕනෑම තැනක සිට)' : 'Online Web Link (Anywhere via Internet)'}:
            </div>
            <div className="direct-link-box highlight-online">
              <span className="link-text">{onlineUrl}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(onlineUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn-copy-link"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? (isSi ? 'පිටපත් විය' : 'Copied') : (isSi ? 'Copy' : 'Copy')}</span>
              </button>
            </div>

            {/* Direct Local Hotspot Link */}
            <div className="direct-link-box subtle-local">
              <span className="link-text-subtle">Local: {networkInfo.url}</span>
            </div>

            {/* iOS Add to Home Screen Instructions */}
            <div className="ios-instructions-box">
              <h5>{isSi ? '💡 iPhone එකේ App එකක් ලෙස තබා ගැනීමට:' : '💡 Add as an App on iPhone Home Screen:'}</h5>
              <ol className="ios-steps-list">
                <li>
                  {isSi ? 'Safari බ්‍රවුසරයෙන් link එක Open කරන්න.' : 'Open the link in Safari.'}
                </li>
                <li>
                  {isSi ? 'පහළ ඇති ' : 'Tap the '} <strong>Share ( <Share2 size={13} className="inline-icon" /> )</strong> {isSi ? 'බොත්තම ඔබන්න.' : 'button at the bottom.'}
                </li>
                <li>
                  <strong>"Add to Home Screen"</strong> {isSi ? 'තෝරන්න.' : 'to save as an app icon.'}
                </li>
              </ol>
            </div>

            <div className="modal-actions-row">
              <button onClick={() => setIsPhoneModalOpen(false)} className="btn-modal-confirm">
                {isSi ? 'හරි, තේරුණා' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="unicash-toast">
          <Sparkles size={15} />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}

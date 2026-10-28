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
  const [category, setCategory] = useState('food');
  const [searchQuery, setSearchQuery] = useState('');

  // Loan & Debt Modal state (Tracking both Lent & Borrowed money)
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanType, setLoanType] = useState('lent'); // 'lent' | 'borrowed'
  const [loanFriendName, setLoanFriendName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanNote, setLoanNote] = useState('');
  const [loanPhone, setLoanPhone] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanDeductWallet, setLoanDeductWallet] = useState(true);
  const [debtDirectionFilter, setDebtDirectionFilter] = useState('all'); // 'all' | 'lent' | 'borrowed'
  const [loanFilter, setLoanFilter] = useState('all'); // 'all' | 'pending' | 'settled'
  const [loanSearch, setLoanSearch] = useState('');

  // Edit current balance directly
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [directBalanceInput, setDirectBalanceInput] = useState('');

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

  // Fetch server network info
  useEffect(() => {
    fetch('/api/network')
      .then(res => res.json())
      .then(data => { if (data.url) setNetworkInfo(data); })
      .catch(() => {});
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
        const res = await fetch(`/api/user-data?id=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
          setSettings(data.settings || INITIAL_SETTINGS);
          setLoans(data.loans || []);
          lastUpdatedRef.current = data.lastUpdated || Date.now();
          setSyncStatus('synced');
        }
      } catch {
        setSyncStatus('offline');
      }
    };

    loadUserData();

    // 2-Way Sync polling for current user
    const interval = setInterval(async () => {
      if (isSavingRef.current || !currentUser) return;
      try {
        const res = await fetch(`/api/user-data?id=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if ((data.lastUpdated || 0) > lastUpdatedRef.current) {
            lastUpdatedRef.current = data.lastUpdated || Date.now();
            setTransactions(data.transactions || []);
            if (data.settings) setSettings(data.settings);
            if (data.loans) setLoans(data.loans);
            setSyncStatus('synced');
          }
        }
      } catch {
        setSyncStatus('offline');
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Save current user data to server
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

      const res = await fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) setSyncStatus('synced');
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword.trim(),
        }),
      });

      const data = await res.json();
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword.trim(),
          name: regName.trim(),
          avatar: regAvatar,
          initialBalance: parseFloat(regBalance) || 0,
        }),
      });

      const data = await res.json();
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

  const currentBalance = totalIncome - totalExpense;

  const todaySpent = transactions
    .filter(t => t.type === 'expense' && t.date === todayStr)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const recentExpenses = transactions.filter(t => t.type === 'expense');
  const uniqueDates = [...new Set(recentExpenses.map(t => t.date))];
  const numDaysActive = Math.max(1, uniqueDates.length);
  const avgDailySpend = Math.round(totalExpense / numDaysActive) || 450;

  const estimatedDaysLeft = currentBalance > 0 && avgDailySpend > 0
    ? Math.max(1, Math.floor(currentBalance / avgDailySpend))
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
    const defaultNote = entryType === 'income'
      ? (isSi ? 'ගෙදරින් ලැබුණු මුදල්' : 'Received from Home')
      : (isSi ? cat.nameSi : cat.nameEn);

    const newTx = {
      id: 'tx-' + Date.now(),
      type: entryType,
      amount: amt,
      category: entryType === 'income' ? 'other' : category,
      date: todayStr,
      note: note.trim() || defaultNote,
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveUserData(updated, settings, loans);
    setAmount('');
    setNote('');
    showToast(entryType === 'expense' ? `Spent ${currency} ${amt}` : `Added ${currency} ${amt}`);
  };

  const handleQuickExpense = (item) => {
    const newTx = {
      id: 'tx-' + Date.now(),
      type: 'expense',
      amount: item.amount,
      category: item.category,
      date: todayStr,
      note: isSi ? item.labelSi : item.labelEn,
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveUserData(updated, settings, loans);
    showToast(`Quick Expense: ${item.labelEn} (${currency} ${item.amount})`);
  };

  const handleQuickIncome = (item) => {
    const newTx = {
      id: 'tx-' + Date.now(),
      type: 'income',
      amount: item.amount,
      category: 'other',
      date: todayStr,
      note: isSi ? item.labelSi : item.labelEn,
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveUserData(updated, settings, loans);
    showToast(`Added ${currency} ${item.amount} from Home`);
  };

  const handleDirectBalanceSave = (e) => {
    e.preventDefault();
    const targetBalance = parseFloat(directBalanceInput);
    if (isNaN(targetBalance)) return;

    const difference = targetBalance - currentBalance;
    if (difference !== 0) {
      const adjustmentTx = {
        id: 'tx-' + Date.now(),
        type: difference > 0 ? 'income' : 'expense',
        amount: Math.abs(difference),
        category: 'other',
        date: todayStr,
        note: isSi
          ? `අතේ ඇති මුදල සකස් කිරීම (${currency} ${targetBalance.toLocaleString()})`
          : `Direct Cash Balance Adjustment to ${currency} ${targetBalance.toLocaleString()}`,
      };
      const updated = [adjustmentTx, ...transactions];
      setTransactions(updated);
      saveUserData(updated, settings, loans);
    }

    setIsEditingBalance(false);
    setDirectBalanceInput('');
    showToast(`Cash in Hand updated to ${currency} ${targetBalance.toLocaleString()}`);
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
      deductedFromWallet: loanDeductWallet,
      createdAt: Date.now(),
    };

    let updatedTx = transactions;
    if (loanDeductWallet) {
      if (loanType === 'lent') {
        // Cash leaves wallet (Expense)
        const tx = {
          id: 'tx-loan-' + Date.now(),
          type: 'expense',
          amount: amt,
          category: 'personal',
          date: newLoan.date,
          note: `Lent to ${newLoan.friendName}${newLoan.note ? ` (${newLoan.note})` : ''}`,
          loanId: newLoan.id,
        };
        updatedTx = [tx, ...transactions];
        setTransactions(updatedTx);
      } else {
        // Cash enters wallet (Income from borrowed money)
        const tx = {
          id: 'tx-borrow-' + Date.now(),
          type: 'income',
          amount: amt,
          category: 'other',
          date: newLoan.date,
          note: `Borrowed from ${newLoan.friendName}${newLoan.note ? ` (${newLoan.note})` : ''}`,
          loanId: newLoan.id,
        };
        updatedTx = [tx, ...transactions];
        setTransactions(updatedTx);
      }
    }

    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);
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
        ? `Recorded: Lent ${currency} ${amt.toLocaleString()} to ${newLoan.friendName}`
        : `Recorded: Borrowed ${currency} ${amt.toLocaleString()} from ${newLoan.friendName}`
    );
  };

  const handleSettleLoan = (loanId) => {
    const target = loans.find(l => l.id === loanId);
    if (!target) return;

    const targetType = target.type || 'lent';
    let updatedTx = transactions;

    if (targetType === 'lent') {
      // Friend repaid me -> cash enters wallet (Income)
      const repaymentTx = {
        id: 'tx-repay-' + Date.now(),
        type: 'income',
        amount: target.amount,
        category: 'other',
        date: todayStr,
        note: `Repaid by ${target.friendName}${target.note ? ` (Settled: ${target.note})` : ''}`,
        loanId: target.id,
      };
      updatedTx = [repaymentTx, ...transactions];
      setTransactions(updatedTx);
      showToast(`Repaid! Added ${currency} ${target.amount.toLocaleString()} to wallet.`);
    } else {
      // I paid back friend -> cash leaves wallet (Expense)
      const payBackTx = {
        id: 'tx-payback-' + Date.now(),
        type: 'expense',
        amount: target.amount,
        category: 'personal',
        date: todayStr,
        note: `Paid back loan to ${target.friendName}${target.note ? ` (${target.note})` : ''}`,
        loanId: target.id,
      };
      updatedTx = [payBackTx, ...transactions];
      setTransactions(updatedTx);
      showToast(`Settled! Paid back ${currency} ${target.amount.toLocaleString()} to ${target.friendName}.`);
    }

    const updatedLoans = loans.map(l =>
      l.id === loanId
        ? { ...l, status: 'settled', settledAt: Date.now(), settledDate: todayStr }
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

  // Filtered transactions for wallet tab
  const filtered = transactions.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const noteMatch = (t.note || '').toLowerCase().includes(q);
    const amtMatch = String(t.amount).includes(q);
    const cat = CATEGORIES[t.category];
    const catMatch = (cat?.nameEn || '').toLowerCase().includes(q) || (cat?.nameSi || '').includes(q);
    return noteMatch || amtMatch || catMatch;
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
            
            {/* 1. Real Cash-in-Hand Hero Card */}
            <section className="hero-balance-card">
              <div className="hero-top-row">
                <div className="hero-title-with-badge">
                  <img src="/app-icon.png" alt="UniCash" className="hero-app-badge" />
                  <div>
                    <span className="hero-subtitle">
                      {isSi ? `💰 ${currentUser.name} ගේ අතේ ඇති මුදල` : `${currentUser.name}'s Cash in Hand`}
                    </span>
                    <span className="hero-tagline">@{currentUser.username} • Campus Wallet</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setDirectBalanceInput(String(Math.max(0, currentBalance)));
                    setIsEditingBalance(true);
                  }}
                  className="btn-edit-balance"
                  title={isSi ? 'දැනට අතේ ඇති මුදල කෙළින්ම ඇතුළත් කරන්න' : 'Set Exact Cash in Hand'}
                >
                  <Edit3 size={13} />
                  <span>{isSi ? 'මුදල වෙනස් කරන්න' : 'Edit Balance'}</span>
                </button>
              </div>

              <div className="hero-main-amount">
                <span className="currency-mark">{currency}</span>
                <span className={`balance-number ${currentBalance < 1000 ? 'text-danger-warn' : ''}`}>
                  {currentBalance.toLocaleString()}
                </span>
              </div>

              {/* Dynamic survival / runway estimate */}
              <div className="runway-status-box">
                {currentBalance <= 0 ? (
                  <div className="runway-alert danger">
                    <AlertTriangle size={16} />
                    <span>
                      {isSi
                        ? '🚨 අතේ මුදල් ඉවර වී ඇත! ගෙදරින් සල්ලි ලැබුණු විට පහත බොත්තමෙන් ඇතුළත් කරන්න.'
                        : '🚨 You have run out of cash! Tap "+ Add Money" when cash arrives from home.'}
                    </span>
                  </div>
                ) : currentBalance < 1000 ? (
                  <div className="runway-alert warning">
                    <AlertTriangle size={16} />
                    <span>
                      {isSi
                        ? `⚠️ සල්ලි ඉවර වේගෙන එන්නේ (ඉතිරි ${currency} ${currentBalance.toLocaleString()} යි). අත්‍යවශ්‍ය දේට පමණක් වියදම් කරන්න.`
                        : `⚠️ Low cash alert! Only ${currency} ${currentBalance.toLocaleString()} left. Spend carefully on essentials.`}
                    </span>
                  </div>
                ) : (
                  <div className="runway-pill healthy">
                    <Clock size={15} />
                    <span>
                      {isSi ? (
                        <>
                          දෛනික සාමාන්‍ය වියදම ~<strong>{currency} {avgDailySpend}</strong> අනුව, මෙම මුදල තව <strong>දින ~{estimatedDaysLeft} කට</strong> පමණ සෑහේ.
                        </>
                      ) : (
                        <>
                          At ~<strong>{currency} {avgDailySpend}/day</strong>, your cash will safely last for ~<strong>{estimatedDaysLeft} days</strong>.
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {todaySpent > 0 && (
                <div className="hero-subinfo">
                  <span>{isSi ? 'අද දින වැය වූ මුදල: ' : 'Spent Today: '} <strong>{currency} {todaySpent.toLocaleString()}</strong></span>
                </div>
              )}
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

            {/* Direct Balance Edit Modal */}
            {isEditingBalance && (
              <div className="mini-modal-overlay">
                <div className="mini-modal-card">
                  <h4>{isSi ? 'දැනට ඔබ ළඟ ඇති මුදල ඇතුළත් කරන්න' : 'Set Your Exact Cash in Hand'}</h4>
                  <p className="modal-help">
                    {isSi
                      ? 'පසුම්බියේ හෝ ගිණුමේ මේ මොහොතේ ඔබ සතුව ඇති මුදල සටහන් කරන්න:'
                      : 'Enter the exact cash amount you currently have in hand or wallet right now:'}
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
                        ? (isSi ? 'මොනවටද? (උදා: දවල් කෑම, බස්, පොත්...)' : 'What was it for? (e.g. Lunch, Bus, Books)')
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
                      onChange={e => setCategory(e.target.value)}
                      className="clean-select"
                    >
                      {Object.values(CATEGORIES).map(c => (
                        <option key={c.id} value={c.id}>
                          {isSi ? c.nameSi : c.nameEn}
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
                          className="simple-chip"
                        >
                          <span>{isSi ? item.labelSi : item.labelEn}</span>
                          <strong className="chip-price">+{item.amount}</strong>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setLoanType('lent');
                          setLoanModalOpen(true);
                        }}
                        className="simple-chip chip-highlight-loan"
                        title="I lent money to a friend"
                      >
                        <ArrowUpRight size={13} />
                        <span>{isSi ? '+ යාලුවෙකුට දුන්නා' : '+ Lent Money'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoanType('borrowed');
                          setLoanModalOpen(true);
                        }}
                        className="simple-chip chip-highlight-borrow"
                        title="I borrowed money from a friend"
                      >
                        <ArrowDownLeft size={13} />
                        <span>{isSi ? '+ යාලුවෙකුගෙන් ගත්තා' : '+ Borrowed Money'}</span>
                      </button>
                    </>
                  )
                  : QUICK_ADD_INCOME.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickIncome(item)}
                        className="simple-chip income-chip"
                      >
                        <span>{isSi ? item.labelSi : item.labelEn}</span>
                        <strong className="chip-price-inc">+{item.amount}</strong>
                      </button>
                    ))}
              </div>
            </section>

            {/* 3. Clean Transaction History */}
            <section className="transactions-simple-card">
              <div className="list-header-row">
                <h3>{isSi ? 'ගනුදෙනු ලැයිස්තුව (History)' : 'Recent Transactions'}</h3>
                
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

              {filtered.length === 0 ? (
                <div className="empty-simple">
                  <p>{isSi ? 'තවම ගනුදෙනු සටහන් කර නැත' : 'No transactions recorded yet'}</p>
                </div>
              ) : (
                <div className="simple-tx-list">
                  {filtered.map(t => {
                    const isIncome = t.type === 'income';
                    const cat = CATEGORIES[t.category] || CATEGORIES.other;
                    return (
                      <div key={t.id} className="simple-tx-item">
                        <div className="tx-left-col">
                          <div
                            className={`tx-cat-circle ${isIncome ? 'circle-income' : ''}`}
                            style={{
                              backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.15)' : cat.bgColor,
                              color: isIncome ? '#10b981' : cat.color,
                            }}
                          >
                            {isIncome ? <ArrowUpRight size={16} /> : <CategoryIcon categoryId={t.category} size={15} />}
                          </div>
                          <div>
                            <div className="tx-item-title">{t.note}</div>
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
                            {loan.deductedFromWallet && (
                              <span className="loan-wallet-tag" title="Synced with wallet cash">
                                <Wallet size={11} />
                                <span>
                                  {isBorrowed
                                    ? (isSi ? 'පසුම්බියට එකතු විය' : 'Added to Wallet')
                                    : (isSi ? 'පසුම්බියෙන් අඩු විය' : 'Deducted from Wallet')}
                                </span>
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
          <div className="mini-modal-card loan-record-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title-row">
              <div className="title-with-icon">
                <Users size={22} className="text-accent" />
                <h4>
                  {loanType === 'lent'
                    ? (isSi ? 'යාලුවෙකුට දුන් ණයක් සටහන් කිරීම' : 'Record Money Lent to Friend')
                    : (isSi ? 'යාලුවෙකුගෙන් ගත් ණයක් සටහන් කිරීම' : 'Record Money Borrowed from Friend')}
                </h4>
              </div>
              <button onClick={() => setLoanModalOpen(false)} className="btn-modal-close">✕</button>
            </div>

            {/* Mode Toggle inside Modal */}
            <div className="modal-debt-type-toggle">
              <button
                type="button"
                className={`debt-toggle-btn ${loanType === 'lent' ? 'active-lent' : ''}`}
                onClick={() => setLoanType('lent')}
              >
                <ArrowUpRight size={15} />
                <span>{isSi ? 'යාලුවෙකුට දුන්නා (Lent)' : 'I Lent to Friend'}</span>
              </button>
              <button
                type="button"
                className={`debt-toggle-btn ${loanType === 'borrowed' ? 'active-borrowed' : ''}`}
                onClick={() => setLoanType('borrowed')}
              >
                <ArrowDownLeft size={15} />
                <span>{isSi ? 'යාලුවෙකුගෙන් ගත්තා (Borrowed)' : 'I Borrowed from Friend'}</span>
              </button>
            </div>

            <p className="modal-help">
              {loanType === 'lent'
                ? (isSi
                    ? 'කැන්ටිමට, බස් එකට හෝ පොත්වලට යාලුවෙකුට දුන් මුදල් සටහන් කරගන්න:'
                    : 'Track who borrowed from you so you never lose track of cash owed to you:')
                : (isSi
                    ? 'මුදල් මදි වූ වෙලාවක යාලුවෙකුගෙන් ගත් මුදලක් මතක තබා ගැනීමට සටහන් කරන්න:'
                    : 'Track cash you received from a friend to help you remember to pay back:')}
            </p>

            <form onSubmit={handleAddLoanSubmit} className="loan-form">
              <div className="form-field">
                <label>
                  {loanType === 'lent'
                    ? (isSi ? 'යාලුවාගේ නම (Friend Name) *' : 'Friend’s Name *')
                    : (isSi ? 'ණයට ගත් යාලුවාගේ නම (Borrowed From) *' : 'Borrowed From (Friend’s Name) *')}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={loanType === 'lent' ? 'e.g. Kasun, Supun, Nuwan...' : 'e.g. Supun, Boarding Mate, Kasun...'}
                  value={loanFriendName}
                  onChange={e => setLoanFriendName(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              <div className="form-field">
                <label>
                  {loanType === 'lent'
                    ? (isSi ? 'දුන් මුදල (Amount Lent) *' : 'Amount Lent *')
                    : (isSi ? 'ගත් මුදල (Amount Borrowed) *' : 'Amount Borrowed *')}
                </label>
                <div className="input-group">
                  <span className="input-prefix">{currency}</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 500, 1000..."
                    value={loanAmount}
                    onChange={e => setLoanAmount(e.target.value)}
                    className="clean-input font-large"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>{isSi ? 'හේතුව / මොනවටද? (Reason / Note)' : 'Reason / For What (Optional)'}</label>
                <input
                  type="text"
                  placeholder={
                    loanType === 'lent'
                      ? 'e.g. Canteen lunch, Bus fare, Printout...'
                      : 'e.g. For canteen lunch when cash ran out, room rent...'
                  }
                  value={loanNote}
                  onChange={e => setLoanNote(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              <div className="form-field">
                <label>
                  {isSi
                    ? 'යාලුවාගේ දුරකථන අංකය (WhatsApp සඳහා)'
                    : 'Friend’s Phone Number (For WhatsApp Updates)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0771234567 (Optional)"
                  value={loanPhone}
                  onChange={e => setLoanPhone(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              <div className="form-field">
                <label>{isSi ? 'දිනය (Date)' : 'Date'}</label>
                <input
                  type="date"
                  value={loanDate}
                  onChange={e => setLoanDate(e.target.value)}
                  className="clean-input clean-box-input"
                />
              </div>

              {/* Wallet Sync Checkbox */}
              <div className="loan-checkbox-row">
                <label className="checkbox-custom-label">
                  <input
                    type="checkbox"
                    checked={loanDeductWallet}
                    onChange={e => setLoanDeductWallet(e.target.checked)}
                  />
                  <span>
                    <strong>
                      {loanType === 'lent'
                        ? (isSi ? 'දැනට අතේ ඇති මුදලින් අඩු කරන්න' : 'Deduct from current Cash in Hand')
                        : (isSi ? 'දැනට අතේ ඇති මුදලට එකතු කරන්න' : 'Add to current Cash in Hand')}
                    </strong>
                    <small>
                      {loanType === 'lent'
                        ? (isSi
                            ? 'ඔබගේ අතින් මුදල් වැය වූ නිසා පසුම්බියේ අතේ මුදල නිවැරදිව අඩු වේ.'
                            : 'Records an expense so your wallet balance decreases accurately.')
                        : (isSi
                            ? 'යාලුවාගෙන් මුදල් අතට ලැබුණු නිසා පසුම්බියේ අතේ ඇති මුදල වැඩි වේ.'
                            : 'Records an inflow so your wallet cash increases with the borrowed money.')}
                    </small>
                  </span>
                </label>
              </div>

              <div className="modal-actions-row">
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
                    ? (isSi ? 'ණය මුදල සටහන් කරන්න' : 'Save Lent Record')
                    : (isSi ? 'ගත් මුදල සටහන් කරන්න' : 'Save Borrowed Record')}
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

import React, { useState } from 'react';
import { CATEGORIES } from '../constants';
import CategoryIcon from './CategoryIcon';
import { Search, Filter, Trash2, ArrowDownRight, ArrowUpRight, Calendar, Tag } from 'lucide-react';

export default function TransactionList({
  transactions,
  onDeleteTransaction,
  currency,
  language,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Filter logic
  const filtered = transactions.filter(t => {
    // Type filter
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    // Category filter
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const noteMatch = (t.note || '').toLowerCase().includes(q);
      const cat = CATEGORIES[t.category];
      const catNameEnMatch = cat?.nameEn.toLowerCase().includes(q);
      const catNameSiMatch = cat?.nameSi.toLowerCase().includes(q);
      const dateMatch = (t.date || '').includes(q);
      const amountMatch = String(t.amount || '').includes(q);
      return noteMatch || catNameEnMatch || catNameSiMatch || dateMatch || amountMatch;
    }
    return true;
  });

  return (
    <div className="transaction-panel glass-panel">
      <div className="transaction-header">
        <div className="title-and-count">
          <h3>
            {language === 'si' ? '📝 වියදම් සහ ලැබීම් ඉතිහාසය' : '📝 Transactions History'}
          </h3>
          <span className="count-pill">
            {filtered.length} {language === 'si' ? 'ක් හමුවිය' : 'records'}
          </span>
        </div>

        {/* Filters and search */}
        <div className="filters-row">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={language === 'si' ? 'සොයන්න (කැන්ටිම, බස්, පොත්...)' : 'Search notes, category, date...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="type-toggle-pills">
            <button
              onClick={() => setSelectedType('all')}
              className={`pill-btn ${selectedType === 'all' ? 'active' : ''}`}
            >
              {language === 'si' ? 'සියල්ල' : 'All'}
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`pill-btn ${selectedType === 'expense' ? 'active' : ''}`}
            >
              {language === 'si' ? 'වියදම්' : 'Expenses'}
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`pill-btn ${selectedType === 'income' ? 'active' : ''}`}
            >
              {language === 'si' ? 'ලැබීම්' : 'Income'}
            </button>
          </div>

          <div className="category-select-wrap">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="category-dropdown"
            >
              <option value="all">
                {language === 'si' ? 'සියලුම අංශ (All Categories)' : 'All Categories'}
              </option>
              {Object.values(CATEGORIES).map(cat => (
                <option key={cat.id} value={cat.id}>
                  {language === 'si' ? cat.nameSi : cat.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="transactions-list-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🍃</span>
            <p className="empty-title">
              {language === 'si' ? 'කිසිදු ගනුදෙනුවක් හමු නොවීය' : 'No transactions found'}
            </p>
            <p className="empty-desc">
              {language === 'si'
                ? 'ඉහත ක්ෂණික බටන් වලින් හෝ නව වියදමක් එකතු කර ආරම්භ කරන්න.'
                : 'Use the quick-add chips above or add a new transaction to get started.'}
            </p>
          </div>
        ) : (
          <div className="transactions-items">
            {filtered.map(t => {
              const isIncome = t.type === 'income';
              const cat = CATEGORIES[t.category] || CATEGORIES.other;
              return (
                <div key={t.id} className={`tx-row ${isIncome ? 'tx-income' : 'tx-expense'}`}>
                  <div className="tx-left">
                    <div
                      className="tx-icon-badge"
                      style={{
                        backgroundColor: isIncome ? 'rgba(34, 197, 94, 0.15)' : cat.bgColor,
                        color: isIncome ? '#22c55e' : cat.color,
                      }}
                    >
                      {isIncome ? (
                        <ArrowUpRight size={18} />
                      ) : (
                        <CategoryIcon categoryId={t.category} size={18} />
                      )}
                    </div>
                    <div className="tx-details">
                      <span className="tx-note">{t.note || (isIncome ? 'Income' : cat.nameEn)}</span>
                      <div className="tx-meta">
                        <span className="tx-cat-tag">
                          {isIncome
                            ? (language === 'si' ? 'ලැබීම' : 'Income')
                            : (language === 'si' ? cat.nameSi : cat.nameEn)}
                        </span>
                        <span className="tx-date-tag">
                          <Calendar size={12} />
                          {t.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="tx-right">
                    <span className={`tx-amount ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                      {isIncome ? '+' : '-'}{currency} {Number(t.amount).toLocaleString()}
                    </span>
                    <button
                      onClick={() => onDeleteTransaction(t.id)}
                      className="btn-delete"
                      title={language === 'si' ? 'මකා දමන්න' : 'Delete'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

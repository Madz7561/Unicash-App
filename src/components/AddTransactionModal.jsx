import React, { useState } from 'react';
import { CATEGORIES } from '../constants';
import CategoryIcon from './CategoryIcon';
import { X, PlusCircle, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function AddTransactionModal({ isOpen, onClose, onAdd, currency, language }) {
  if (!isOpen) return null;

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(language === 'si' ? 'කරුණාකර වලංගු මුදලක් ඇතුළත් කරන්න' : 'Please enter a valid amount');
      return;
    }

    onAdd({
      id: 'tx-' + Date.now(),
      type,
      amount: parsedAmount,
      category: type === 'income' ? 'other' : category,
      date,
      note: note.trim() || (type === 'income' ? 'Income' : CATEGORIES[category]?.nameEn || 'Expense'),
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <PlusCircle size={20} className="text-accent" />
            <h3>
              {language === 'si' ? 'නව ගනුදෙනුවක් ඇතුළත් කරන්න' : 'Record New Transaction'}
            </h3>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error-banner">{error}</div>}

          {/* Type Toggle */}
          <div className="type-selector-tabs">
            <button
              type="button"
              className={`type-tab ${type === 'expense' ? 'active-expense' : ''}`}
              onClick={() => setType('expense')}
            >
              <ArrowDownRight size={18} />
              <span>{language === 'si' ? 'වියදමක් (Expense)' : 'Expense'}</span>
            </button>
            <button
              type="button"
              className={`type-tab ${type === 'income' ? 'active-income' : ''}`}
              onClick={() => setType('income')}
            >
              <ArrowUpRight size={18} />
              <span>{language === 'si' ? 'ලැබීමක් (Income)' : 'Income'}</span>
            </button>
          </div>

          {/* Amount Input */}
          <div className="form-group">
            <label>
              {language === 'si' ? 'මුදල (Amount)' : 'Amount'} ({currency}) *
            </label>
            <div className="amount-input-wrap">
              <span className="amount-prefix">{currency}</span>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 250"
                value={amount}
                onChange={e => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="input-amount"
                autoFocus
              />
            </div>
          </div>

          {/* Category (if expense) */}
          {type === 'expense' && (
            <div className="form-group">
              <label>{language === 'si' ? 'අංශය (Category)' : 'Category'} *</label>
              <div className="category-grid-picker">
                {Object.values(CATEGORIES).map(cat => (
                  <button
                    type="button"
                    key={cat.id}
                    className={`cat-picker-btn ${category === cat.id ? 'selected' : ''}`}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      borderColor: category === cat.id ? cat.color : 'transparent',
                    }}
                  >
                    <span
                      className="cat-picker-icon"
                      style={{ backgroundColor: cat.bgColor, color: cat.color }}
                    >
                      <CategoryIcon categoryId={cat.id} size={16} />
                    </span>
                    <span className="cat-picker-name">
                      {language === 'si' ? cat.nameSi : cat.nameEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date and Description */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label>{language === 'si' ? 'දිනය (Date)' : 'Date'} *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input-text"
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              {language === 'si' ? 'විස්තරය / සටහන (Note)' : 'Description / Note'}
            </label>
            <input
              type="text"
              placeholder={
                language === 'si'
                  ? 'උදා: කැන්ටිමෙන් දවල් කෑම, ඇසයින්මන්ට් ප්‍රින්ට්...'
                  : 'e.g. Canteen lunch, bus to campus, photostat...'
              }
              value={note}
              onChange={e => setNote(e.target.value)}
              className="input-text"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              {language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary">
              {language === 'si' ? 'සේව් කරන්න' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

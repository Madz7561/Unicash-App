import React, { useState } from 'react';
import { X, Settings, RotateCcw, Trash2, Check, DollarSign, Calendar, PiggyBank, Home } from 'lucide-react';

export default function BudgetSettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetSampleData,
  onClearAllData,
  language,
}) {
  if (!isOpen) return null;

  const [allowance, setAllowance] = useState(settings.monthlyAllowance);
  const [fixedCosts, setFixedCosts] = useState(settings.fixedCosts);
  const [savingsTarget, setSavingsTarget] = useState(settings.savingsTarget);
  const [cycleStartDay, setCycleStartDay] = useState(settings.cycleStartDay || 1);
  const [currency, setCurrency] = useState(settings.currency || 'Rs.');

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      monthlyAllowance: parseFloat(allowance) || 0,
      fixedCosts: parseFloat(fixedCosts) || 0,
      savingsTarget: parseFloat(savingsTarget) || 0,
      cycleStartDay: parseInt(cycleStartDay, 10) || 1,
      currency,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} className="text-accent" />
            <h3>
              {language === 'si' ? 'අයවැය සහ ගිණුම් සැකසුම් (Budget Settings)' : 'Budget & Allowance Settings'}
            </h3>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          {/* Monthly Allowance */}
          <div className="form-group">
            <label>
              {language === 'si' ? 'ගෙදරින් ලැබෙන මාසික මුදල (Monthly Allowance)' : 'Monthly Allowance from Home'} ({currency})
            </label>
            <input
              type="number"
              required
              value={allowance}
              onChange={e => setAllowance(e.target.value)}
              className="input-text"
            />
            <small className="form-help">
              {language === 'si'
                ? 'මාසික වියදම් සඳහා දෙමව්පියන් එවන සම්පූර්ණ මුදල'
                : 'Total monthly pocket money sent for your expenses'}
            </small>
          </div>

          {/* Fixed commitments */}
          <div className="form-group">
            <label>
              <Home size={15} className="inline-icon" />
              {language === 'si' ? 'ස්ථාවර වියදම් - බෝඩිම් / බිල්පත් (Boarding / Fixed Rent)' : 'Fixed Rent & Bills'} ({currency})
            </label>
            <input
              type="number"
              value={fixedCosts}
              onChange={e => setFixedCosts(e.target.value)}
              className="input-text"
            />
            <small className="form-help">
              {language === 'si'
                ? 'මාසය පටන් ගත් වහාම ගෙවිය යුතු බෝඩිං ගාස්තු හෝ බිල්පත්'
                : 'Rent or fixed commitments automatically planned for'}
            </small>
          </div>

          {/* Savings target */}
          <div className="form-group">
            <label>
              <PiggyBank size={15} className="inline-icon" />
              {language === 'si' ? 'ඉතිරිකිරීමේ ඉලක්කය / හදිසි අරමුදල (Savings Target)' : 'Savings / Emergency Fund'} ({currency})
            </label>
            <input
              type="number"
              value={savingsTarget}
              onChange={e => setSavingsTarget(e.target.value)}
              className="input-text"
            />
            <small className="form-help">
              {language === 'si'
                ? 'අනපේක්ෂිත වියදම් සඳහා ඉතිරි කර තබා ගැනීමට බලාපොරොත්තු වන මුදල'
                : 'Target amount you want to keep as savings or emergency cushion'}
            </small>
          </div>

          {/* Cycle start day and currency */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label>
                <Calendar size={15} className="inline-icon" />
                {language === 'si' ? 'මුදල් ලැබෙන දිනය' : 'Day Money Arrives'}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={cycleStartDay}
                onChange={e => setCycleStartDay(e.target.value)}
                className="input-text"
              />
              <small className="form-help">
                {language === 'si' ? 'මාසයේ දින (1 - 31)' : 'Day of month (1-31)'}
              </small>
            </div>

            <div className="form-group flex-1">
              <label>{language === 'si' ? 'මුදල් ඒකකය (Currency)' : 'Currency'}</label>
              <input
                type="text"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="input-text"
              />
              <small className="form-help">e.g. Rs. , LKR, $</small>
            </div>
          </div>

          {/* Action buttons */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              {language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>{language === 'si' ? 'සැකසුම් සුරකින්න' : 'Save Changes'}</span>
            </button>
          </div>

          {/* Danger zone / data utilities */}
          <div className="settings-danger-zone">
            <h4>{language === 'si' ? 'දත්ත කළමනාකරණය' : 'Data Management'}</h4>
            <div className="danger-zone-buttons">
              <button
                type="button"
                onClick={() => {
                  if (confirm(language === 'si' ? 'නියැදි දත්ත නැවත පූරණය කිරීමට අවශ්‍යද?' : 'Reset to student sample data?')) {
                    onResetSampleData();
                    onClose();
                  }
                }}
                className="btn-outline-warning"
              >
                <RotateCcw size={15} />
                <span>{language === 'si' ? 'නියැදි දත්ත පූරණය කරන්න' : 'Load Sample Data'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(language === 'si' ? 'සියලුම ගනුදෙනු මකා දැමීමට සහතිකද?' : 'Are you sure you want to delete all transactions?')) {
                    onClearAllData();
                    onClose();
                  }
                }}
                className="btn-outline-danger"
              >
                <Trash2 size={15} />
                <span>{language === 'si' ? 'සියල්ල මකා දමන්න' : 'Clear All Data'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

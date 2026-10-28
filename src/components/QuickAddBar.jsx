import React from 'react';
import { QUICK_ADD_ITEMS, CATEGORIES } from '../constants';
import CategoryIcon from './CategoryIcon';
import { Zap, Plus } from 'lucide-react';

export default function QuickAddBar({ onQuickAdd, onCustomAdd, currency, language }) {
  return (
    <div className="quick-add-panel glass-panel">
      <div className="quick-add-header">
        <div className="quick-add-title">
          <Zap size={18} className="text-accent" />
          <span>
            {language === 'si' ? 'ක්ෂණිකව වියදම් සටහන් කරන්න (Quick Add)' : 'Fast Quick Add (One-Tap)'}
          </span>
        </div>
        <button onClick={onCustomAdd} className="btn-primary-sm">
          <Plus size={16} />
          <span>{language === 'si' ? 'වෙනත් වියදමක් ඇතුළත් කරන්න' : 'Add Custom Transaction'}</span>
        </button>
      </div>

      <div className="quick-chips-row">
        {QUICK_ADD_ITEMS.map((item, index) => {
          const cat = CATEGORIES[item.category] || CATEGORIES.other;
          return (
            <button
              key={index}
              onClick={() => onQuickAdd(item)}
              className="quick-chip-btn"
              title={language === 'si' ? 'ක්ලික් කළ සැනින් සටහන් වේ' : 'Click to add immediately'}
            >
              <span className="quick-chip-icon" style={{ backgroundColor: cat.bgColor, color: cat.color }}>
                <CategoryIcon categoryId={item.category} size={15} />
              </span>
              <span className="quick-chip-label">
                {language === 'si' ? item.labelSi : item.labelEn}
              </span>
              <span className="quick-chip-price">
                +{currency} {item.amount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

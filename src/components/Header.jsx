import React from 'react';
import {
  GraduationCap,
  Moon,
  Sun,
  Globe,
  Settings,
  DownloadCloud,
  Plus,
} from 'lucide-react';

export default function Header({
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenExport,
  onOpenAddModal,
}) {
  const isSinhala = settings.language === 'si';

  const toggleLanguage = () => {
    onUpdateSettings({
      ...settings,
      language: isSinhala ? 'en' : 'si',
    });
  };

  const toggleDarkMode = () => {
    onUpdateSettings({
      ...settings,
      darkMode: !settings.darkMode,
    });
  };

  return (
    <header className="app-header glass-panel">
      <div className="header-left">
        <div className="brand-logo-wrap">
          <GraduationCap size={28} className="brand-icon" />
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <h1>UniCash</h1>
            <span className="brand-badge">Campus v1.0</span>
          </div>
          <p className="brand-tagline">
            {isSinhala
              ? 'විශ්වවිද්‍යාල වියදම් කළමනාකරු (Student Budget Tracker)'
              : 'University Student Expense & Budget Tracker'}
          </p>
        </div>
      </div>

      <div className="header-actions">
        <button
          onClick={onOpenAddModal}
          className="btn-add-header"
          title={isSinhala ? 'වියදමක් සටහන් කරන්න' : 'Record Transaction'}
        >
          <Plus size={18} />
          <span className="hide-on-mobile">{isSinhala ? 'වියදමක් ඇතුළත්' : 'Add Record'}</span>
        </button>

        <button
          onClick={toggleLanguage}
          className="btn-header-tool"
          title={isSinhala ? 'Switch to English' : 'සිංහල බසට මාරුවන්න'}
        >
          <Globe size={16} />
          <span className="lang-text">{isSinhala ? 'English' : 'සිංහල'}</span>
        </button>

        <button
          onClick={toggleDarkMode}
          className="btn-header-tool"
          title={settings.darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {settings.darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          onClick={onOpenExport}
          className="btn-header-tool"
          title={isSinhala ? 'වාර්තාව / Backup' : 'Backup & Export'}
        >
          <DownloadCloud size={17} />
        </button>

        <button
          onClick={onOpenSettings}
          className="btn-header-tool"
          title={isSinhala ? 'අයවැය සැකසුම්' : 'Budget Settings'}
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}

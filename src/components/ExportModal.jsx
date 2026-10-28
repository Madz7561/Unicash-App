import React, { useRef } from 'react';
import { X, Download, Upload, FileText, Printer, CheckCircle } from 'lucide-react';

export default function ExportModal({
  isOpen,
  onClose,
  transactions,
  settings,
  onImportData,
  language,
}) {
  if (!isOpen) return null;
  const fileInputRef = useRef(null);

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      transactions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unicash-student-budget-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = transactions.map(t => [
      t.date,
      t.type,
      t.category,
      t.amount,
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unicash-expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          onImportData(parsed.transactions, parsed.settings || settings);
          alert(language === 'si' ? 'දත්ත සාර්ථකව ප්‍රතිස්ථාපනය කෙරිණි!' : 'Data restored successfully!');
          onClose();
        } else {
          alert('Invalid file format');
        }
      } catch (err) {
        alert('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={20} className="text-accent" />
            <h3>
              {language === 'si' ? 'දත්ත බාගත කිරීම සහ මුද්‍රණය' : 'Backup & Export Report'}
            </h3>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="export-options-list">
          {/* JSON Backup */}
          <div className="export-option-card">
            <div className="option-info">
              <h4>{language === 'si' ? 'JSON උපස්ථ ගොනුව (Full Backup)' : 'Full JSON Backup'}</h4>
              <p>
                {language === 'si'
                  ? 'ඔබගේ සියලුම සැකසුම් සහ වියදම් තොරතුරු පරිගණකයට සුරැකීමට'
                  : 'Download complete backup file of all records and preferences'}
              </p>
            </div>
            <button onClick={handleExportJSON} className="btn-secondary">
              <Download size={16} />
              <span>{language === 'si' ? 'බාගත කරන්න' : 'Download JSON'}</span>
            </button>
          </div>

          {/* CSV for Excel */}
          <div className="export-option-card">
            <div className="option-info">
              <h4>{language === 'si' ? 'Excel / CSV ලේඛනය' : 'Excel / CSV Spreadsheet'}</h4>
              <p>
                {language === 'si'
                  ? 'වියදම් ලැයිස්තුව Excel මගින් විවෘත කිරීමට සුදුසු ආකෘතියෙන්'
                  : 'Export transactions spreadsheet compatible with Excel or Google Sheets'}
              </p>
            </div>
            <button onClick={handleExportCSV} className="btn-secondary">
              <Download size={16} />
              <span>{language === 'si' ? 'CSV බාගත කරන්න' : 'Download CSV'}</span>
            </button>
          </div>

          {/* Print / PDF */}
          <div className="export-option-card">
            <div className="option-info">
              <h4>{language === 'si' ? 'මාසික වාර්තාව මුද්‍රණය (Print / PDF)' : 'Print / Save as PDF'}</h4>
              <p>
                {language === 'si'
                  ? 'දෙමව්පියන්ට පෙන්වීමට හෝ තබා ගැනීමට මාසික වියදම් වාර්තාව'
                  : 'Print-ready summary report or save directly as PDF for your records'}
              </p>
            </div>
            <button onClick={handlePrint} className="btn-secondary">
              <Printer size={16} />
              <span>{language === 'si' ? 'මුද්‍රණය කරන්න' : 'Print Report'}</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="export-option-card import-card">
            <div className="option-info">
              <h4>{language === 'si' ? 'උපස්ථ ගොනුවක් ආයාත කරන්න (Restore)' : 'Restore from Backup'}</h4>
              <p>
                {language === 'si'
                  ? 'කලින් සුරැකි JSON ගොනුවකින් දත්ත නැවත ලබා ගැනීමට'
                  : 'Restore transactions from a previously exported backup file'}
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-outline-primary"
            >
              <Upload size={16} />
              <span>{language === 'si' ? 'ගොනුව තෝරන්න' : 'Upload Backup'}</span>
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-primary">
            {language === 'si' ? 'වසන්න' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

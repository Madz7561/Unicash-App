import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Calendar, Coffee, DollarSign } from 'lucide-react';

export default function StudentAdvisor({
  remainingBalance,
  daysLeft,
  safeDailySpend,
  todaySpent,
  currency,
  language,
}) {
  // Determine health level
  let status = 'safe';
  if (remainingBalance <= 0 || safeDailySpend < 300) {
    status = 'danger';
  } else if (safeDailySpend < 700) {
    status = 'warning';
  }

  const isTodayExceeded = todaySpent > safeDailySpend && safeDailySpend > 0;

  return (
    <div className={`advisor-card glass-panel status-${status}`}>
      <div className="advisor-header">
        <div className="advisor-title-wrap">
          <div className="advisor-icon-pill">
            {status === 'safe' && <CheckCircle2 size={24} className="text-success" />}
            {status === 'warning' && <AlertTriangle size={24} className="text-warning" />}
            {status === 'danger' && <ShieldAlert size={24} className="text-danger" />}
          </div>
          <div>
            <h4>
              {language === 'si'
                ? '🎓 කැම්පස් වියදම් උපදේශක (Student Survival Advisor)'
                : '🎓 Campus Budget & Survival Advisor'}
            </h4>
            <p className="advisor-subtitle">
              {language === 'si'
                ? `ඊළඟ මාසික මුදල ලැබීමට තව දින ${daysLeft} ක් ඇත`
                : `${daysLeft} days remaining until next allowance`}
            </p>
          </div>
        </div>

        <div className="daily-safe-pill">
          <span className="daily-safe-label">
            {language === 'si' ? 'අද දින උපරිම සීමාව:' : 'Safe Daily Limit:'}
          </span>
          <span className="daily-safe-value">
            {currency} {Math.max(0, Math.round(safeDailySpend)).toLocaleString()}
            <small>/ {language === 'si' ? 'දිනකට' : 'day'}</small>
          </span>
        </div>
      </div>

      <div className="advisor-body">
        <div className="advisor-alert-box">
          {status === 'safe' && (
            <p>
              {language === 'si'
                ? `✨ නියමයි! ඔබේ වියදම් හොඳින් පාලනය වී ඇත. දිනකට රු. ${Math.round(safeDailySpend)} බැගින් වියදම් කළහොත් මාසය අග වන තුරු සුවසේ පිරිමසා ගත හැක.`
                : `✨ Great job! Your spending is well balanced. Spending up to ${currency} ${Math.round(safeDailySpend)}/day will safely last you until next month.`}
            </p>
          )}

          {status === 'warning' && (
            <p>
              {language === 'si'
                ? `⚠️ අවධානය දෙන්න: ඉතිරි දින ${daysLeft} සඳහා දිනකට ඇත්තේ රු. ${Math.round(safeDailySpend)} කි. අමතර කෑම බීම සහ අනවශ්‍ය ගමන් පාලනය කරගන්න.`
                : `⚠️ Caution: You have ${currency} ${Math.round(safeDailySpend)}/day for the next ${daysLeft} days. Reduce discretionary snacks & outings.`}
            </p>
          )}

          {status === 'danger' && (
            <p>
              {language === 'si'
                ? `🚨 අනතුරු ඇඟවීමයි! මාසය අවසන් වීමට පෙර මුදල් අවසන් වීමේ අවදානමක් ඇත. දිනකට වැය කළ හැක්කේ රු. ${Math.round(safeDailySpend)} ක් පමණි. කැන්ටිමෙන් පමණක් ආහාර ගන්න.`
                : `🚨 Danger zone! High risk of running out of money before month ends. Max daily budget is ${currency} ${Math.round(safeDailySpend)}. Stick to essentials only.`}
            </p>
          )}

          {isTodayExceeded && (
            <div className="today-overspend-warning">
              📌 {language === 'si'
                ? `අද දින ඔබ දැනටමත් රු. ${todaySpent.toLocaleString()} ක් වියදම් කර ඇත (දෛනික සීමාවට වඩා රු. ${Math.round(todaySpent - safeDailySpend).toLocaleString()} ක් වැඩිය). හෙට දවසේ වියදම් ටිකක් අඩු කරගන්න!`
                : `You spent ${currency} ${todaySpent.toLocaleString()} today (${currency} ${Math.round(todaySpent - safeDailySpend).toLocaleString()} over safe daily limit). Try trimming spending tomorrow!`}
            </div>
          )}
        </div>

        {/* Actionable University Survival Tips */}
        <div className="survival-tips-grid">
          <div className="tip-chip">
            <span className="tip-icon">🍛</span>
            <span>{language === 'si' ? 'පිටින් කෑම වෙනුවට කැන්ටිමෙන් කෑම ගන්න' : 'Favor canteen meals over outside cafes'}</span>
          </div>
          <div className="tip-chip">
            <span className="tip-icon">🚌</span>
            <span>{language === 'si' ? 'CTB / දුම්රිය ශිෂ්‍ය සීසන් එක ලබාගන්න' : 'Get student bus/train season passes'}</span>
          </div>
          <div className="tip-chip">
            <span className="tip-icon">📄</span>
            <span>{language === 'si' ? 'ප්‍රින්ට්අවුට් වෙනුවට PDF / Tablets භාවිතා කරන්න' : 'Use digital PDFs when possible to save print costs'}</span>
          </div>
          <div className="tip-chip">
            <span className="tip-icon">💧</span>
            <span>{language === 'si' ? 'නිතර වතුර බෝතලයක් රැගෙන යන්න' : 'Carry a refillable water bottle to campus'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

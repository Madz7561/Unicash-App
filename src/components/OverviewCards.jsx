import React from 'react';
import { Wallet, TrendingDown, TrendingUp, Calendar, AlertCircle, Settings2, PiggyBank } from 'lucide-react';

export default function OverviewCards({
  monthlyAllowance,
  totalExpense,
  remainingBalance,
  todaySpent,
  safeDailySpend,
  daysLeft,
  currency,
  language,
  onOpenSettings,
}) {
  const spentPct = monthlyAllowance > 0 ? Math.min(100, Math.round((totalExpense / monthlyAllowance) * 100)) : 0;
  const isHealthy = remainingBalance > 0 && spentPct <= 85;

  return (
    <div className="overview-cards-grid">
      {/* 1. Monthly Allowance Card */}
      <div className="stat-card glass-panel card-income">
        <div className="stat-card-top">
          <div className="stat-icon-wrap income-icon">
            <Wallet size={22} />
          </div>
          <button
            onClick={onOpenSettings}
            className="btn-icon-subtle"
            title={language === 'si' ? 'අයවැය සකසන්න' : 'Adjust Budget'}
          >
            <Settings2 size={16} />
          </button>
        </div>
        <div className="stat-card-mid">
          <span className="stat-label">
            {language === 'si' ? 'ගෙදරින් ලැබුණු මුදල' : 'Monthly Allowance'}
          </span>
          <h2 className="stat-value">
            {currency} {Number(monthlyAllowance || 0).toLocaleString()}
          </h2>
        </div>
        <div className="stat-card-bottom">
          <span className="stat-subtext">
            {language === 'si' ? 'චක්‍රය: දින 30 කට වරක්' : '30-day budget cycle'}
          </span>
        </div>
      </div>

      {/* 2. Total Expenses Card */}
      <div className="stat-card glass-panel card-expense">
        <div className="stat-card-top">
          <div className="stat-icon-wrap expense-icon">
            <TrendingDown size={22} />
          </div>
          <span className="stat-badge danger">
            {spentPct}% {language === 'si' ? 'වියදම් වී ඇත' : 'spent'}
          </span>
        </div>
        <div className="stat-card-mid">
          <span className="stat-label">
            {language === 'si' ? 'මෙම මස මුළු වියදම' : 'Total Spent This Month'}
          </span>
          <h2 className="stat-value text-danger">
            {currency} {Number(totalExpense || 0).toLocaleString()}
          </h2>
        </div>
        <div className="stat-card-bottom">
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${spentPct > 80 ? 'bg-danger' : spentPct > 60 ? 'bg-warning' : 'bg-primary'}`}
              style={{ width: `${spentPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Remaining Balance Card */}
      <div className="stat-card glass-panel card-balance">
        <div className="stat-card-top">
          <div className="stat-icon-wrap balance-icon">
            <PiggyBank size={22} />
          </div>
          <span className={`stat-badge ${isHealthy ? 'success' : 'danger'}`}>
            {isHealthy
              ? (language === 'si' ? 'හොඳ මට්ටමක' : 'Healthy')
              : (language === 'si' ? 'පාලනය කරන්න' : 'Attention')}
          </span>
        </div>
        <div className="stat-card-mid">
          <span className="stat-label">
            {language === 'si' ? 'අතේ ඉතිරි මුදල' : 'Remaining Balance'}
          </span>
          <h2 className={`stat-value ${remainingBalance < 1500 ? 'text-danger' : 'text-success'}`}>
            {currency} {Number(remainingBalance || 0).toLocaleString()}
          </h2>
        </div>
        <div className="stat-card-bottom">
          <span className="stat-subtext">
            {language === 'si'
              ? `ඉදිරි දින ${daysLeft} සඳහා ප්‍රමාණවත් විය යුතුයි`
              : `Must last for next ${daysLeft} days`}
          </span>
        </div>
      </div>

      {/* 4. Safe Daily Limit vs Today Card */}
      <div className="stat-card glass-panel card-daily">
        <div className="stat-card-top">
          <div className="stat-icon-wrap daily-icon">
            <Calendar size={22} />
          </div>
          <span className="stat-badge info">
            {daysLeft} {language === 'si' ? 'දින ඉතිරිව ඇත' : 'days left'}
          </span>
        </div>
        <div className="stat-card-mid">
          <span className="stat-label">
            {language === 'si' ? 'අද වියදම / දෛනික සීමාව' : 'Today Spent / Safe Daily Limit'}
          </span>
          <div className="daily-comparison-row">
            <span className={`stat-subvalue ${todaySpent > safeDailySpend ? 'text-danger font-bold' : ''}`}>
              {currency} {todaySpent.toLocaleString()}
            </span>
            <span className="stat-divider">/</span>
            <span className="stat-target-limit">
              {currency} {Math.max(0, Math.round(safeDailySpend)).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="stat-card-bottom">
          <span className="stat-subtext">
            {todaySpent <= safeDailySpend
              ? (language === 'si' ? '✅ අද දින වියදම් සීමාවේ පවතී' : '✅ Within today’s safe budget')
              : (language === 'si' ? '⚠️ අද සීමාව ඉක්මවා ඇත' : '⚠️ Exceeded today’s safe limit')}
          </span>
        </div>
      </div>
    </div>
  );
}

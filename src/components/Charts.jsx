import React, { useState, useMemo } from 'react';
import { CATEGORIES } from '../constants';
import CategoryIcon from './CategoryIcon';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Flame,
  Award,
} from 'lucide-react';

export default function Charts({ transactions = [], currency = 'Rs.', language = 'en' }) {
  const isSi = language === 'si';
  const [timeframe, setTimeframe] = useState('all'); // '7d' | '14d' | '30d' | 'all'
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Filter transactions by timeframe
  const filteredTransactions = useMemo(() => {
    if (timeframe === 'all') return transactions;
    const now = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : 30;
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return transactions.filter(t => t.date >= cutoffStr);
  }, [transactions, timeframe]);

  // Income vs Expense Totals
  const incomeTxs = filteredTransactions.filter(t => t.type === 'income');
  const expenseTxs = filteredTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenseTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsPct = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
  const expensePctOfIncome = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 100;

  // Active days & Average daily spend
  const uniqueExpenseDays = [...new Set(expenseTxs.map(t => t.date))];
  const numDaysActive = Math.max(1, uniqueExpenseDays.length);
  const avgDailySpend = Math.round(totalExpense / numDaysActive) || 0;

  // Category breakdown calculation
  const categoryData = useMemo(() => {
    const totals = {};
    const counts = {};
    expenseTxs.forEach(t => {
      const cat = t.category || 'other';
      totals[cat] = (totals[cat] || 0) + Number(t.amount || 0);
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(totals)
      .map(([catId, amount]) => {
        const cat = CATEGORIES[catId] || CATEGORIES.other;
        const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        return {
          id: catId,
          name: isSi ? cat.nameSi : cat.nameEn,
          color: cat.color,
          bgColor: cat.bgColor,
          amount,
          pct,
          count: counts[catId] || 1,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenseTxs, totalExpense, isSi]);

  const topCategory = categoryData[0] || null;

  // Donut geometry
  const size = 230;
  const strokeWidth = 34;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const donutSlices = categoryData.map(cat => {
    const strokeDasharray = `${(cat.pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += (cat.pct / 100) * circumference;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // Daily Trend calculation (last N days based on timeframe)
  const barDaysCount = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : timeframe === '30d' ? 30 : 14;
  const dailyData = useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = barDaysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      const dayName = d.toLocaleDateString(isSi ? 'si-LK' : 'en-US', { weekday: 'short' });
      const daySpent = expenseTxs
        .filter(t => t.date === dateStr)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      result.push({ dateStr, dayLabel, dayName, daySpent, isToday: i === 0 });
    }
    return result;
  }, [expenseTxs, barDaysCount, isSi]);

  const maxDaily = Math.max(...dailyData.map(d => d.daySpent), 600);

  // Highest spending day
  const peakDay = dailyData.reduce((max, d) => (d.daySpent > max.daySpent ? d : max), dailyData[0] || { daySpent: 0, dateStr: 'N/A' });

  return (
    <div className="analytics-page">
      
      {/* 1. Header with Timeframe Filter Pills */}
      <div className="analytics-header-card">
        <div>
          <h3 className="analytics-main-title">
            <BarChart3 size={22} className="text-accent" />
            <span>{isSi ? 'වියදම් විශ්ලේෂණය සහ ප්‍රස්ථාර' : 'Financial Insights & Analytics'}</span>
          </h3>
          <p className="analytics-subtitle">
            {isSi
              ? 'ඔබගේ වියදම් රටාව, දෛනික ප්‍රවණතා සහ ඉතිරිවීම් නිරීක්ෂණය කරන්න'
              : 'Monitor category allocations, daily burn rate, and cash runway trends'}
          </p>
        </div>

        <div className="analytics-timeframe-selector">
          <button
            onClick={() => setTimeframe('7d')}
            className={`tf-pill-btn ${timeframe === '7d' ? 'active' : ''}`}
          >
            {isSi ? 'දින 7' : '7 Days'}
          </button>
          <button
            onClick={() => setTimeframe('14d')}
            className={`tf-pill-btn ${timeframe === '14d' ? 'active' : ''}`}
          >
            {isSi ? 'දින 14' : '14 Days'}
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`tf-pill-btn ${timeframe === '30d' ? 'active' : ''}`}
          >
            {isSi ? 'දින 30' : '30 Days'}
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`tf-pill-btn ${timeframe === 'all' ? 'active' : ''}`}
          >
            {isSi ? 'සියල්ල' : 'All Time'}
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="analytics-kpi-grid">
        {/* Total Expenses */}
        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">{isSi ? 'මුළු වියදම' : 'Total Expenses'}</span>
            <div className="kpi-icon-pill expense">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="kpi-value text-expense">
            {currency} {totalExpense.toLocaleString()}
          </div>
          <span className="kpi-sub">
            {expenseTxs.length} {isSi ? 'ගනුදෙනු' : 'transactions recorded'}
          </span>
        </div>

        {/* Daily Average */}
        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">{isSi ? 'දෛනික සාමාන්‍යය' : 'Daily Average'}</span>
            <div className="kpi-icon-pill amber">
              <Flame size={16} />
            </div>
          </div>
          <div className="kpi-value amber-text">
            {currency} {avgDailySpend.toLocaleString()}
            <span className="kpi-unit">/day</span>
          </div>
          <span className="kpi-sub">
            {isSi ? `දින ${numDaysActive} ක සාමාන්‍යය` : `Across ${numDaysActive} active days`}
          </span>
        </div>

        {/* Top Spending Category */}
        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">{isSi ? 'ප්‍රධානම වියදම' : 'Top Category'}</span>
            <div className="kpi-icon-pill indigo">
              <Award size={16} />
            </div>
          </div>
          <div className="kpi-value indigo-text">
            {topCategory ? topCategory.name : 'None'}
          </div>
          <span className="kpi-sub">
            {topCategory ? `${topCategory.pct.toFixed(0)}% of total (${currency} ${topCategory.amount.toLocaleString()})` : 'No data yet'}
          </span>
        </div>

        {/* Cash Flow Balance / Remaining */}
        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">{isSi ? 'අතේ ඉතිරි මුදල' : 'Net Cash Flow'}</span>
            <div className="kpi-icon-pill emerald">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className={`kpi-value ${netSavings >= 0 ? 'emerald-text' : 'text-expense'}`}>
            {currency} {netSavings.toLocaleString()}
          </div>
          <span className="kpi-sub">
            {totalIncome > 0
              ? (isSi ? `ලැබුණු මුදලින් ${savingsPct}% ක් ඉතිරිව ඇත` : `${savingsPct}% of received funds retained`)
              : (isSi ? 'ගෙදරින් ලැබුණු මුදල් නැත' : 'No income recorded')}
          </span>
        </div>
      </div>

      {/* 3. Cash Flow Visual Progress Bar */}
      {totalIncome > 0 && (
        <div className="analytics-flow-card">
          <div className="flow-card-header">
            <div className="flow-title-group">
              <Wallet size={17} className="text-accent" />
              <strong>{isSi ? 'මුදල් ලැබීම් සහ වියදම් සංසන්දනය' : 'Cash Flow Utilization'}</strong>
            </div>
            <span className="flow-badge">
              {expensePctOfIncome}% {isSi ? 'වැය වී ඇත' : 'Utilized'}
            </span>
          </div>

          <div className="flow-progress-track">
            <div
              className={`flow-progress-fill ${expensePctOfIncome > 80 ? 'fill-warning' : 'fill-healthy'}`}
              style={{ width: `${Math.min(100, expensePctOfIncome)}%` }}
            />
          </div>

          <div className="flow-stats-row">
            <div className="flow-stat-col">
              <span className="flow-dot emerald" />
              <span>{isSi ? 'ලැබුණු මුළු මුදල: ' : 'Total In: '} <strong>{currency} {totalIncome.toLocaleString()}</strong></span>
            </div>
            <div className="flow-stat-col">
              <span className="flow-dot red" />
              <span>{isSi ? 'වැය වූ මුදල: ' : 'Total Spent: '} <strong>{currency} {totalExpense.toLocaleString()}</strong></span>
            </div>
            <div className="flow-stat-col">
              <span className="flow-dot blue" />
              <span>{isSi ? 'ඉතිරි: ' : 'Remaining: '} <strong>{currency} {netSavings.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Two-Column Analytics Layout: Category Donut & Detailed List */}
      <div className="analytics-split-grid">
        
        {/* Left: Donut Chart Card */}
        <div className="analytics-chart-panel">
          <div className="panel-title-row">
            <div className="title-left">
              <PieChart size={18} className="text-accent" />
              <h4>{isSi ? 'වියදම් වර්ගීකරණය' : 'Category Allocation'}</h4>
            </div>
            <span className="panel-badge-sub">
              {categoryData.length} {isSi ? 'අංශ' : 'Categories'}
            </span>
          </div>

          {totalExpense === 0 ? (
            <div className="chart-empty-state">
              <PieChart size={40} className="empty-icon-faded" />
              <p>{isSi ? 'මෙම කාලසීමාව තුළ වියදම් සටහන් කර නැත' : 'No expenses recorded in this period'}</p>
            </div>
          ) : (
            <div className="donut-visualization-wrap">
              <div className="donut-svg-stage">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  <defs>
                    <filter id="donut-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.25" />
                    </filter>
                  </defs>

                  {/* Background Track */}
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="var(--border-color)"
                    strokeWidth={strokeWidth}
                    opacity={0.6}
                  />

                  {/* Slices */}
                  {donutSlices.map(slice => {
                    const isHovered = hoveredSlice?.id === slice.id;
                    return (
                      <circle
                        key={slice.id}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHovered ? strokeWidth + 7 : strokeWidth}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        strokeLinecap="round"
                        className="donut-animated-slice"
                        onMouseEnter={() => setHoveredSlice(slice)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        style={{
                          transform: 'rotate(-90deg)',
                          transformOrigin: '50% 50%',
                          transition: 'stroke-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
                          opacity: hoveredSlice && !isHovered ? 0.45 : 1,
                          cursor: 'pointer',
                          filter: isHovered ? 'url(#donut-glow)' : 'none',
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Dynamic Card */}
                <div className="donut-center-glass">
                  {hoveredSlice ? (
                    <div className="donut-hover-details animate-fade">
                      <span className="donut-hover-pct" style={{ color: hoveredSlice.color }}>
                        {hoveredSlice.pct.toFixed(0)}%
                      </span>
                      <span className="donut-hover-label">{hoveredSlice.name}</span>
                      <span className="donut-hover-amount">
                        {currency} {hoveredSlice.amount.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div className="donut-default-details">
                      <span className="donut-default-number">{categoryData.length}</span>
                      <span className="donut-default-sub">{isSi ? 'වියදම් අංශ' : 'Categories'}</span>
                      <span className="donut-default-hint">{isSi ? 'ස්පර්ශ කරන්න' : 'Hover to inspect'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Detailed Category Breakdown List with Progress Bars */}
        <div className="analytics-chart-panel">
          <div className="panel-title-row">
            <div className="title-left">
              <Sparkles size={18} className="text-accent" />
              <h4>{isSi ? 'අංශ අනුව විස්තරය' : 'Category Breakdown'}</h4>
            </div>
            <span className="panel-badge-sub">
              {currency} {totalExpense.toLocaleString()}
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="chart-empty-state">
              <p>{isSi ? 'දත්ත සටහන් කර නැත' : 'No category data available'}</p>
            </div>
          ) : (
            <div className="category-detailed-list">
              {categoryData.map(cat => {
                const isHovered = hoveredSlice?.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`category-item-card ${isHovered ? 'is-highlighted' : ''}`}
                    onMouseEnter={() => setHoveredSlice(cat)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <div className="cat-item-top">
                      <div className="cat-item-info">
                        <div
                          className="cat-icon-badge"
                          style={{ backgroundColor: cat.bgColor, color: cat.color }}
                        >
                          <CategoryIcon categoryId={cat.id} size={16} />
                        </div>
                        <div>
                          <span className="cat-item-name">{cat.name}</span>
                          <span className="cat-item-count">
                            {cat.count} {isSi ? 'වරක්' : `expense${cat.count > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>

                      <div className="cat-item-numbers">
                        <span className="cat-item-val">
                          {currency} {cat.amount.toLocaleString()}
                        </span>
                        <span className="cat-item-pct-badge" style={{ backgroundColor: cat.bgColor, color: cat.color }}>
                          {cat.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="cat-item-bar-track">
                      <div
                        className="cat-item-bar-fill"
                        style={{
                          width: `${cat.pct}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Daily Spending Trend (Interactive Bar Chart) */}
      <div className="analytics-chart-panel daily-chart-panel">
        <div className="panel-title-row">
          <div className="title-left">
            <Calendar size={18} className="text-accent" />
            <div>
              <h4>{isSi ? 'දෛනික වියදම් ප්‍රවණතාව' : 'Daily Spending Trend'}</h4>
              <span className="panel-hint-text">
                {isSi ? `පසුගිය දින ${barDaysCount} තුළ වියදම් හැසිරීම` : `Expense pattern across the last ${barDaysCount} days`}
              </span>
            </div>
          </div>

          <div className="panel-legend-pills">
            <span className="legend-chip">
              <span className="legend-dot-sq today-dot" /> {isSi ? 'අද (Today)' : 'Today'}
            </span>
            <span className="legend-chip">
              <span className="legend-dot-sq high-dot" /> {isSi ? 'වැඩි වියදම්' : 'Peak Day'}
            </span>
            <span className="legend-chip">
              <span className="legend-dot-sq avg-dot" /> {isSi ? 'සාමාන්‍යය' : `Avg (${currency} ${avgDailySpend})`}
            </span>
          </div>
        </div>

        {totalExpense === 0 ? (
          <div className="chart-empty-state">
            <p>{isSi ? 'දෛනික වියදම් දත්ත නොමැත' : 'No daily spending recorded in this period'}</p>
          </div>
        ) : (
          <div className="daily-barchart-container">
            <div className="daily-bars-stage">
              {dailyData.map((d) => {
                const heightPct = Math.min(100, Math.max(5, (d.daySpent / maxDaily) * 100));
                const isPeak = d.daySpent > 0 && d.daySpent === peakDay.daySpent;
                const isHovered = hoveredBar?.dateStr === d.dateStr;

                return (
                  <div
                    key={d.dateStr}
                    className={`bar-data-column ${d.isToday ? 'is-today' : ''} ${isPeak ? 'is-peak' : ''}`}
                    onMouseEnter={() => setHoveredBar(d)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="bar-hover-popover">
                        <strong className="pop-amount">{currency} {d.daySpent.toLocaleString()}</strong>
                        <span className="pop-date">{d.dayName}, {d.dayLabel}</span>
                      </div>
                    )}

                    <div className="bar-vertical-track">
                      <div
                        className={`bar-vertical-fill ${d.isToday ? 'fill-today' : isPeak ? 'fill-peak' : d.daySpent > avgDailySpend ? 'fill-high' : 'fill-regular'}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    <span className={`bar-bottom-label ${d.isToday ? 'today-label' : ''}`}>
                      {d.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Average spend guideline */}
            {avgDailySpend > 0 && (
              <div
                className="bar-avg-guideline"
                style={{ bottom: `${Math.min(90, Math.max(15, (avgDailySpend / maxDaily) * 100))}%` }}
                title={`Average: ${currency} ${avgDailySpend}`}
              >
                <span className="avg-line-label">Avg: {currency} {avgDailySpend}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Smart Financial Insights for Students */}
      <div className="analytics-smart-insights-grid">
        <div className="smart-insight-card">
          <div className="insight-icon-box flame">
            <Flame size={20} />
          </div>
          <div>
            <h5>{isSi ? 'වැඩිපුරම වියදම් වූ දිනය' : 'Highest Spending Peak'}</h5>
            <p>
              {peakDay && peakDay.daySpent > 0 ? (
                isSi ? (
                  <><strong>{peakDay.dateStr}</strong> දින <strong>{currency} {peakDay.daySpent.toLocaleString()}</strong> ක වියදමක් වාර්තා විය.</>
                ) : (
                  <>Your highest single-day spend was <strong>{currency} {peakDay.daySpent.toLocaleString()}</strong> on <strong>{peakDay.dateStr}</strong>.</>
                )
              ) : (
                isSi ? 'තවම විශාල වියදමක් සටහන් වී නැත.' : 'No major spending peaks detected yet.'
              )}
            </p>
          </div>
        </div>

        <div className="smart-insight-card">
          <div className="insight-icon-box food">
            <CategoryIcon categoryId="food" size={20} />
          </div>
          <div>
            <h5>{isSi ? 'ආහාර සහ කැන්ටිම් වියදම' : 'Food & Meal Allocation'}</h5>
            <p>
              {(() => {
                const foodCat = categoryData.find(c => c.id === 'food');
                if (foodCat && totalExpense > 0) {
                  return isSi ? (
                    <>ඔබගේ මුළු වියදමෙන් <strong>{foodCat.pct.toFixed(0)}% ({currency} {foodCat.amount.toLocaleString()})</strong> කෑම බීම සඳහා වැය වී ඇත.</>
                  ) : (
                    <>Food & meals account for <strong>{foodCat.pct.toFixed(0)}% ({currency} {foodCat.amount.toLocaleString()})</strong> of your expenditures.</>
                  );
                }
                return isSi ? 'කෑම බීම වියදම් සටහන් කර නැත.' : 'No food transactions recorded yet.';
              })()}
            </p>
          </div>
        </div>

        <div className="smart-insight-card">
          <div className="insight-icon-box balance">
            <Sparkles size={20} />
          </div>
          <div>
            <h5>{isSi ? 'කැම්පස් අයවැය උපදෙස' : 'Campus Budget Tip'}</h5>
            <p>
              {avgDailySpend > 600 ? (
                isSi ? (
                  <>දෛනික වියදම ~<strong>{currency} {avgDailySpend}</strong> තරමක් ඉහළය. සුළු වියදම් පාලනය කරගෙන මුදල් ඉතිරි කරගන්න.</>
                ) : (
                  <>Your daily burn rate (~<strong>{currency} {avgDailySpend}</strong>) is a bit high. Trimming small canteen extras will extend your cash.</>
                )
              ) : (
                isSi ? (
                  <>ඔබගේ දෛනික වියදම (~<strong>{currency} {avgDailySpend}</strong>) ඉතා හොඳ මට්ටමක පවතී. මෙම ක්‍රමය ඉදිරියටත් පවත්වාගන්න!</>
                ) : (
                  <>Great discipline! Your daily burn rate (~<strong>{currency} {avgDailySpend}</strong>) is well-balanced for campus life.</>
                )
              )}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

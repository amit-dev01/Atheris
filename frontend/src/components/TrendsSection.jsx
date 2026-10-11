import { useState, useContext, useEffect, useMemo } from 'react';
import { DbContext } from '../App';
import { 
  TrendingUp, TrendingDown, Loader2, AlertCircle, 
  Target, Zap, ShieldAlert, BarChart3, RefreshCw, 
  ExternalLink, CheckSquare, Search, Layers, Activity, Check
} from 'lucide-react';
import { getIntelligenceTrends, createTask } from '../api';
import { getTrendHumanReadableLabel, getImpactBadgeStyle } from '../constants';

export default function TrendsSection() {
  const context = useContext(DbContext) || {};
  const { 
    intelligenceTrends, 
    refreshAlertsAndTrends, 
    refreshTaskStats,
    checkStatus, 
    startCheck, 
    showToast,
    selectedCompetitorFilter 
  } = context;

  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL'); // ALL, PRODUCT, PRICING, GTM, CRITICAL
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatchedTasks, setDispatchedTasks] = useState({});
  const [dispatchingId, setDispatchingId] = useState(null);

  const fetchTrends = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const data = await getIntelligenceTrends();
      setTrendsData(data);
      if (refreshAlertsAndTrends) refreshAlertsAndTrends();
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError('Failed to load competitive trends. Please try again.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (intelligenceTrends && !trendsData) {
      setTrendsData(intelligenceTrends);
      fetchTrends(false);
    } else {
      fetchTrends(true);
    }
  }, []);

  // Handle 1-click dispatch to Action Center
  const handleCreateTaskFromTrend = async (trend) => {
    if (dispatchedTasks[trend.id] || dispatchingId === trend.id) return;
    setDispatchingId(trend.id);
    try {
      const payload = {
        title: `Counter-strategy for ${trend.competitorName}: ${getTrendHumanReadableLabel(trend.trendType)}`,
        description: `${trend.description}\n\nRecommended Action: ${trend.recommendedAction || 'Formulate tactical counter-response.'}`,
        priority: trend.severity === 'CRITICAL' ? 'CRITICAL' : trend.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
        category: 'COMPETITOR_RESPONSE',
        competitor_id: trend.competitorId,
        competitor_name: trend.competitorName,
        source_type: 'AI_TREND'
      };
      await createTask(payload);
      setDispatchedTasks(prev => ({ ...prev, [trend.id]: true }));
      if (refreshTaskStats) refreshTaskStats();
      if (showToast) {
        showToast(`Task created for ${trend.competitorName} in Action Center!`, 'success');
      }
    } catch (err) {
      console.error('Failed to dispatch task:', err);
      if (showToast) {
        showToast('Could not create task. Please try again.', 'error');
      }
    } finally {
      setDispatchingId(null);
    }
  };

  const rawTrendsList = trendsData?.trends || [];
  const activeTrends = rawTrendsList.filter(t => t.isActive !== false);

  // Filter trends based on active category tab, search query, and global competitor filter
  const filteredTrends = useMemo(() => {
    return activeTrends.filter(trend => {
      // Global filter from sidebar
      if (selectedCompetitorFilter && selectedCompetitorFilter !== 'All Competitors') {
        if (trend.competitorName?.toLowerCase() !== selectedCompetitorFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesComp = trend.competitorName?.toLowerCase().includes(q);
        const matchesDesc = trend.description?.toLowerCase().includes(q);
        const matchesAction = trend.recommendedAction?.toLowerCase().includes(q);
        const matchesType = trend.trendType?.toLowerCase().includes(q);
        if (!matchesComp && !matchesDesc && !matchesAction && !matchesType) {
          return false;
        }
      }

      // Category tab
      if (filterCategory === 'CRITICAL') {
        return trend.severity === 'CRITICAL';
      }
      if (filterCategory === 'PRODUCT') {
        const t = (trend.trendType || '').toLowerCase();
        return t.includes('product') || t.includes('feature') || t.includes('launch') || t.includes('ai');
      }
      if (filterCategory === 'PRICING') {
        const t = (trend.trendType || '').toLowerCase();
        return t.includes('price') || t.includes('pricing') || t.includes('tier') || t.includes('cost');
      }
      if (filterCategory === 'GTM') {
        const t = (trend.trendType || '').toLowerCase();
        return t.includes('expansion') || t.includes('partner') || t.includes('marketing') || t.includes('leadership');
      }

      return true;
    });
  }, [activeTrends, filterCategory, searchQuery, selectedCompetitorFilter]);

  // Group filtered trends by competitor
  const trendsByCompetitor = useMemo(() => {
    return filteredTrends.reduce((acc, trend) => {
      const comp = trend.competitorName || 'Unknown Competitor';
      if (!acc[comp]) acc[comp] = [];
      acc[comp].push(trend);
      return acc;
    }, {});
  }, [filteredTrends]);

  // Macro thematic clusters from unsupervised KMeans
  const macroClusters = trendsData?.macroThematicClusters || [];
  const dominantTheme = trendsData?.dominantTheme || 'Product & AI Innovation';

  // Summary counts
  const totalActive = trendsData?.totalActive || activeTrends.length;
  const criticalCount = trendsData?.criticalCount ?? activeTrends.filter(t => t.severity === 'CRITICAL').length;
  const highCount = trendsData?.highCount ?? activeTrends.filter(t => t.severity === 'HIGH').length;
  const trendingCompetitorsCount = trendsData?.trendingCompetitorsCount ?? Object.keys(trendsByCompetitor).length;

  if (loading && !trendsData) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse pb-12">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
        <div className="h-44 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 mt-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !trendsData) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{error}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Could not communicate with the intelligence backend. Please verify your connection or refresh your session.
        </p>
        <button
          onClick={() => fetchTrends(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all"
        >
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* ── HEADER & LIVE ACTIONS ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <TrendingUp size={30} className="text-blue-600 dark:text-blue-400" /> Competitive Trends & Dynamics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Algorithmic pattern recognition and momentum vectors detected across competitor activity.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchTrends(false)}
            title="Refresh trends data"
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl shadow-sm hover:bg-slate-50 transition-all text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={startCheck}
            disabled={checkStatus?.status === 'RUNNING'}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md text-sm disabled:opacity-50"
          >
            {checkStatus?.status === 'RUNNING' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Checking Signals...
              </>
            ) : (
              <>
                <Zap size={16} />
                Run Signal Check
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Card if running background monitoring */}
      {checkStatus?.status === 'RUNNING' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-blue-700 dark:text-blue-400 font-bold text-sm">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Scanning competitor activity & detecting momentum vectors...
            </div>
            <span>{checkStatus.progress}%</span>
          </div>
          <div className="w-full bg-blue-200/50 dark:bg-blue-900/50 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${checkStatus.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
            <span>Current Step: {checkStatus.currentStep}</span>
            <span>Signals Scraped: {checkStatus.documentsFound} | Processed: {checkStatus.documentsProcessed}</span>
          </div>
        </div>
      )}

      {/* ── SUMMARY BAR (4 STAT CARDS) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Trends', val: totalActive, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Critical Threats', val: criticalCount, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30' },
          { label: 'High Priority', val: highCount, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30' },
          { label: 'Trending Competitors', val: trendingCompetitorsCount, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.val}</div>
            </div>
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* ── MACRO MARKET THEMATIC CLUSTERS (UNSUPERVISED ML KMEANS) ── */}
      {macroClusters.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <Layers size={16} />
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Macro Market Attention (AI Thematic Clusters)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Unsupervised K-Means clustering groups {trendsData?.totalActive || 0} intelligence vectors into dominant industry themes.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-600 dark:text-blue-400">
              <Activity size={13} />
              Dominant Vector: {dominantTheme}
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            {macroClusters.map((cluster, idx) => {
              const colors = [
                'bg-blue-600',
                'bg-purple-600',
                'bg-emerald-500',
                'bg-amber-500'
              ];
              const color = colors[idx % colors.length];
              return (
                <div
                  key={cluster.clusterId || idx}
                  className={`${color} h-full transition-all duration-500`}
                  style={{ width: `${cluster.categorySharePct || 25}%` }}
                  title={`${cluster.theme}: ${cluster.categorySharePct}%`}
                />
              );
            })}
          </div>

          {/* Cluster Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {macroClusters.map((cluster, idx) => {
              const borderColors = [
                'border-blue-200 dark:border-blue-900/50',
                'border-purple-200 dark:border-purple-900/50',
                'border-emerald-200 dark:border-emerald-900/50'
              ];
              const tagColors = [
                'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              ];
              return (
                <div 
                  key={cluster.clusterId || idx}
                  className={`bg-slate-50/70 dark:bg-slate-950/40 border ${borderColors[idx % borderColors.length]} rounded-2xl p-4 space-y-3 flex flex-col justify-between`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {cluster.theme}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 shrink-0">
                      {cluster.categorySharePct}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(cluster.topKeyphrases || []).slice(0, 4).map((term, tIdx) => (
                      <span 
                        key={tIdx}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${tagColors[idx % tagColors.length]}`}
                      >
                        {term}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    {cluster.documentCount || 0} events clustered
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
          {[
            { id: 'ALL', label: 'All Trends' },
            { id: 'PRODUCT', label: 'Product & AI' },
            { id: 'PRICING', label: 'Pricing & Monetization' },
            { id: 'GTM', label: 'GTM & Expansion' },
            { id: 'CRITICAL', label: 'Critical Only' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                filterCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trends or competitors..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {filteredTrends.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <TrendingUp size={48} className="text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            No matching trends found
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
            {searchQuery 
              ? `No trends matching "${searchQuery}". Try adjusting your search or tab filters.`
              : 'Run a live check to scan competitor signals and identify emerging trend patterns.'}
          </p>
          <button
            onClick={startCheck}
            disabled={checkStatus?.status === 'RUNNING'}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-sm"
          >
            <Zap size={14} /> Run Live Scan
          </button>
        </div>
      )}

      {/* ── TRENDS BY COMPETITOR ── */}
      <div className="space-y-8">
        {Object.entries(trendsByCompetitor).map(([compName, compTrends]) => (
          <section key={compName} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
                {compName}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {compTrends.length} {compTrends.length === 1 ? 'trend' : 'trends'}
                </span>
              </h2>

              {compTrends[0]?.momentum && (
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  compTrends[0].momentum === 'ACCELERATING' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                }`}>
                  <TrendingUp size={12} />
                  {compTrends[0].momentum} VELOCITY
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {compTrends.map(trend => {
                const changePct = trend.changePercent ?? 0;
                const isPositive = changePct >= 0;
                const isTaskCreated = dispatchedTasks[trend.id];
                const isDispatching = dispatchingId === trend.id;

                return (
                  <div 
                    key={trend.id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white block">
                          {getTrendHumanReadableLabel(trend.trendType)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Observed {trend.periodStart || 'Last 14d'} – {trend.periodEnd || 'Today'}
                        </span>
                      </div>
                      
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${getImpactBadgeStyle(trend.severity)}`}>
                        {trend.severity}
                      </span>
                    </div>

                    {/* Change Indicator Box */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isPositive ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                          <div className={`font-black text-lg ${isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                            {isPositive ? '+' : ''}{changePct}% vs baseline
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            Current: <strong>{trend.currentValue ?? 'N/A'}</strong> events | Baseline: <strong>{trend.baselineValue ?? 'N/A'}</strong>
                          </div>
                        </div>
                      </div>

                      {trend.momentum && (
                        <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                          {trend.momentum}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {trend.description}
                    </p>

                    {/* Strategic Implication & Action Box */}
                    <div className="space-y-3 pt-2">
                      {trend.strategicImplication && (
                        <div className="bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-3.5 space-y-1">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                            <Activity size={12} />
                            Strategic Context
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                            {trend.strategicImplication}
                          </p>
                        </div>
                      )}

                      {trend.recommendedAction && (
                        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Target size={12} />
                              Tactical Counter-Move
                            </div>

                            <button
                              onClick={() => handleCreateTaskFromTrend(trend)}
                              disabled={isTaskCreated || isDispatching}
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                                isTaskCreated
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 cursor-default'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                              }`}
                            >
                              {isDispatching ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  Creating...
                                </>
                              ) : isTaskCreated ? (
                                <>
                                  <Check size={12} />
                                  Task Created
                                </>
                              ) : (
                                <>
                                  <CheckSquare size={12} />
                                  Add to Action Center
                                </>
                              )}
                            </button>
                          </div>
                          
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-normal">
                            {trend.recommendedAction}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Verified Signal Citation Link */}
                    {trend.sampleDocument?.title && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span className="truncate max-w-[280px] font-medium" title={trend.sampleDocument.title}>
                          Evidence: {trend.sampleDocument.title}
                        </span>
                        {trend.sampleDocument.sourceUrl && (
                          <a
                            href={trend.sampleDocument.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold shrink-0"
                          >
                            Source <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  Trophy, ThumbsDown, DollarSign, TrendingUp, AlertCircle, 
  RefreshCw, Plus, ArrowRight, ShieldAlert, BarChart3, HelpCircle,
  Zap, Sparkles, Sliders, CheckCircle2, ShieldCheck, Target, Loader2
} from 'lucide-react';
import { getDealAnalytics, predictDealOdds } from '../api';

export default function WinLossAnalyticsCard({ onOpenLogModal, refreshTrigger }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // XGBoost Real-Time Predictor State
  const [predCompetitor, setPredCompetitor] = useState('Linear');
  const [predDealSize, setPredDealSize] = useState(45000);
  const [predDays, setPredDays] = useState(30);
  const [predClientSize, setPredClientSize] = useState('Enterprise');
  const [prediction, setPrediction] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  const handlePredict = async (comp = predCompetitor, size = predDealSize, days = predDays, client = predClientSize) => {
    setPredictLoading(true);
    try {
      const res = await predictDealOdds({
        competitor_name: comp,
        deal_size: size,
        sales_cycle_days: days,
        client_size: client
      });
      setPrediction(res);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setPredictLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDealAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load deal analytics:', err);
      setError(err.message || 'Failed to aggregate win/loss analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    handlePredict('Linear', 45000, 30, 'Enterprise');
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-3xl p-6 text-center space-y-2">
        <AlertCircle size={28} className="text-red-500 mx-auto" />
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Deal Analytics Unavailable</h4>
        <button
          onClick={fetchAnalytics}
          className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    totalDealsLogged = 0,
    overallWinRate = 0,
    wonDeals = 0,
    lostDeals = 0,
    pipelineWon = 0,
    pipelineLost = 0,
    headToHead = [],
    topLossReasons = [],
    recommendation,
  } = analytics;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Win/Loss Commercial Intelligence
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live sales cycle outcomes, competitive win rates, and pipeline revenue at risk.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLogModal}
          className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
        >
          <Plus size={15} /> Log Closed Deal
        </button>
      </div>

      {/* ── KPI Stat Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-200/80 dark:border-emerald-900/40">
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Overall Win Rate
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {overallWinRate}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {wonDeals} Won · {lostDeals} Lost ({totalDealsLogged} Total)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/[0.04] border border-blue-200/80 dark:border-blue-900/40">
          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Pipeline Won
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            ${Math.round(pipelineWon).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Total revenue captured vs. competitors
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-200/80 dark:border-rose-900/40">
          <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Revenue at Risk / Lost
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            ${Math.round(pipelineLost).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Lost deal value attributed to rivals
          </p>
        </div>
      </div>

      {/* ── Deal Outcome Win/Loss Simulator ── */}
      <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-900/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold tracking-tight">
                  Commercial Deal Win / Loss Simulator
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  Predictive Scoring
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/70">
                Empirical Commercial Pipeline Intelligence · Dynamic Opportunity Probability Engine
              </p>
            </div>
          </div>
          <span className="text-[10px] text-indigo-300/80 font-mono bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800/40">
            Engine: Live Deal Radar
          </span>
        </div>

        {/* Inputs & Prediction Gauge Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Competitor Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                  Target Rival
                </label>
                <select
                  value={predCompetitor}
                  onChange={(e) => {
                    const c = e.target.value;
                    setPredCompetitor(c);
                    handlePredict(c, predDealSize, predDays, predClientSize);
                  }}
                  className="w-full bg-slate-800/90 border border-indigo-800/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {Array.from(new Set([
                    'Linear', 'Jira', 'ClickUp', 'Asana', 'Monday.com',
                    ...(headToHead || []).map(h => h.competitorName).filter(Boolean)
                  ])).map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                  ))}
                </select>
              </div>

              {/* Client Segment */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                  Client Tier
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl border border-indigo-900">
                  {['SMB', 'Mid-Market', 'Enterprise'].map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => {
                        setPredClientSize(tier);
                        handlePredict(predCompetitor, predDealSize, predDays, tier);
                      }}
                      className={`text-[10px] font-semibold py-1 rounded-lg transition-all ${
                        predClientSize === tier
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-indigo-300 hover:text-white'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Deal Size Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-indigo-200 text-[11px]">Contract Value (ACV)</span>
                <span className="font-mono font-extrabold text-amber-300 text-xs">${predDealSize.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={250000}
                step={5000}
                value={predDealSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPredDealSize(val);
                  handlePredict(predCompetitor, val, predDays, predClientSize);
                }}
                className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-indigo-300/60 font-mono">
                <span>$5k (Pilot)</span>
                <span>$100k</span>
                <span>$250k (Enterprise)</span>
              </div>
            </div>

            {/* Sales Cycle Duration Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-indigo-200 text-[11px]">Sales Cycle Duration</span>
                <span className="font-mono font-extrabold text-indigo-300 text-xs">{predDays} days</span>
              </div>
              <input
                type="range"
                min={7}
                max={180}
                step={1}
                value={predDays}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPredDays(val);
                  handlePredict(predCompetitor, predDealSize, val, predClientSize);
                }}
                className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-indigo-300/60 font-mono">
                <span>7 days (Sprint)</span>
                <span>45 days (Avg)</span>
                <span>180 days (Enterprise)</span>
              </div>
            </div>
          </div>

          {/* Outcome Gauge (5 cols) */}
          <div className="lg:col-span-5 bg-slate-800/60 border border-indigo-800/60 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
            {predictLoading ? (
              <div className="py-6 flex flex-col items-center gap-2">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
                <span className="text-xs text-indigo-200">Simulating deal win probabilities...</span>
              </div>
            ) : prediction ? (
              <>
                <div className="space-y-1 w-full">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    Predicted Win Probability
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-3xl font-black tracking-tight ${
                      prediction.winProbability >= 60 ? 'text-emerald-400' :
                      prediction.winProbability >= 35 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {prediction.winProbability}%
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                      prediction.status === 'FAVORABLE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      prediction.status === 'AT_RISK' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {prediction.status}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-indigo-900/60">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      prediction.winProbability >= 60 ? 'bg-emerald-500' :
                      prediction.winProbability >= 35 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, prediction.winProbability))}%` }}
                  />
                </div>

                <p className="text-[11px] text-indigo-200/90 leading-relaxed font-medium bg-slate-900/80 p-2.5 rounded-xl border border-indigo-900/40 text-left w-full">
                  💡 {prediction.recommendation}
                </p>
              </>
            ) : null}
          </div>

        </div>
      </div>

      {/* ── Head to Head Breakdown ── */}
      {headToHead.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Head-to-Head Win Rates Against Rivals
          </div>
          <div className="space-y-2">
            {headToHead.map((item, idx) => (
              <div 
                key={idx} 
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2"
              >
                <div className="space-y-1 sm:w-1/3">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    vs. {item.competitorName}
                  </span>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.won}W - {item.lost}L ({item.totalDeals} deals)
                  </div>
                </div>

                <div className="flex-1 max-w-xs space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Win Rate</span>
                    <span className={item.winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'}>
                      {item.winRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all ${item.winRate >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                      style={{ width: `${Math.min(100, Math.max(5, item.winRate))}%` }} 
                    />
                  </div>
                </div>

                {item.revenueAtRisk > 0 && (
                  <div className="text-right text-xs sm:w-1/4">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Lost Revenue</span>
                    <strong className="text-rose-600 dark:text-rose-400">
                      ${Math.round(item.revenueAtRisk).toLocaleString()}
                    </strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            No competitive deal outcomes logged yet.
          </p>
          <button
            onClick={onOpenLogModal}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            <Plus size={14} /> Log your first deal outcome
          </button>
        </div>
      )}

      {/* ── Recommendation ── */}
      {recommendation && (
        <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <ArrowRight size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <span>{recommendation}</span>
        </div>
      )}

    </div>
  );
}

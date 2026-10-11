import { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingDown, TrendingUp, Sparkles, AlertCircle, 
  RefreshCw, CheckCircle2, Layers, HelpCircle, ArrowRight
} from 'lucide-react';
import { getPricingMatrix } from '../api';

export default function PricingMatrixWidget() {
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMatrix = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPricingMatrix();
      setMatrixData(data);
    } catch (err) {
      console.error('Failed to load pricing matrix:', err);
      setError(err.message || 'Failed to aggregate category pricing matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (error || !matrixData) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-3xl p-8 text-center space-y-3">
        <DollarSign size={36} className="text-red-500 mx-auto" />
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Pricing Matrix Unavailable</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">{error || 'Unable to aggregate pricing tiers.'}</p>
        <button
          onClick={fetchMatrix}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const { category, categoryStats = {}, matrix = [], whitespaceGaps = [], pricingRecommendations = [] } = matrixData;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
            <DollarSign size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Category Pricing Matrix & Whitespace
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {category || 'B2B SaaS'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live cross-competitor price floors, enterprise ceilings, and whitespace monetization gaps.
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-200/80 dark:border-emerald-900/40">
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown size={14} /> Market Entry Floor ($P_min)
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            ${categoryStats.priceFloorMinima ?? 0}
            <span className="text-xs font-semibold text-slate-400">/mo</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Lowest barrier to entry across tracked competitors
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-blue-500/[0.04] border border-blue-200/80 dark:border-blue-900/40">
          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} /> Category Median Rate
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            ${Math.round(categoryStats.categoryMedianPrice ?? 0)}
            <span className="text-xs font-semibold text-slate-400">/mo</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Median subscription baseline for active competitors
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-purple-500/[0.04] border border-purple-200/80 dark:border-purple-900/40">
          <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} /> Enterprise Ceiling ($P_max)
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            ${categoryStats.enterpriseCeilingMaxima ?? 0}
            <span className="text-xs font-semibold text-slate-400">/mo</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Highest quoted public tier prior to custom quote
          </p>
        </div>
      </div>

      {/* ── Whitespace Gaps Banner ── */}
      {whitespaceGaps.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <Sparkles size={15} /> Identified Pricing Whitespace Gap
          </div>
          <div className="space-y-1.5">
            {whitespaceGaps.map((gap, i) => (
              <div key={i} className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                • {gap.description || `Underserved pricing zone from $${gap.rangeFrom} to $${gap.rangeTo}/mo with zero direct competitor plans.`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cross-Competitor Pricing Grid Table ── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Competitor</th>
              <th className="py-3.5 px-4">Flagship Offering</th>
              <th className="py-3.5 px-4">Price Floor</th>
              <th className="py-3.5 px-4">Price Ceiling</th>
              <th className="py-3.5 px-4">Overlap Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {matrix.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No pricing matrix data recorded yet.
                </td>
              </tr>
            ) : (
              matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {row.competitorName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {row.flagshipProduct || 'Standard Tier'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ${row.priceMinima || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">/mo</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      ${row.priceMaxima || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">/mo</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {row.competitiveScore || 65}/100
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Strategic Recommendations ── */}
      {pricingRecommendations.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-blue-500" /> Strategic Pricing Directives
          </h4>
          <div className="space-y-1">
            {pricingRecommendations.map((rec, i) => (
              <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <ArrowRight size={13} className="text-blue-500 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

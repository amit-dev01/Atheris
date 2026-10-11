import { useState, useEffect } from 'react';
import { 
  Columns, Loader2, AlertCircle, Building2, Globe, 
  TrendingUp, Award, Layers, ShieldCheck, DollarSign,
  Printer, Check, ExternalLink, Zap, Users, RefreshCw,
  Sparkles, ArrowRight, Camera, Sliders, Box, Star,
  TrendingDown, ShieldAlert
} from 'lucide-react';
import { getSideBySideComparison, getProductPortfolioMatrix } from '../api';
import TimeMachineSlider from './TimeMachineSlider';
import ProductTeardownModal from './ProductTeardownModal';

export default function SideBySideSection() {
  const [activeView, setActiveView] = useState('products'); // 'products', 'time_machine', 'fundamentals'
  const [data, setData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [selectedTeardownComp, setSelectedTeardownComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [compRes, prodRes] = await Promise.all([
        getSideBySideComparison().catch(() => null),
        getProductPortfolioMatrix().catch(() => null)
      ]);
      if (compRes) setData(compRes);
      if (prodRes) setProductData(prodRes);
    } catch (err) {
      console.error('Failed to load comparison data:', err);
      setError(err.message || 'Failed to aggregate comparison matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm space-y-4 animate-pulse">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
          Aggregating Live Product Portfolios & Web Presence...
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Benchmarking product visuals, flagship offerings, and pricing boundaries (Minima, Median, Maxima).
        </p>
      </div>
    );
  }

  const home = data?.homeCompany || {
    name: 'Our Business',
    industry: 'Productivity & AI',
    companySize: '25-50',
    location: 'San Francisco, CA',
    monthlyTraffic: '185K',
    domainAuthority: 68,
    techStack: ['Next.js', 'React', 'Tailwind CSS', 'FastAPI', 'Supabase', 'Stripe'],
    financialHealth: 'A',
    pricingModel: 'Freemium / Tiered'
  };

  const competitors = data?.competitors || [];
  const homeProduct = productData?.homeProduct || {};
  const competitorProducts = productData?.competitorProducts || [];
  const categoryStats = productData?.categoryStats || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Columns size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Product & Competitor Benchmarking Hub
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Visual Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Compare product visuals, flagship anchors, price boundaries ($P_min, $P_med, $P_max), and visual DOM time machine deltas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Printer size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── View Navigation Tabs ── */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'products', label: 'Product Portfolios & Visuals', icon: Box, count: competitorProducts.length + 1 },
          { id: 'time_machine', label: 'Visual Time Machine (Before vs. After)', icon: Camera, badge: 'NEW' },
          { id: 'fundamentals', label: 'Company Fundamentals & Tech Stack', icon: Layers, count: competitors.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          VIEW 1: PRODUCT PORTFOLIOS & VISUALS (FLAGSHIP, MINIMA, MAXIMA)
          ══════════════════════════════════════════════════════════════════ */}
      {activeView === 'products' && (
        <div className="space-y-8 animate-fade-in">
          {/* Price Boundary KPI Meters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown size={14} /> Market Entry Floor ($P_min)
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                ${categoryStats.categoryPriceMinima ?? 7.00}
                <span className="text-xs font-semibold text-slate-400">/mo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Lowest paid barrier to acquire self-serve users</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} /> Category Median Rate ($P_med)
              </div>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                ${categoryStats.categoryPriceMedian ?? 13.80}
                <span className="text-xs font-semibold text-slate-400">/mo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Core baseline customer willingness-to-pay</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} /> Enterprise Ceiling ($P_max)
              </div>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                ${categoryStats.categoryPriceMaxima ?? 39.99}
                <span className="text-xs font-semibold text-slate-400">/mo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Maximum advertised tier before sales negotiation</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Star size={14} /> Flagship Anchor
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1 truncate">
                {homeProduct.flagshipProduct || 'Core Product Suite'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Primary customer acquisition product</p>
            </div>
          </div>

          {/* Product Cards Grid with Real Visuals */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Box size={16} className="text-blue-600" /> Side-by-Side Product Portfolios
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Home Company Product Card */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-500/80 shadow-md overflow-hidden flex flex-col relative group">
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  <img
                    src={homeProduct.productVisual}
                    alt={homeProduct.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles size={11} /> OUR PRODUCT
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] font-bold">
                    {homeProduct.pricingModel}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-lg">
                        {homeProduct.name}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        P_min: ${homeProduct.pricingFloor}
                      </span>
                    </div>

                    {/* Flagship Badge */}
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 flex items-center gap-2">
                      <Star size={14} className="text-blue-600 shrink-0" />
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate">
                        Flagship: {homeProduct.flagshipProduct}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{homeProduct.keyDifferentiator}"
                    </p>
                  </div>

                  {/* Price Boundaries Visual Meter */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>Entry: ${homeProduct.pricingFloor}</span>
                      <span className="text-blue-600 font-bold">Median: ${homeProduct.pricingMedian}</span>
                      <span>Ceiling: ${homeProduct.pricingCeiling}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 w-[25%]" />
                      <div className="bg-blue-600 w-[45%]" />
                      <div className="bg-purple-600 w-[30%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Competitor Product Cards */}
              {competitorProducts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                    <img
                      src={p.productVisual}
                      alt={p.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] font-bold">
                      {p.productCategory}
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] font-bold">
                      {p.pricingModel}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg">
                          {p.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          P_min: ${p.pricingFloor}
                        </span>
                      </div>

                      {/* Flagship Badge */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <Star size={14} className="text-amber-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          Flagship: {p.flagshipProduct}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{p.keyDifferentiator}"
                      </p>
                    </div>

                    {/* Price Boundaries Visual Meter */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                        <span>Entry: ${p.pricingFloor}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">Median: ${p.pricingMedian}</span>
                        <span>Ceiling: ${p.pricingCeiling}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 w-[20%]" />
                        <div className="bg-slate-400 w-[50%]" />
                        <div className="bg-purple-600 w-[30%]" />
                      </div>

                      <button
                        onClick={() => setSelectedTeardownComp(p)}
                        className="w-full mt-3 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                      >
                        <Box size={13} /> Product Dossier Teardown
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deep Specifications Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Product Architecture & Capabilities Matrix
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                    <th className="p-4 font-bold text-slate-500 uppercase tracking-wider w-48">Feature / Capability</th>
                    <th className="p-4 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20 border-x border-blue-200/50 dark:border-blue-900/30">
                      {homeProduct.name} (Our Product)
                    </th>
                    {competitorProducts.map((p) => (
                      <th key={p.id} className="p-4 font-bold text-slate-900 dark:text-slate-100 min-w-[180px]">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {(homeProduct.specs || []).map((spec, idx) => (
                    <tr key={idx}>
                      <td className="p-4 font-semibold text-slate-500">{spec.label}</td>
                      <td className="p-4 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/10 border-x border-blue-200/30 dark:border-blue-900/20">
                        {spec.value}
                      </td>
                      {competitorProducts.map((p) => {
                        const rivalSpec = (p.specs || [])[idx]?.value || 'None';
                        return (
                          <td key={p.id} className="p-4 text-slate-700 dark:text-slate-300">
                            {rivalSpec}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIEW 2: VISUAL TIME MACHINE (BEFORE VS. AFTER SPLIT SLIDER)
          ══════════════════════════════════════════════════════════════════ */}
      {activeView === 'time_machine' && (
        <TimeMachineSlider defaultCompetitorId={competitors[0]?.id || 'comp-linear'} />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIEW 3: COMPANY FUNDAMENTALS & BUILTWITH TECH STACK
          ══════════════════════════════════════════════════════════════════ */}
      {activeView === 'fundamentals' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                    <th className="p-4 sm:p-5 font-bold text-slate-500 uppercase tracking-wider w-44 sticky left-0 bg-slate-50/95 dark:bg-slate-800/95 z-10 backdrop-blur-sm">
                      Metrics & Features
                    </th>
                    <th className="p-4 sm:p-5 font-bold text-blue-600 dark:text-blue-400 min-w-[210px] bg-blue-50/40 dark:bg-blue-950/20 border-x border-blue-200/50 dark:border-blue-900/30">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span>{home.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold ml-1">US</span>
                      </div>
                    </th>
                    {competitors.map((c) => (
                      <th key={c.id} className="p-4 sm:p-5 font-bold text-slate-900 dark:text-slate-100 min-w-[200px]">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{c.name}</span>
                          {c.website && (
                            <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 ml-1">
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  <tr className="bg-slate-50/40 dark:bg-slate-800/20 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    <td colSpan={competitors.length + 2} className="px-4 py-2">
                      1. Company Overview
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10">HQ Location</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200 bg-blue-50/20 dark:bg-blue-950/10 border-x border-blue-200/30 dark:border-blue-900/20">{home.location || 'Global'}</td>
                    {competitors.map((c) => (
                      <td key={c.id} className="p-4 text-slate-700 dark:text-slate-300">{c.hqLocation || 'United States'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10">Founded</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200 bg-blue-50/20 dark:bg-blue-950/10 border-x border-blue-200/30 dark:border-blue-900/20">{home.founded || '2023'}</td>
                    {competitors.map((c) => (
                      <td key={c.id} className="p-4 text-slate-700 dark:text-slate-300">{c.foundedYear || 2020}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10">Team Size</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200 bg-blue-50/20 dark:bg-blue-950/10 border-x border-blue-200/30 dark:border-blue-900/20">{home.companySize || '25-50'}</td>
                    {competitors.map((c) => (
                      <td key={c.id} className="p-4 text-slate-700 dark:text-slate-300">{c.teamSize || '100-250'}</td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 dark:bg-slate-800/20 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    <td colSpan={competitors.length + 2} className="px-4 py-2">
                      2. Web Presence & Tech Stack (BuiltWith & SimilarWeb)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10">Monthly Visits</td>
                    <td className="p-4 font-black text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/10 border-x border-blue-200/30 dark:border-blue-900/20">{home.monthlyTraffic}</td>
                    {competitors.map((c) => (
                      <td key={c.id} className="p-4 font-bold text-slate-800 dark:text-slate-200">{c.monthlyTraffic || '250K'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10">SEO Domain Authority</td>
                    <td className="p-4 bg-blue-50/20 dark:bg-blue-950/10 border-x border-blue-200/30 dark:border-blue-900/20">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">{home.domainAuthority}</span> / 100
                    </td>
                    {competitors.map((c) => (
                      <td key={c.id} className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        <span className="font-extrabold text-slate-900 dark:text-white">{c.domainAuthority || 74}</span> / 100
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10">Detected Tech Stack</td>
                    <td className="p-4 bg-blue-50/20 dark:bg-blue-950/10 border-x border-blue-200/30 dark:border-blue-900/20">
                      <div className="flex flex-wrap gap-1">
                        {(home.techStack || []).map((t, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">{t}</span>
                        ))}
                      </div>
                    </td>
                    {competitors.map((c) => (
                      <td key={c.id} className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {(c.techStack || ['React', 'Next.js', 'Tailwind', 'Cloudflare']).map((t, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">{t}</span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 dark:bg-slate-800/20 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    <td colSpan={competitors.length + 2} className="px-4 py-2">
                      3. Financial Fundamentals & Health
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10">Valuation / Funding</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100 bg-blue-50/20 dark:bg-blue-950/10 border-x border-blue-200/30 dark:border-blue-900/20">$25M (Series A)</td>
                    {competitors.map((c) => (
                      <td key={c.id} className="p-4 font-bold text-slate-900 dark:text-slate-100">{c.totalFunding || '$60M'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10">Financial Health</td>
                    <td className="p-4 bg-blue-50/20 dark:bg-blue-950/10 border-x border-blue-200/30 dark:border-blue-900/20">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Grade {home.financialHealth || 'A'}</span>
                    </td>
                    {competitors.map((c) => (
                      <td key={c.id} className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.financialHealth === 'A' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                          c.financialHealth === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}>Grade {c.financialHealth || 'B'}</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Dossier & Teardown Modal ── */}
      <ProductTeardownModal
        isOpen={!!selectedTeardownComp}
        onClose={() => setSelectedTeardownComp(null)}
        competitor={selectedTeardownComp}
      />
    </div>
  );
}

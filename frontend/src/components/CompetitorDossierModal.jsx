import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Sparkles, ShieldAlert, Target, DollarSign, 
  Swords, CheckCircle2, AlertTriangle, Layers, ArrowRight, Loader2, 
  Image as ImageIcon, Box, Zap, Copy, Check, TrendingUp, ThumbsDown, 
  ThumbsUp, MessageSquare, Flame, Award, Sliders, ShieldCheck, Grid,
  Maximize2
} from 'lucide-react';
import { 
  getCompetitorBattlecard, 
  getCompetitorProductsTeardown, 
  getCommunitySignals,
  predictDealOdds 
} from '../api';
import CompetitorCharts from './CompetitorCharts';
import { getTypeBadgeStyle } from '../constants';

export default function CompetitorDossierModal({ isOpen, competitor, onClose, showToast }) {
  const [activeTab, setActiveTab] = useState('flagship'); // 'flagship', 'predictor', 'battlecard', 'products', 'stealth', 'community', 'activity'
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [teardownData, setTeardownData] = useState(null);
  const [battlecardData, setBattlecardData] = useState(null);
  const [communityData, setCommunityData] = useState(null);
  
  // XGBoost Predictor State
  const [predDealSize, setPredDealSize] = useState(45000);
  const [predDays, setPredDays] = useState(30);
  const [predClientSize, setPredClientSize] = useState('Enterprise');
  const [prediction, setPrediction] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  
  // Teardown Active Product State
  const [activeProdIndex, setActiveProdIndex] = useState(0);
  
  // Copy state
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    if (!isOpen || !competitor) return;

    let isMounted = true;
    setLoading(true);
    setActiveProdIndex(0);
    setActiveTab('flagship');

    const compId = competitor.id || 'comp-linear';
    const compName = competitor.name || competitor.companyName || competitor.company_name || 'Linear';

    // Parallel fetch of all company intelligence streams
    Promise.allSettled([
      getCompetitorProductsTeardown(compId),
      getCompetitorBattlecard(compId),
      getCommunitySignals(compId),
      predictDealOdds({ competitorName: compName, dealSize: 45000, salesCycleDays: 30, clientSize: 'Enterprise' })
    ]).then(([tdRes, bcRes, commRes, predRes]) => {
      if (!isMounted) return;
      
      if (tdRes.status === 'fulfilled') setTeardownData(tdRes.value);
      if (bcRes.status === 'fulfilled') setBattlecardData(bcRes.value);
      if (commRes.status === 'fulfilled') setCommunityData(commRes.value);
      if (predRes.status === 'fulfilled') setPrediction(predRes.value);
      
      setLoading(false);
    }).catch(err => {
      console.warn('Dossier loading note:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, competitor]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePredict = async (size = predDealSize, days = predDays, client = predClientSize) => {
    if (!competitor) return;
    setPredictLoading(true);
    const compName = competitor.name || competitor.companyName || competitor.company_name || 'Competitor';
    try {
      const res = await predictDealOdds({
        competitorName: compName,
        dealSize: size,
        salesCycleDays: days,
        clientSize: client
      });
      setPrediction(res);
    } catch (err) {
      console.error('Prediction failed in dossier:', err);
    } finally {
      setPredictLoading(false);
    }
  };

  const copyToClipboard = (text, msg = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
    if (showToast) showToast(msg);
  };

  if (!isOpen || !competitor) return null;

  const compName = competitor.name || competitor.companyName || competitor.company_name || teardownData?.competitorName || 'Competitor';
  const compWeb = competitor.website || competitor.websiteUrl || competitor.website_url || teardownData?.website || '';
  const compType = competitor.type || 'DIRECT';
  const compScore = competitor.competitiveScore ?? competitor.ai_score ?? 75;

  const products = teardownData?.products || [];
  const flagshipProduct = products[0] || null;
  const selectedProduct = products[activeProdIndex] || flagshipProduct;

  const flagshipImg = flagshipProduct?.visualUrl || teardownData?.extractedOgImage || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80';
  const stealthAlert = battlecardData?.metadata?.stealthAlert || false;
  const anomalySeverity = battlecardData?.metadata?.anomalySeverity || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-5 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-[1520px] w-[97vw] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-2 sm:my-3 h-[94vh] max-h-[96vh] flex flex-col">
        
        {/* ── Top Header ── */}
        <div className="p-5 md:px-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-black text-lg shadow-md border border-indigo-500/30 shrink-0">
              {compName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {compName}
                </h2>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getTypeBadgeStyle(compType)}`}>
                  {compType}
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  Threat: {compScore}/100
                </span>
                {stealthAlert && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 animate-pulse flex items-center gap-1">
                    <AlertTriangle size={11} /> Stealth Alert
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>360° Comprehensive Executive Dossier</span>
                {compWeb && (
                  <>
                    <span>•</span>
                    <a 
                      href={compWeb.startsWith('http') ? compWeb : `https://${compWeb}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      {compWeb.replace(/^https?:\/\//, '').replace(/\/$/, '')} <ExternalLink size={11} />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Dossier"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="px-6 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto">
          <div className="flex space-x-2 py-2 min-w-max">
            {[
              { id: 'flagship', label: 'Flagship & Overview', icon: ImageIcon },
              { id: 'predictor', label: '⚡ Deal Win Odds Simulator', icon: Zap },
              { id: 'battlecard', label: '⚔️ Sales Battlecard', icon: Swords },
              { id: 'products', label: '📦 Product Portfolio', icon: Box, count: products.length },
              { id: 'stealth', label: '🚨 Stealth Activity Radar', icon: ShieldAlert, badge: stealthAlert ? 'ALERT' : null },
              { id: 'community', label: '🗣️ Voice of Customer & Social', icon: MessageSquare },
              { id: 'activity', label: '📈 Velocity Timeline', icon: TrendingUp },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold">
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Scrollable Body ── */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-center animate-pulse">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <h4 className="text-base font-extrabold text-slate-800 dark:text-white">Synthesizing 360° Intelligence...</h4>
              <p className="text-xs text-slate-500 max-w-sm">Aggregating extracted web visuals, deal win probabilities, sales battlecards, and customer chatter.</p>
            </div>
          )}

          {!loading && (
            <>
              {/* ── TAB 1: FLAGSHIP HERO & OVERVIEW ── */}
              {activeTab === 'flagship' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Visual Flagship Product Showcase Card */}
                  <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-white shadow-lg flex flex-col lg:flex-row">
                    <div className="lg:w-1/2 relative h-64 lg:h-auto min-h-[240px] bg-slate-900 group">
                      <img
                        src={flagshipImg}
                        alt={`${compName} Flagship`}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
                      
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-white flex items-center gap-1.5 border border-white/20">
                          <ImageIcon size={12} className="text-blue-400" /> Extracted Live UI Screenshot
                        </span>
                        {flagshipProduct?.role && (
                          <span className="px-2.5 py-1 rounded-xl bg-indigo-600/90 text-[10px] font-black uppercase text-white shadow-sm">
                            {flagshipProduct.role}
                          </span>
                        )}
                      </div>

                      {compWeb && (
                        <a
                          href={compWeb.startsWith('http') ? compWeb : `https://${compWeb}`}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all shadow-md"
                        >
                          <Maximize2 size={12} /> View Live App
                        </a>
                      )}
                    </div>

                    <div className="p-6 lg:p-8 lg:w-1/2 flex flex-col justify-between space-y-4 bg-slate-950">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                          Flagship Product Anchor
                        </span>
                        <h3 className="text-2xl font-black text-white mt-1">
                          {flagshipProduct?.name || `${compName} Core Platform`}
                        </h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          {teardownData?.brandSummary || competitor.description || `${compName} operates as a primary player in the workflow and collaboration software market.`}
                        </p>
                      </div>

                      {/* Flagship KPI Metrics Grid */}
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
                        <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Pricing Floor</span>
                          <span className="text-base font-black text-emerald-400">
                            ${flagshipProduct?.pricingFloor || 8}/mo
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">ARR Contribution</span>
                          <span className="text-base font-black text-indigo-400">
                            {flagshipProduct?.revenueShare || '55%'}
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Buyer</span>
                          <span className="text-[11px] font-bold text-slate-200 line-clamp-1">
                            {flagshipProduct?.targetBuyer || 'Engineering & Ops'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Dismissal Preview */}
                      {battlecardData?.quickDismissal && (
                        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 space-y-1">
                          <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                            <span>⚡ Quick Sales Rep Dismissal</span>
                            <button
                              onClick={() => copyToClipboard(battlecardData.quickDismissal, 'Dismissal script copied!')}
                              className="hover:text-white transition-colors"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                          <p className="text-xs text-indigo-100 italic leading-relaxed">
                            "{battlecardData.quickDismissal}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flagship Strengths vs Flank Vulnerabilities */}
                  {flagshipProduct && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-200/80 dark:border-emerald-900/40 space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 size={15} /> Flagship Core Strengths
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {(flagshipProduct.strengths || ['High interaction velocity', 'Modern developer ecosystem integration']).map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-5 rounded-2xl bg-rose-500/[0.04] border border-rose-200/80 dark:border-rose-900/40 space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                          <ShieldAlert size={15} /> Exploitable Flank Vulnerabilities & Gaps
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {(flagshipProduct.vulnerabilities || ['Seat-minimum barriers on higher tiers', 'Friction for non-technical departments']).map((v, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-rose-500 font-bold">•</span>
                              <span>{v}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ── TAB 2: REAL-TIME DEAL WIN ODDS SIMULATOR ── */}
              {activeTab === 'predictor' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-900/60 pb-4">
                      <div>
                        <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                          <Zap size={20} className="text-amber-400" />
                          Commercial Deal Win Odds Against {compName}
                        </h3>
                        <p className="text-xs text-indigo-200/80">
                          Empirical B2B Opportunity Intelligence · Dynamic Probability Engine
                        </p>
                      </div>
                      <span className="text-[10px] text-indigo-300 font-mono bg-indigo-900/50 px-3 py-1 rounded-lg border border-indigo-700/40">
                        Engine: Active Deal Radar
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Controls (7 cols) */}
                      <div className="lg:col-span-7 space-y-5">
                        
                        {/* Client Segment */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                            Client Tier Segment
                          </label>
                          <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl border border-indigo-900">
                            {['SMB', 'Mid-Market', 'Enterprise'].map(tier => (
                              <button
                                key={tier}
                                type="button"
                                onClick={() => {
                                  setPredClientSize(tier);
                                  handlePredict(predDealSize, predDays, tier);
                                }}
                                className={`text-xs font-semibold py-1.5 rounded-lg transition-all ${
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

                        {/* Deal Size Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-indigo-200">Contract Value (ACV)</span>
                            <span className="font-mono font-black text-amber-300 text-sm">
                              ${predDealSize.toLocaleString()}
                            </span>
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
                              handlePredict(val, predDays, predClientSize);
                            }}
                            className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-indigo-300/60 font-mono">
                            <span>$5,000 (Pilot)</span>
                            <span>$100,000</span>
                            <span>$250,000 (Enterprise)</span>
                          </div>
                        </div>

                        {/* Sales Cycle Duration Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-indigo-200">Sales Cycle Velocity</span>
                            <span className="font-mono font-black text-indigo-300 text-sm">
                              {predDays} days
                            </span>
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
                              handlePredict(predDealSize, val, predClientSize);
                            }}
                            className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-indigo-300/60 font-mono">
                            <span>7 days (Fast Sprint)</span>
                            <span>45 days (Average)</span>
                            <span>180 days (Protracted)</span>
                          </div>
                        </div>

                      </div>

                      {/* Result Gauge (5 cols) */}
                      <div className="lg:col-span-5 bg-slate-800/80 border border-indigo-800/70 rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
                        {predictLoading ? (
                          <div className="py-8 flex flex-col items-center gap-2">
                            <Loader2 size={32} className="animate-spin text-indigo-400" />
                            <span className="text-xs text-indigo-200 font-medium">Simulating deal win probabilities...</span>
                          </div>
                        ) : prediction ? (
                          <>
                            <div className="space-y-1 w-full">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                                Predicted Close Odds vs {compName}
                              </span>
                              <div className="flex items-center justify-center gap-2.5">
                                <span className={`text-5xl font-black tracking-tight ${
                                  prediction.winProbability >= 60 ? 'text-emerald-400' :
                                  prediction.winProbability >= 35 ? 'text-amber-400' : 'text-rose-400'
                                }`}>
                                  {prediction.winProbability}%
                                </span>
                                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-xl border ${
                                  prediction.status === 'FAVORABLE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                  prediction.status === 'AT_RISK' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                  'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                }`}>
                                  {prediction.status}
                                </span>
                              </div>
                            </div>

                            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-indigo-900/60">
                              <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                  prediction.winProbability >= 60 ? 'bg-emerald-500' :
                                  prediction.winProbability >= 35 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, prediction.winProbability))}%` }}
                              />
                            </div>

                            <p className="text-xs text-indigo-100/90 leading-relaxed font-medium bg-slate-900/80 p-3 rounded-xl border border-indigo-900/50 text-left w-full">
                              💡 {prediction.recommendation}
                            </p>
                          </>
                        ) : null}
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: SALES BATTLECARD ── */}
              {activeTab === 'battlecard' && battlecardData && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* 30-Sec Script */}
                  {battlecardData.quickDismissal && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <Sparkles size={14} /> 30-Second Prospect Call Dismissal Script
                        </span>
                        <button
                          onClick={() => copyToClipboard(battlecardData.quickDismissal, 'Dismissal script copied!')}
                          className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
                        >
                          {copiedScript ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                        </button>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 italic leading-relaxed">
                        "{battlecardData.quickDismissal}"
                      </p>
                    </div>
                  )}

                  {/* Strategic Trap Questions */}
                  {battlecardData.landminesToLay && battlecardData.landminesToLay.length > 0 && (
                    <div className="p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-200/80 dark:border-amber-900/40 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <Flame size={15} /> Strategic Trap Questions (Guide Prospect To Ask {compName})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {battlecardData.landminesToLay.map((lm, i) => (
                          <div key={i} className="p-3.5 bg-white dark:bg-slate-800/80 border border-amber-200/80 dark:border-amber-900/30 rounded-xl space-y-1">
                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Trap Question #{i + 1}</span>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{lm}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Where We Win vs Where They Win */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-200/80 dark:border-emerald-900/40 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <Award size={15} /> Where We Win Against {compName}
                      </h4>
                      <div className="space-y-2">
                        {(battlecardData.whereWeWin || []).map((w, i) => (
                          <div key={i} className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-emerald-200/60 dark:border-emerald-900/30 space-y-0.5">
                            <strong className="text-xs font-bold text-slate-900 dark:text-white block">{w.advantage}</strong>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{w.proofPoint}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-indigo-500/[0.04] border border-indigo-200/80 dark:border-indigo-900/40 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                        <ShieldCheck size={15} /> How to Defend Their Pitches
                      </h4>
                      <div className="space-y-2">
                        {(battlecardData.whereTheyWinAndHowToDefend || []).map((d, i) => (
                          <div key={i} className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-indigo-200/60 dark:border-indigo-900/30 space-y-0.5">
                            <span className="text-[10px] font-bold text-rose-500 uppercase block">Their Claim: {d.theirClaim}</span>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium"><strong>Our Rebuttal:</strong> {d.ourRebuttal}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SWOT Matrix */}
                  {battlecardData.swotAnalysis && (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Grid size={15} /> Competitive SWOT Matrix
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <strong className="text-emerald-600 uppercase text-[10px] font-black block">Strengths</strong>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                            {(battlecardData.swotAnalysis.strengths || []).map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <strong className="text-rose-600 uppercase text-[10px] font-black block">Weaknesses</strong>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                            {(battlecardData.swotAnalysis.weaknesses || []).map((w, i) => <li key={i}>• {w}</li>)}
                          </ul>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <strong className="text-blue-600 uppercase text-[10px] font-black block">Opportunities</strong>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                            {(battlecardData.swotAnalysis.opportunities || []).map((o, i) => <li key={i}>• {o}</li>)}
                          </ul>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <strong className="text-amber-600 uppercase text-[10px] font-black block">Threats</strong>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                            {(battlecardData.swotAnalysis.threats || []).map((t, i) => <li key={i}>• {t}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ── TAB 4: PRODUCT LINEUP TEARDOWN ── */}
              {activeTab === 'products' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Product Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {products.map((p, idx) => {
                      const isSel = idx === activeProdIndex;
                      return (
                        <button
                          key={p.id || idx}
                          onClick={() => setActiveProdIndex(idx)}
                          className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 ${
                            isSel
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${p.roleBadgeColor || 'bg-slate-200 text-slate-700'}`}>
                              {p.role}
                            </span>
                            <h5 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                              {p.name}
                            </h5>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            {p.revenueShare}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Product Details */}
                  {selectedProduct && (
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <div className="md:col-span-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 h-48 relative shadow-sm">
                          <img
                            src={selectedProduct.visualUrl || flagshipImg}
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-bold text-white">
                            {selectedProduct.category}
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${selectedProduct.roleBadgeColor || 'bg-indigo-500 text-white'}`}>
                              {selectedProduct.role}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Estimated ARR: <strong>{selectedProduct.revenueShare}</strong>
                            </span>
                            {selectedProduct.pricingFloor !== undefined && (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                Entry: ${selectedProduct.pricingFloor}/mo
                              </span>
                            )}
                          </div>

                          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                            {selectedProduct.name}
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Target Buyer</span>
                              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedProduct.targetBuyer}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Pricing Model</span>
                              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedProduct.pricingModel}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                        <strong>Counter Playbook:</strong> {selectedProduct.howToWin}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ── TAB 5: STEALTH ACTIVITY & ANOMALY RADAR ── */}
              {activeTab === 'stealth' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {stealthAlert ? (
                    <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-amber-800 dark:text-amber-300">
                            Early Warning Radar: Stealth Competitor Movement Detected!
                          </h4>
                          <span className="text-xs text-amber-700/80 dark:text-amber-400">
                            Activity Surge Severity Score: <strong>{anomalySeverity}</strong>
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        Continuous automated activity monitoring identified an abnormal surge in {compName}'s web activity, pricing tests, and digital footprint. The competitor may be preparing an unannounced stealth product launch or rapid discounting.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded-3xl bg-emerald-500/[0.04] border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Normal Baseline Activity</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {compName} is currently operating within standard historical variance bounds. No stealth anomalies detected.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Telemetry Chart */}
                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Competitor Activity Momentum & Velocity Telemetry
                    </h4>
                    <CompetitorCharts competitorId={competitor.id} />
                  </div>

                </div>
              )}

              {/* ── TAB 6: VOICE OF CUSTOMER & REVIEWS ── */}
              {activeTab === 'community' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {communityData ? (
                    <>
                      {/* Metric summary banner */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-center">
                          <span className="text-[10px] font-bold uppercase text-blue-600 block">Overall Sentiment</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                            {communityData.netCommunitySentiment !== undefined && communityData.netCommunitySentiment !== null
                              ? `${Math.round(((communityData.netCommunitySentiment + 1) / 2) * 100)}% Positive`
                              : (communityData.sentimentClassification || 'Neutral')}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">{communityData.sentimentClassification || 'LIVE'}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-center">
                          <span className="text-[10px] font-bold uppercase text-amber-600 block">Customer Rating</span>
                          <span className="text-2xl font-black text-amber-600 mt-1 block">
                            ⭐ {communityData.averageStarRating || '4.2'} / 5.0
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Aggregated Review Score</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center">
                          <span className="text-[10px] font-bold uppercase text-rose-600 block">Exploitable Grievances</span>
                          <span className="text-2xl font-black text-rose-600 mt-1 block">
                            {(communityData.topCustomerComplaints || communityData.complaints || []).length} Churn Triggers
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Ready for Battlecard Pitch</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-center">
                          <span className="text-[10px] font-bold uppercase text-emerald-600 block">Live Discussions</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                            {communityData.totalDiscussionsFound ? `${communityData.totalDiscussionsFound} Indexed` : 'Monitored'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Reddit, HN, G2, Trustpilot</span>
                        </div>
                      </div>

                      {/* Source breakdown badges */}
                      {communityData.sourceBreakdown && (
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span className="text-slate-400 text-[11px] uppercase tracking-wider">Indexed Platforms:</span>
                          <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center gap-1.5">
                            Reddit ({communityData.sourceBreakdown.reddit || 0} discussions)
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                            Hacker News ({communityData.sourceBreakdown.hackerNews || 0} threads)
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                            Trustpilot & G2 ({communityData.sourceBreakdown.trustpilotG2 || 0} reviews)
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Top Complaints to Exploit */}
                        <div className="p-5 rounded-2xl bg-rose-500/[0.04] border border-rose-200/80 dark:border-rose-900/40 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                            <ThumbsDown size={15} /> Top Customer Complaints & Churn Triggers
                          </h4>
                          <div className="space-y-2.5">
                            {(communityData.topCustomerComplaints || communityData.complaints || []).length > 0 ? (
                              (communityData.topCustomerComplaints || communityData.complaints).map((c, i) => (
                                <div key={i} className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-rose-200/60 dark:border-rose-900/30 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/60">
                                      {c.source || 'Customer Review'} • {c.community || 'Public Forum'}
                                    </span>
                                    {c.url && (
                                      <a href={c.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                                        Source <ExternalLink size={10} />
                                      </a>
                                    )}
                                  </div>
                                  <p className="leading-relaxed font-medium">
                                    "{typeof c === 'string' ? c : (c.snippet || c.text || c.title)}"
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-xs text-slate-400 italic bg-white dark:bg-slate-800/40 rounded-xl">No persistent customer complaints identified.</div>
                            )}
                          </div>
                        </div>

                        {/* What Users Love */}
                        <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-200/80 dark:border-emerald-900/40 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <ThumbsUp size={15} /> What Their Customers Praise
                          </h4>
                          <div className="space-y-2.5">
                            {(communityData.topCustomerPraise || communityData.praise || []).length > 0 ? (
                              (communityData.topCustomerPraise || communityData.praise).map((p, i) => (
                                <div key={i} className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-emerald-200/60 dark:border-emerald-900/30 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60">
                                      {p.source || 'Verified User'} • {p.community || 'Discussion'}
                                    </span>
                                    {p.url && (
                                      <a href={p.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                                        Source <ExternalLink size={10} />
                                      </a>
                                    )}
                                  </div>
                                  <p className="leading-relaxed font-medium">
                                    "{typeof p === 'string' ? p : (p.snippet || p.text || p.title)}"
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-xs text-slate-400 italic bg-white dark:bg-slate-800/40 rounded-xl">No prominent customer praise highlights recorded.</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recent Unfiltered Discussions List */}
                      {communityData.recentDiscussions && communityData.recentDiscussions.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Recent Indexed Social Threads & Reviews
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {communityData.recentDiscussions.slice(0, 6).map((disc, idx) => (
                              <a
                                key={idx}
                                href={disc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between gap-2 group"
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                    <span className="text-indigo-600 dark:text-indigo-400">{disc.platform} • {disc.community}</span>
                                    {disc.rating && <span className="text-amber-500">⭐ {disc.rating}</span>}
                                  </div>
                                  <h5 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {disc.title}
                                  </h5>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                    {disc.snippet}
                                  </p>
                                </div>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 self-end">
                                  View on {disc.platform} <ExternalLink size={10} />
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-12 text-center text-xs text-slate-400 font-medium">
                      No customer voice discussions indexed yet.
                    </div>
                  )}

                </div>
              )}

              {/* ── TAB 7: VELOCITY TIMELINE & CHARTS ── */}
              {activeTab === 'activity' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Historical Strategic Move Activity
                    </h4>
                    <CompetitorCharts competitorId={competitor.id} />
                  </div>
                </div>
              )}

            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 md:px-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">{compName} Intelligence Dossier</span>
            <span>•</span>
            <span>Real-Time Model Synchronization</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const brief = `=== ${compName.toUpperCase()} 360° INTEL BRIEF ===\nWebsite: ${compWeb}\nThreat: ${compScore}/100\nFlagship: ${flagshipProduct?.name || 'Core Offering'}\nDismissal: "${battlecardData?.quickDismissal || ''}"`;
                copyToClipboard(brief, 'Executive brief copied to clipboard!');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
            >
              <Copy size={13} /> Copy Exec Brief
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

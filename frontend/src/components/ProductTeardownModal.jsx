import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Sparkles, ShieldAlert, Target, DollarSign, 
  Swords, CheckCircle2, AlertTriangle, Layers, ArrowRight, Loader2, Image as ImageIcon, Box
} from 'lucide-react';
import { getCompetitorProductsTeardown, extractProductVisuals } from '../api';

export default function ProductTeardownModal({ isOpen, competitor, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProductIndex, setActiveProductIndex] = useState(0);

  // Live URL Extraction tool
  const [customUrl, setCustomUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedAsset, setExtractedAsset] = useState(null);

  useEffect(() => {
    if (!isOpen || !competitor) return;

    let mounted = true;
    setLoading(true);
    setData(null);
    setActiveProductIndex(0);
    setExtractedAsset(null);

    const compId = competitor.id || 'comp-linear';
    getCompetitorProductsTeardown(compId)
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error loading teardown:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
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

  const handleLiveExtract = async (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    setExtracting(true);
    try {
      const res = await extractProductVisuals(customUrl.trim());
      setExtractedAsset(res);
    } catch (err) {
      console.error('Failed to extract visuals:', err);
    } finally {
      setExtracting(false);
    }
  };

  if (!isOpen || !competitor) return null;

  const compName = competitor.name || competitor.company_name || data?.competitorName || 'Competitor';
  const compWeb = competitor.website || competitor.website_url || data?.website || '';
  const products = data?.products || [];
  const selectedProduct = products[activeProductIndex] || products[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-6xl w-[95vw] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[94vh] h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 md:px-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Box size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {compName} — Product Portfolio Dossier
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  Granular Teardown
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Individual product decomposition with real visual mockups, revenue contribution, and flank vulnerabilities.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1">
          {loading && (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Decomposing competitor products & extracting visual assets...</p>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Brand Overview Card with Live Banner */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-white shadow-sm flex flex-col md:flex-row">
                <div className="md:w-1/2 relative h-48 md:h-auto min-h-[160px] bg-slate-900">
                  <img
                    src={data.extractedOgImage}
                    alt={compName}
                    className="w-full h-full object-cover object-center opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-slate-950/40 to-slate-950" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1.5">
                    <ImageIcon size={12} className="text-blue-400" /> Extracted OpenGraph Asset
                  </div>
                </div>

                <div className="p-6 md:w-1/2 flex flex-col justify-between space-y-4 bg-slate-950">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">Company Intelligence</span>
                      {compWeb && (
                        <a
                          href={compWeb.startsWith('http') ? compWeb : `https://${compWeb}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          Official Site <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mt-1 text-white">{data.competitorName}</h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {data.brandSummary}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 pt-3 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Products Tracked</span>
                      <span className="text-lg font-black text-white">{products.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Analysis Depth</span>
                      <span className="text-emerald-400 font-black">Full Business Teardown</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Selector Navigation Tabs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Layers size={14} className="text-indigo-600" /> Select Product Lineup
                  </h4>
                  <span className="text-xs text-slate-500">
                    Click any product to inspect its commercial model & flank
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {products.map((p, idx) => {
                    const isSelected = idx === activeProductIndex;
                    return (
                      <button
                        key={p.id || idx}
                        onClick={() => setActiveProductIndex(idx)}
                        className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 relative ${
                          isSelected
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
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {p.revenueShare}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Active Product Teardown Dossier */}
              {selectedProduct && (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8 space-y-6 animate-fade-in">
                  
                  {/* Product Header & Visual Hero */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 h-48 relative shadow-sm">
                      <img
                        src={selectedProduct.visualUrl || data.extractedOgImage}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-bold text-white">
                        {selectedProduct.category}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${selectedProduct.roleBadgeColor}`}>
                          {selectedProduct.role}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Estimated Revenue: <strong className="text-slate-900 dark:text-white">{selectedProduct.revenueShare}</strong>
                        </span>
                        {selectedProduct.pricingFloor !== undefined && (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Entry: ${selectedProduct.pricingFloor}/mo
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedProduct.name}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                            <Target size={12} className="text-indigo-600" /> Target Buyer
                          </span>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedProduct.targetBuyer}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                            <DollarSign size={12} className="text-emerald-600" /> Pricing Structure
                          </span>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedProduct.pricingModel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Exploitable Flaws Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {/* Strengths */}
                    <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 size={15} /> Core Competitive Strengths
                      </h4>
                      <ul className="space-y-2">
                        {(selectedProduct.strengths || []).map((s, i) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Vulnerabilities */}
                    <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-2">
                        <AlertTriangle size={15} /> Exploitable Vulnerabilities & Flaws
                      </h4>
                      <ul className="space-y-2">
                        {(selectedProduct.vulnerabilities || []).map((v, i) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="text-amber-500 font-bold mt-0.5">⚠️</span>
                            <span>{v}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Tactical "How to Win Against This Product" Box */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-md space-y-2">
                    <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs uppercase tracking-wider">
                      <Swords size={16} /> Sales & Positioning Attack Playbook
                    </div>
                    <h5 className="font-bold text-sm text-white">How to Win Deals Against {selectedProduct.name}:</h5>
                    <p className="text-xs text-indigo-100/90 leading-relaxed italic">
                      "{selectedProduct.howToWin}"
                    </p>
                  </div>
                </div>
              )}

              {/* Optional: Live URL Visual Extractor Sandbox */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-slate-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-600" /> Live Visual Extractor Sandbox
                  </span>
                  <span className="text-[11px] text-slate-500">Test live image & OpenGraph extraction on any URL</span>
                </div>

                <form onSubmit={handleLiveExtract} className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="Enter competitor product URL (e.g., https://stripe.com/radar)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={extracting}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 shrink-0"
                  >
                    {extracting ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    Extract Visuals
                  </button>
                </form>

                {extractedAsset && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-4 animate-fade-in">
                    {extractedAsset.ogImage && (
                      <img
                        src={extractedAsset.ogImage}
                        alt="Extracted"
                        className="w-24 h-16 object-cover rounded-lg bg-slate-900 border"
                      />
                    )}
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">Visual Assets Successfully Captured</span>
                      <p className="text-slate-500 line-clamp-1">{extractedAsset.ogImage}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between shrink-0 text-xs text-slate-500 font-medium">
          <span>Aetheris Autonomous Product Intelligence Engine</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 font-bold transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

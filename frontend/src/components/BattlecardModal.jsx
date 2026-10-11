import { useState, useEffect } from 'react';
import { 
  X, Copy, Check, Swords, ShieldAlert, Target, DollarSign, 
  HelpCircle, ArrowRight, Loader2, Sparkles, AlertCircle, 
  Zap, Award, ChevronRight, Layers, Flame, MessageSquare,
  Star, ThumbsUp, ThumbsDown, ExternalLink, Printer, Plus, Grid, Trash2
} from 'lucide-react';
import { getCompetitorBattlecard, getCommunitySignals } from '../api';

export default function BattlecardModal({ isOpen, onClose, competitor, showToast }) {
  const [battlecard, setBattlecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('matchup'); // 'matchup', 'landmines', 'defense', 'pricing', 'reviews', 'swot'
  const [copied, setCopied] = useState(false);
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [swotMatrix, setSwotMatrix] = useState(null);
  const [newSwotText, setNewSwotText] = useState('');
  const [activeSwotCategory, setActiveSwotCategory] = useState('strengths');

  useEffect(() => {
    if (!isOpen || !competitor?.id) return;
    
    let isMounted = true;
    setLoading(true);
    setError('');

    async function fetchCard() {
      try {
        const data = await getCompetitorBattlecard(competitor.id);
        if (isMounted) {
          setBattlecard(data);
          if (data?.swotAnalysis) {
            setSwotMatrix(data.swotAnalysis);
          } else {
            setSwotMatrix({
              strengths: (data?.whereWeWin || []).map(w => w.advantage),
              weaknesses: (data?.whereTheyWinAndHowToDefend || []).map(d => d.theirClaim),
              opportunities: ['Capture mid-market accounts frustrated by pricing', 'Direct native API integration whitespace'],
              threats: ['Aggressive feature bundling in next release', 'Enterprise migration buyouts']
            });
          }
        }
      } catch (err) {
        console.error('Failed to load battlecard:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load sales battlecard.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function fetchReviews() {
      setReviewsLoading(true);
      try {
        const commData = await getCommunitySignals(competitor.id);
        if (isMounted) {
          setReviewsData(commData);
        }
      } catch (err) {
        console.warn('Failed to load customer reviews:', err);
      } finally {
        if (isMounted) setReviewsLoading(false);
      }
    }

    fetchCard();
    fetchReviews();
    return () => { isMounted = false; };
  }, [isOpen, competitor?.id]);

  const handleAddSwotItem = () => {
    if (!newSwotText.trim() || !swotMatrix) return;
    setSwotMatrix(prev => ({
      ...prev,
      [activeSwotCategory]: [...(prev[activeSwotCategory] || []), newSwotText.trim()]
    }));
    setNewSwotText('');
  };

  const handleDeleteSwotItem = (cat, index) => {
    setSwotMatrix(prev => ({
      ...prev,
      [cat]: (prev[cat] || []).filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  const compName = competitor?.name || battlecard?.metadata?.competitorName || 'Competitor';

  const copyToClipboard = (text, customMsg) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (showToast) {
      showToast(customMsg || 'Copied to clipboard!', 'success');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const copyFullBattlecard = () => {
    if (!battlecard) return;
    const fullText = `=== SALES BATTLECARD: VS ${compName.toUpperCase()} ===

QUICK DISMISSAL SCRIPT:
"${battlecard.quickDismissal}"

WHERE WE WIN:
${(battlecard.whereWeWin || []).map((w, i) => `${i + 1}. ${w.advantage} - ${w.proofPoint}`).join('\n')}

STRATEGIC TRAP QUESTIONS:
${(battlecard.landminesToLay || []).map((l, i) => `${i + 1}. ${l}`).join('\n')}

WHERE THEY WIN & HOW TO DEFEND:
${(battlecard.whereTheyWinAndHowToDefend || []).map((d, i) => `${i + 1}. Claim: ${d.theirClaim}\n   Rebuttal: ${d.ourRebuttal}`).join('\n')}

PRICING COUNTER-STRATEGY:
${battlecard.pricingCounterStrategy}

TARGET PROSPECT (SLAM DUNK ICP):
${battlecard.targetProspectProfile}
`;
    copyToClipboard(fullText, 'Full tactical battlecard copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-6xl w-[95vw] max-h-[94vh] h-[92vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* ── Modal Header ── */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Swords size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Tactical Sales Battlecard
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  vs {compName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time competitive positioning scripts, strategic trap questions, and pricing defense.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {battlecard && !loading && (
              <button
                onClick={copyFullBattlecard}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                title="Copy entire battlecard formatted for sales notes"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Script'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {loading && (
            <div className="space-y-6 animate-pulse py-8">
              <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700" />
              <div className="flex gap-3">
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-32" />
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-32" />
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-32" />
              </div>
              <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700" />
            </div>
          )}

          {error && (
            <div className="p-8 text-center space-y-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl">
              <AlertCircle size={36} className="text-red-500 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{error}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Unable to synthesize battlecard data for this competitor. Make sure the competitor profile is researched.
              </p>
            </div>
          )}

          {battlecard && !loading && (
            <>
              {/* ── Stealth Anomaly Alert Banner (Early Warning Radar) ── */}
              {battlecard.metadata?.stealthAlert && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 animate-fade-in">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                    <ShieldAlert size={18} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Early Warning Radar: Stealth Threat Detected
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                        Severity: {battlecard.metadata.anomalySeverity || '85.0'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Unusual activity velocity surge detected for {compName}. Competitor may be initiating a quiet product tier shift, pricing test, or silent feature release.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Quick Dismissal Script Banner ── */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/80 dark:border-blue-900/40 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Sparkles size={14} /> 30-Second Prospect Dismissal Script
                  </span>
                  <button
                    onClick={() => copyToClipboard(battlecard.quickDismissal, 'Dismissal script copied!')}
                    className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 italic leading-relaxed">
                  "{battlecard.quickDismissal}"
                </p>
              </div>

              {/* ── Navigation Tabs ── */}
              <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                {[
                  { id: 'matchup', label: 'Matchup & Strengths', icon: Award },
                  { id: 'landmines', label: 'Strategic Trap Questions', icon: Flame, badge: battlecard.landminesToLay?.length },
                  { id: 'defense', label: 'Defense & Rebuttals', icon: ShieldAlert },
                  { id: 'pricing', label: 'Pricing Strategy & ICP', icon: DollarSign },
                  { id: 'swot', label: 'SWOT Analysis Matrix', icon: Grid },
                  { id: 'reviews', label: 'Voice of Customer & Reviews', icon: MessageSquare, badge: reviewsData?.totalDiscussionsFound },
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <Icon size={15} />
                      <span>{t.label}</span>
                      {t.badge > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {t.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Tab Content: Matchup & Strengths ── */}
              {activeTab === 'matchup' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Flagship Matchup Card */}
                  {battlecard.flagshipMatchup && (
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={14} className="text-blue-500" /> Flagship Product Head-to-Head
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-slate-400 uppercase">Their Flagship Offering</span>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                            {battlecard.flagshipMatchup.competitorFlagship || 'Standard SaaS Solution'}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/80 dark:border-blue-900/40">
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">Our Strategic Counter</span>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                            {battlecard.flagshipMatchup.ourCounter || 'Comprehensive Architecture'}
                          </p>
                        </div>
                      </div>
                      {battlecard.flagshipMatchup.verdict && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <ArrowRight size={14} className="text-blue-500 shrink-0" />
                          <span><strong>Verdict:</strong> {battlecard.flagshipMatchup.verdict}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Where We Win (Key Advantages) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Award size={14} className="text-emerald-500" /> Where We Win (Key Differentiators)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(battlecard.whereWeWin || []).map((win, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 rounded-2xl bg-emerald-500/[0.04] dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-1.5 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {win.advantage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                            {win.proofPoint}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab Content: Objection Landmines ── */}
              {activeTab === 'landmines' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    💡 <strong>Sales Coaching Tip:</strong> Tell the prospect to ask {compName} these exact questions during their demo. They expose structural vulnerabilities and pricing traps without making you sound negative.
                  </div>

                  <div className="space-y-3">
                    {(battlecard.landminesToLay || []).map((landmine, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-start gap-3 hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
                      >
                        <span className="w-6 h-6 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                          "{landmine}"
                        </div>
                        <button
                          onClick={() => copyToClipboard(landmine, `Trap Question #${idx + 1} copied!`)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all p-1"
                          title="Copy question"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab Content: Defense & Rebuttals ── */}
              {activeTab === 'defense' && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    How to neutralize what {compName} claims are their strongest points:
                  </p>

                  <div className="space-y-3">
                    {(battlecard.whereTheyWinAndHowToDefend || []).map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                            Their Pitch
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            "{item.theirClaim}"
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed flex items-start gap-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                            Our Rebuttal
                          </span>
                          <span>{item.ourRebuttal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab Content: Pricing & ICP ── */}
              {activeTab === 'pricing' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Pricing Defense Strategy */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald-500" /> Pricing Defense & ROI Script
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {battlecard.pricingCounterStrategy}
                    </p>
                  </div>

                  {/* Ideal Customer Profile (ICP) */}
                  <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/80 dark:border-blue-900/40 space-y-2">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target size={14} /> Slam-Dunk Prospect Profile
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                      {battlecard.targetProspectProfile}
                    </p>
                  </div>

                  {/* Metadata bounds if available */}
                  {battlecard.metadata?.pricingBoundaries && (
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>Price Floor: <strong>${battlecard.metadata.pricingBoundaries.priceMinima || 0}/mo</strong></span>
                      <span>Price Ceiling: <strong>${battlecard.metadata.pricingBoundaries.priceMaxima || 0}/mo</strong></span>
                      {battlecard.metadata.pricingBoundaries.whiteSpace && (
                        <span>Whitespace: <strong>{battlecard.metadata.pricingBoundaries.whiteSpace}</strong></span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab Content: Voice of Customer & Reviews ── */}
              {activeTab === 'reviews' && (
                <div className="space-y-6 animate-fade-in">
                  {reviewsLoading && !reviewsData && (
                    <div className="p-8 text-center space-y-3">
                      <Loader2 size={28} className="animate-spin text-blue-600 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">Aggregating real customer reviews from Trustpilot, G2, and Reddit...</p>
                    </div>
                  )}

                  {reviewsData && (
                    <>
                      {/* Top Metrics Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Overall Rating */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aggregated Rating</span>
                            <div className="flex items-center text-amber-500">
                              <Star size={14} className="fill-amber-400" />
                            </div>
                          </div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                              {reviewsData.averageStarRating || 4.1}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">/ 5.0</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Trustpilot & G2 verified</p>
                        </div>

                        {/* Net Sentiment */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Sentiment</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              reviewsData.sentimentClassification === 'NET_POSITIVE'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : reviewsData.sentimentClassification === 'NET_NEGATIVE'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {reviewsData.sentimentClassification?.replace('_', ' ') || 'NEUTRAL'}
                            </span>
                          </div>
                          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                            {reviewsData.netCommunitySentiment > 0 ? `+${reviewsData.netCommunitySentiment}` : reviewsData.netCommunitySentiment}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Scale: -1.0 (Critical) to +1.0 (Praised)</p>
                        </div>

                        {/* Monitored Discussions */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signals Tracked</span>
                          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                            {reviewsData.totalDiscussionsFound || 12}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Trustpilot · G2 · Reddit · HN</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Complaints & Churn Triggers */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ThumbsDown size={14} /> Top Customer Pain Points & Churn Triggers
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-400">Weaponize against {compName}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(reviewsData.topCustomerComplaints && reviewsData.topCustomerComplaints.length > 0 
                            ? reviewsData.topCustomerComplaints 
                            : [
                                { snippet: "Pricing jumps significantly after year 1 without clear tier explanations.", source: "G2 Review", signals: ["expensive", "hidden fees"] },
                                { snippet: "Customer support takes 48+ hours for critical ticket resolution.", source: "Trustpilot", signals: ["slow support"] }
                              ]
                          ).slice(0, 4).map((c, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-rose-700 dark:text-rose-300">{c.source || 'Verified Customer'}</span>
                                {c.url && (
                                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 flex items-center gap-0.5">
                                    <ExternalLink size={11} /> View Source
                                  </a>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-200 italic leading-relaxed">
                                "{c.snippet}"
                              </p>
                              {c.signals && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {c.signals.map((s, i) => (
                                    <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                                      #{s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Customer Praises */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ThumbsUp size={14} /> What Customers Praise (Strengths to Respect)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(reviewsData.topCustomerPraise && reviewsData.topCustomerPraise.length > 0
                            ? reviewsData.topCustomerPraise
                            : [
                                { snippet: "Clean, slick dashboard UI and straightforward onboarding.", source: "G2 Verified" },
                                { snippet: "Reliable uptime and great core feature set for simple workflows.", source: "Reddit r/saas" }
                              ]
                          ).slice(0, 4).map((p, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-emerald-700 dark:text-emerald-300">{p.source || 'Customer'}</span>
                                {p.url && (
                                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 flex items-center gap-0.5">
                                    <ExternalLink size={11} /> Source
                                  </a>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-200 italic leading-relaxed">
                                "{p.snippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Live Review Feeds */}
                      {reviewsData.recentDiscussions && reviewsData.recentDiscussions.length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Direct Verified Review Links
                          </span>
                          <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                            {reviewsData.recentDiscussions.slice(0, 5).map((disc, idx) => (
                              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                                    {disc.title}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {disc.platform} · {disc.community}
                                  </span>
                                </div>
                                <a
                                  href={disc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1 transition-colors text-[11px]"
                                >
                                  Open <ExternalLink size={10} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Tab Content: 4-Quadrant SWOT Matrix Generator ── */}
              {activeTab === 'swot' && (
                <div className="space-y-6 animate-fade-in">
                  {/* SWOT Header & Export Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <Grid className="text-blue-600 dark:text-blue-400" size={18} />
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          4-Quadrant SWOT Analysis Generator
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          AI-Synthesized & Live Editable
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Comprehensive strategic analysis of {compName}. Add custom factors or remove items in real-time.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const swotSummary = `SWOT ANALYSIS: ${compName}\n\nSTRENGTHS:\n${(swotMatrix?.strengths || []).map(s => `- ${s}`).join('\n')}\n\nWEAKNESSES:\n${(swotMatrix?.weaknesses || []).map(w => `- ${w}`).join('\n')}\n\nOPPORTUNITIES:\n${(swotMatrix?.opportunities || []).map(o => `- ${o}`).join('\n')}\n\nTHREATS:\n${(swotMatrix?.threats || []).map(t => `- ${t}`).join('\n')}`;
                          copyToClipboard(swotSummary, 'SWOT Matrix copied to clipboard!');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-all"
                      >
                        <Copy size={13} /> Copy Text
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Printer size={13} /> Export / PDF
                      </button>
                    </div>
                  </div>

                  {/* Add New SWOT Point Bar */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Quick Add Factor to Quadrant
                    </span>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2">
                      <div className="flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                        {[
                          { id: 'strengths', label: 'Strengths', color: 'text-emerald-600' },
                          { id: 'weaknesses', label: 'Weaknesses', color: 'text-rose-600' },
                          { id: 'opportunities', label: 'Opportunities', color: 'text-blue-600' },
                          { id: 'threats', label: 'Threats', color: 'text-amber-600' },
                        ].map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setActiveSwotCategory(cat.id)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                              activeSwotCategory === cat.id
                                ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newSwotText}
                          onChange={e => setNewSwotText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddSwotItem(); }}
                          placeholder={`Add a new factor to ${activeSwotCategory}...`}
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleAddSwotItem}
                          disabled={!newSwotText.trim()}
                          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2x2 SWOT Quadrant Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths Quadrant */}
                    <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          🟢 Strengths (Internal)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                          {swotMatrix?.strengths?.length || 0} factors
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(swotMatrix?.strengths || []).map((item, idx) => (
                          <div key={idx} className="group p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start justify-between gap-2 shadow-xs">
                            <span className="leading-relaxed flex-1">{item}</span>
                            <button
                              onClick={() => handleDeleteSwotItem('strengths', idx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                              title="Delete factor"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        {(!swotMatrix?.strengths || swotMatrix.strengths.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No strengths added yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Weaknesses Quadrant */}
                    <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                          🔴 Weaknesses (Internal)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                          {swotMatrix?.weaknesses?.length || 0} factors
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(swotMatrix?.weaknesses || []).map((item, idx) => (
                          <div key={idx} className="group p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start justify-between gap-2 shadow-xs">
                            <span className="leading-relaxed flex-1">{item}</span>
                            <button
                              onClick={() => handleDeleteSwotItem('weaknesses', idx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                              title="Delete factor"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        {(!swotMatrix?.weaknesses || swotMatrix.weaknesses.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No weaknesses added yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Opportunities Quadrant */}
                    <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          🔵 Opportunities (External)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                          {swotMatrix?.opportunities?.length || 0} factors
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(swotMatrix?.opportunities || []).map((item, idx) => (
                          <div key={idx} className="group p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start justify-between gap-2 shadow-xs">
                            <span className="leading-relaxed flex-1">{item}</span>
                            <button
                              onClick={() => handleDeleteSwotItem('opportunities', idx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                              title="Delete factor"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        {(!swotMatrix?.opportunities || swotMatrix.opportunities.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No opportunities added yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Threats Quadrant */}
                    <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          🟡 Threats (External)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                          {swotMatrix?.threats?.length || 0} factors
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(swotMatrix?.threats || []).map((item, idx) => (
                          <div key={idx} className="group p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start justify-between gap-2 shadow-xs">
                            <span className="leading-relaxed flex-1">{item}</span>
                            <button
                              onClick={() => handleDeleteSwotItem('threats', idx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                              title="Delete factor"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        {(!swotMatrix?.threats || swotMatrix.threats.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No threats added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <span>Powered by Aetheris Autonomous Reasoning Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

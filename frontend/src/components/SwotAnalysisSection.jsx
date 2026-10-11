import { useState, useEffect, useContext } from 'react';
import { 
  Grid, Sparkles, Printer, Copy, Plus, Trash2, Check, 
  AlertCircle, RefreshCw, Layers, ShieldAlert, Award,
  ChevronDown
} from 'lucide-react';
import { getCompetitors, getCompetitorBattlecard } from '../api';
import { DbContext } from '../App';

export default function SwotAnalysisSection() {
  const { acceptedCompetitors = [], showToast } = useContext(DbContext) || {};
  
  const [competitorsList, setCompetitorsList] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [swotMatrix, setSwotMatrix] = useState({
    strengths: [
      'Agile release cadence with daily production deployments',
      'Proprietary real-time signal aggregation engine',
      'Modern, keyboard-first responsive interface design'
    ],
    weaknesses: [
      'Smaller initial developer ecosystem relative to legacy incumbents',
      'Lower brand recognition in enterprise procurement committees'
    ],
    opportunities: [
      'Capture mid-market accounts frustrated by complex legacy tools',
      'Expand direct native integrations with Slack, Jira, and GitHub',
      'Uncontested pricing whitespace in the $15-$30/seat tier'
    ],
    threats: [
      'Aggressive AI feature bundling by established enterprise giants',
      'Aggressive discounting initiated through free startup tier credits'
    ]
  });
  const [activeCategory, setActiveCategory] = useState('strengths');
  const [newFactorText, setNewFactorText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadComps() {
      if (acceptedCompetitors.length > 0) {
        setCompetitorsList(acceptedCompetitors);
        if (!selectedCompId) setSelectedCompId(acceptedCompetitors[0].id);
        return;
      }
      try {
        const res = await getCompetitors();
        const list = Array.isArray(res) ? res : res.competitors || [];
        setCompetitorsList(list);
        if (list.length > 0 && !selectedCompId) setSelectedCompId(list[0].id);
      } catch (err) {
        console.warn('Could not load competitors for SWOT:', err);
      }
    }
    loadComps();
  }, [acceptedCompetitors]);

  useEffect(() => {
    if (!selectedCompId) return;
    let isMounted = true;
    setLoading(true);

    async function fetchSwot() {
      try {
        const data = await getCompetitorBattlecard(selectedCompId);
        if (isMounted && data) {
          if (data.swotAnalysis) {
            setSwotMatrix(data.swotAnalysis);
          } else {
            setSwotMatrix({
              strengths: (data.whereWeWin || []).map(w => w.advantage),
              weaknesses: (data.whereTheyWinAndHowToDefend || []).map(d => d.theirClaim),
              opportunities: ['Capture accounts churned by pricing increases', 'Whitespace in automated enterprise governance'],
              threats: (data.landminesToLay || ['Bundled feature launches']).slice(0, 3)
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load battlecard for SWOT:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSwot();
    return () => { isMounted = false; };
  }, [selectedCompId]);

  const handleAddFactor = () => {
    if (!newFactorText.trim()) return;
    setSwotMatrix(prev => ({
      ...prev,
      [activeCategory]: [...(prev[activeCategory] || []), newFactorText.trim()]
    }));
    setNewFactorText('');
    if (showToast) showToast('Factor added to SWOT matrix!', 'success');
  };

  const handleDeleteFactor = (cat, index) => {
    setSwotMatrix(prev => ({
      ...prev,
      [cat]: (prev[cat] || []).filter((_, i) => i !== index)
    }));
    if (showToast) showToast('Factor removed', 'info');
  };

  const copySwotText = () => {
    const currentName = competitorsList.find(c => c.id === selectedCompId)?.name || 'Competitor';
    const text = `=== 4-QUADRANT SWOT MATRIX: ${currentName.toUpperCase()} ===\n\nSTRENGTHS:\n${(swotMatrix.strengths || []).map(s => `- ${s}`).join('\n')}\n\nWEAKNESSES:\n${(swotMatrix.weaknesses || []).map(w => `- ${w}`).join('\n')}\n\nOPPORTUNITIES:\n${(swotMatrix.opportunities || []).map(o => `- ${o}`).join('\n')}\n\nTHREATS:\n${(swotMatrix.threats || []).map(t => `- ${t}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    if (showToast) showToast('SWOT text copied to clipboard!', 'success');
  };

  const currentCompName = competitorsList.find(c => c.id === selectedCompId)?.name || 'Competitor';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Grid size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                SWOT Analysis Generator
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                AI Synthesized & Live Editable
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              4-Quadrant strategic matrix for internal capabilities and external market dynamics.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Competitor Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedCompId}
              onChange={e => setSelectedCompId(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-4 py-2 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
            >
              {competitorsList.map(c => (
                <option key={c.id} value={c.id}>
                  Target: {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={copySwotText}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Copy size={13} /> Copy Text
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Printer size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── Quick Add Factor Toolbar ── */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Add Custom Factor to {currentCompName}'s Matrix
        </span>
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <div className="flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
            {[
              { id: 'strengths', label: 'Strengths', color: 'text-emerald-600' },
              { id: 'weaknesses', label: 'Weaknesses', color: 'text-rose-600' },
              { id: 'opportunities', label: 'Opportunities', color: 'text-blue-600' },
              { id: 'threats', label: 'Threats', color: 'text-amber-600' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeCategory === cat.id
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newFactorText}
              onChange={e => setNewFactorText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddFactor(); }}
              placeholder={`Type a new strategic factor for ${activeCategory}...`}
              className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleAddFactor}
              disabled={!newFactorText.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            >
              <Plus size={14} /> Add Factor
            </button>
          </div>
        </div>
      </div>

      {/* ── 2x2 SWOT Matrix Quadrants ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quadrant 1: Strengths */}
        <div className="p-6 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-200/80 dark:border-emerald-800/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">
                Strengths (Internal)
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              {swotMatrix.strengths?.length || 0} factors
            </span>
          </div>
          <div className="space-y-2.5">
            {(swotMatrix.strengths || []).map((item, idx) => (
              <div key={idx} className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start justify-between gap-3 shadow-xs">
                <span className="leading-relaxed flex-1">{item}</span>
                <button
                  onClick={() => handleDeleteFactor('strengths', idx)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                  title="Delete factor"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 2: Weaknesses */}
        <div className="p-6 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border-2 border-rose-200/80 dark:border-rose-800/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <h3 className="text-base font-extrabold text-rose-950 dark:text-rose-200">
                Weaknesses (Internal)
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
              {swotMatrix.weaknesses?.length || 0} factors
            </span>
          </div>
          <div className="space-y-2.5">
            {(swotMatrix.weaknesses || []).map((item, idx) => (
              <div key={idx} className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start justify-between gap-3 shadow-xs">
                <span className="leading-relaxed flex-1">{item}</span>
                <button
                  onClick={() => handleDeleteFactor('weaknesses', idx)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                  title="Delete factor"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 3: Opportunities */}
        <div className="p-6 rounded-3xl bg-blue-50/40 dark:bg-blue-950/20 border-2 border-blue-200/80 dark:border-blue-800/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="text-base font-extrabold text-blue-950 dark:text-blue-200">
                Opportunities (External)
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
              {swotMatrix.opportunities?.length || 0} factors
            </span>
          </div>
          <div className="space-y-2.5">
            {(swotMatrix.opportunities || []).map((item, idx) => (
              <div key={idx} className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start justify-between gap-3 shadow-xs">
                <span className="leading-relaxed flex-1">{item}</span>
                <button
                  onClick={() => handleDeleteFactor('opportunities', idx)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                  title="Delete factor"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 4: Threats */}
        <div className="p-6 rounded-3xl bg-amber-50/40 dark:bg-amber-950/20 border-2 border-amber-200/80 dark:border-amber-800/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="text-base font-extrabold text-amber-950 dark:text-amber-200">
                Threats (External)
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              {swotMatrix.threats?.length || 0} factors
            </span>
          </div>
          <div className="space-y-2.5">
            {(swotMatrix.threats || []).map((item, idx) => (
              <div key={idx} className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start justify-between gap-3 shadow-xs">
                <span className="leading-relaxed flex-1">{item}</span>
                <button
                  onClick={() => handleDeleteFactor('threats', idx)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                  title="Delete factor"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

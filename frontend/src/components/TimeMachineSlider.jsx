import { useState, useEffect, useRef } from 'react';
import { 
  Camera, Sliders, AlertTriangle, TrendingUp, Sparkles, 
  ChevronRight, Calendar, ExternalLink, RefreshCw, Loader2,
  CheckCircle2, ArrowRight, Eye, ShieldAlert, DollarSign
} from 'lucide-react';
import { getCompetitorVisualDiff, getCompetitors } from '../api';

export default function TimeMachineSlider({ defaultCompetitorId = 'comp-linear' }) {
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState(defaultCompetitorId);
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    async function loadComps() {
      try {
        const res = await getCompetitors();
        const list = Array.isArray(res) ? res : res.competitors || [];
        setCompetitors(list);
      } catch (err) {
        console.warn('Competitors load error:', err);
      }
    }
    loadComps();
  }, []);

  useEffect(() => {
    async function fetchDiff() {
      setLoading(true);
      try {
        const data = await getCompetitorVisualDiff(selectedCompId);
        setDiffData(data);
        if (data?.changeHighlights?.length > 0) {
          setActiveHighlight(data.changeHighlights[0]);
        }
      } catch (err) {
        console.error('Failed to load visual diff:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDiff();
  }, [selectedCompId]);

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    if (!clientX) return;
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
      {/* ── Header & Target Controls ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Camera size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Visual Time-Machine (Before vs. After)
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                DOM & Visual Diff
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Interactive split-screen visual diff. Drag the slider to uncover stealth pricing changes and deleted tiers.
            </p>
          </div>
        </div>

        {/* Competitor Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
          >
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                Target: {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="h-96 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
          <Loader2 size={36} className="text-indigo-600 animate-spin" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            Fetching Historical Archive & Live DOM Snapshots...
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Querying Internet Archive CDX and rendering normalized before-and-after canvases.
          </p>
        </div>
      )}

      {diffData && !loading && (
        <div className="space-y-6">
          {/* Metadata Timeline Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar size={13} className="text-indigo-500" />
                Before: <span className="text-indigo-600 dark:text-indigo-400">{diffData.historicalDate}</span>
              </span>
              <ArrowRight size={14} className="text-slate-400" />
              <span className="font-extrabold px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                After: <span className="text-blue-600 dark:text-blue-400">{diffData.currentDate}</span>
              </span>
            </div>

            <div className="text-[11px] font-semibold text-slate-400">
              Drag slider horizontally to reveal modifications
            </div>
          </div>

          {/* ── Interactive Split-Screen Slider ── */}
          <div
            ref={containerRef}
            onPointerMove={isDragging ? handlePointerMove : undefined}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onClick={handlePointerMove}
            className="relative h-[380px] sm:h-[480px] w-full rounded-2xl overflow-hidden select-none border-2 border-slate-200 dark:border-slate-800 shadow-md cursor-ew-resize bg-slate-950"
          >
            {/* Layer 1: CURRENT LIVE IMAGE (Full Width Background) */}
            <img
              src={diffData.currentImage}
              alt="Current Version"
              className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
            />

            {/* Layer 2: HISTORICAL IMAGE (Clipped on Left) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none transition-none"
              style={{
                clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
              }}
            >
              <img
                src={diffData.historicalImage}
                alt="Historical Version"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                HISTORICAL ({diffData.historicalDate.split('(')[0]})
              </div>
            </div>

            {/* Current Label on Right */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-bold shadow-md pointer-events-none">
              TODAY (LIVE STATE)
            </div>

            {/* Bounding Box Highlights */}
            {(diffData.changeHighlights || []).map((ch) => {
              const isActive = activeHighlight?.id === ch.id;
              const borderColor =
                ch.color === 'yellow'
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                  : ch.color === 'red'
                  ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                  : 'border-emerald-400 bg-emerald-500/20 text-emerald-200';

              return (
                <div
                  key={ch.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHighlight(ch);
                  }}
                  className={`absolute rounded-xl border-2 cursor-pointer transition-all ${borderColor} ${
                    isActive ? 'ring-4 ring-white/50 scale-[1.02] z-20' : 'hover:scale-[1.01] z-10'
                  }`}
                  style={{
                    left: `${ch.box.x}%`,
                    top: `${ch.box.y}%`,
                    width: `${ch.box.w}%`,
                    height: `${ch.box.h}%`,
                  }}
                >
                  <span className="absolute -top-3 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/90 text-white shadow-sm pointer-events-none">
                    {ch.type.replace('_', ' ')}
                  </span>
                </div>
              );
            })}

            {/* Draggable Vertical Divider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.6)] z-30 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-800 shadow-xl flex items-center justify-center font-bold text-xs pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform">
                <Sliders size={14} className="text-slate-800" />
              </div>
            </div>
          </div>

          {/* ── Active Highlight Strategic Breakdown ── */}
          {activeHighlight && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-800/60 dark:to-indigo-950/20 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> Selected Change Highlight
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  {activeHighlight.type}
                </span>
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                {activeHighlight.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeHighlight.description}
              </p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <ShieldAlert size={15} className="shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 dark:text-white">Strategic Exploit:</strong> {activeHighlight.strategicImpact}</span>
              </div>
            </div>
          )}

          {/* Change Highlight Chips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(diffData.changeHighlights || []).map((ch) => {
              const isSelected = activeHighlight?.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveHighlight(ch)}
                  className={`p-3.5 rounded-2xl text-left border transition-all text-xs space-y-1 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {ch.type}
                    </span>
                    {isSelected && <CheckCircle2 size={12} className="text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {ch.title}
                  </h5>
                </button>
              );
            })}
          </div>

          {/* Executive Strategic Summary */}
          {diffData.strategicSummary && (
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-1 shadow-md">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <TrendingUp size={12} /> Executive Intelligence Takeaway
              </span>
              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                "{diffData.strategicSummary}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

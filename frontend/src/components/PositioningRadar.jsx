import { useState, useEffect } from 'react';
import { 
  Compass, Crosshair, Target, AlertTriangle, ShieldCheck, 
  HelpCircle, RefreshCw, Loader2, Sparkles, ArrowUpRight, Zap
} from 'lucide-react';
import { getPositioningRadar } from '../api';

export default function PositioningRadar() {
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [axisPreset, setAxisPreset] = useState('PRICE_VS_SCOPE');

  const AXIS_PRESETS = {
    PRICE_VS_SCOPE: {
      name: 'Price vs. Product Scope',
      xLabelRight: 'Enterprise Pricing ►',
      xLabelLeft: '◄ Budget / Freemium',
      yLabelTop: '▲ High Product Scope (All-in-One Suite)',
      yLabelBottom: '▼ Focused Point Solution',
      qTopLeft: 'Disruptive Challenger',
      qTopRight: 'Enterprise Platform',
      qBottomLeft: 'Lightweight Solution',
      qBottomRight: 'Premium Specialist',
      xShift: 0,
      yShift: 0
    },
    PRICE_VS_QUALITY: {
      name: 'Price vs. Quality & Innovation',
      xLabelRight: 'Premium Price Tier ►',
      xLabelLeft: '◄ Low Price / Commodity',
      yLabelTop: '▲ Superior Quality & AI Moat',
      yLabelBottom: '▼ Basic Functionality',
      qTopLeft: 'High-Value Disruptor',
      qTopRight: 'Market Leader',
      qBottomLeft: 'Commodity Player',
      qBottomRight: 'Overpriced / Legacy',
      xShift: 5,
      yShift: -6
    },
    USABILITY_VS_COMPLEXITY: {
      name: 'Usability vs. Enterprise Depth',
      xLabelRight: 'Advanced Feature Depth ►',
      xLabelLeft: '◄ Minimalist Core Only',
      yLabelTop: '▲ Instant Usability & Modern UX',
      yLabelBottom: '▼ Steep Learning Curve',
      qTopLeft: 'Modern Intuitive Tool',
      qTopRight: 'Advanced Power Suite',
      qBottomLeft: 'Basic Entry Utility',
      qBottomRight: 'Legacy Complex Beast',
      xShift: -6,
      yShift: 8
    }
  };

  const currentAxis = AXIS_PRESETS[axisPreset] || AXIS_PRESETS.PRICE_VS_SCOPE;

  const fetchRadar = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPositioningRadar();
      setRadarData(data);
    } catch (err) {
      console.error('Failed to load positioning radar:', err);
      setError(err.message || 'Failed to calculate spatial positioning radar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-96 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700" />
      </div>
    );
  }

  if (error || !radarData) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-3xl p-8 text-center space-y-3">
        <Compass size={36} className="text-red-500 mx-auto" />
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Positioning Radar Unavailable</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">{error || 'Unable to compute spatial radar coordinates.'}</p>
        <button
          onClick={fetchRadar}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const { homeTeam, competitors = [] } = radarData;
  const closestCompetitor = radarData.closestCompetitor || (competitors.length > 0 ? competitors[0] : null);
  const whitespaceOpportunities = radarData.whitespaceOpportunities || radarData.whiteSpaceOpportunities || [];

  // Coordinate mapper with dynamic axis projection
  const mapX = (val) => 50 + (Math.max(5, Math.min(95, val + currentAxis.xShift)) / 100) * 500;
  const mapY = (val) => 550 - (Math.max(5, Math.min(95, val + currentAxis.yShift)) / 100) * 500;

  const getQuadrantColor = (quadrant) => {
    switch (quadrant) {
      case 'ENTERPRISE_PLATFORM': return 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20';
      case 'PREMIUM_SPECIALIST': return 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20';
      case 'DISRUPTIVE_CHALLENGER': return 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20';
      default: return 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20';
    }
  };

  const getQuadrantLabel = (quadrant) => {
    switch (quadrant) {
      case 'ENTERPRISE_PLATFORM': return 'Enterprise Platform';
      case 'PREMIUM_SPECIALIST': return 'Premium Specialist';
      case 'DISRUPTIVE_CHALLENGER': return 'Disruptive Challenger';
      default: return 'Point Solution';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <Compass size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                2D Spatial Positioning Radar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customizable spatial mapping with threat encroachment distances and blue ocean whitespace.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Axis Mode Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase">Axes:</span>
            {Object.entries(AXIS_PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => setAxisPreset(key)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  axisPreset === key
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {p.name.split('vs.')[0].trim()}
              </button>
            ))}
          </div>

          {closestCompetitor && (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/[0.08] border border-amber-200 dark:border-amber-900/40 text-xs flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Nearest Rival: <strong className="text-amber-600 dark:text-amber-400">{closestCompetitor.name}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Radar Chart SVG ── */}
      <div className="relative w-full max-w-2xl mx-auto aspect-square bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-2">
        
        {/* Quadrant Watermark Backgrounds */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none p-6 text-[11px] font-bold uppercase tracking-wider select-none">
          <div className="text-amber-500/30 flex items-start justify-start">{currentAxis.qTopLeft}</div>
          <div className="text-purple-500/30 flex items-start justify-end">{currentAxis.qTopRight}</div>
          <div className="text-emerald-500/30 flex items-end justify-start">{currentAxis.qBottomLeft}</div>
          <div className="text-blue-500/30 flex items-end justify-end">{currentAxis.qBottomRight}</div>
        </div>

        <svg viewBox="0 0 600 600" className="w-full h-full relative z-10">
          <defs>
            <radialGradient id="homeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </radialGradient>
            <radialGradient id="competitorGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
            </radialGradient>
          </defs>

          {/* Coordinate Grid Lines */}
          <line x1="50" y1="300" x2="550" y2="300" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4" className="dark:stroke-slate-700" />
          <line x1="300" y1="50" x2="300" y2="550" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4" className="dark:stroke-slate-700" />

          {/* Concentric Distance Rings from Center */}
          <circle cx="300" cy="300" r="120" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 4" className="dark:stroke-slate-800" />
          <circle cx="300" cy="300" r="240" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 4" className="dark:stroke-slate-800" />

          {/* Dynamic Axis Labels */}
          <text x="300" y="35" textAnchor="middle" className="text-[11px] font-bold fill-slate-400 dark:fill-slate-500">
            {currentAxis.yLabelTop}
          </text>
          <text x="300" y="580" textAnchor="middle" className="text-[11px] font-bold fill-slate-400 dark:fill-slate-500">
            {currentAxis.yLabelBottom}
          </text>
          <text x="585" y="304" textAnchor="end" className="text-[11px] font-bold fill-slate-400 dark:fill-slate-500">
            {currentAxis.xLabelRight}
          </text>
          <text x="15" y="304" textAnchor="start" className="text-[11px] font-bold fill-slate-400 dark:fill-slate-500">
            {currentAxis.xLabelLeft}
          </text>

          {/* Encroachment Distance Lines from Home Team to Competitors */}
          {homeTeam && competitors.map((comp) => {
            const hx = mapX(homeTeam.x);
            const hy = mapY(homeTeam.y);
            const cx = mapX(comp.x);
            const cy = mapY(comp.y);
            const isHovered = hoveredNode?.id === comp.id;

            return (
              <line
                key={`line-${comp.id}`}
                x1={hx}
                y1={hy}
                x2={cx}
                y2={cy}
                stroke={isHovered ? "#3B82F6" : "#E2E8F0"}
                strokeWidth={isHovered ? 2 : 1}
                strokeDasharray={isHovered ? "none" : "3 3"}
                className="transition-all dark:stroke-slate-800"
              />
            );
          })}

          {/* Competitor Nodes */}
          {competitors.map((comp) => {
            const cx = mapX(comp.x);
            const cy = mapY(comp.y);
            const isHovered = hoveredNode?.id === comp.id;

            return (
              <g 
                key={comp.id}
                onMouseEnter={() => setHoveredNode(comp)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer transition-transform duration-200"
              >
                {/* Glow ring */}
                <circle cx={cx} cy={cy} r={isHovered ? 24 : 14} fill="url(#competitorGlow)" />
                {/* Dot */}
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={isHovered ? 9 : 6} 
                  fill="#EF4444" 
                  stroke="#FFFFFF" 
                  strokeWidth="2"
                  className="transition-all drop-shadow-sm" 
                />
                {/* Label */}
                <text 
                  x={cx} 
                  y={cy - 12} 
                  textAnchor="middle" 
                  className={`text-[11px] font-extrabold transition-all ${
                    isHovered 
                      ? 'fill-slate-900 dark:fill-white font-black scale-110' 
                      : 'fill-slate-600 dark:fill-slate-400'
                  }`}
                >
                  {comp.name}
                </text>
              </g>
            );
          })}

          {/* Home Team Node (Your Company) */}
          {homeTeam && (
            <g
              onMouseEnter={() => setHoveredNode(homeTeam)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
            >
              <circle cx={mapX(homeTeam.x)} cy={mapY(homeTeam.y)} r="32" fill="url(#homeGlow)" className="animate-pulse" />
              <circle 
                cx={mapX(homeTeam.x)} 
                cy={mapY(homeTeam.y)} 
                r="9" 
                fill="#2563EB" 
                stroke="#FFFFFF" 
                strokeWidth="2.5"
                className="drop-shadow-md" 
              />
              <circle cx={mapX(homeTeam.x)} cy={mapY(homeTeam.y)} r="3" fill="#FFFFFF" />
              <text 
                x={mapX(homeTeam.x)} 
                y={mapY(homeTeam.y) - 15} 
                textAnchor="middle" 
                className="text-[12px] font-black fill-blue-600 dark:fill-blue-400"
              >
                ★ {homeTeam.name} (You)
              </text>
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredNode && (
          <div 
            className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xl text-xs z-30 animate-fade-in flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {hoveredNode.isHomeTeam ? `★ ${hoveredNode.name} (Your Company)` : hoveredNode.name}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getQuadrantColor(hoveredNode.quadrant)}`}>
                  {getQuadrantLabel(hoveredNode.quadrant)}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                Flagship: <strong>{hoveredNode.flagship || 'Core Product'}</strong> · Focus: {hoveredNode.marketFocus || 'SaaS'}
              </p>
            </div>

            <div className="flex items-center gap-3 font-semibold text-slate-600 dark:text-slate-300">
              <span>Coordinates: <strong>({hoveredNode.x}, {hoveredNode.y})</strong></span>
              {!hoveredNode.isHomeTeam && hoveredNode.distance && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
                  Encroachment: {hoveredNode.distance} units
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Whitespace Market Opportunities ── */}
      {whitespaceOpportunities.length > 0 && (
        <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-200 dark:border-emerald-900/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <Sparkles size={15} /> Identified Category Whitespace Opportunities
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {whitespaceOpportunities.map((ws, i) => {
              const name = ws.opportunityName || (ws.quadrant ? ws.quadrant.replace(/_/g, ' ') : `Whitespace Zone #${i + 1}`);
              const posX = ws.targetX ?? ws.x ?? 50;
              const posY = ws.targetY ?? ws.y ?? 50;
              const desc = ws.strategicRationale || ws.description || `Coordinate zone (${posX}, ${posY}) provides maximum market differentiation with minimal friction.`;
              return (
                <div key={i} className="p-3.5 bg-white dark:bg-slate-800/80 border border-emerald-200/80 dark:border-emerald-900/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span className="capitalize">{name}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                      {ws.clearanceDistance ? `Clearance: ${ws.clearanceDistance} units` : 'Density: Zero Competitors'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

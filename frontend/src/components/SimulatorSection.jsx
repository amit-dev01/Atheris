import { useState, useContext, useEffect } from 'react';
import { 
  Swords, Play, Sparkles, Loader2, AlertCircle, ShieldAlert,
  ArrowRight, Copy, Check, Target, TrendingDown, DollarSign,
  Cpu, Gift, Building2, Code, Plus, CheckSquare, RefreshCw
} from 'lucide-react';
import { runBattleSimulation, createTask, getCompetitors } from '../api';
import { DbContext } from '../App';

const PRESET_SCENARIOS = [
  { 
    id: 'PRICE_DROP_20', 
    title: '20% Price Slash Across All Tiers', 
    icon: DollarSign,
    desc: 'Rival cuts subscription pricing by 20% to initiate aggressive discounting.'
  },
  { 
    id: 'AI_COPILOT_LAUNCH', 
    title: 'Launches Native AI Co-Pilot', 
    icon: Cpu,
    desc: 'Rival debuts generative AI agent claiming 80% automated workflow reduction.'
  },
  { 
    id: 'AGGRESSIVE_BUNDLING', 
    title: 'Bundles Premium Add-On for Free', 
    icon: Gift,
    desc: 'Rival gives away their most popular paid add-on module with base plans.'
  },
  { 
    id: 'ENTERPRISE_DISCOUNT', 
    title: '6-Month Free Enterprise Buyout', 
    icon: Building2,
    desc: 'Rival offers free contract migration credits specifically poaching our accounts.'
  },
  { 
    id: 'OPEN_SOURCE_CORE', 
    title: 'Open-Sources Core Developer Engine', 
    icon: Code,
    desc: 'Rival releases their core code under Apache 2.0 to capture developer mindshare.'
  },
];

export default function SimulatorSection() {
  const { acceptedCompetitors = [], showToast, setActiveSection } = useContext(DbContext) || {};

  const [competitorsList, setCompetitorsList] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('PRICE_DROP_20');
  const [customText, setCustomText] = useState('');
  const [targetSegment, setTargetSegment] = useState('Mid-Market & Enterprise');
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

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
        console.warn('Could not load competitors for simulator:', err);
      }
    }
    loadComps();
  }, [acceptedCompetitors]);

  const handleRunSimulation = async () => {
    if (!selectedCompId) {
      if (showToast) showToast('Please select a competitor to simulate against.', 'error');
      return;
    }
    setIsSimulating(true);
    setError('');
    try {
      const res = await runBattleSimulation({
        competitorId: selectedCompId,
        scenarioType: selectedScenario,
        customScenario: selectedScenario === 'CUSTOM' ? customText : null,
        targetSegment
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
      setError(err.message || 'Simulation execution failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handlePushToActionCenter = async (title, desc) => {
    setIsAddingTask(true);
    try {
      await createTask({
        title: `[DEFENSE] ${title}`,
        description: desc,
        priority: 'HIGH',
        category: 'COMPETITOR'
      });
      if (showToast) showToast('Strategy pushed to Action Center as high-priority task!', 'success');
    } catch (err) {
      if (showToast) showToast('Failed to dispatch to Action Center.', 'error');
    } finally {
      setIsAddingTask(false);
    }
  };

  const copySalesScript = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    if (showToast) showToast('Sales dismissal script copied!', 'success');
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const currentComp = competitorsList.find(c => c.id === selectedCompId) || competitorsList[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Swords size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Strategic Scenario & Counter-Move Simulator
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                Game-Theoretic
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Simulate aggressive competitor maneuvers, price cuts, and feature launches before they occur in market.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column: Configuration ── */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Target Rival */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              1. Select Rival Competitor
            </label>
            <select
              value={selectedCompId}
              onChange={e => setSelectedCompId(e.target.value)}
              className="w-full px-4 py-3 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              {competitorsList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.website || 'Direct Threat'})
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Picker */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              2. Select Threat Scenario
            </label>
            <div className="space-y-2">
              {PRESET_SCENARIOS.map(s => {
                const Icon = s.icon;
                const active = selectedScenario === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenario(s.id)}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                      active 
                        ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700 shadow-xs' 
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      active ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${active ? 'text-purple-900 dark:text-purple-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {s.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulation Launcher Button */}
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Simulating Multi-Agent Game Theory...</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>Run Live Battle Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* ── Right Column: Simulation Output ── */}
        <div className="lg:col-span-7 space-y-6">
          {!simulationResult && !isSimulating && (
            <div className="h-full min-h-[420px] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40 dark:bg-slate-900/20">
              <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Swords size={32} />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                Scenario Simulation Idle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                Select a rival and competitive maneuver on the left, then click Run Simulation to project market share shift and calculate defensive counters.
              </p>
            </div>
          )}

          {isSimulating && (
            <div className="h-full min-h-[420px] rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 space-y-4">
              <Loader2 size={40} className="text-purple-600 animate-spin" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Running Autonomous Game-Theoretic Projections...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Evaluating Nash equilibria, cross-elasticity churn, and drafting 7-day tactical playbooks.
              </p>
            </div>
          )}

          {simulationResult && !isSimulating && (
            <div className="space-y-6 animate-fade-in">
              {/* Executive Impact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-rose-500/[0.06] border border-rose-200 dark:border-rose-900/40">
                  <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Threat Risk Level
                  </div>
                  <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                    {simulationResult.riskLevel} ({simulationResult.riskScore} / 100)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {simulationResult.predictedMarketShareImpact}
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-purple-500/[0.06] border border-purple-200 dark:border-purple-900/40">
                  <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target size={14} /> Rival Vulnerability
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 leading-relaxed">
                    "{simulationResult.competitorVulnerability}"
                  </p>
                </div>
              </div>

              {/* Dismissal Script Banner */}
              {simulationResult.salesRepDismissalScript && (
                <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-2 relative shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                      <Sparkles size={13} /> Sales Rep Prospect Dismissal Script
                    </span>
                    <button
                      onClick={() => copySalesScript(simulationResult.salesRepDismissalScript)}
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                    >
                      {copiedScript ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedScript ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs font-medium text-slate-100 italic leading-relaxed">
                    "{simulationResult.salesRepDismissalScript}"
                  </p>
                </div>
              )}

              {/* 7-Day Immediate Counter-Moves */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    7-Day Tactical Counter-Offensive
                  </h4>
                  <button
                    onClick={() => handlePushToActionCenter(
                      `Execute counter against ${currentComp?.name || 'Rival'}`,
                      (simulationResult.immediateCounterMoves || []).join('; ')
                    )}
                    disabled={isAddingTask}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-all border border-purple-200 dark:border-purple-800"
                  >
                    <CheckSquare size={13} /> Push to Action Center
                  </button>
                </div>
                <div className="space-y-2.5">
                  {(simulationResult.immediateCounterMoves || []).map((move, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{move}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 60-Day Strategic Moat */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  60-Day Defensive Moat Initiatives
                </h4>
                <div className="space-y-2">
                  {(simulationResult.sixtyDayStrategicMoat || []).map((moat, i) => (
                    <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                      <ArrowRight size={13} className="text-purple-500 shrink-0 mt-0.5" />
                      <span>{moat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useContext } from 'react';
import { 
  X, Swords, Play, Sparkles, Loader2, AlertCircle, ShieldAlert,
  ArrowRight, Copy, Check, Target, TrendingDown, DollarSign,
  Cpu, Gift, Building2, Code, Plus, CheckSquare
} from 'lucide-react';
import { runBattleSimulation, createTask } from '../api';
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

export default function BattleSimulatorModal({ isOpen, onClose, competitors = [] }) {
  const { showToast, setActiveSection } = useContext(DbContext) || {};

  const [selectedCompId, setSelectedCompId] = useState(competitors[0]?.id || '');
  const [selectedScenario, setSelectedScenario] = useState('PRICE_DROP_20');
  const [customText, setCustomText] = useState('');
  const [targetSegment, setTargetSegment] = useState('Mid-Market & Enterprise');
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

  if (!isOpen) return null;

  const currentComp = competitors.find(c => c.id === selectedCompId) || competitors[0];

  const handleRunSimulation = async () => {
    if (!selectedCompId) {
      setError('Please select a competitor to simulate against.');
      return;
    }

    setIsSimulating(true);
    setError('');
    setSimulationResult(null);

    try {
      const res = await runBattleSimulation({
        competitorId: selectedCompId,
        scenarioType: selectedScenario,
        customScenario: selectedScenario === 'CUSTOM' ? customText : null,
        targetSegment
      });
      setSimulationResult(res);
      if (showToast) showToast('Simulation completed with game-theoretic projection!', 'success');
    } catch (err) {
      console.error('Simulation failed:', err);
      setError(err.message || 'Failed to execute battle simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  const copySalesScript = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    if (showToast) showToast('Sales counter-script copied!', 'success');
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const pushToActionCenter = async () => {
    if (!simulationResult || isAddingTask) return;
    setIsAddingTask(true);
    try {
      await createTask({
        title: `Defend against ${simulationResult.competitorName}: ${simulationResult.scenarioTitle}`,
        description: `Immediate Counter-Measure: ${simulationResult.immediateCounterMeasure}\nMid-term Moat: ${simulationResult.midTermMoatStrategy}`,
        recommendedSteps: simulationResult.immediateCounterMeasure,
        priority: simulationResult.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        category: 'RESPOND_TO_COMPETITOR',
        competitorId: selectedCompId
      });
      if (showToast) showToast('Added tactical counter-action to Action Center!', 'success');
      onClose();
      if (setActiveSection) setActiveSection('action_center');
    } catch (err) {
      console.error('Failed to create task:', err);
      if (showToast) showToast('Failed to add to Action Center', 'error');
    } finally {
      setIsAddingTask(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl w-[94vw] max-h-[92vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-purple-50/50 via-blue-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600/10 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Swords size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Strategic Scenario Simulator
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Game Theory
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Simulate "what-if" competitive market moves, project market share shifts, and generate strategic defense playbooks
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Controls Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Competitor Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Target Competitor
              </label>
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              >
                {competitors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.competitiveScore ? `(Threat Score: ${c.competitiveScore})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Segment */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Contested Segment
              </label>
              <select
                value={targetSegment}
                onChange={(e) => setTargetSegment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Mid-Market & Enterprise">Mid-Market & Enterprise ($20k+ ARR)</option>
                <option value="SMB & Startups">SMB & Fast-Growth Startups</option>
                <option value="Self-Serve Developers">Self-Serve Developers & Open Source</option>
                <option value="Global Key Accounts">Global Enterprise Key Accounts</option>
              </select>
            </div>
          </div>

          {/* Scenario Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Select What-If Market Scenario
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PRESET_SCENARIOS.map(s => {
                const Icon = s.icon;
                const isSelected = selectedScenario === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScenario(s.id)}
                    className={`text-left p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/30'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        <Icon size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {s.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {s.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Run Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400 font-medium">
              Simulates game-theoretic payoff matrix using Groq Autonomous Engine
            </span>
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Simulating Game Dynamics...
                </>
              ) : (
                <>
                  <Play size={16} className="fill-white" /> Run Scenario Simulation
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Simulation Output Card */}
          {simulationResult && (
            <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
              
              {/* Risk & Impact Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-rose-500/10 border border-purple-200 dark:border-purple-900/40 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Risk Severity</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-xl font-black ${
                      simulationResult.riskLevel === 'CRITICAL' ? 'text-rose-600 dark:text-rose-400' : 'text-purple-600 dark:text-purple-400'
                    }`}>
                      {simulationResult.riskLevel}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                      Score: {simulationResult.riskScore}/100
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Projected 6M Impact</span>
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
                    {simulationResult.projectedMarketShareImpact}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Rival Vulnerability</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    {simulationResult.competitorVulnerability}
                  </p>
                </div>
              </div>

              {/* Dynamic Timeline Progression */}
              {simulationResult.timelineForecast && simulationResult.timelineForecast.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingDown size={14} className="text-purple-500" /> Market Dynamics Progression Timeline
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {simulationResult.timelineForecast.map((p, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500">{p.phase}</span>
                          <span className={p.marketImpact >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                            {p.marketImpact > 0 ? `+${p.marketImpact}%` : `${p.marketImpact}%`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                          {p.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Two Column Strategy Playbook */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Immediate Counter-Measure */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Immediate Action (Days 1–7)
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {simulationResult.immediateCounterMeasure}
                  </p>
                </div>

                {/* Mid-term Moat Strategy */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target size={14} /> Mid-Term Moat Fortification (Days 30–60)
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {simulationResult.midTermMoatStrategy}
                  </p>
                </div>
              </div>

              {/* Sales Rep Word-for-Word Objection Killer */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} /> Sales Rep Word-for-Word Objection Killer
                  </span>
                  <button
                    onClick={() => copySalesScript(simulationResult.salesRepPlaybook)}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 flex items-center gap-1"
                  >
                    {copiedScript ? <Check size={12} /> : <Copy size={12} />}
                    {copiedScript ? 'Copied' : 'Copy Script'}
                  </button>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 italic leading-relaxed">
                  "{simulationResult.salesRepPlaybook}"
                </p>
              </div>

              {/* Operationalize Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={pushToActionCenter}
                  disabled={isAddingTask}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isAddingTask ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckSquare size={14} />
                  )}
                  Push to Action Center (Assign to Team)
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <span>Powered by Aetheris Game-Theoretic Simulation Engine</span>
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

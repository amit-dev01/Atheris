import { useState, useEffect } from 'react';
import { 
  X, Columns, Loader2, AlertCircle, Building2, Globe, 
  TrendingUp, Award, Layers, ShieldCheck, DollarSign,
  Printer, Check, ExternalLink, Zap
} from 'lucide-react';
import { getSideBySideComparison } from '../api';

export default function SideBySideComparisonModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    setError('');

    async function fetchData() {
      try {
        const res = await getSideBySideComparison();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load comparison:', err);
        if (isMounted) setError(err.message || 'Failed to aggregate comparison matrix.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const home = data?.homeCompany || {
    name: 'Our Company',
    companySize: '25-50',
    location: 'Global',
    monthlyTraffic: '120K',
    domainAuthority: 62,
    techStack: ['Next.js', 'React', 'Tailwind', 'FastAPI', 'Stripe'],
    financialHealth: 'A'
  };

  const competitors = data?.competitors || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/50 dark:from-blue-950/20 dark:via-slate-900 dark:to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Columns size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Side-by-Side Competitor Comparison Matrix
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Benchmarking
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Head-to-head comparison of web traffic, tech stack, funding, and positioning metrics
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Print comparison table"
            >
              <Printer size={16} /> <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {loading && (
            <div className="py-16 text-center space-y-4">
              <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Scanning competitor tech stacks, SEO traffic, and financial fundamentals...
              </p>
            </div>
          )}

          {error && (
            <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-center space-y-2">
              <AlertCircle size={32} className="text-red-500 mx-auto" />
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{error}</h4>
            </div>
          )}

          {data && !loading && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-4 font-bold text-slate-400 uppercase tracking-wider w-48 bg-slate-50/50 dark:bg-slate-800/30 rounded-l-2xl">
                      Dimension
                    </th>
                    {/* Home Team Column */}
                    <th className="py-4 px-4 font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30 border-x border-blue-200 dark:border-blue-900/50 min-w-48 text-sm">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={16} />
                        <span>{home.name} (You)</span>
                      </div>
                    </th>
                    {/* Competitor Columns */}
                    {competitors.map(c => (
                      <th key={c.id} className="py-4 px-4 font-extrabold text-slate-900 dark:text-white min-w-48 text-sm">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{c.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {c.type}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Row: Threat Score */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">Threat Overlap</td>
                    <td className="py-3.5 px-4 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-100 dark:border-blue-900/30 font-bold text-blue-600">Home Baseline</td>
                    {competitors.map(c => (
                      <td key={c.id} className="py-3.5 px-4">
                        <span className="font-black text-slate-900 dark:text-white">{c.threatScore}/100</span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Monthly Traffic */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">Est. Monthly Traffic</td>
                    <td className="py-3.5 px-4 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-100 dark:border-blue-900/30 font-bold text-slate-800 dark:text-slate-200">{home.monthlyTraffic} visits/mo</td>
                    {competitors.map(c => (
                      <td key={c.id} className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {c.monthlyTraffic} visits/mo
                      </td>
                    ))}
                  </tr>

                  {/* Row: SEO Domain Authority */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">SEO Domain Authority</td>
                    <td className="py-3.5 px-4 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-100 dark:border-blue-900/30 font-bold text-slate-800 dark:text-slate-200">{home.domainAuthority} / 100</td>
                    {competitors.map(c => (
                      <td key={c.id} className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {c.domainAuthority} / 100
                      </td>
                    ))}
                  </tr>

                  {/* Row: Total Funding / Valuation */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">Funding / Valuation</td>
                    <td className="py-3.5 px-4 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-100 dark:border-blue-900/30 font-semibold text-slate-700 dark:text-slate-300">Growth Stage</td>
                    {competitors.map(c => (
                      <td key={c.id} className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {c.totalFunding}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Team Size */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">Team Size</td>
                    <td className="py-3.5 px-4 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-100 dark:border-blue-900/30 font-semibold text-slate-700 dark:text-slate-300">{home.companySize}</td>
                    {competitors.map(c => (
                      <td key={c.id} className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {c.companySize}
                      </td>
                    ))}
                  </tr>

                  {/* Row: HQ Location */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">HQ Location</td>
                    <td className="py-3.5 px-4 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-100 dark:border-blue-900/30 font-semibold text-slate-700 dark:text-slate-300">{home.location}</td>
                    {competitors.map(c => (
                      <td key={c.id} className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {c.location}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Detected Tech Stack */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">Tech Stack (BuiltWith)</td>
                    <td className="py-3.5 px-4 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-100 dark:border-blue-900/30">
                      <div className="flex flex-wrap gap-1">
                        {home.techStack.map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    {competitors.map(c => (
                      <td key={c.id} className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {c.techStack.map((t, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Financial Health Grade */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">Financial Health Grade</td>
                    <td className="py-3.5 px-4 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-100 dark:border-blue-900/30 font-black text-emerald-600">{home.financialHealth}</td>
                    {competitors.map(c => (
                      <td key={c.id} className="py-3.5 px-4">
                        <span className="font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                          {c.financialHealth}
                        </span>
                      </td>
                    ))}
                  </tr>

                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <span>Benchmarked via BuiltWith & SimilarWeb Automated Heuristics</span>
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

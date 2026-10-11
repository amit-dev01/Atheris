import { useState } from 'react';
import { 
  X, Check, AlertCircle, DollarSign, Trophy, 
  ThumbsDown, Minus, Building2, User, FileText, Loader2, Sparkles
} from 'lucide-react';
import { recordDealOutcome } from '../api';

const REASON_OPTIONS = [
  { id: 'FEATURE_GAP', label: 'Feature Gap (Missing Capability)' },
  { id: 'PRICING', label: 'Pricing (Competitor Cheaper / Discounted)' },
  { id: 'BRAND_REPUTATION', label: 'Brand Trust & Market Presence' },
  { id: 'RELATIONSHIP', label: 'Existing Executive / Partner Relationship' },
  { id: 'SECURITY_COMPLIANCE', label: 'Security & Enterprise Compliance (SOC2/HIPAA)' },
  { id: 'EASE_OF_USE', label: 'Usability & Ease of Implementation' },
  { id: 'SUPPORT_QUALITY', label: 'Support Quality & SLA Guarantees' },
];

export default function WinLossModal({ isOpen, onClose, competitors = [], onSuccess, showToast }) {
  const [outcome, setOutcome] = useState('WON'); // WON, LOST, TIED
  const [competitorId, setCompetitorId] = useState(competitors[0]?.id || '');
  const [dealValue, setDealValue] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [primaryReason, setPrimaryReason] = useState('FEATURE_GAP');
  const [competitorStrength, setCompetitorStrength] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!competitorId) {
      setError('Please select a competitor.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await recordDealOutcome({
        competitorId,
        outcome,
        dealValue: dealValue ? parseFloat(dealValue) : 0.0,
        prospectName: prospectName.trim() || 'Enterprise Prospect',
        primaryReason,
        competitorStrength: competitorStrength.trim(),
        notes: notes.trim(),
      });

      if (showToast) {
        showToast(`Deal outcome logged as ${outcome}!`, 'success');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to log deal outcome:', err);
      setError(err.message || 'Failed to record deal outcome.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Log Deal Outcome
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track win/loss records and identify root sales friction points.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Outcome Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Deal Outcome
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'WON', label: 'Won Deal', icon: Trophy, activeStyle: 'bg-emerald-600 text-white border-emerald-600' },
                { id: 'LOST', label: 'Lost Deal', icon: ThumbsDown, activeStyle: 'bg-rose-600 text-white border-rose-600' },
                { id: 'TIED', label: 'Tied / No Decision', icon: Minus, activeStyle: 'bg-amber-600 text-white border-amber-600' },
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = outcome === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOutcome(opt.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? opt.activeStyle + ' shadow-sm scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Competitor & Deal Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Against Competitor *
              </label>
              <select
                value={competitorId}
                onChange={e => setCompetitorId(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">Select Competitor...</option>
                {competitors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.companyName || 'Competitor'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Deal Annual Value ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">$</span>
                <input
                  type="number"
                  placeholder="25000"
                  value={dealValue}
                  onChange={e => setDealValue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Prospect Name & Primary Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Prospect / Account Name
              </label>
              <input
                type="text"
                placeholder="Acme Enterprise Corp"
                value={prospectName}
                onChange={e => setProspectName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Driver / Reason
              </label>
              <select
                value={primaryReason}
                onChange={e => setPrimaryReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {REASON_OPTIONS.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Competitor Pitch / Strength */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Competitor Pitch / Notable Advantage
            </label>
            <input
              type="text"
              placeholder="e.g., Bundled free with their existing CRM contract"
              value={competitorStrength}
              onChange={e => setCompetitorStrength(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Sales Call Notes & Feedback
            </label>
            <textarea
              rows={2}
              placeholder="Key prospect quotes or objection context..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs md:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Record Deal
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

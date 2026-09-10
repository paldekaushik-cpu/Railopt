import { useState } from 'react';
import { AiRecommendation } from '../types';
import { firestoreService } from '../firebase/firestoreService';
import { Sparkles, CheckCircle, Clock, AlertTriangle, ShieldCheck, Check, Layers, ArrowRight } from 'lucide-react';

interface AiRecommendationsPageProps {
  recommendations: AiRecommendation[];
  onRefresh?: () => void;
}

export function AiRecommendationsPage({ recommendations }: AiRecommendationsPageProps) {
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const handleApply = async (rec: AiRecommendation) => {
    setApplyingId(rec.recommendationId);
    setAppliedNotification(null);
    try {
      await firestoreService.applyRecommendation(rec);
      setAppliedNotification(`Recommendation ${rec.recommendationId} applied! Associated block plan saved to Firestore.`);
    } catch (err) {
      console.error('Error applying recommendation:', err);
    } finally {
      setApplyingId(null);
    }
  };

  const handleDismiss = async (recId: string) => {
    try {
      await firestoreService.dismissRecommendation(recId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              Explainable AI Intelligence
            </span>
            <span className="text-xs text-slate-500 font-mono">Cross-Department Synthesizer</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Proactive AI Corridor Recommendations</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Actionable optimization insights synthesized from multi-department job backlogs, asset health conditions, and live train timetables.
          </p>
        </div>
      </div>

      {/* Applied Notification Banner */}
      {appliedNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2 shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{appliedNotification}</span>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map(rec => {
          const isApplied = rec.status === 'Applied';
          const isDismissed = rec.status === 'Dismissed';

          const iconMap = {
            Bundling: Layers,
            Prioritization: AlertTriangle,
            Rescheduling: Clock,
            ConflictAvoidance: ShieldCheck
          }[rec.type] || Sparkles;
          const Icon = iconMap;

          return (
            <div
              key={rec.recommendationId}
              className={`p-5 rounded-xl border bg-white shadow-sm flex flex-col justify-between transition-all ${
                isApplied
                  ? 'border-emerald-300 bg-emerald-50/20 opacity-90'
                  : isDismissed
                  ? 'border-slate-200 opacity-60 bg-slate-50'
                  : 'border-slate-200 hover:border-blue-400'
              }`}
            >
              <div className="space-y-3">
                {/* Badge & Type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-900">{rec.recommendationId}</span>
                      <span className="ml-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Section {rec.section}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      isApplied
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isDismissed
                        ? 'bg-slate-200 text-slate-600 border-slate-300'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {rec.title}
                </h3>

                {/* Reason Banner */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Decision Rationale:</strong>
                  {rec.reason}
                </div>

                {/* Key Bullet Points */}
                {rec.keyPoints && rec.keyPoints.length > 0 && (
                  <div className="space-y-1 text-xs text-slate-600">
                    {rec.keyPoints.map((pt, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Impact Metrics Row */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-2 rounded bg-blue-50/60 border border-blue-100">
                    <span className="text-[10px] text-slate-500 block">Recommended Window</span>
                    <span className="font-mono font-bold text-blue-900">{rec.recommendedTime}</span>
                  </div>
                  <div className="p-2 rounded bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block">Corridor Savings</span>
                    <span className="font-bold text-emerald-800">
                      {rec.hoursSaved ? `${rec.hoursSaved} hrs saved` : `+${rec.assetAvailabilityGain || 2.4}% availability`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {!isApplied && !isDismissed && (
                  <>
                    <button
                      onClick={() => handleDismiss(rec.recommendationId)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium rounded hover:bg-slate-100 transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleApply(rec)}
                      disabled={applyingId === rec.recommendationId}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <span>{applyingId === rec.recommendationId ? 'Applying to Firestore...' : 'Apply Recommendation'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {isApplied && (
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Applied to Active Corridor Block Plan</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

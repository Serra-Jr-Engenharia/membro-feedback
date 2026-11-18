import { FaStar } from "react-icons/fa";
import {
  formatCycleRange,
  formatDate,
  type SelfEvaluationRecord,
} from "../utils/selfEvaluation";

interface ViewSelfEvaluationModalProps {
  evaluation: SelfEvaluationRecord;
  onClose: () => void;
}

const QUESTIONS = [
  { key: "rating_rendimento", label: "Rendimento" },
  { key: "rating_entregas", label: "Entregas" },
  { key: "rating_consistencia", label: "Consistência" },
] as const;

function ReadOnlyStars({ value }: { value: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          className={star <= value ? "text-accent-500" : "text-brand-600"}
        />
      ))}
    </div>
  );
}

export default function ViewSelfEvaluationModal({
  evaluation,
  onClose,
}: ViewSelfEvaluationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-azulClaroBorder/30 bg-azulEscuroCard font-poppins text-gray-200 shadow-2xl">
        <header className="relative shrink-0 border-b border-white/10 bg-azulEscuroPage p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
          >
            ✕
          </button>
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Autoavaliação
          </span>
          <h2 className="mt-1 text-xl font-bold text-white">
            {formatCycleRange(evaluation.week_of)}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Registrada em {formatDate(evaluation.created_at)}
          </p>
        </header>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
            {QUESTIONS.map((question) => (
              <div
                key={question.key}
                className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0"
              >
                <span className="text-sm font-medium text-gray-300">
                  {question.label}
                </span>
                <ReadOnlyStars value={evaluation[question.key]} />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">
              O que poderia ter sido melhor?
            </h3>
            <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-azulEscuroPage/70 p-4 text-sm text-gray-300">
              {evaluation.rating_melhoria || "Não informado."}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">
              O que ajudou ou atrapalhou?
            </h3>
            <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-azulEscuroPage/70 p-4 text-sm text-gray-300">
              {evaluation.rating_fatores || "Não informado."}
            </p>
          </div>

          {evaluation.comments && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                Comentários adicionais
              </h3>
              <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-azulEscuroPage/70 p-4 text-sm text-gray-300">
                {evaluation.comments}
              </p>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 justify-end border-t border-white/10 bg-azulEscuroPage p-4">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-white/15 px-6 py-2.5 font-semibold text-white transition-colors hover:border-accent-500 hover:text-accent-500"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}

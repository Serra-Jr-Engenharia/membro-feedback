import type { ReactNode } from "react";
import ActionButton from "./ui/ActionButton";
import StatusBadge, { type StatusTone } from "./ui/StatusBadge";

export type SelfEvaluationState = "done" | "draft" | "pending" | "loading";

export interface SelfEvaluationInfo {
  state: SelfEvaluationState;
  detailLabel?: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}

interface StatusEvaluationProps {
  cycleLabel: string;
  selfEvaluation: SelfEvaluationInfo;
  children?: ReactNode;
  footer?: ReactNode;
}

const selfEvaluationTone: Record<
  SelfEvaluationState,
  { tone: StatusTone; label: string }
> = {
  done: { tone: "success", label: "Concluída" },
  draft: { tone: "info", label: "Rascunho salvo" },
  pending: { tone: "warning", label: "Pendente" },
  loading: { tone: "neutral", label: "Verificando..." },
};

export default function StatusEvaluation({
  cycleLabel,
  selfEvaluation,
  children,
  footer,
}: StatusEvaluationProps) {
  const tone = selfEvaluationTone[selfEvaluation.state];
  const canAct = !selfEvaluation.disabled;

  return (
    <section
      aria-label="Status das avaliações"
      className="w-full rounded-3xl border border-white/10 bg-azulEscuroCard/80 p-6 shadow-xl backdrop-blur sm:p-8"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
          Resumo do ciclo
        </span>
        <h2 className="text-xl font-bold text-white">Ciclo atual</h2>
        <p className="text-sm text-brand-200">{cycleLabel}</p>
      </div>

      {children && <div className="mt-5">{children}</div>}

      <div className={children ? "mt-6 border-t border-white/10 pt-5" : "mt-5"}>
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-white">
                Autoavaliação
              </h3>
              <StatusBadge tone={tone.tone}>{tone.label}</StatusBadge>
            </div>
            {selfEvaluation.detailLabel && (
              <p className="text-xs text-gray-400">
                {selfEvaluation.detailLabel}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <ActionButton
              variant={selfEvaluation.state === "done" ? "secondary" : "primary"}
              onClick={selfEvaluation.onAction}
              disabled={!canAct}
            >
              {selfEvaluation.actionLabel}
            </ActionButton>
          </div>
        </div>
      </div>

      {footer && (
        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
          {footer}
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import StarRating from "./StarRating";

export interface SelfEvaluationFormData {
  rating_rendimento: number;
  rating_entregas: number;
  rating_consistencia: number;
  rating_melhoria: string;
  rating_fatores: string;
  comments?: string;
}

interface SelfEvaluationDraft {
  formData: Partial<SelfEvaluationFormData>;
  comments: string;
}

function getDraftKey(userName: string) {
  return `draft_self_eval_${userName}`;
}

function readDraft(userName: string): SelfEvaluationDraft | null {
  try {
    const raw = localStorage.getItem(getDraftKey(userName));
    return raw ? (JSON.parse(raw) as SelfEvaluationDraft) : null;
  } catch (e) {
    console.error("Erro ao carregar rascunho da autoavaliação", e);
    return null;
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

interface SelfEvaluationQuestion {
  key: keyof Omit<SelfEvaluationFormData, "comments">;
  label: string;
  category: "Estado" | "Trajetória" | "Performance";
  type: "rating" | "text";
}

const QUESTIONS: SelfEvaluationQuestion[] = [
  { key: "rating_rendimento", label: "Você sente que está rendendo o que consegue hoje?", category: "Estado", type: "rating" },
  { key: "rating_entregas", label: "Como você avalia suas entregas nas últimas semanas?", category: "Trajetória", type: "rating" },
  { key: "rating_consistencia", label: "Você sente que está sendo consistente?", category: "Trajetória", type: "rating" },
  { key: "rating_melhoria", label: "Teve algo que você sente que poderia ter feito melhor?", category: "Performance", type: "text" },
  { key: "rating_fatores", label: "O que tem te ajudado ou atrapalhado na sua performance?", category: "Performance", type: "text" },
];

type SelfEvaluationModalProps = {
  userName: string;
  onClose: () => void;
  onSubmit: (data: SelfEvaluationFormData) => void | Promise<void>;
  initialData?: SelfEvaluationFormData;
};

export default function SelfEvaluationModal({
  userName,
  onClose,
  onSubmit,
  initialData,
}: SelfEvaluationModalProps) {
  const [restoredDraft] = useState(() => readDraft(userName));

  const [formData, setFormData] = useState<Partial<SelfEvaluationFormData>>(() =>
    restoredDraft?.formData
      ? restoredDraft.formData
      : initialData
        ? {
            rating_rendimento: initialData.rating_rendimento,
            rating_entregas: initialData.rating_entregas,
            rating_consistencia: initialData.rating_consistencia,
            rating_melhoria: initialData.rating_melhoria,
            rating_fatores: initialData.rating_fatores,
          }
        : {}
  );
  const [comments, setComments] = useState(
    restoredDraft?.comments ?? initialData?.comments ?? ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      getDraftKey(userName),
      JSON.stringify({ formData, comments })
    );
  }, [formData, comments, userName]);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleNextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      return;
    }

    const missing = QUESTIONS.filter((q) => !formData[q.key]);
    if (missing.length > 0) {
      alert("Responda todas as perguntas antes de salvar.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        rating_rendimento: formData.rating_rendimento as number,
        rating_entregas: formData.rating_entregas as number,
        rating_consistencia: formData.rating_consistencia as number,
        rating_melhoria: formData.rating_melhoria as string,
        rating_fatores: formData.rating_fatores as string,
        comments: comments.trim() || undefined,
      });
      localStorage.removeItem(getDraftKey(userName));
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      alert("Erro ao salvar autoavaliação: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md transition-opacity">
      <div className="flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-azulEscuroCard font-poppins text-gray-200 shadow-2xl">
        <header className="relative shrink-0 border-b border-white/10 bg-azulEscuroPage p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
          >
            ✕
          </button>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-brand-800 text-sm font-semibold text-cyan-400">
              {getInitials(userName)}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {userName}
              </h2>
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Autoavaliação
              </span>
              <span className="text-[10px] text-gray-500">
                Rascunho salvo automaticamente
              </span>
            </div>
          </div>

          <div className="relative mt-6 flex items-center justify-between">
            <div className="absolute left-0 right-0 top-1/2 -z-10 h-0.5 bg-white/10"></div>
            <div
              className="absolute left-0 top-1/2 -z-10 h-0.5 bg-accent-500 transition-all duration-300 ease-in-out"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setCurrentStep(step)}
                className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-xs font-bold shadow-lg ring-4 ring-azulEscuroPage transition-all duration-300 ${
                  currentStep >= step
                    ? "bg-accent-500 text-white"
                    : "bg-white/5 text-brand-300"
                }`}
              >
                {step}
              </button>
            ))}
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
          <form id="selfEvaluationForm" onSubmit={handleSubmit} className="h-full space-y-6">
            <div className={`h-full flex-col transition-all duration-300 ${currentStep === 1 ? "flex animate-fade-in" : "hidden"}`}>
              <h3 className="mb-4 border-l-4 border-cyan-400 pl-3 text-lg font-semibold text-white">
                Avaliação Contínua
              </h3>
              <div className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-5">
                {QUESTIONS.filter((q) => q.type === "rating").map((q) => (
                  <div key={q.key} className="flex flex-col gap-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <label className="font-medium leading-snug text-gray-300">
                      {q.label}
                    </label>
                    <div className="flex justify-start pt-1">
                      <StarRating
                        rating={(formData[q.key] as number) || 0}
                        setRating={(value) =>
                          setFormData((prev) => ({ ...prev, [q.key]: value }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`h-full flex-col transition-all duration-300 ${currentStep === 2 ? "flex animate-fade-in" : "hidden"}`}>
              <h3 className="mb-4 border-l-4 border-accent-500 pl-3 text-lg font-semibold text-white">
                Reflexão Prática
              </h3>
              <div className="space-y-5">
                {QUESTIONS.filter((q) => q.type === "text").map((q) => (
                  <div key={q.key} className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-200">
                      {q.label}
                    </label>
                    <textarea
                      value={(formData[q.key] as string) || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [q.key]: e.target.value }))
                      }
                      className="w-full resize-none rounded-xl border border-white/10 bg-brand-950/60 p-4 text-white placeholder-gray-600 outline-none transition-all focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                      rows={3}
                      placeholder="Descreva em detalhes..."
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={`h-full flex-col transition-all duration-300 ${currentStep === 3 ? "flex animate-fade-in" : "hidden"}`}>
              <h3 className="mb-4 border-l-4 border-success pl-3 text-lg font-semibold text-white">
                Espaço Aberto
              </h3>
              <div className="flex h-full flex-1 flex-col">
                <label className="mb-2 font-medium text-gray-300">
                  Comentários Adicionais (Opcional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="min-h-37.5 w-full flex-1 resize-none rounded-xl border border-white/10 bg-brand-950/60 p-4 text-white placeholder-gray-600 outline-none transition-all focus:border-success focus:ring-1 focus:ring-success"
                  placeholder="Existe algo mais que você gostaria de compartilhar com a diretoria ou relatar sobre seu momento atual?"
                />
              </div>
            </div>
          </form>
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-white/10 bg-azulEscuroPage p-4">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handlePrevStep}
            className="cursor-pointer px-5 py-2.5 font-medium text-gray-400 transition-colors hover:text-white"
          >
            {currentStep === 1 ? "Cancelar" : "← Voltar"}
          </button>

          {currentStep < totalSteps ? (
            <button
              key="next-step-btn"
              type="button"
              onClick={handleNextStep}
              className="cursor-pointer rounded-lg border border-white/15 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:border-cyan-400 hover:text-cyan-300"
            >
              Próximo Passo
            </button>
          ) : (
            <button
              key="submit-self-eval-btn"
              type="submit"
              form="selfEvaluationForm"
              disabled={loading}
              className="cursor-pointer rounded-lg bg-accent-500 px-8 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Finalizar"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

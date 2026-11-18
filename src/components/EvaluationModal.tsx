import { useState, useEffect } from "react";
import StarRating from "./StarRating";

export interface EvaluationFormData {
  rating_comunicacao: number;
  rating_proatividade: number;
  comments: string;

  rating_participacao?: number;
  rating_relacao_grupo?: number;
  rating_entrega_metas?: number;
  is_destaque?: boolean;

  rating_lideranca?: number;
  rating_flexibilidade?: number;
  text_delegacao?: string;
}

type EvaluationModalProps = {
  memberName: string;
  evaluationType: "member" | "director";
  onClose: () => void;
  onSubmit: (formData: EvaluationFormData) => void;
  initialData?: EvaluationFormData;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function EvaluationModal({
  memberName,
  evaluationType,
  onClose,
  onSubmit,
  initialData,
}: EvaluationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [comunicacao, setComunicacao] = useState(initialData?.rating_comunicacao || 0);
  const [proatividade, setProatividade] = useState(initialData?.rating_proatividade || 0);
  const [comments, setComments] = useState(initialData?.comments || "");

  const [participacao, setParticipacao] = useState(initialData?.rating_participacao || 0);
  const [relacao, setRelacao] = useState(initialData?.rating_relacao_grupo || 0);
  const [metas, setMetas] = useState(initialData?.rating_entrega_metas || 0);
  const [isDestaque, setIsDestaque] = useState(initialData?.is_destaque || false);

  const [lideranca, setLideranca] = useState(initialData?.rating_lideranca || 0);
  const [flexibilidade, setFlexibilidade] = useState(initialData?.rating_flexibilidade || 0);
  const [delegacao, setDelegacao] = useState(initialData?.text_delegacao || "Alguns");

  useEffect(() => {
    const draftStr = localStorage.getItem(`draft_eval_${memberName}`);
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (draft.rating_comunicacao !== undefined) setComunicacao(draft.rating_comunicacao);
        if (draft.rating_proatividade !== undefined) setProatividade(draft.rating_proatividade);
        if (draft.comments !== undefined) setComments(draft.comments);
        if (draft.rating_participacao !== undefined) setParticipacao(draft.rating_participacao);
        if (draft.rating_relacao_grupo !== undefined) setRelacao(draft.rating_relacao_grupo);
        if (draft.rating_entrega_metas !== undefined) setMetas(draft.rating_entrega_metas);
        if (draft.is_destaque !== undefined) setIsDestaque(draft.is_destaque);
        if (draft.rating_lideranca !== undefined) setLideranca(draft.rating_lideranca);
        if (draft.rating_flexibilidade !== undefined) setFlexibilidade(draft.rating_flexibilidade);
        if (draft.text_delegacao !== undefined) setDelegacao(draft.text_delegacao);
      } catch (e) {
        console.error("Erro ao carregar rascunho", e);
      }
    }
  }, [memberName]);

  useEffect(() => {
    const draft = {
      rating_comunicacao: comunicacao,
      rating_proatividade: proatividade,
      comments: comments,
      rating_participacao: participacao,
      rating_relacao_grupo: relacao,
      rating_entrega_metas: metas,
      is_destaque: isDestaque,
      rating_lideranca: lideranca,
      rating_flexibilidade: flexibilidade,
      text_delegacao: delegacao,
    };
    localStorage.setItem(`draft_eval_${memberName}`, JSON.stringify(draft));
  }, [comunicacao, proatividade, comments, participacao, relacao, metas, isDestaque, lideranca, flexibilidade, delegacao, memberName]);

  const handleNextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      return;
    }

    const formData: EvaluationFormData = {
      rating_comunicacao: comunicacao,
      rating_proatividade: proatividade,
      comments: comments,
      ...(evaluationType === "member"
        ? {
            rating_participacao: participacao,
            rating_relacao_grupo: relacao,
            rating_entrega_metas: metas,
            is_destaque: isDestaque,
          }
        : {
            rating_lideranca: lideranca,
            rating_flexibilidade: flexibilidade,
            text_delegacao: delegacao,
          }),
    };

    localStorage.removeItem(`draft_eval_${memberName}`);
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
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
              {getInitials(memberName)}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {memberName}
              </h2>
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-500">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                {evaluationType === "member"
                  ? "Avaliação de Membro"
                  : "Avaliação de Liderança"}
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
          <form id="evaluationForm" onSubmit={handleSubmit} className="space-y-6">
            <div className={`transition-all duration-300 ${currentStep === 1 ? "block animate-fade-in" : "hidden"}`}>
              <h3 className="mb-4 border-l-4 border-cyan-400 pl-3 text-lg font-semibold text-white">
                Competências Base
              </h3>
              <div className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <label className="font-medium text-gray-300">Comunicação</label>
                  <StarRating rating={comunicacao} setRating={setComunicacao} />
                </div>
                <div className="flex flex-col justify-between gap-3 border-t border-white/5 pt-2 sm:flex-row sm:items-center">
                  <label className="font-medium text-gray-300">Proatividade</label>
                  <StarRating rating={proatividade} setRating={setProatividade} />
                </div>
              </div>
            </div>

            <div className={`transition-all duration-300 ${currentStep === 2 ? "block animate-fade-in" : "hidden"}`}>
              <h3 className="mb-4 border-l-4 border-accent-500 pl-3 text-lg font-semibold text-white">
                Desempenho Específico
              </h3>
              <div className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-5">
                {evaluationType === "member" ? (
                  <>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <label className="font-medium text-gray-300">Participação</label>
                      <StarRating rating={participacao} setRating={setParticipacao} />
                    </div>
                    <div className="flex flex-col justify-between gap-3 border-t border-white/5 pt-2 sm:flex-row sm:items-center">
                      <label className="font-medium text-gray-300">Relação com grupo</label>
                      <StarRating rating={relacao} setRating={setRelacao} />
                    </div>
                    <div className="flex flex-col justify-between gap-3 border-t border-white/5 pt-2 sm:flex-row sm:items-center">
                      <label className="font-medium text-gray-300">Entrega de metas</label>
                      <StarRating rating={metas} setRating={setMetas} />
                    </div>

                    <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
                      <div>
                        <label className="block font-medium text-gray-200">Membro Destaque?</label>
                        <span className="text-xs text-gray-500">
                          Indicaria essa pessoa pelo esforço excepcional?
                        </span>
                      </div>
                      <div className="flex rounded-lg bg-white/5 p-1">
                        <button
                          type="button"
                          onClick={() => setIsDestaque(true)}
                          className={`cursor-pointer rounded-md px-5 py-1.5 text-sm font-medium transition-all ${
                            isDestaque
                              ? "bg-accent-500 text-white shadow-md"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDestaque(false)}
                          className={`cursor-pointer rounded-md px-5 py-1.5 text-sm font-medium transition-all ${
                            !isDestaque
                              ? "bg-white/10 text-white shadow-md"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <label className="font-medium text-gray-300">Liderança</label>
                      <StarRating rating={lideranca} setRating={setLideranca} />
                    </div>
                    <div className="flex flex-col justify-between gap-3 border-t border-white/5 pt-2 sm:flex-row sm:items-center">
                      <label className="font-medium text-gray-300">Flexibilidade</label>
                      <StarRating rating={flexibilidade} setRating={setFlexibilidade} />
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <label className="mb-3 block font-medium text-gray-200">
                        Como delega atividades?
                      </label>
                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/5 p-1">
                        {["Todos", "Alguns", "Nenhum"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setDelegacao(opt)}
                            className={`rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                              delegacao === opt
                                ? "bg-accent-500 text-white shadow-md"
                                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={`h-full flex-col transition-all duration-300 ${currentStep === 3 ? "flex animate-fade-in" : "hidden"}`}>
              <h3 className="mb-4 border-l-4 border-success pl-3 text-lg font-semibold text-white">
                Parecer Final
              </h3>
              <div className="flex flex-1 flex-col">
                <label className="mb-2 text-sm font-medium text-gray-300">
                  Comentários e Feedbacks Adicionais
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="min-h-37.5 w-full flex-1 resize-none rounded-xl border border-white/10 bg-brand-950/60 p-4 text-white placeholder-gray-600 outline-none transition-all focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                  placeholder="Deixe um feedback construtivo detalhando os pontos fortes e os pontos a melhorar..."
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
              key="submit-eval-btn"
              type="submit"
              form="evaluationForm"
              className="cursor-pointer rounded-lg bg-accent-500 px-8 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-accent-600"
            >
              Finalizar Avaliação
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import StarRating from "./StarRating";
import userIcon from "../assets/userIcon.svg";

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
  evaluationType: 'member' | 'director';
  onClose: () => void;
  onSubmit: (formData: EvaluationFormData) => void;
  initialData?: EvaluationFormData;
};

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
    
    const formData: EvaluationFormData = {
      rating_comunicacao: comunicacao,
      rating_proatividade: proatividade,
      comments: comments,
      ...(evaluationType === 'member' ? {
        rating_participacao: participacao,
        rating_relacao_grupo: relacao,
        rating_entrega_metas: metas,
        is_destaque: isDestaque,
      } : {
        rating_lideranca: lideranca,
        rating_flexibilidade: flexibilidade,
        text_delegacao: delegacao,
      })
    };

    localStorage.removeItem(`draft_eval_${memberName}`);
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div className="font-poppins bg-azulEscuroCard text-gray-200 rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col border border-azulClaroBorder/30 overflow-hidden">
        
        {/* Cabecalho do Modal e Indicador de Progresso */}
        <header className="p-6 bg-azulEscuroPage border-b border-[#001A33] shrink-0 relative">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer p-2 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Fechar"
            >
                ✕
            </button>
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#001A33] border border-azulClaroBorder/30 flex items-center justify-center p-2 shadow-[0_0_15px_rgba(13,180,224,0.1)]">
                    <img src={userIcon} alt="Ícone" className="w-full h-full object-contain" />
                </div>
                <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{memberName}</h2>
                <span className="text-xs text-laranja uppercase tracking-widest font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-laranja"></span>
                    {evaluationType === 'member' ? 'Avaliação de Membro' : 'Avaliação de Liderança'}
                </span>
                </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex justify-between items-center relative mt-6">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#001A33] -z-10"></div>
                <div 
                    className="absolute left-0 top-1/2 h-0.5 bg-azulClaroCheck -z-10 transition-all duration-300 ease-in-out" 
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                ></div>
                {[1, 2, 3].map((step) => (
                    <div 
                        key={step} 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-lg ${
                            currentStep >= step 
                            ? 'bg-azulClaroCheck text-azulEscuroPage shadow-cyan-500/40 ring-4 ring-azulEscuroCard' 
                            : 'bg-[#001A33] text-gray-500 ring-4 ring-azulEscuroCard'
                        }`}
                    >
                        {step}
                    </div>
                ))}
            </div>
        </header>

        {/* Corpo Rolável */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <form id="evaluationForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* STEP 1: Fundamentos */}
                <div className={`transition-all duration-300 ${currentStep === 1 ? 'block animate-fade-in' : 'hidden'}`}>
                    <h3 className="text-lg font-semibold text-white mb-4 border-l-4 border-azulClaroCheck pl-3">Competências Base</h3>
                    <div className="space-y-5 bg-azulEscuroPage/50 p-5 rounded-xl border border-white/5">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <label className="text-gray-300 font-medium">Comunicação</label>
                            <StarRating rating={comunicacao} setRating={setComunicacao} />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2 border-t border-white/5">
                            <label className="text-gray-300 font-medium">Proatividade</label>
                            <StarRating rating={proatividade} setRating={setProatividade} />
                        </div>
                    </div>
                </div>

                {/* STEP 2: Específicos */}
                <div className={`transition-all duration-300 ${currentStep === 2 ? 'block animate-fade-in' : 'hidden'}`}>
                    <h3 className="text-lg font-semibold text-white mb-4 border-l-4 border-laranja pl-3">Desempenho Específico</h3>
                    <div className="space-y-5 bg-azulEscuroPage/50 p-5 rounded-xl border border-white/5">
                    
                    {evaluationType === 'member' ? (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <label className="text-gray-300 font-medium">Participação</label>
                                <StarRating rating={participacao} setRating={setParticipacao} />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2 border-t border-white/5">
                                <label className="text-gray-300 font-medium">Relação com grupo</label>
                                <StarRating rating={relacao} setRating={setRelacao} />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2 border-t border-white/5">
                                <label className="text-gray-300 font-medium">Entrega de metas</label>
                                <StarRating rating={metas} setRating={setMetas} />
                            </div>
                            
                            <div className="pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-t border-[#001A33]">
                                <div>
                                    <label className="text-gray-200 font-medium block">Membro Destaque?</label>
                                    <span className="text-xs text-gray-500">Indicaria essa pessoa pelo esforço excepcional?</span>
                                </div>
                                <div className="flex bg-[#001A33] rounded-lg p-1">
                                    <button type="button" onClick={() => setIsDestaque(true)} className={`cursor-pointer px-5 py-1.5 rounded-md text-sm font-medium transition-all ${isDestaque ? 'bg-laranja text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Sim</button>
                                    <button type="button" onClick={() => setIsDestaque(false)} className={`cursor-pointer px-5 py-1.5 rounded-md text-sm font-medium transition-all ${!isDestaque ? 'bg-gray-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Não</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <label className="text-gray-300 font-medium">Liderança</label>
                                <StarRating rating={lideranca} setRating={setLideranca} />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2 border-t border-white/5">
                                <label className="text-gray-300 font-medium">Flexibilidade</label>
                                <StarRating rating={flexibilidade} setRating={setFlexibilidade} />
                            </div>
                            
                            <div className="pt-4 border-t border-[#001A33]">
                                <label className="text-gray-200 font-medium block mb-3">Como delega atividades?</label>
                                <div className="grid grid-cols-3 gap-2 bg-[#001A33] p-1 rounded-xl">
                                    {['Todos', 'Alguns', 'Nenhum'].map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setDelegacao(opt)}
                                            className={`py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                delegacao === opt 
                                                ? 'bg-azulClaroCheck text-azulEscuroPage shadow-md' 
                                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
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

                {/* STEP 3: Conclusão */}
                <div className={`transition-all duration-300 h-full flex flex-col ${currentStep === 3 ? 'block animate-fade-in' : 'hidden'}`}>
                    <h3 className="text-lg font-semibold text-white mb-4 border-l-4 border-green-500 pl-3">Parecer Final</h3>
                    <div className="flex-1 flex flex-col">
                        <label className="text-gray-300 text-sm font-medium mb-2">Comentários e Feedbacks Adicionais</label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full flex-1 min-h-37.5 p-4 bg-azulEscuroPage/80 border border-[#001A33] text-white rounded-xl focus:border-azulClaroCheck focus:ring-1 focus:ring-azulClaroCheck outline-none transition-all placeholder-gray-600 resize-none"
                            placeholder="Deixe um feedback construtivo detalhando os pontos fortes e os pontos a melhorar..."
                        />
                    </div>
                </div>

            </form>
        </div>

        {/* Rodapé e Navegação */}
        <footer className="p-4 bg-azulEscuroPage border-t border-[#001A33] flex justify-between items-center shrink-0">
            <button
                type="button"
                onClick={currentStep === 1 ? onClose : handlePrevStep}
                className="cursor-pointer px-5 py-2.5 text-gray-400 hover:text-white font-medium transition-colors"
            >
                {currentStep === 1 ? 'Cancelar' : '← Voltar'}
            </button>

            {currentStep < totalSteps ? (
                <button
                    type="button"
                    onClick={handleNextStep}
                    className="cursor-pointer px-6 py-2.5 bg-[#001A33] text-azulClaroCheck border border-azulClaroBorder/50 hover:bg-azulClaroCheck hover:text-azulEscuroPage rounded-lg transition-all font-semibold shadow-lg"
                >
                    Próximo Passo
                </button>
            ) : (
                <button
                    type="submit"
                    form="evaluationForm"
                    className="cursor-pointer px-8 py-2.5 bg-laranja text-white rounded-lg hover:bg-orange-500 transition-all font-bold shadow-[0_0_15px_rgba(255,102,0,0.3)] hover:shadow-[0_0_20px_rgba(255,102,0,0.5)] transform hover:-translate-y-0.5"
                >
                    Finalizar Avaliação
                </button>
            )}
        </footer>
      </div>
    </div>
  );
}
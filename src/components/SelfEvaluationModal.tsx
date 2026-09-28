import { useState } from "react";
import StarRating from "./StarRating";
import userIcon from "../assets/userIcon.svg";

export interface SelfEvaluationFormData {
  rating_rendimento: number;
  rating_entregas: number;
  rating_consistencia: number;
  rating_melhoria: string;
  rating_fatores: string;
  comments?: string;
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
  onSubmit: (data: SelfEvaluationFormData) => Promise<void>;
};

export default function SelfEvaluationModal({
  userName,
  onClose,
  onSubmit,
}: SelfEvaluationModalProps) {
  const [formData, setFormData] = useState<Partial<SelfEvaluationFormData>>({});
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Controle do Stepper
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
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      alert("Erro ao salvar autoavaliação: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div className="font-poppins bg-azulEscuroCard text-gray-200 rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col border border-azulClaroBorder/30 overflow-hidden">
        
        {/* Cabeçalho e Indicador de Progresso */}
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
                <h2 className="text-xl font-bold text-white tracking-tight">{userName}</h2>
                <span className="text-xs text-azulClaroCheck uppercase tracking-widest font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-azulClaroCheck"></span>
                    Autoavaliação
                </span>
              </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex justify-between items-center relative mt-6">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#001A33] -z-10"></div>
              <div 
                  className="absolute left-0 top-1/2 h-0.5 bg-laranja -z-10 transition-all duration-300 ease-in-out" 
                  style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              ></div>
              {[1, 2, 3].map((step) => (
                  <div 
                      key={step} 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-lg ${
                          currentStep >= step 
                          ? 'bg-laranja text-white shadow-orange-500/40 ring-4 ring-azulEscuroCard' 
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
          <form id="selfEvaluationForm" onSubmit={handleSubmit} className="space-y-6 h-full">
            
            {/* STEP 1: Quantitativo (Estado e Trajetória) */}
            <div className={`transition-all duration-300 h-full flex-col ${currentStep === 1 ? 'flex animate-fade-in' : 'hidden'}`}>
              <h3 className="text-lg font-semibold text-white mb-4 border-l-4 border-azulClaroCheck pl-3">Avaliação Contínua</h3>
              <div className="space-y-5 bg-azulEscuroPage/50 p-5 rounded-xl border border-white/5">
                {QUESTIONS.filter((q) => q.type === "rating").map((q) => (
                  <div key={q.key} className="flex flex-col gap-2 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <label className="text-gray-300 font-medium leading-snug">{q.label}</label>
                    <div className="flex justify-start pt-1">
                      <StarRating
                        rating={(formData[q.key] as number) || 0}
                        setRating={(value) => setFormData(prev => ({ ...prev, [q.key]: value }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 2: Qualitativo (Performance) */}
            <div className={`transition-all duration-300 h-full flex-col ${currentStep === 2 ? 'flex animate-fade-in' : 'hidden'}`}>
              <h3 className="text-lg font-semibold text-white mb-4 border-l-4 border-laranja pl-3">Reflexão Prática</h3>
              <div className="space-y-5">
                {QUESTIONS.filter((q) => q.type === "text").map((q) => (
                  <div key={q.key} className="flex flex-col">
                    <label className="text-gray-200 font-medium mb-2">{q.label}</label>
                    <textarea
                      value={(formData[q.key] as string) || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, [q.key]: e.target.value }))}
                      className="w-full p-4 bg-azulEscuroPage/80 border border-[#001A33] text-white rounded-xl focus:border-laranja focus:ring-1 focus:ring-laranja outline-none transition-all placeholder-gray-600 resize-none"
                      rows={3}
                      placeholder="Descreva em detalhes..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 3: Comentários */}
            <div className={`transition-all duration-300 h-full flex-col ${currentStep === 3 ? 'flex animate-fade-in' : 'hidden'}`}>
              <h3 className="text-lg font-semibold text-white mb-4 border-l-4 border-green-500 pl-3">Espaço Aberto</h3>
              <div className="flex-1 flex flex-col">
                <label className="text-gray-300 font-medium mb-2">Comentários Adicionais (Opcional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full flex-1 min-h-37.5 p-4 bg-azulEscuroPage/80 border border-[#001A33] text-white rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder-gray-600 resize-none"
                  placeholder="Existe algo mais que você gostaria de compartilhar com a diretoria ou relatar sobre seu momento atual?"
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
                  form="selfEvaluationForm"
                  disabled={loading}
                  className="cursor-pointer px-8 py-2.5 bg-laranja text-white rounded-lg hover:bg-orange-500 transition-all font-bold shadow-[0_0_15px_rgba(255,102,0,0.3)] hover:shadow-[0_0_20px_rgba(255,102,0,0.5)] transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                  {loading ? 'Salvando...' : 'Finalizar'}
              </button>
          )}
        </footer>
      </div>
    </div>
  );
}
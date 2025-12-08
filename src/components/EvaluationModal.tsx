import { useState } from "react";
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
  text_delegacao?: string; // "Todos", "Alguns", "Nenhum"
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

    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="p-6 font-poppins bg-[#001429] text-gray-200 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#001A33]">
        <header className="flex justify-start items-center gap-3 mb-6 border-b border-[#001A33] pb-4">
          <img src={userIcon} alt="Ícone" className="w-10 h-10" />
          <div>
            <h2 className="text-xl font-bold text-white">{memberName}</h2>
            <span className="text-xs text-[#FF6600] uppercase tracking-wider font-semibold">
              {evaluationType === 'member' ? 'Avaliação de Membro' : 'Avaliação de Liderança'}
            </span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 p-4 bg-[#000D1A] rounded-xl">
            
            {/* --- CAMPOS COMUNS --- */}
            <div className="flex justify-between items-center">
              <label className="text-gray-300">Comunicação:</label>
              <StarRating rating={comunicacao} setRating={setComunicacao} />
            </div>
            <div className="flex justify-between items-center">
              <label className="text-gray-300">Proatividade:</label>
              <StarRating rating={proatividade} setRating={setProatividade} />
            </div>

            {/* --- CAMPOS DE MEMBRO --- */}
            {evaluationType === 'member' && (
              <>
                <div className="flex justify-between items-center">
                  <label className="text-gray-300">Participação:</label>
                  <StarRating rating={participacao} setRating={setParticipacao} />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-gray-300">Relação com grupo:</label>
                  <StarRating rating={relacao} setRating={setRelacao} />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-gray-300">Entrega de metas:</label>
                  <StarRating rating={metas} setRating={setMetas} />
                </div>
                
                {/* Destaque */}
                <div className="pt-2 flex justify-between items-center border-t border-[#001A33] mt-2">
                  <label className="text-gray-300">Membro destaque?</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsDestaque(true)} className={`px-4 py-1 rounded text-sm transition-colors ${isDestaque ? 'bg-[#FF6600] text-white' : 'bg-[#001429] text-gray-400'}`}>Sim</button>
                    <button type="button" onClick={() => setIsDestaque(false)} className={`px-4 py-1 rounded text-sm transition-colors ${!isDestaque ? 'bg-gray-600 text-white' : 'bg-[#001429] text-gray-400'}`}>Não</button>
                  </div>
                </div>
              </>
            )}

            {/* --- CAMPOS DE LÍDER --- */}
            {evaluationType === 'director' && (
              <>
                <div className="flex justify-between items-center">
                  <label className="text-gray-300">Liderança:</label>
                  <StarRating rating={lideranca} setRating={setLideranca} />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-gray-300">Flexibilidade:</label>
                  <StarRating rating={flexibilidade} setRating={setFlexibilidade} />
                </div>
                
                {/* Delegar Atividades */}
                <div className="pt-2 border-t border-[#001A33] mt-2">
                  <label className="text-gray-300 block mb-2">Delega atividades?</label>
                  <div className="flex gap-2 w-full">
                    {['Todos', 'Alguns', 'Nenhum'].map((opt) => (
                       <button
                        key={opt}
                        type="button"
                        onClick={() => setDelegacao(opt)}
                        className={`flex-1 py-2 rounded text-sm border border-[#001A33] transition-colors ${
                          delegacao === opt ? 'bg-[#FF6600] text-white font-bold' : 'bg-[#001429] text-gray-400 hover:bg-[#001A33]'
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

          <div>
            <label className="text-gray-300 text-sm font-medium ml-1">Comentários:</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-3 mt-1 bg-[#000D1A] border border-[#001A33] text-white rounded-lg focus:border-[#FF6600] outline-none transition-colors"
              rows={3}
              placeholder="Escreva um feedback construtivo..."
            />
          </div>

          <div className="flex w-full justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-[#FF6600] rounded-lg hover:bg-opacity-90 transition-all font-medium shadow-lg shadow-orange-900/20"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
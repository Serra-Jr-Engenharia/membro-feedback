import { useState } from 'react'
import StarRating from './StarRating'

export interface EvaluationFormData {
  rating_comunicacao: number;
  rating_participacao: number;
  rating_relacao_grupo: number;
  rating_proatividade: number;
  rating_entrega_metas: number;
  is_destaque: boolean;
  comments: string;
}

type EvaluationModalProps = {
  memberName: string;
  onClose: () => void;
  onSubmit: (formData: EvaluationFormData) => void;
  initialData?: EvaluationFormData; 
}

export default function EvaluationModal({ 
  memberName, 
  onClose, 
  onSubmit, 
  initialData 
}: EvaluationModalProps) {
  
  const [ratingComunicacao, setRatingComunicacao] = useState(initialData?.rating_comunicacao || 0);
  const [ratingParticipacao, setRatingParticipacao] = useState(initialData?.rating_participacao || 0);
  const [ratingRelacaoGrupo, setRatingRelacaoGrupo] = useState(initialData?.rating_relacao_grupo || 0);
  const [ratingProatividade, setRatingProatividade] = useState(initialData?.rating_proatividade || 0);
  const [ratingEntregaMetas, setRatingEntregaMetas] = useState(initialData?.rating_entrega_metas || 0);
  const [isDestaque, setIsDestaque] = useState(initialData?.is_destaque || false);
  const [comments, setComments] = useState(initialData?.comments || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSubmit({
      rating_comunicacao: ratingComunicacao,
      rating_participacao: ratingParticipacao,
      rating_relacao_grupo: ratingRelacaoGrupo,
      rating_proatividade: ratingProatividade,
      rating_entrega_metas: ratingEntregaMetas,
      is_destaque: isDestaque,
      comments: comments,
    })
  }

 return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      
      {/* O Card (Modal) */}
      <div className="p-6 bg-[#001429] text-gray-200 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-white">Avaliar: {memberName}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            <div className="p-4 bg-[#001A33] rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Comunicação:</label>
                <StarRating rating={ratingComunicacao} setRating={setRatingComunicacao} />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Participação:</label>
                <StarRating rating={ratingParticipacao} setRating={setRatingParticipacao} />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Relação com o grupo:</label>
                <StarRating rating={ratingRelacaoGrupo} setRating={setRatingRelacaoGrupo} />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Proatividade:</label>
                <StarRating rating={ratingProatividade} setRating={setRatingProatividade} />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Entrega de metas:</label>
                <StarRating rating={ratingEntregaMetas} setRating={setRatingEntregaMetas} />
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-[#001A33] rounded-lg">
              <label className="text-gray-300">O membro é destaque?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`px-4 py-2 rounded transition-colors ${
                    isDestaque ? 'bg-[#FF6600] text-white font-bold' : 'bg-[#001429] text-gray-400 hover:bg-[#000D1A]'
                  }`}
                  onClick={() => setIsDestaque(true)}
                >
                  Sim
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded transition-colors ${
                    !isDestaque ? 'bg-gray-500 text-white font-bold' : 'bg-[#001429] text-gray-400 hover:bg-[#000D1A]'
                  }`}
                  onClick={() => setIsDestaque(false)}
                >
                  Não
                </button>
              </div>
            </div>

            <div>
              <label className="text-gray-300">Comentários:</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full p-2 mt-1 bg-[#001A33] border border-[#000D1A] text-white rounded focus:ring-[#FF6600] focus:border-[#FF6600]"
                rows={3}
                placeholder="Seja construtivo..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-300 bg-[#001A33] rounded hover:bg-[#000D1A] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-[#FF6600] rounded hover:opacity-90 transition-opacity"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
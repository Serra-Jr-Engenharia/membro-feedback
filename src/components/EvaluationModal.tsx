import { useState } from "react";
import StarRating from "./StarRating";
import userIcon from "../assets/userIcon.svg";

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
};

export default function EvaluationModal({
  memberName,
  onClose,
  onSubmit,
  initialData,
}: EvaluationModalProps) {
  const [ratingComunicacao, setRatingComunicacao] = useState(
    initialData?.rating_comunicacao || 0
  );
  const [ratingParticipacao, setRatingParticipacao] = useState(
    initialData?.rating_participacao || 0
  );
  const [ratingRelacaoGrupo, setRatingRelacaoGrupo] = useState(
    initialData?.rating_relacao_grupo || 0
  );
  const [ratingProatividade, setRatingProatividade] = useState(
    initialData?.rating_proatividade || 0
  );
  const [ratingEntregaMetas, setRatingEntregaMetas] = useState(
    initialData?.rating_entrega_metas || 0
  );
  const [isDestaque, setIsDestaque] = useState(
    initialData?.is_destaque || false
  );
  const [comments, setComments] = useState(initialData?.comments || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      rating_comunicacao: ratingComunicacao,
      rating_participacao: ratingParticipacao,
      rating_relacao_grupo: ratingRelacaoGrupo,
      rating_proatividade: ratingProatividade,
      rating_entrega_metas: ratingEntregaMetas,
      is_destaque: isDestaque,
      comments: comments,
    });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="p-6 font-poppins bg-azulEscuroCard text-gray-200 rounded-lg shadow-xl w-[30%] h-[90%] overflow-hidden max-w-lg">
        <header className="flex justify-start items-center gap-3 mb-3">
          <img src={userIcon} alt="Ícone do usuário" />
          <h2 className="text-2xl font-bold text-white">{memberName}</h2>
        </header>

        <main className="p-4 max-h-[90%] overflow-scroll">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="rounded-lg space-y-3">
                <div className="flex flex-col items-start">
                  <label className="text-gray-300">Comunicação:</label>
                  <StarRating
                    rating={ratingComunicacao}
                    setRating={setRatingComunicacao}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <label className="text-gray-300">Participação:</label>
                  <StarRating
                    rating={ratingParticipacao}
                    setRating={setRatingParticipacao}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <label className="text-gray-300">Relação com o grupo:</label>
                  <StarRating
                    rating={ratingRelacaoGrupo}
                    setRating={setRatingRelacaoGrupo}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <label className="text-gray-300">Proatividade:</label>
                  <StarRating
                    rating={ratingProatividade}
                    setRating={setRatingProatividade}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <label className="text-gray-300">Entrega de metas:</label>
                  <StarRating
                    rating={ratingEntregaMetas}
                    setRating={setRatingEntregaMetas}
                  />
                </div>
              </div>

              <div className="flex flex-col items-start">
                <label className="text-gray-300 mb-3">
                  O membro é destaque?
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex justify-center items-center bg-[#001A33] w-[30px] h-[30px] rounded-full"
                    onClick={() => setIsDestaque(true)}
                  >
                    {isDestaque && (
                      <div className="bg-azulClaroCheck w-5 h-5 rounded-full"></div>
                    )}
                  </button>
                  <p>Sim</p>
                  <button
                    type="button"
                    className="ml-5 flex justify-center items-center bg-[#001A33] w-[30px] h-[30px] rounded-full"
                    onClick={() => setIsDestaque(false)}
                  >
                    {!isDestaque && (
                      <div className="bg-laranja w-5 h-5 rounded-full"></div>
                    )}
                  </button>
                  <p>Não</p>
                </div>
              </div>

              <div>
                <label className="text-gray-300">Comentários:</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full p-2 mt-1 bg-[#001A33] outline-0 border border-azulEscuroPage text-white rounded"
                  rows={3}
                  placeholder="Seja construtivo..."
                />
              </div>
            </div>

            <div className="flex w-full justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full px-5 py-2 text-gray-300 bg-[#001A33] border-2 border-azulClaroCheck hover:bg-azulEscuroPage transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full px-5 py-2 text-white bg-[#001A33] border-2 border-laranja hover:bg-azulEscuroPage transition-colors cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

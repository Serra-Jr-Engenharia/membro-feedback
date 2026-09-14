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

const CATEGORIES: SelfEvaluationQuestion["category"][] = ["Estado", "Trajetória", "Performance"];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="p-6 font-poppins bg-azulEscuroCard text-gray-200 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#001A33]">
        <header className="flex justify-start items-center gap-3 mb-6 border-b border-[#001A33] pb-4">
          <img src={userIcon} alt="Ícone" className="w-10 h-10" />
          <div>
            <h2 className="text-xl font-bold text-white">{userName}</h2>
            <span className="text-xs text-laranja uppercase tracking-wider font-semibold">
              Autoavaliação
            </span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {CATEGORIES.map((category) => (
            <div key={category} className="p-4 bg-azulEscuroPage rounded-xl space-y-4">
              <h3 className="text-laranja font-semibold text-sm uppercase tracking-wider">
                {category}
              </h3>

              {QUESTIONS.filter((q) => q.category === category).map((q) => (
                <div key={q.key}>
                  <label className="block text-gray-300 text-sm mb-2">{q.label}</label>
                  {q.type === "rating" ? (
                    <StarRating
                      rating={(formData[q.key] as number) || 0}
                      setRating={(value) => setFormData(prev => ({ ...prev, [q.key]: value }))}
                    />
                  ) : (
                    <textarea
                      value={(formData[q.key] as string) || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, [q.key]: e.target.value }))}
                      className="w-full p-3 mt-1 bg-azulEscuroCard border border-[#001A33] text-white rounded-lg focus:border-laranja outline-none transition-colors"
                      rows={3}
                      placeholder="Escreva sua resposta..."
                    />
                  )}
                </div>
              ))}
            </div>
          ))}

          <div>
            <label className="text-gray-300 text-sm font-medium ml-1">Comentários (Opcional):</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-3 mt-1 bg-azulEscuroPage border border-[#001A33] text-white rounded-lg focus:border-laranja outline-none transition-colors"
              rows={3}
              placeholder="Algo que gostaria de compartilhar sobre sua avaliação..."
            />
          </div>

          <div className="flex w-full justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer px-6 py-2 text-white bg-laranja rounded-lg hover:bg-opacity-90 transition-all font-medium shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
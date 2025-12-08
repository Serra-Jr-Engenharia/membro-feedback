import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { FaTimes, FaStar, FaQuoteLeft } from "react-icons/fa";

interface DetailProps {
  memberName: string;
  onClose: () => void;
}

interface EvaluationRow {
  id: number;
  created_at: string;
  week_of: string;
  comments: string;
  evaluation_type: string;
  profiles: { notion_name: string; user_role: string } | null;
  rating_comunicacao: number;
  rating_participacao?: number;
  rating_lideranca?: number;
}

export default function AnalyticsDetailsModal({ memberName, onClose }: DetailProps) {
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select(`
          *,
          profiles:director_id ( notion_name, user_role )
        `)
        .eq("member_name", memberName)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setEvaluations(data || []);
      
      setLoading(false);
    };
    fetchDetails();
  }, [memberName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#001429] border border-[#001A33] w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#001A33] bg-[#000D1A]">
          <div>
            <h2 className="text-2xl font-bold text-white">Histórico de Feedbacks</h2>
            <p className="text-[#FF6600] font-medium">{memberName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FaTimes size={24} />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <p className="text-center text-gray-500 mt-10">Carregando histórico...</p>
          ) : evaluations.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">Nenhuma avaliação encontrada.</p>
          ) : (
            evaluations.map((item) => (
              <div key={item.id} className="bg-[#000D1A] border border-[#001A33] rounded-lg p-5 hover:border-[#FF6600]/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#001A33] flex items-center justify-center text-xs font-bold text-gray-300">
                      {item.profiles?.notion_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.profiles?.notion_name || "Anônimo"}</p>
                      <p className="text-xs text-gray-500">{item.profiles?.user_role} • Semana: {item.week_of}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-[#001A33] text-gray-400 border border-[#001429]">
                    {item.evaluation_type === 'director' ? 'Liderança' : 'Membro'}
                  </span>
                </div>

                {/* Comentário */}
                {item.comments && (
                  <div className="flex gap-3 mb-4">
                    <FaQuoteLeft className="text-[#FF6600] text-opacity-40 min-w-[12px] mt-1" />
                    <p className="text-gray-300 text-sm italic">{item.comments}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                   <ScoreChip label="Comunicação" val={item.rating_comunicacao} />
                   {item.evaluation_type === 'director' ? (
                     <>
                        <ScoreChip label="Liderança" val={item.rating_lideranca} />
                     </>
                   ) : (
                     <>
                        <ScoreChip label="Participação" val={item.rating_participacao} />
                     </>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const ScoreChip = ({ label, val }: { label: string, val?: number }) => {
  if (!val) return null;
  return (
    <div className="flex items-center gap-1 bg-[#001429] px-2 py-1 rounded text-xs text-gray-400 border border-[#001A33]">
      <span>{label}:</span>
      <span className="text-[#FF6600] font-bold flex items-center gap-1">
        {val} <FaStar size={8} />
      </span>
    </div>
  )
}
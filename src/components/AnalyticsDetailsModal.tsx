import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { FaTimes, FaStar, FaQuoteLeft, FaTrophy, FaUserCheck } from "react-icons/fa";

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
  is_destaque: boolean;
  text_delegacao?: string;
  
  // Join com profiles para saber quem avaliou
  profiles: { notion_name: string; user_role: string } | null;
  
  // Todas as Notas possíveis
  rating_comunicacao: number;
  rating_proatividade: number;
  
  // Específicas de Membro
  rating_participacao?: number;
  rating_relacao_grupo?: number;
  rating_entrega_metas?: number;
  
  // Específicas de Diretor
  rating_lideranca?: number;
  rating_flexibilidade?: number;
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
            <h2 className="text-2xl font-bold text-white">Histórico Detalhado</h2>
            <p className="text-[#FF6600] font-medium text-lg">{memberName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <FaTimes size={24} />
          </button>
        </div>

        {/* Lista de Avaliações */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-full">
                <p className="text-gray-500 animate-pulse">Carregando histórico...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                <FaQuoteLeft className="text-4xl opacity-20" />
                <p>Nenhuma avaliação encontrada.</p>
            </div>
          ) : (
            evaluations.map((item) => (
              <div key={item.id} className="bg-[#000D1A] border border-[#001A33] rounded-lg p-5 hover:border-[#FF6600]/30 transition-all shadow-md">
                
                {/* Cabeçalho do Card (Quem avaliou + Data) */}
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#001A33]/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#001A33] flex items-center justify-center text-sm font-bold text-gray-300 border border-[#001A33]">
                      {item.profiles?.notion_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.profiles?.notion_name || "Usuário Removido"}</p>
                      <p className="text-xs text-gray-500">
                        {item.profiles?.user_role || "Cargo Desconhecido"} • {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                        item.evaluation_type === 'director' 
                        ? 'bg-purple-900/20 text-purple-400 border-purple-900/50' 
                        : 'bg-blue-900/20 text-blue-400 border-blue-900/50'
                    }`}>
                        {item.evaluation_type === 'director' ? 'Liderança' : 'Membro'}
                    </span>
                    {item.is_destaque && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-yellow-900/20 text-yellow-500 border border-yellow-900/50 font-bold">
                            <FaTrophy size={8} /> Destaque
                        </span>
                    )}
                  </div>
                </div>

                {/* Comentário */}
                {item.comments && (
                  <div className="flex gap-3 mb-5 bg-[#001429] p-3 rounded-lg border border-[#001A33]/50">
                    <FaQuoteLeft className="text-[#FF6600] text-opacity-40 min-w-[14px] mt-0.5" />
                    <p className="text-gray-300 text-sm italic leading-relaxed whitespace-pre-wrap">
                      {item.comments}
                    </p>
                  </div>
                )}

                {/* Grid de Notas (Agora com TODAS as métricas) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                   
                   {/* Métricas Comuns (Sempre aparecem) */}
                   <ScoreChip label="Comunicação" val={item.rating_comunicacao} />
                   <ScoreChip label="Proatividade" val={item.rating_proatividade} />

                   {/* Lógica Condicional para os outros campos */}
                   {item.evaluation_type === 'director' ? (
                     <>
                        <ScoreChip label="Liderança" val={item.rating_lideranca} />
                        <ScoreChip label="Flexibilidade" val={item.rating_flexibilidade} />
                        
                        {item.text_delegacao && (
                            <div className="flex items-center justify-between bg-[#001429] px-3 py-2 rounded border border-[#001A33]">
                                <span className="text-xs text-gray-500">Delega:</span>
                                <span className="text-xs font-bold text-white bg-[#000D1A] px-2 py-0.5 rounded border border-[#001A33]">
                                    {item.text_delegacao}
                                </span>
                            </div>
                        )}
                     </>
                   ) : (
                     /* Métricas de Membro (ADICIONADAS AQUI) */
                     <>
                        <ScoreChip label="Participação" val={item.rating_participacao} />
                        <ScoreChip label="Relação Grupo" val={item.rating_relacao_grupo} />
                        <ScoreChip label="Metas" val={item.rating_entrega_metas} />
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

// Componente visual da nota (Estrelinha)
const ScoreChip = ({ label, val }: { label: string, val?: number }) => {
  // Se o valor for 0, undefined ou null, não renderiza nada para não poluir
  if (!val) return null;
  
  // Cor dinâmica baseada na nota (Verde > 4, Amarelo = 3, Vermelho < 3)
  const valueColor = val >= 4 ? 'text-green-400' : val >= 3 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="flex items-center justify-between bg-[#001429] px-3 py-2 rounded border border-[#001A33]">
      <span className="text-xs text-gray-500 truncate mr-2" title={label}>{label}:</span>
      <span className={`${valueColor} font-bold text-sm flex items-center gap-1`}>
        {val} <FaStar size={10} className="text-yellow-600/50" />
      </span>
    </div>
  )
}
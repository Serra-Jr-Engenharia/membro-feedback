import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { FaTimes, FaStar, FaQuoteLeft, FaTrophy } from "react-icons/fa";

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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6">
      <div className="flex w-full max-w-4xl max-h-[88vh] animate-slide-up flex-col overflow-hidden rounded-3xl border border-white/10 bg-azulEscuroCard shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-azulEscuroPage/60 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-brand-800 text-sm font-semibold text-cyan-400">
              {getInitials(memberName)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">Histórico Detalhado</h2>
              <p className="text-base font-medium text-accent-500 sm:text-lg">{memberName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!loading && (
              <span className="hidden whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-200 sm:inline-block">
                {evaluations.length} avaliações
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Lista de Avaliações */}
        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
                <p className="animate-pulse">Carregando histórico...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                <FaQuoteLeft className="text-4xl opacity-20" />
                <p>Nenhuma avaliação encontrada.</p>
            </div>
          ) : (
            evaluations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-azulEscuroPage/70 p-5 transition-all hover:border-accent-500/30">
                
                {/* Cabeçalho do Card (Quem avaliou + Data) */}
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-gray-300">
                      {item.profiles?.notion_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.profiles?.notion_name || "Usuário Removido"}</p>
                      <p className="text-xs text-gray-400">
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
                  <div className="mb-5 flex gap-3 rounded-r-xl border-l-2 border-accent-500 bg-azulEscuroCard/80 p-4">
                    <FaQuoteLeft className="text-accent-500/50 min-w-[14px] mt-0.5" />
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
                            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-azulEscuroCard px-3 py-2">
                                <span className="text-xs text-gray-400">Delega:</span>
                                <span className="text-xs font-bold text-white bg-azulEscuroPage px-2 py-0.5 rounded border border-white/10">
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
  
  // Cor dinâmica baseada na nota (Verde > 4, Amarelo = 3, Vermelho < 3), consistente nos dois temas
  const valueColor = val >= 4 ? 'text-success' : val >= 3 ? 'text-warning' : 'text-danger';

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-azulEscuroCard px-3 py-2">
      <span className="text-xs text-gray-400 truncate mr-2" title={label}>{label}:</span>
      <span className={`${valueColor} font-bold text-sm flex items-center gap-1`}>
        {val} <FaStar size={10} className="text-gray-500" />
      </span>
    </div>
  )
}
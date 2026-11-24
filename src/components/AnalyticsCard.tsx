import { FaStar, FaArrowRight } from "react-icons/fa";

export interface AnalyticsData {
  profile_id: string;
  member_name: string;
  user_role: string;
  assessoria: string;
  project_name: string | null;
  total_evaluations: number;
  overall_score: number;
  avg_comunicacao: number;
  avg_participacao: number;
  avg_relacao: number;
  avg_proatividade: number;
  avg_metas: number;
  avg_lideranca: number;
  avg_flexibilidade: number;
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

const StatBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex w-full flex-col gap-1">
    <div className="flex justify-between text-xs text-gray-400">
      <span>{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-accent-500 transition-all duration-500"
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
  </div>
);

export default function AnalyticsCard({ data }: { data: AnalyticsData }) {
  return (
    <div className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-azulEscuroCard/80 p-6 shadow-lg backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-accent-500/40 hover:shadow-xl">
      <div className="flex flex-col gap-4">
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-brand-800 text-sm font-semibold text-cyan-400">
              {getInitials(data.member_name)}
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-bold leading-tight text-white">{data.member_name}</h3>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-brand-200">
                  {data.user_role}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-brand-200">
                  {data.assessoria}
                </span>
                {data.project_name && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-brand-200">
                    {data.project_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Nota Principal (Destaque) */}
          <div className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-center">
            <span className="text-2xl font-bold text-accent-500">{data.overall_score}</span>
            <FaStar className="text-xs text-accent-500/70" />
            <span className="text-[10px] whitespace-nowrap text-gray-400">{data.total_evaluations} avaliações</span>
          </div>
        </div>

        {/* Estatísticas Detalhadas */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 pt-4">
          <StatBar label="Comunicação" value={data.avg_comunicacao} />
          <StatBar label="Proatividade" value={data.avg_proatividade} />

          {/* Mostra métricas de membro se tiverem valor > 0 */}
          {data.avg_participacao > 0 && <StatBar label="Participação" value={data.avg_participacao} />}
          {data.avg_relacao > 0 && <StatBar label="Relação" value={data.avg_relacao} />}
          {data.avg_metas > 0 && <StatBar label="Metas" value={data.avg_metas} />}

          {/* Mostra métricas de líder se tiverem valor > 0 */}
          {data.avg_lideranca > 0 && <StatBar label="Liderança" value={data.avg_lideranca} />}
          {data.avg_flexibilidade > 0 && <StatBar label="Flexibilidade" value={data.avg_flexibilidade} />}
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-5 flex items-center justify-end gap-1.5 border-t border-white/10 pt-3 text-xs font-semibold text-gray-400 transition-colors group-hover:text-accent-500">
        Ver histórico completo <FaArrowRight size={10} />
      </div>
    </div>
  );
}

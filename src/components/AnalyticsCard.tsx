import { FaStar, FaUserTie, FaProjectDiagram } from "react-icons/fa";

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
}

const StatBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="flex justify-between text-xs text-gray-400">
      <span>{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
    <div className="w-full bg-[#000D1A] h-2 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-[#FF6600]" 
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
  </div>
);

export default function AnalyticsCard({ data }: { data: AnalyticsData }) {
  return (
    <div className="bg-[#001429] border border-[#001A33] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      
      {/* Cabeçalho do Card */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{data.member_name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <FaUserTie className="text-[#FF6600]" /> {data.user_role}
            </span>
            <span>•</span>
            <span className="text-gray-300">{data.assessoria}</span>
          </div>
          {data.project_name && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <FaProjectDiagram /> {data.project_name}
            </div>
          )}
        </div>
        
        {/* Nota Principal (Destaque) */}
        <div className="flex flex-col items-center bg-[#000D1A] p-2 rounded-lg border border-[#001A33]">
          <span className="text-2xl font-bold text-[#FF6600]">{data.overall_score}</span>
          <div className="flex text-yellow-400 text-xs">
            <FaStar />
          </div>
          <span className="text-[10px] text-gray-500 mt-1">{data.total_evaluations} avaliações</span>
        </div>
      </div>

      <hr className="border-[#001A33] mb-4" />

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <StatBar label="Comunicação" value={data.avg_comunicacao} />
        <StatBar label="Participação" value={data.avg_participacao} />
        <StatBar label="Relação" value={data.avg_relacao} />
        <StatBar label="Proatividade" value={data.avg_proatividade} />
        <StatBar label="Metas" value={data.avg_metas} />
      </div>
    </div>
  );
}
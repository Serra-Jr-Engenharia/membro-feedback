import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import AnalyticsCard from '../components/AnalyticsCard';
import type { AnalyticsData } from '../components/AnalyticsCard';
import AnalyticsDetailsModal from '../components/AnalyticsDetailsModal';
import { useAuth } from '../hooks/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter } from 'react-icons/fa';

const assessorias = ['Todas', 'Computação', 'Mecânica', 'SerraLab', 'Comercial', 'Marketing', 'Recursos Humanos'];
const roles = ['Todos', 'Membro', 'Gestor', 'Diretor'];

export default function Analytics() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [filterAssessoria, setFilterAssessoria] = useState('Todas');

  useEffect(() => {
    const isAllowed = profile && (profile.user_role === 'Diretor' || profile.assessoria === 'Recursos Humanos');

    if (profile && !isAllowed) {
        alert("Acesso restrito ao RH e Diretoria.");
        navigate('/');
        return;
    }

    const fetchData = async () => {
      setLoading(true);
      const { data: analyticsData, error } = await supabase
        .from('analytics_view')
        .select('*');

      if (error) {
        console.error("Erro ao carregar analytics:", error);
      } else {
        setData(analyticsData || []);
      }
      setLoading(false);
    };

    if (profile && isAllowed) fetchData();
  }, [profile, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    alert("Para excluir a conta, acesse o Dashboard.");
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.member_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'Todos' || item.user_role === filterRole;
    const matchesAssessoria = filterAssessoria === 'Todas' || item.assessoria === filterAssessoria;
    
    return matchesSearch && matchesRole && matchesAssessoria;
  });

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#000D1A] text-gray-200 pb-24">
      <div className="p-8 pt-2 mx-auto max-w-6xl">
        <Header 
            nome={profile.notion_name} 
            logout={handleLogout} 
            deleteAccount={handleDeleteAccount}
        />

        <div className="mt-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6">Painel de Feedback <span className="text-[#FF6600]">RH</span></h2>
            
            {/* Barra de Ferramentas (Busca e Filtros) */}
            <div className="flex flex-col md:flex-row gap-4 bg-[#001429] p-4 rounded-xl border border-[#001A33] shadow-md">
                
                {/* Input de Busca */}
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Buscar membro por nome..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#000D1A] border border-[#001A33] rounded-lg text-white focus:border-[#FF6600] outline-none transition-colors placeholder-gray-600"
                    />
                </div>

                {/* Filtros Dropdown */}
                <div className="flex gap-4">
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                        <select 
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="pl-8 pr-4 py-2 bg-[#000D1A] border border-[#001A33] rounded-lg text-white focus:border-[#FF6600] outline-none appearance-none cursor-pointer hover:bg-[#001A33] transition-colors"
                        >
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div className="relative">
                        <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                        <select 
                            value={filterAssessoria}
                            onChange={(e) => setFilterAssessoria(e.target.value)}
                            className="pl-8 pr-4 py-2 bg-[#000D1A] border border-[#001A33] rounded-lg text-white focus:border-[#FF6600] outline-none appearance-none cursor-pointer hover:bg-[#001A33] transition-colors"
                        >
                            {assessorias.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>

        {/* Lista de Cards */}
        {loading ? (
            <div className="text-center text-gray-400 mt-20 animate-pulse">Carregando dados do RH...</div>
        ) : filteredData.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">Nenhum membro encontrado com estes filtros.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map(item => (
                <div 
                  key={item.member_name} 
                  onClick={() => setSelectedMember(item.member_name)} 
                  className="cursor-pointer"
                  >
                  <AnalyticsCard data={item} />
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes (Histórico) */}
      {selectedMember && (
        <AnalyticsDetailsModal 
            memberName={selectedMember} 
            onClose={() => setSelectedMember(null)} 
        />
      )}
    </div>
  );
}
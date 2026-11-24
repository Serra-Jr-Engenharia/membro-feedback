import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import AnalyticsCard from '../components/AnalyticsCard';
import type { AnalyticsData } from '../components/AnalyticsCard';
import AnalyticsDetailsModal from '../components/AnalyticsDetailsModal';
import { useAuth } from '../hooks/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaBuilding, FaChevronDown, FaArrowLeft, FaUsers, FaStar } from 'react-icons/fa';

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



  const filteredData = data.filter(item => {
    const matchesSearch = item.member_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'Todos' || item.user_role === filterRole;
    const matchesAssessoria = filterAssessoria === 'Todas' || item.assessoria === filterAssessoria;
    
    return matchesSearch && matchesRole && matchesAssessoria;
  });

  const totalEvaluations = filteredData.reduce((sum, item) => sum + item.total_evaluations, 0);
  const hasActiveFilters = searchTerm !== '' || filterRole !== 'Todos' || filterAssessoria !== 'Todas';

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterRole('Todos');
    setFilterAssessoria('Todas');
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-azulEscuroPage text-gray-200 relative overflow-x-hidden">
      {/* Glow decorativo de fundo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl 2xl:max-w-[90rem] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2">
        <Header
            nome={profile.notion_name}
            logout={handleLogout}
        />
      </div>

      <main className="max-w-7xl 2xl:max-w-[90rem] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-24 flex flex-col gap-8">

        {/* --- HERO SECTION --- */}
        <section className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-accent-500"
          >
            <FaArrowLeft size={12} /> Voltar ao painel
          </button>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Painel de <span className="text-accent-500">RH</span>
              </h1>
              <p className="max-w-xl text-gray-400">
                Acompanhe o desempenho da equipe, filtre por cargo ou assessoria e consulte o histórico completo de avaliações de cada membro.
              </p>
            </div>

            <div className="flex shrink-0 gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <FaUsers className="text-cyan-400" />
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-bold text-white">{filteredData.length}</span>
                  <span className="text-[11px] text-gray-400">membros</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <FaStar className="text-accent-500" />
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-bold text-white">{totalEvaluations}</span>
                  <span className="text-[11px] text-gray-400">avaliações</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- BARRA DE FILTROS --- */}
        <section className="rounded-2xl border border-white/10 bg-azulEscuroCard/80 p-4 shadow-lg backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

            {/* Busca */}
            <div className="relative flex-1 min-w-[220px]">
              <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar membro por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-9 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-accent-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 transition-colors hover:text-white"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>

            {/* Cargo - segmented control */}
            <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              {roles.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilterRole(r)}
                  className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 motion-reduce:transform-none motion-reduce:transition-none sm:text-sm ${
                    filterRole === r
                      ? 'bg-accent-500 text-white shadow'
                      : 'text-brand-200 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Assessoria - select estilizado */}
            <div className="relative w-full sm:w-auto">
              <FaBuilding className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-500" />
              <select
                value={filterAssessoria}
                onChange={(e) => setFilterAssessoria(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white outline-none transition-colors hover:bg-white/10 focus:border-accent-500 sm:w-auto"
              >
                {assessorias.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-500" />
            </div>

            {/* Limpar filtros */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 px-3.5 py-2.5 text-xs font-semibold text-gray-400 transition-colors hover:border-accent-500/50 hover:text-accent-500"
              >
                <FaTimes size={10} /> Limpar filtros
              </button>
            )}
          </div>
        </section>

        {/* --- LISTA DE CARDS --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
            <p className="animate-pulse">Carregando dados do RH...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center">
            <p className="text-sm text-gray-400">Nenhum membro encontrado com estes filtros.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-accent-500 transition-colors hover:border-accent-500/50"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 animate-fade-in md:grid-cols-2 xl:grid-cols-3">
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
      </main>

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
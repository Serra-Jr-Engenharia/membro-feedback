import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  notion_name: string;
  user_role: string;
  project_name: string;
  assessoria: string;
  email: string;
}

interface Evaluation {
  id: string | number; 
  director_id: string;
  member_name: string;
  evaluation_type: string;
  created_at: string;
}

interface SelfEvaluation {
  id: string | number;
  user_id: string;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'evaluations' | 'self_evaluations'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selfEvaluations, setSelfEvaluations] = useState<SelfEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    
    const [profilesRes, evalsRes, selfEvalsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('notion_name'),
      supabase.from('evaluations').select('*').order('created_at', { ascending: false }),
      supabase.from('self_evaluations').select('*').order('created_at', { ascending: false })
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (evalsRes.data) setEvaluations(evalsRes.data);
    if (selfEvalsRes.data) setSelfEvaluations(selfEvalsRes.data);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`ATENÇÃO: Deseja realmente excluir a conta de ${name}? Esta ação não pode ser desfeita.`)) return;
    
    const { error } = await supabase.functions.invoke('delete-account', {
      body: { targetUserId: userId }
    });

    if (error) alert("Erro ao excluir usuário: " + error.message);
    else {
      alert("Usuário excluído com sucesso.");
      fetchData(); 
    }
  };

  const handleDeleteEvaluation = async (evalId: string | number, table: 'evaluations' | 'self_evaluations') => {
    if (!window.confirm(`Deseja apagar esta avaliação do banco de dados?`)) return;

    const { error } = await supabase.from(table).delete().eq('id', evalId);
    
    if (error) alert("Erro ao apagar avaliação: " + error.message);
    else fetchData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const filteredProfiles = profiles.filter(profile => 
    (profile.notion_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-azulEscuroPage p-8 text-gray-200 font-poppins">
      <div className="max-w-6xl mx-auto border border-azulClaroBorder/30 bg-azulEscuroCard rounded-2xl p-6 shadow-2xl">
        
        <div className="flex justify-between items-center mb-8 border-b border-azulClaroBorder/30 pb-4">
          <h1 className="text-2xl font-bold text-laranja">Painel Administrativo - RH</h1>
          <button onClick={handleLogout} className="text-sm px-4 py-2 bg-red-900/50 text-red-200 rounded hover:bg-red-800/50 transition">
            Sair
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`px-4 py-2 rounded transition ${activeTab === 'users' ? 'bg-laranja text-white font-bold' : 'bg-[#001A33] text-gray-400 hover:text-white'}`}
          >
            Gerenciar Membros
          </button>
          <button 
            onClick={() => setActiveTab('evaluations')} 
            className={`px-4 py-2 rounded transition ${activeTab === 'evaluations' ? 'bg-laranja text-white font-bold' : 'bg-[#001A33] text-gray-400 hover:text-white'}`}
          >
            Avaliações (Membros e Diretores)
          </button>
          <button 
            onClick={() => setActiveTab('self_evaluations')} 
            className={`px-4 py-2 rounded transition ${activeTab === 'self_evaluations' ? 'bg-laranja text-white font-bold' : 'bg-[#001A33] text-gray-400 hover:text-white'}`}
          >
            Autoavaliações
          </button>
        </div>

        {loading ? (
          <p className="text-center py-10 text-gray-400 animate-pulse">Carregando dados...</p>
        ) : activeTab === 'users' ? (
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou e-mail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 mb-2 rounded bg-[#001A33] border border-azulClaroBorder/30 text-white placeholder-gray-500 focus:outline-none focus:border-laranja transition"
            />

            <div className="grid gap-4">
              {filteredProfiles.length === 0 && <p className="text-gray-400">Nenhum membro encontrado.</p>}
              {filteredProfiles.map(profile => (
                <div key={profile.id} className="flex justify-between items-center bg-[#001A33] p-4 rounded-lg border border-azulClaroBorder/20">
                  <div>
                    <p className="font-bold text-white text-lg">{profile.notion_name || 'Sem nome'}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center flex-wrap gap-2">
                      {profile.email && <span className="text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-800/50">{profile.email}</span>}
                      <span>Cargo: <strong className="text-gray-300">{profile.user_role}</strong></span>
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteUser(profile.id, profile.notion_name)}
                    disabled={profile.user_role === 'Admin'}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-30 transition"
                  >
                    Excluir Conta
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'evaluations' ? (
          <div className="grid gap-4">
            {evaluations.length === 0 && <p className="text-gray-400">Nenhuma avaliação encontrada.</p>}
            {evaluations.map(evaluation => {
              
              const avaliadorProfile = profiles.find(p => p.id === evaluation.director_id);
              const avaliadorNome = avaliadorProfile?.notion_name || "Usuário Excluído";
              const avaliadoNome = evaluation.member_name || "Membro Desconhecido";

              const cargoAvaliador = avaliadorProfile?.user_role?.toLowerCase() || '';
              let badgeType = 'Avaliação';
              
              if (cargoAvaliador.includes('membro') || evaluation.evaluation_type === 'membro_diretor') {
                badgeType = 'Membro → Diretor';
              } else if (cargoAvaliador.includes('diretor') || cargoAvaliador.includes('gestor') || evaluation.evaluation_type === 'diretor_membro') {
                badgeType = 'Diretor → Membro';
              } else {
                badgeType = evaluation.evaluation_type?.replace('_', ' ') || 'Avaliação';
              }

              return (
                <div key={evaluation.id} className="flex justify-between items-center bg-[#001A33] p-4 rounded-lg border border-azulClaroBorder/20">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bold text-white text-md">
                        <span className="text-laranja">{avaliadorNome}</span> 
                        <span className="text-gray-400 mx-2 font-normal">avaliou</span> 
                        <span className="text-blue-300">{avaliadoNome}</span>
                      </p>
                      <span className="text-[10px] uppercase tracking-wider bg-blue-900/40 text-blue-300 border border-blue-800/50 px-2 py-0.5 rounded">
                        {badgeType}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      ID: {evaluation.id} <span className="mx-2">|</span> 
                      Data: {new Date(evaluation.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteEvaluation(evaluation.id, 'evaluations')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                  >
                    Apagar
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4">
            {selfEvaluations.length === 0 && <p className="text-gray-400">Nenhuma autoavaliação encontrada.</p>}
            {selfEvaluations.map(selfEval => {
              
              const membroNome = profiles.find(p => p.id === selfEval.user_id)?.notion_name || "Usuário Excluído";

              return (
                <div key={selfEval.id} className="flex justify-between items-center bg-[#001A33] p-4 rounded-lg border border-azulClaroBorder/20">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bold text-white text-md">
                        <span className="text-blue-300">{membroNome}</span>
                      </p>
                      <span className="text-[10px] uppercase tracking-wider bg-green-900/40 text-green-300 border border-green-800/50 px-2 py-0.5 rounded">
                        Autoavaliação
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      ID: {selfEval.id} <span className="mx-2">|</span> 
                      Data: {new Date(selfEval.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteEvaluation(selfEval.id, 'self_evaluations')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                  >
                    Apagar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
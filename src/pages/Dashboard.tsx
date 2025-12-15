import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/AuthProvider";
import EvaluationModal from "../components/EvaluationModal";
import type { EvaluationFormData } from "../components/EvaluationModal";
import Header from "../components/Header";
import Project from "../components/Project/Project";
import StatusEvaluation from "../components/StatusEvaluation";
import { useNavigate } from "react-router-dom";
import { FaChartLine } from "react-icons/fa";

type PendingEvaluationsMap = Map<string, EvaluationFormData>;
type ViewMode = 'team' | 'director';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  // Estados para as listas de membros
  const [teamMembers, setTeamMembers] = useState<string[]>([]); // Colegas (Peers)
  const [projectManagers, setProjectManagers] = useState<string[]>([]); // Gestores (para Membros)
  const [sectorDirectors, setSectorDirectors] = useState<string[]>([]); // Diretores (para Membros)
  
  // Estado específico para quando o Gestor avalia seu Diretor
  const [gestorDirectors, setGestorDirectors] = useState<string[]>([]);

  const [loadingMembers, setLoadingMembers] = useState(false);
  const [evaluatingMember, setEvaluatingMember] = useState<string | null>(null);
  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvaluationsMap>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para controlar a visualização (apenas para Gestores)
  const [viewMode, setViewMode] = useState<ViewMode>('team');
  
  const [localProjectName, setLocalProjectName] = useState('');

  useEffect(() => {
    if (profile?.project_name) {
        setLocalProjectName(profile.project_name);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setLoadingMembers(true);
      
      const fetchTargets = async () => {
        let notionMembersList: string[] = [];

        // 1. BUSCA DA EQUIPE NO NOTION (Para todos)
        const projectFilter = profile.user_role === 'Gestor' ? (localProjectName || profile.project_name) : null;

        const { data: notionData, error: notionError } = await supabase.functions.invoke(
            "get-notion-members",
            {
              method: "POST",
              body: {
                filter_type: profile.user_role,
                filter_value: profile.user_role === 'Gestor' ? projectFilter : (profile.user_role === 'Diretor' ? profile.assessoria : null),
                exclude_name: profile.notion_name,
                user_name: profile.notion_name, 
              },
            }
          );

          if (notionError) {
            console.error("Erro ao buscar do Notion:", notionError);
          } else {
            notionMembersList = [...(notionData.members || [])];
          }

        // 2. BUSCA DE LIDERANÇA NO SUPABASE
        
        // --- CENÁRIO: MEMBRO ---
        if (profile.user_role === 'Membro') {
            // Membro NÃO vê mais colegas para avaliar, apenas líderes.
            // Mas mantemos a busca caso precise no futuro, ou limpamos setTeamMembers.
            setTeamMembers([]); // Limpa ou não usa

            const { data: leadersData } = await supabase
                .from('profiles')
                .select('notion_name, user_role')
                .or(`and(user_role.eq.Diretor,assessoria.eq."${profile.assessoria}"),and(user_role.eq.Gestor,project_name.eq."${profile.project_name}")`);
            
            if (leadersData) {
                const managers = leadersData.filter(l => l.user_role === 'Gestor').map(l => l.notion_name);
                const directors = leadersData.filter(l => l.user_role === 'Diretor').map(l => l.notion_name);
                
                setProjectManagers(managers.filter(name => name !== profile.notion_name));
                setSectorDirectors(directors.filter(name => name !== profile.notion_name));
            }
        } 
        
        // --- CENÁRIO: GESTOR ---
        else if (profile.user_role === 'Gestor') {
            // Gestor vê sua equipe do Notion
            setTeamMembers(notionMembersList.filter(name => name !== profile.notion_name));

            const { data: directorData } = await supabase
                .from('profiles')
                .select('notion_name')
                .eq('user_role', 'Diretor')
                .eq('assessoria', profile.assessoria); 

            if (directorData) {
                setGestorDirectors(directorData.map(d => d.notion_name).filter(name => name !== profile.notion_name));
            }
        }
        
        // --- CENÁRIO: DIRETOR ---
        else if (profile.user_role === 'Diretor') {
             setTeamMembers(notionMembersList.filter(name => name !== profile.notion_name));
        }
        
        setLoadingMembers(false);
      };

      fetchTargets();
    }
  }, [profile, localProjectName]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleEditProjectName = async () => {
    if (!user) return;
    const newName = window.prompt("Novo nome do projeto (Deve ser idêntico à tag no Notion):", localProjectName);
    if (newName && newName !== localProjectName) {
        const { error } = await supabase
            .from('profiles')
            .update({ project_name: newName })
            .eq('id', user.id);

        if (error) {
            alert("Erro ao atualizar nome: " + error.message);
        } else {
            setLocalProjectName(newName);
            alert("Projeto atualizado! Lembre-se que a tag no Notion deve ser igual.");
        }
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm("TEM CERTEZA que deseja excluir sua conta?");
    if (!confirm1) return;
    const confirm2 = window.confirm("Essa ação é IRREVERSÍVEL. Deseja continuar?");
    if (!confirm2) return;

    try {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) throw error;
      alert("Sua conta foi excluída com sucesso.");
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err: any) {
      console.error("Erro:", err);
      alert("Erro ao excluir conta: " + (err.message || "Erro desconhecido"));
    }
  };

  const handleSaveEvaluation = (formData: EvaluationFormData) => {
    if (!evaluatingMember) return;
    const newPendingEvals = new Map(pendingEvaluations);
    newPendingEvals.set(evaluatingMember, formData);
    setPendingEvaluations(newPendingEvals);
    setEvaluatingMember(null);
  };

  const handleSubmitAll = async () => {
    if (!user || !profile) {
      alert("Erro de autenticação. Faça login novamente.");
      return;
    }

    if (pendingEvaluations.size === 0) {
      alert("Nenhuma avaliação pendente para enviar.");
      return;
    }

    const confirm = window.confirm(`Deseja enviar ${pendingEvaluations.size} avaliações?`);
    if (!confirm) return;

    setIsSubmitting(true);

    const evaluationsToInsert = Array.from(pendingEvaluations.entries()).map(
      ([memberName, formData]) => {
        
        // Lógica: Se a pessoa avaliada for um dos líderes, é tipo 'director'
        let type = 'member';
        
        if (
            projectManagers.includes(memberName) || 
            sectorDirectors.includes(memberName) || 
            gestorDirectors.includes(memberName)
        ) {
            type = 'director';
        }

        return {
          director_id: user.id,
          member_name: memberName,
          week_of: new Date().toISOString().split("T")[0],
          evaluation_type: type, 
          ...formData,
        };
      }
    );

    const { error } = await supabase
      .from("evaluations")
      .insert(evaluationsToInsert);

    if (error) {
      alert("Erro ao enviar avaliações: " + error.message);
      console.error(error);
    } else {
      alert(`Sucesso! ${evaluationsToInsert.length} avaliações enviadas.`);
      setPendingEvaluations(new Map());
    }

    setIsSubmitting(false);
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-azulEscuroPage text-gray-300">
        Carregando perfil...
      </div>
    );
  }

  // Cálculo total para o StatusEvaluation
  let totalMembersCount = 0;
  if (profile.user_role === 'Membro') {
      // Membros só avaliam Gestores e Diretores agora
      totalMembersCount = projectManagers.length + sectorDirectors.length;
  } else if (profile.user_role === 'Gestor') {
      totalMembersCount = (viewMode === 'team' ? teamMembers.length : gestorDirectors.length);
  } else {
      totalMembersCount = teamMembers.length;
  }

  return (
    <div className="min-h-screen bg-azulEscuroPage text-gray-200 relative pb-24">
      <div className="p-8 pt-2 mx-auto">
        <Header 
            nome={profile.notion_name} 
            logout={handleLogout} 
            deleteAccount={handleDeleteAccount} 
        />
        
        {loadingMembers ? (
            <div className="mt-10 text-center text-gray-400 animate-pulse">
                Buscando dados...
            </div>
        ) : (
            <>
                {/* --- BOTÃO DE ANALYTICS PARA RH --- */}
                {profile.assessoria === 'Recursos Humanos' && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => navigate('/analytics')}
                            className="flex items-center gap-2 px-6 py-3 bg-[#001A33] border border-azulClaroBorder rounded-lg text-white font-medium hover:bg-azulClaroBorder hover:text-azulEscuroPage transition-all shadow-lg hover:shadow-cyan-500/20 group"
                        >
                            <FaChartLine className="text-laranja group-hover:text-azulEscuroPage transition-colors" />
                            Acessar Painel de Analytics
                        </button>
                    </div>
                )}

                {/* --- RENDERIZAÇÃO PARA MEMBRO (2 Linhas: Gestor e Diretor) --- */}
                {profile.user_role === 'Membro' ? (
                    <div className="flex flex-col gap-8">
                        
                        {/* Linha 1: Gestor do Projeto (Título = Nome do Projeto) */}
                        {projectManagers.length > 0 && (
                            <Project
                                nome={localProjectName || "Projeto"} // Mostra o nome do projeto
                                membros={projectManagers}
                                evaluate={setEvaluatingMember}
                                submit={handleSubmitAll}
                                loading={isSubmitting}
                            />
                        )}

                        {/* Linha 2: Diretor da Assessoria */}
                        {sectorDirectors.length > 0 && (
                            <Project
                                nome={`Diretor (${profile.assessoria})`}
                                membros={sectorDirectors}
                                evaluate={setEvaluatingMember}
                                submit={handleSubmitAll}
                                loading={isSubmitting}
                            />
                        )}

                        {totalMembersCount === 0 && (
                            <p className="text-center text-gray-500 mt-10">
                                Nenhum gestor ou diretor encontrado para avaliar.
                            </p>
                        )}
                    </div>
                ) : (
                    // --- RENDERIZAÇÃO PARA GESTOR E DIRETOR (Mantida) ---
                    <>
                        {/* Toggle para Gestores */}
                        {profile.user_role === 'Gestor' && gestorDirectors.length > 0 && (
                            <div className="flex justify-center gap-4 my-6">
                                <button
                                    onClick={() => setViewMode('team')}
                                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                                        viewMode === 'team' 
                                        ? 'bg-laranja text-white shadow-lg scale-105' 
                                        : 'bg-azulEscuroCard text-gray-400 border border-azulClaroBorder hover:bg-opacity-80'
                                    }`}
                                >
                                    Avaliar Equipe
                                </button>
                                <button
                                    onClick={() => setViewMode('director')}
                                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                                        viewMode === 'director' 
                                        ? 'bg-laranja text-white shadow-lg scale-105' 
                                        : 'bg-azulEscuroCard text-gray-400 border border-azulClaroBorder hover:bg-opacity-80'
                                    }`}
                                >
                                    Avaliar Diretor
                                </button>
                            </div>
                        )}

                        <Project
                            nome={
                                profile.user_role === 'Diretor' ? profile.assessoria :
                                (viewMode === 'team' ? (localProjectName || "Projeto") : `Diretoria (${profile.assessoria})`)
                            }
                            membros={
                                profile.user_role === 'Gestor' && viewMode === 'director' 
                                ? gestorDirectors 
                                : teamMembers
                            }
                            evaluate={setEvaluatingMember}
                            submit={handleSubmitAll}
                            loading={isSubmitting}
                            onEditTitle={(profile.user_role === 'Gestor' && viewMode === 'team') ? handleEditProjectName : undefined}
                        />
                        
                        {teamMembers.length === 0 && (profile.user_role !== 'Gestor' || viewMode === 'team') && (
                            <p className="text-center text-gray-500 mt-4">Ninguém encontrado nesta categoria.</p>
                        )}
                    </>
                )}
            </>
        )}
      </div>

      <StatusEvaluation
        totalMembers={totalMembersCount}
        evaluated={Array.from(pendingEvaluations.keys()).length}
        pending={totalMembersCount - Array.from(pendingEvaluations.keys()).length}
      />

      {evaluatingMember && (
        <EvaluationModal
          memberName={evaluatingMember}
          initialData={pendingEvaluations.get(evaluatingMember)}
          onClose={() => setEvaluatingMember(null)}
          onSubmit={handleSaveEvaluation}
          // Lógica: Se for um dos líderes, usa 'director' (métricas de liderança). Senão, 'member'.
          evaluationType={
            (projectManagers.includes(evaluatingMember) || 
             sectorDirectors.includes(evaluatingMember) || 
             gestorDirectors.includes(evaluatingMember)) 
             ? 'director' 
             : 'member'
          }
        />
      )}
    </div>
  );
}
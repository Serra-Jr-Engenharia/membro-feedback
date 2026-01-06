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
import ReviewModal from "../components/ReviewModal";


type PendingEvaluationsMap = Map<string, EvaluationFormData>;
type ViewMode = 'team' | 'director';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  // Estados para as listas
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [projectManagers, setProjectManagers] = useState<string[]>([]); 
  const [sectorDirectors, setSectorDirectors] = useState<string[]>([]); 
  
  const [gestorDirectors, setGestorDirectors] = useState<string[]>([]);

  const [loadingMembers, setLoadingMembers] = useState(false);
  const [evaluatingMember, setEvaluatingMember] = useState<string | null>(null);
  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvaluationsMap>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('team');
  const [localProjectName, setLocalProjectName] = useState('');

  const [isReviewOpen, setIsReviewOpen] = useState(false);


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
        let discoveredProjectName: string | null = null;

        // 1. BUSCA DA EQUIPE NO NOTION
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
            
            if (notionData.detected_project) {
                discoveredProjectName = notionData.detected_project;
                setLocalProjectName(discoveredProjectName || ""); 
            }
          }

        // 2. LÓGICA DE BUSCA DE LÍDERES (Refatorada para segurança)
        
        // --- CENÁRIO: MEMBRO ---
        if (profile.user_role === 'Membro') {
            setTeamMembers([]); // Limpa lista de pares

            const targetProject = discoveredProjectName || profile.project_name;
            console.log("Projeto Alvo para buscar Gestor:", targetProject);

            // A. BUSCA DIRETORES (Sempre busca pela assessoria)
            const { data: directorsData } = await supabase
                .from('profiles')
                .select('notion_name')
                .eq('user_role', 'Diretor')
                .eq('assessoria', profile.assessoria);
            
            if (directorsData) {
                setSectorDirectors(directorsData.map(d => d.notion_name).filter(n => n !== profile.notion_name));
            }

            // B. BUSCA GESTORES (Só se tiver projeto)
            if (targetProject) {
                const { data: managersData, error: managerError } = await supabase
                    .from('profiles')
                    .select('notion_name')
                    .eq('user_role', 'Gestor')
                    .eq('project_name', targetProject); // Busca exata pelo nome do projeto
                
                if (managerError) {
                    console.error("Erro ao buscar gestor:", managerError);
                }

                if (managersData && managersData.length > 0) {
                    console.log("Gestores encontrados:", managersData);
                    setProjectManagers(managersData.map(m => m.notion_name).filter(n => n !== profile.notion_name));
                } else {
                    console.warn(`Nenhum gestor encontrado no banco para o projeto: "${targetProject}"`);
                }
            }
        } 
        
        // --- CENÁRIO: GESTOR ---
        else if (profile.user_role === 'Gestor') {
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
      totalMembersCount = projectManagers.length + sectorDirectors.length;
  } else if (profile.user_role === 'Gestor') {
      totalMembersCount = (viewMode === 'team' ? teamMembers.length : gestorDirectors.length);
  } else {
      totalMembersCount = teamMembers.length;
  }

  const reviewTargets: { nome: string; evaluationType: 'member' | 'director' }[] = (() => {
    if (!profile) return [];

    if (profile.user_role === 'Membro') {
      const nomes = [...projectManagers, ...sectorDirectors];
      return nomes.map((nome) => ({ nome, evaluationType: 'director' }));
    }

    if (profile.user_role === 'Gestor') {
      if (viewMode === 'director') {
        return gestorDirectors.map((nome) => ({ nome, evaluationType: 'director' }));
      }
      return teamMembers.map((nome) => ({ nome, evaluationType: 'member' }));
    }

    return teamMembers.map((nome) => ({ nome, evaluationType: 'member' }));
  })();


  const reviewItems = reviewTargets.map(({ nome, evaluationType }) => ({
    nome,
    evaluationType,
    data: pendingEvaluations.get(nome) ?? {
      rating_comunicacao: 0,
      rating_proatividade: 0,
      comments: "",
      ...(evaluationType === 'member'
        ? {
            rating_participacao: 0,
            rating_relacao_grupo: 0,
            rating_entrega_metas: 0,
            is_destaque: false,
          }
        : {
            rating_lideranca: 0,
            rating_flexibilidade: 0,
            text_delegacao: "Alguns",
          }),
    },
  }));


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

                {/* --- RENDERIZAÇÃO PARA MEMBRO (2 Linhas Separadas) --- */}
                {profile.user_role === 'Membro' ? (
                    <div className="flex flex-col gap-8">
                        
                        {/* Linha 1: Gestor do Projeto */}
                        {projectManagers.length > 0 ? (
                            <Project
                                nome={localProjectName || "Projeto"} 
                                membros={projectManagers}
                                evaluate={setEvaluatingMember}
                                submit={handleSubmitAll}
                                loading={isSubmitting}
                                onReview={() => setIsReviewOpen(true)}
                            />
                        ) : (
                            <div className="text-center text-gray-500 mt-4 text-sm border border-dashed border-gray-700 rounded p-4">
                                <p>Nenhum gestor encontrado para o projeto: <strong>{localProjectName || "?"}</strong></p>
                                <p className="text-xs mt-1">(Verifique se o Gestor já criou a conta e se o nome do projeto está idêntico no Notion)</p>
                            </div>
                        )}

                        {/* Linha 2: Diretor da Assessoria */}
                        {sectorDirectors.length > 0 && (
                            <Project
                                nome={`Diretor (${profile.assessoria})`}
                                membros={sectorDirectors}
                                evaluate={setEvaluatingMember}
                                submit={handleSubmitAll}
                                loading={isSubmitting}
                                onReview={() => setIsReviewOpen(true)}
                            />
                        )}
                    </div>
                ) : (
                    // --- RENDERIZAÇÃO PARA GESTOR E DIRETOR ---
                    <>
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
                            onReview={() => setIsReviewOpen(true)}
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
          evaluationType={
            (projectManagers.includes(evaluatingMember) || 
             sectorDirectors.includes(evaluatingMember) || 
             gestorDirectors.includes(evaluatingMember)) 
             ? 'director' 
             : 'member'
          }
        />
      )}

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        items={reviewItems}
        title="Resumo das avaliações atuais"
      />

    </div>
  );
}
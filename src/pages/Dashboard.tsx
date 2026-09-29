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
import SelfEvaluationModal from "../components/SelfEvaluationModal";
import type { SelfEvaluationFormData } from "../components/SelfEvaluationModal";
import { getEvaluationStatus } from "../utils/evaluationStatus";

type PendingEvaluationsMap = Map<string, EvaluationFormData>;
type ViewMode = 'team' | 'director';

function getCycleDate(): string {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  return monday.toISOString().split("T")[0];
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [sectorDirectors, setSectorDirectors] = useState<string[]>([]); 
  const [gestorDirectors, setGestorDirectors] = useState<string[]>([]);

  const [loadingMembers, setLoadingMembers] = useState(false);
  const [evaluatingMember, setEvaluatingMember] = useState<string | null>(null);
  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvaluationsMap>(new Map());
  const [isPendingLoaded, setIsPendingLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('team');
  const [localProjectName, setLocalProjectName] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const [selfEvalStatus, setSelfEvalStatus] = useState<'loading' | 'done' | 'pending'>('loading');
  const [isSelfEvalOpen, setIsSelfEvalOpen] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<'pending' | 'up-to-date' | null>(null);

  useEffect(() => {
    if (profile?.project_name) {
        setLocalProjectName(profile.project_name);
    }
  }, [profile]);

  useEffect(() => {
    if (user && !isPendingLoaded) {
      const saved = localStorage.getItem(`pendingEvals_${user.id}`);
      if (saved) {
        try {
          setPendingEvaluations(new Map(JSON.parse(saved)));
        } catch (e) {
          console.error("Erro ao carregar avaliações pendentes", e);
        }
      }
      setIsPendingLoaded(true);
    }
  }, [user, isPendingLoaded]);

  useEffect(() => {
    if (user && isPendingLoaded) {
      localStorage.setItem(`pendingEvals_${user.id}`, JSON.stringify(Array.from(pendingEvaluations.entries())));
    }
  }, [pendingEvaluations, user, isPendingLoaded]);

  useEffect(() => {
    const checkEvaluationStatus = async () => {
      if (!user || !profile) return;
      if (profile.user_role !== 'Membro' && profile.user_role !== 'Diretor') return;

      const { data, error } = await supabase
        .from('evaluations')
        .select('created_at')
        .eq('director_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error("Erro ao buscar datas de avaliação:", error);
        return;
      }

      const lastEvalDateStr = data && data.length > 0 ? data[0].created_at : null;
      const status = getEvaluationStatus(profile.user_role, lastEvalDateStr);
      setEvaluationStatus(status);
    };

    checkEvaluationStatus();
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const checkSelfEvaluation = async () => {
      const { data } = await supabase
        .from("self_evaluations")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_of", getCycleDate())
        .maybeSingle();

      if (!cancelled) {
        setSelfEvalStatus(data ? "done" : "pending");
      }
    };

    checkSelfEvaluation();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (profile) {
      setLoadingMembers(true);
      
      const fetchTargets = async () => {
        let notionMembersList: string[] = [];
        let discoveredProjectName: string | null = null;

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

        if (profile.user_role === 'Membro') {
            const { data: directorsData } = await supabase
                .from('profiles')
                .select('notion_name')
                .eq('user_role', 'Diretor')
                .eq('assessoria', profile.assessoria);
            
            if (directorsData) {
                setSectorDirectors(directorsData.map(d => d.notion_name).filter(n => n !== profile.notion_name));
            }
        } 
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

  const handleSaveEvaluation = (formData: EvaluationFormData) => {
    if (!evaluatingMember) return;
    const newPendingEvals = new Map(pendingEvaluations);
    newPendingEvals.set(evaluatingMember, formData);
    setPendingEvaluations(newPendingEvals);
    setEvaluatingMember(null);
  };

  const handleSubmitSelfEvaluation = async (formData: SelfEvaluationFormData) => {
    if (!user) throw new Error("Usuário não autenticado.");

    const { error } = await supabase
      .from("self_evaluations")
      .upsert(
        {
          user_id: user.id,
          week_of: getCycleDate(),
          ...formData,
        },
        { onConflict: "user_id,week_of" }
      );

    if (error) throw error;
    setSelfEvalStatus("done");
  };

  const handleSubmitAll = async () => {
    if (!user || !profile) {
      alert("Erro de autenticação. Faça login novamente.");
      return;
    }

    if (selfEvalStatus !== 'done') {
      alert("Você precisa concluir sua autoavaliação antes de enviar as avaliações.");
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
        
        if (sectorDirectors.includes(memberName) || gestorDirectors.includes(memberName)) {
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
      setEvaluationStatus('up-to-date');

      if (user) {
        localStorage.removeItem(`pendingEvals_${user.id}`);
      }
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

  let totalMembersCount = 0;
  if (profile.user_role === 'Membro') {
      totalMembersCount = sectorDirectors.length;
  } else if (profile.user_role === 'Gestor') {
      totalMembersCount = (viewMode === 'team' ? teamMembers.length : gestorDirectors.length);
  } else {
      totalMembersCount = teamMembers.length;
  }

  const reviewTargets: { nome: string; evaluationType: 'member' | 'director' }[] = (() => {
    if (!profile) return [];

    if (profile.user_role === 'Membro') {
      const nomes = [...sectorDirectors];
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
        />
        
        <div className="flex justify-center mt-6">
          {selfEvalStatus === 'done' ? (
            <div className="flex items-center gap-2 px-6 py-3 bg-azulEscuroCard border border-green-500/40 rounded-lg text-green-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Autoavaliação concluída
            </div>
          ) : (
            <button
              onClick={() => setIsSelfEvalOpen(true)}
              className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-[#001A33] border border-azulClaroBorder rounded-lg text-white font-medium hover:bg-azulClaroBorder hover:text-azulEscuroPage transition-all shadow-lg hover:shadow-cyan-500/20 group"
            >
              Realizar Autoavaliação
            </button>
          )}
        </div>

        {evaluationStatus && (
            <div className={`mt-4 px-4 py-3 rounded-lg flex items-center justify-center font-medium border shadow-sm transition-all ${
                evaluationStatus === 'up-to-date' 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-laranja/10 text-laranja border-laranja/20'
            }`}>
                {evaluationStatus === 'up-to-date' 
                    ? "✅ Avaliação em dia" 
                    : (profile.user_role === 'Diretor' 
                        ? "⚠️ Avaliação pendente na semana" 
                        : "⚠️ Avaliação quinzenal pendente"
                    )
                }
            </div>
        )}
        
        {loadingMembers ? (
            <div className="mt-10 text-center text-gray-400 animate-pulse">
                Buscando dados...
            </div>
        ) : (
            <>
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

                {profile.user_role === 'Membro' ? (
                    <div className="flex flex-col gap-8 mt-6">
                        {sectorDirectors.length > 0 ? (
                            <Project
                                nome={`Diretor (${profile.assessoria})`}
                                membros={sectorDirectors}
                                evaluate={setEvaluatingMember}
                                submit={handleSubmitAll}
                                loading={isSubmitting}
                                onReview={() => setIsReviewOpen(true)}
                            />
                        ) : (
                            <div className="text-center text-gray-500 mt-4 text-sm border border-dashed border-gray-700 rounded p-4">
                                <p>Nenhum diretor encontrado para a assessoria: <strong>{profile.assessoria}</strong></p>
                            </div>
                        )}
                    </div>
                ) : (
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

                        <div className="mt-6">
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
                        </div>
                        
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
            (sectorDirectors.includes(evaluatingMember) || gestorDirectors.includes(evaluatingMember)) 
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

      {isSelfEvalOpen && (
        <SelfEvaluationModal
          userName={profile.notion_name}
          onClose={() => setIsSelfEvalOpen(false)}
          onSubmit={handleSubmitSelfEvaluation}
        />
      )}

    </div>
  );
}
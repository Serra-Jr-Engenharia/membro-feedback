import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/AuthProvider";
import EvaluationModal from "../components/EvaluationModal";
import type { EvaluationFormData } from "../components/EvaluationModal";
import Header from "../components/Header";
import Project from "../components/Project/Project";
import StatusEvaluation from "../components/StatusEvaluation";

type PendingEvaluationsMap = Map<string, EvaluationFormData>;

type ViewMode = 'team' | 'director';

export default function Dashboard() {
  const { profile, user } = useAuth();
  
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [directors, setDirectors] = useState<string[]>([]);
  
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [evaluatingMember, setEvaluatingMember] = useState<string | null>(null);
  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvaluationsMap>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('team');

  useEffect(() => {
    if (profile) {
      setLoadingMembers(true);
      
      const fetchTargets = async () => {
        let teamList: string[] = [];
        let directorList: string[] = [];

        const { data: notionData, error: notionError } = await supabase.functions.invoke(
            "get-notion-members",
            {
              method: "POST",
              body: {
                filter_type: profile.user_role,
                filter_value: profile.user_role === 'Gestor' ? profile.project_name : (profile.user_role === 'Diretor' ? profile.assessoria : null),
                exclude_name: profile.notion_name,
                user_name: profile.notion_name, 
              },
            }
          );

          if (notionError) {
            console.error("Erro ao buscar do Notion:", notionError);
          } else {
            teamList = [...(notionData.members || [])];
          }
        
        if (profile.user_role === 'Membro') {
            const { data: leadersData } = await supabase
                .from('profiles')
                .select('notion_name')
                .or(`and(user_role.eq.Diretor,assessoria.eq."${profile.assessoria}"),and(user_role.eq.Gestor,project_name.eq."${profile.project_name}")`);
            
            if (leadersData) {
                const leaderNames = leadersData.map(l => l.notion_name);
                teamList = [...teamList, ...leaderNames]; 
            }
        } 
        
        else if (profile.user_role === 'Gestor') {
            const { data: directorData } = await supabase
                .from('profiles')
                .select('notion_name')
                .eq('user_role', 'Diretor')
                .eq('assessoria', profile.assessoria); 
            if (directorData) {
                directorList = directorData.map(d => d.notion_name);
            }
        }

        setTeamMembers([...new Set(teamList)].filter(name => name !== profile.notion_name));
        setDirectors([...new Set(directorList)].filter(name => name !== profile.notion_name));
        
        setLoadingMembers(false);
      };

      fetchTargets();
    }
  }, [profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

    const currentList = (profile.user_role === 'Gestor' && viewMode === 'director') 
      ? directors 
      : teamMembers;

    const currentPendingCount = currentList.filter(m => pendingEvaluations.has(m)).length;

    if (pendingEvaluations.size === 0) {
      alert("Nenhuma avaliação pendente para enviar.");
      return;
    }

    if (currentPendingCount < currentList.length) {
       const remaining = currentList.length - currentPendingCount;
       const confirm = window.confirm(
         `Você avaliou ${currentPendingCount} de ${currentList.length} pessoas desta lista.\n` +
         `Faltam ${remaining}.\n\nDeseja enviar assim mesmo?`
       );
       if (!confirm) return;
    }

    setIsSubmitting(true);

    const evaluationsToInsert = Array.from(pendingEvaluations.entries()).map(
      ([memberName, formData]) => {
        let type = 'member';
        
        if (directors.includes(memberName)) {
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

  const displayedMembers = (profile.user_role === 'Gestor' && viewMode === 'director') 
    ? directors 
    : teamMembers;

  let contextTitle = "";
  if (profile.user_role === "Diretor") contextTitle = profile.assessoria;
  else if (profile.user_role === "Membro") contextTitle = `Equipe e Liderança`;
  else if (profile.user_role === "Gestor") {
      contextTitle = viewMode === 'team' ? (profile.project_name || "Projeto") : `Diretoria (${profile.assessoria})`;
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
                {/* --- TOGGLE PARA GESTORES --- */}
                {/* Só aparece se for Gestor e houver diretores para avaliar */}
                {profile.user_role === 'Gestor' && directors.length > 0 && (
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
                    nome={contextTitle}
                    membros={displayedMembers}
                    evaluate={setEvaluatingMember}
                    submit={handleSubmitAll}
                    loading={isSubmitting}
                />
                
                {/* Mensagem caso a lista esteja vazia */}
                {displayedMembers.length === 0 && (
                    <p className="text-center text-gray-500 mt-4">
                        Ninguém encontrado nesta categoria.
                    </p>
                )}
            </>
        )}
      </div>

      <StatusEvaluation
        totalMembers={displayedMembers.length}
        evaluated={Array.from(pendingEvaluations.keys()).filter(m => displayedMembers.includes(m)).length}
        pending={displayedMembers.length - Array.from(pendingEvaluations.keys()).filter(m => displayedMembers.includes(m)).length}
      />

      {evaluatingMember && (
        <EvaluationModal
          memberName={evaluatingMember}
          initialData={pendingEvaluations.get(evaluatingMember)}
          onClose={() => setEvaluatingMember(null)}
          onSubmit={handleSaveEvaluation}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/AuthProvider";
import EvaluationModal from "../components/EvaluationModal";
import type { EvaluationFormData } from "../components/EvaluationModal"; // Importa a interface
import Header from "../components/Header";
import Project from "../components/Project/Project";
import StatusEvaluation from "../components/StatusEvaluation";

type PendingEvaluationsMap = Map<string, EvaluationFormData>;

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [members, setMembers] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [evaluatingMember, setEvaluatingMember] = useState<string | null>(null);
  const [pendingEvaluations, setPendingEvaluations] =
    useState<PendingEvaluationsMap>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setLoadingMembers(true);
      const fetchMembers = async () => {
        const { data, error } = await supabase.functions.invoke(
          "get-notion-members",
          {
            method: "POST",
            body: {
              assessoria: profile.assessoria,
              exclude_name: profile.notion_name,
            },
          }
        );
        if (error) {
          console.error("Erro ao buscar membros:", error);
          alert("Não foi possível carregar os membros do Notion.");
        } else {
          setMembers(data.members);
        }
        setLoadingMembers(false);
      };
      fetchMembers();
    }
  }, [profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSaveEvaluation = (formData: EvaluationFormData) => {
    if (!evaluatingMember) return;

    const newPendingEvals = new Map(pendingEvaluations);

    newPendingEvals.set(evaluatingMember, formData);

    setPendingEvaluations(newPendingEvals);

    setEvaluatingMember(null);
  };

  const handleSubmitAll = async () => {
    if (!user) {
      alert("Erro de autenticação. Faça login novamente.");
      return;
    }

    if (members.length === 0) {
      alert("Nenhum membro carregado para avaliação.");
      return;
    }

    if (pendingEvaluations.size < members.length) {
      const remaining = members.length - pendingEvaluations.size;
      alert(
        `Você ainda não avaliou todos os membros.\nFaltam ${remaining} ${
          remaining === 1 ? "membro" : "membros"
        } para avaliar.`
      );
      return;
    }

    if (pendingEvaluations.size === 0) {
      alert("Nenhuma avaliação pendente para enviar.");
      return;
    }

    setIsSubmitting(true);

    const evaluationsToInsert = Array.from(pendingEvaluations.entries()).map(
      ([memberName, formData]) => {
        return {
          director_id: user.id,
          member_name: memberName,
          week_of: new Date().toISOString().split("T")[0],
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
      alert(
        `Sucesso! ${evaluationsToInsert.length} ${
          evaluationsToInsert.length === 1
            ? "avaliação foi enviada"
            : "avaliações foram enviadas"
        }.`
      );
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

  const contextDisplay =
    profile.user_role === "Gestor" ? profile.project_name : profile.assessoria;

  return (
    <div className="min-h-screen bg-azulEscuroPage text-gray-200 relative pb-24">
      <div className="p-8 pt-2 mx-auto">
        <Header nome={profile.notion_name} logout={handleLogout} />
        <Project
          nome={profile.assessoria}
          membros={members}
          evaluate={setEvaluatingMember}
          submit={handleSubmitAll}
        />
      </div>

      <StatusEvaluation
        totalMembers={members.length}
        evaluated={pendingEvaluations.size}
        pending={members.length - pendingEvaluations.size}
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

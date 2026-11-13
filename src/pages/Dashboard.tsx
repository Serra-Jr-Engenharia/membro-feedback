import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/AuthProvider";
import EvaluationModal from "../components/EvaluationModal";
import type { EvaluationFormData } from "../components/EvaluationModal";
import Header from "../components/Header";
import Project from "../components/Project/Project";
import Button from "../components/Project/Button";
import ViewSelfEvaluationModal from "../components/ViewSelfEvaluationModal";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaClipboardCheck, FaExclamationTriangle } from "react-icons/fa";
import ReviewModal from "../components/ReviewModal";
import SelfEvaluationModal from "../components/SelfEvaluationModal";
import type { SelfEvaluationFormData } from "../components/SelfEvaluationModal";
import {
  getCycleDateISO,
  getCycleStartDate,
  getEvaluationStatus,
} from "../utils/evaluationStatus";
import {
  formatCycleRange,
  type SelfEvaluationRecord,
} from "../utils/selfEvaluation";

type PendingEvaluationsMap = Map<string, EvaluationFormData>;
type ViewMode = 'team' | 'director';

function isMeaningfulEvaluationDraft(draft: EvaluationFormData): boolean {
  return Boolean(
    draft.rating_comunicacao > 0 ||
    draft.rating_proatividade > 0 ||
    (draft.rating_participacao ?? 0) > 0 ||
    (draft.rating_relacao_grupo ?? 0) > 0 ||
    (draft.rating_entrega_metas ?? 0) > 0 ||
    (draft.rating_lideranca ?? 0) > 0 ||
    (draft.rating_flexibilidade ?? 0) > 0 ||
    draft.is_destaque ||
    (draft.comments ?? "").trim().length > 0 ||
    (draft.text_delegacao ?? "Alguns") !== "Alguns"
  );
}

function hasMeaningfulSelfEvaluationDraft(userName: string): boolean {
  try {
    const raw = localStorage.getItem(`draft_self_eval_${userName}`);
    if (!raw) return false;

    const draft = JSON.parse(raw) as {
      formData?: Partial<SelfEvaluationFormData>;
      comments?: string;
    };
    const data = draft.formData ?? {};

    return Boolean(
      data.rating_rendimento ||
      data.rating_entregas ||
      data.rating_consistencia ||
      (data.rating_melhoria ?? "").trim().length > 0 ||
      (data.rating_fatores ?? "").trim().length > 0 ||
      (draft.comments ?? "").trim().length > 0
    );
  } catch (e) {
    console.error("Erro ao verificar rascunho da autoavaliação", e);
    return false;
  }
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [sectorDirectors, setSectorDirectors] = useState<string[]>([]); 
  const [gestorDirectors, setGestorDirectors] = useState<string[]>([]);
  const [leaderNames, setLeaderNames] = useState<Set<string>>(new Set());

  const [loadingMembers, setLoadingMembers] = useState(false);
  const [evaluatingMember, setEvaluatingMember] = useState<string | null>(null);
  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvaluationsMap>(new Map());
  const [evaluatedInDb, setEvaluatedInDb] = useState<Set<string>>(new Set());
  const [isPendingLoaded, setIsPendingLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('team');
  const [localProjectName, setLocalProjectName] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const [selfEvalStatus, setSelfEvalStatus] = useState<'loading' | 'done' | 'pending'>('loading');
  const [pendingSelfEvaluation, setPendingSelfEvaluation] = useState<SelfEvaluationFormData | null>(null);
  const [isSelfEvalOpen, setIsSelfEvalOpen] = useState(false);
  const [currentSelfEvaluation, setCurrentSelfEvaluation] = useState<SelfEvaluationRecord | null>(null);
  const [viewedSelfEvaluation, setViewedSelfEvaluation] = useState<SelfEvaluationRecord | null>(null);
  const [hasSelfEvalDraft, setHasSelfEvalDraft] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<'pending' | 'up-to-date' | null>(null);

  useEffect(() => {
    if (profile?.project_name) {
        setLocalProjectName(profile.project_name);
    }
  }, [profile?.project_name]);

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
      const savedSelf = localStorage.getItem(`pendingSelfEval_${user.id}`);
      if (savedSelf) {
        try {
          setPendingSelfEvaluation(JSON.parse(savedSelf));
        } catch (e) {
          console.error("Erro ao carregar autoavaliação pendente", e);
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
    if (user && isPendingLoaded) {
      if (pendingSelfEvaluation) {
        localStorage.setItem(`pendingSelfEval_${user.id}`, JSON.stringify(pendingSelfEvaluation));
      } else {
        localStorage.removeItem(`pendingSelfEval_${user.id}`);
      }
    }
  }, [pendingSelfEvaluation, user, isPendingLoaded]);

  const checkSelfEvalDraft = useCallback(() => {
    if (!profile?.notion_name) {
      setHasSelfEvalDraft(false);
      return;
    }
    setHasSelfEvalDraft(hasMeaningfulSelfEvaluationDraft(profile.notion_name));
  }, [profile?.notion_name]);

  useEffect(() => {
    if (!isSelfEvalOpen) {
      checkSelfEvalDraft();
    }
  }, [isSelfEvalOpen, checkSelfEvalDraft]);

  useEffect(() => {
    const checkEvaluationStatus = async () => {
      if (!user || !profile) return;

      const cycleStart = getCycleStartDate();

      const { data, error } = await supabase
        .from('evaluations')
        .select('member_name, created_at')
        .eq('director_id', user.id)
        .gte('created_at', cycleStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar datas de avaliação:", error);
        return;
      }

      if (data) {
        const evaluatedNames = new Set(data.map((e) => e.member_name));
        setEvaluatedInDb(evaluatedNames);
      }

      if (profile.user_role === 'Membro' || profile.user_role === 'Diretor') {
        const lastEvalDate = data && data.length > 0 ? data[0].created_at : null;
        setEvaluationStatus(getEvaluationStatus(lastEvalDate));
      }
    };

    checkEvaluationStatus();
  }, [user, profile]);

  const refreshSelfEvaluations = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("self_evaluations")
      .select("*")
      .eq("user_id", user.id)
      .order("week_of", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Erro ao buscar autoavaliações:", error);
      return;
    }

    const records = (data ?? []) as SelfEvaluationRecord[];
    const currentCycle = getCycleDateISO();
    const current = records.find((record) => record.week_of === currentCycle) ?? null;

    setCurrentSelfEvaluation(current);
    setSelfEvalStatus(current ? "done" : "pending");

    if (current) {
      setPendingSelfEvaluation(null);
      localStorage.removeItem(`pendingSelfEval_${user.id}`);
    }
  }, [user]);

  useEffect(() => {
    refreshSelfEvaluations();
  }, [refreshSelfEvaluations]);

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
            
            if (notionData.detected_project && notionData.detected_project !== localProjectName) {
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

             const { data: leaderData } = await supabase
                .from('profiles')
                .select('notion_name, user_role')
                .eq('assessoria', profile.assessoria)
                .in('user_role', ['Diretor', 'Gestor']);

             if (leaderData) {
                setLeaderNames(new Set(
                    leaderData
                        .map((leader) => leader.notion_name)
                        .filter((name): name is string => Boolean(name))
                ));
             }
        }
        
        setLoadingMembers(false);
      };

      fetchTargets();
    }
  }, [profile, localProjectName]);

  useEffect(() => {
    if (!user || !profile || !isPendingLoaded) return;

    const targetNames =
      profile.user_role === 'Membro'
        ? sectorDirectors
        : profile.user_role === 'Gestor' && viewMode === 'director'
          ? gestorDirectors
          : teamMembers;

    if (targetNames.length === 0) return;

    setPendingEvaluations((prev) => {
      const next = new Map(prev);
      let changed = false;

      for (const name of targetNames) {
        if (next.has(name) || evaluatedInDb.has(name)) continue;

        const raw = localStorage.getItem(`draft_eval_${name}`);
        if (!raw) continue;

        try {
          const draft = JSON.parse(raw) as EvaluationFormData;
          if (!isMeaningfulEvaluationDraft(draft)) continue;
          next.set(name, draft);
          changed = true;
        } catch (e) {
          console.error("Erro ao carregar rascunho de avaliação", e);
        }
      }

      return changed ? next : prev;
    });
  }, [
    user,
    profile,
    isPendingLoaded,
    sectorDirectors,
    gestorDirectors,
    teamMembers,
    viewMode,
    evaluatedInDb,
    evaluatingMember,
  ]);

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

  const handleSaveSelfEvaluation = (formData: SelfEvaluationFormData) => {
    setPendingSelfEvaluation(formData);
    setIsSelfEvalOpen(false);
  };

  const getEvaluationType = (name: string): 'member' | 'director' => {
    if (!profile) return 'member';
    if (profile.user_role === 'Membro') {
      return sectorDirectors.includes(name) ? 'director' : 'member';
    }
    if (profile.user_role === 'Gestor') {
      return gestorDirectors.includes(name) ? 'director' : 'member';
    }
    if (profile.user_role === 'Diretor') {
      return leaderNames.has(name) ? 'director' : 'member';
    }
    return 'member';
  };

  const handleSubmitAll = async () => {
    if (!user || !profile) {
      alert("Erro de autenticação. Faça login novamente.");
      return;
    }

    if (selfEvalStatus !== 'done' && !pendingSelfEvaluation) {
      alert("Você precisa concluir sua autoavaliação antes de enviar as avaliações.");
      return;
    }

    if (pendingEvaluations.size === 0) {
      alert("Nenhuma avaliação pendente para enviar.");
      return;
    }

    const incompleteEvaluations = Array.from(pendingEvaluations.entries()).filter(
      ([name, data]) => {
        const type = getEvaluationType(name);
        const required =
          type === 'director'
            ? [
                data.rating_comunicacao,
                data.rating_proatividade,
                data.rating_lideranca,
                data.rating_flexibilidade,
              ]
            : [
                data.rating_comunicacao,
                data.rating_proatividade,
                data.rating_participacao,
                data.rating_relacao_grupo,
                data.rating_entrega_metas,
              ];

        return required.some((value) => !value || value < 1);
      }
    );

    if (incompleteEvaluations.length > 0) {
      alert(
        `Conclua a avaliação de: ${incompleteEvaluations
          .map(([name]) => name)
          .join(', ')} antes de enviar.`
      );
      return;
    }

    const confirmMessage = pendingSelfEvaluation
      ? `Deseja enviar ${pendingEvaluations.size} avaliação(ões) e sua autoavaliação?`
      : `Deseja enviar ${pendingEvaluations.size} avaliações?`;
    const confirm = window.confirm(confirmMessage);
    if (!confirm) return;

    setIsSubmitting(true);

    if (pendingSelfEvaluation) {
      const { error: selfEvalError } = await supabase
        .from("self_evaluations")
        .upsert(
          {
            user_id: user.id,
            week_of: getCycleDateISO(),
            ...pendingSelfEvaluation,
          },
          { onConflict: "user_id,week_of" }
        );

      if (selfEvalError) {
        alert("Erro ao enviar autoavaliação: " + selfEvalError.message);
        console.error(selfEvalError);
        setIsSubmitting(false);
        return;
      }
    }

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
      if (pendingSelfEvaluation) {
        await refreshSelfEvaluations();
      }

      alert(
        pendingSelfEvaluation
          ? `Sucesso! ${evaluationsToInsert.length} avaliação(ões) e sua autoavaliação foram enviadas.`
          : `Sucesso! ${evaluationsToInsert.length} avaliações enviadas.`
      );
      setEvaluatedInDb((prev) => {
        const next = new Set(prev);
        for (const [memberName] of pendingEvaluations) {
          next.add(memberName);
        }
        return next;
      });
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

  const selfEvaluationState: 'done' | 'draft' | 'pending' | 'loading' =
    selfEvalStatus === 'loading'
      ? 'loading'
      : selfEvalStatus === 'done'
        ? 'done'
        : pendingSelfEvaluation || hasSelfEvalDraft
          ? 'draft'
          : 'pending';

  const memberTargetActionTitle = 'Avaliar diretor';

  const memberTargetDescription = `Avalie a liderança e o suporte da diretoria de ${profile.assessoria} neste ciclo.`;

  const teamTargetActionTitle =
    profile.user_role === 'Diretor'
      ? 'Avaliar membros'
      : viewMode === 'director'
        ? 'Avaliar diretores'
        : (localProjectName || 'Projeto');

  const teamTargetDescription =
    profile.user_role === 'Diretor'
      ? `Avalie o desempenho da equipe de ${profile.assessoria} neste ciclo.`
      : viewMode === 'director'
        ? `Avalie a liderança da diretoria de ${profile.assessoria} neste ciclo.`
        : 'Avalie o desempenho dos membros do seu projeto neste ciclo.';

  const targetCycleStart = getCycleStartDate();

  const targetPeriodLabel = formatCycleRange(targetCycleStart);

  const selfEvaluationPeriodLabel = currentSelfEvaluation
    ? formatCycleRange(currentSelfEvaluation.week_of)
    : formatCycleRange(getCycleStartDate());

  const handleSelfEvaluationAction = () => {
    if (selfEvaluationState === 'done' && currentSelfEvaluation) {
      setViewedSelfEvaluation(currentSelfEvaluation);
      return;
    }
    setIsSelfEvalOpen(true);
  };

  const getMemberStatus = (name: string): 'evaluated' | 'draft' | 'pending' => {
    if (evaluatedInDb.has(name)) return 'evaluated';
    if (pendingEvaluations.has(name)) return 'draft';
    return 'pending';
  };

  const reviewTargets: { nome: string; evaluationType: 'member' | 'director' }[] = (() => {
    if (!profile) return [];

    if (profile.user_role === 'Membro') {
      return sectorDirectors.map((nome) => ({
        nome,
        evaluationType: getEvaluationType(nome),
      }));
    }

    if (profile.user_role === 'Gestor') {
      if (viewMode === 'director') {
        return gestorDirectors.map((nome) => ({
          nome,
          evaluationType: getEvaluationType(nome),
        }));
      }
      return teamMembers.map((nome) => ({
        nome,
        evaluationType: getEvaluationType(nome),
      }));
    }

    return teamMembers.map((nome) => ({
      nome,
      evaluationType: getEvaluationType(nome),
    }));
  })();

  const reviewItems = reviewTargets.flatMap(({ nome, evaluationType }) => {
    const data = pendingEvaluations.get(nome);
    return data ? [{ nome, evaluationType, data }] : [];
  });

  const evaluationCount = reviewTargets.length;

  const selfEvaluationForReview: SelfEvaluationFormData | null =
    pendingSelfEvaluation ??
    (currentSelfEvaluation
      ? {
          rating_rendimento: currentSelfEvaluation.rating_rendimento,
          rating_entregas: currentSelfEvaluation.rating_entregas,
          rating_consistencia: currentSelfEvaluation.rating_consistencia,
          rating_melhoria: currentSelfEvaluation.rating_melhoria,
          rating_fatores: currentSelfEvaluation.rating_fatores,
          comments: currentSelfEvaluation.comments ?? undefined,
        }
      : null);

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

      <main className="max-w-7xl 2xl:max-w-[90rem] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-32 flex flex-col gap-10">

        {/* --- HERO SECTION --- */}
        <section className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex flex-col justify-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Visão Geral
            </h1>
            <p className="max-w-md text-gray-400">
              Acompanhe seus ciclos de avaliação, dê feedback à sua equipe e mantenha o time alinhado com excelência.
            </p>
            <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200">
              {targetPeriodLabel}
            </span>
          </div>

          {selfEvaluationState === 'done' ? (
            <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 px-5 py-4 font-medium text-success shadow-lg">
              <span className="h-3 w-3 shrink-0 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
              <div>
                <p className="font-semibold text-white">Autoavaliação concluída</p>
                <p className="text-sm text-success/80">
                  Você já registrou sua reflexão deste ciclo.
                </p>
                {currentSelfEvaluation && (
                  <button
                    type="button"
                    onClick={handleSelfEvaluationAction}
                    className="mt-2 cursor-pointer text-xs font-semibold text-accent-500 underline-offset-4 transition-colors hover:text-accent-400 hover:underline"
                  >
                    Ver autoavaliação
                  </button>
                )}
              </div>
            </div>
          ) : selfEvaluationState === 'loading' ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <p>Verificando autoavaliação...</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSelfEvaluationAction}
              className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-accent-500/50 bg-accent-500/10 px-5 py-4 text-left font-medium text-white shadow-lg transition-all hover:border-accent-500"
            >
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-white">
                    {selfEvaluationState === 'draft'
                      ? 'Autoavaliação preenchida'
                      : 'Realizar autoavaliação'}
                  </p>
                  {selfEvaluationState === 'draft' && (
                    <span className="rounded-full border border-accent-500/40 bg-accent-500/15 px-2 py-0.5 text-[11px] font-semibold text-accent-500">
                      Rascunho salvo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 transition-colors group-hover:text-gray-300">
                  {selfEvaluationState === 'draft' ? (
                    <>
                      Será enviada junto com as avaliações.{' '}
                      <em className="italic">Clique para editar.</em>
                    </>
                  ) : (
                    'Reserve um instante para refletir sobre seu ciclo.'
                  )}
                </p>
              </div>
              <FaClipboardCheck className="shrink-0 text-2xl text-accent-500" />
            </button>
          )}
        </section>

        {evaluationStatus && (
          <div
            className={`animate-fade-in mx-auto flex w-fit items-center justify-center gap-2 rounded-2xl border bg-white/5 px-5 py-4 text-center font-medium shadow-lg backdrop-blur-md ${
              evaluationStatus === 'up-to-date'
                ? 'border-success/30 text-success'
                : 'border-accent-500/40 text-accent-500'
            }`}
          >
            <span>
              {evaluationStatus === 'up-to-date'
                ? 'Avaliação em dia'
                : 'Avaliação quinzenal pendente'}
            </span>
            {evaluationStatus === 'up-to-date' ? (
              <FaCheckCircle className="shrink-0 text-xl" />
            ) : (
              <FaExclamationTriangle className="shrink-0 text-xl" />
            )}
          </div>
        )}

        {/* --- BOTÃO DE ANALYTICS PARA RH --- */}
        {profile.assessoria === 'Recursos Humanos' && (
            <div className="flex justify-center">
                <button
                    onClick={() => navigate('/analytics')}
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-lg active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
                >
                    Acessar painel de analytics
                </button>
            </div>
        )}

        {/* --- BLOCO DE AVALIAÇÕES --- */}
        <section className="w-full rounded-3xl border border-white/10 bg-azulEscuroCard/80 p-6 shadow-xl backdrop-blur sm:p-8">
            {loadingMembers ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-gray-400">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
                    <p className="animate-pulse">Buscando dados...</p>
                </div>
            ) : profile.user_role === 'Membro' ? (
                sectorDirectors.length > 0 ? (
                    <Project
                        nome={memberTargetActionTitle}
                        descricao={memberTargetDescription}
                        membros={sectorDirectors}
                        evaluate={setEvaluatingMember}
                        getMemberStatus={getMemberStatus}
                    />
                ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center">
                        <p className="text-sm text-gray-400">
                            Nenhum diretor encontrado para a assessoria{' '}
                            <strong className="font-semibold text-gray-200">
                                {profile.assessoria}
                            </strong>.
                        </p>
                    </div>
                )
            ) : (
                <div className="flex flex-col gap-6">
                    {profile.user_role === 'Gestor' && gestorDirectors.length > 0 && (
                        <div className="flex justify-center">
                            <div className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                                <button
                                    onClick={() => setViewMode('team')}
                                    className={`cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 motion-reduce:transform-none motion-reduce:transition-none ${
                                        viewMode === 'team'
                                        ? 'bg-accent-500 text-white shadow'
                                        : 'text-brand-200 hover:text-white'
                                    }`}
                                >
                                    Equipe
                                </button>
                                <button
                                    onClick={() => setViewMode('director')}
                                    className={`cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 motion-reduce:transform-none motion-reduce:transition-none ${
                                        viewMode === 'director'
                                        ? 'bg-accent-500 text-white shadow'
                                        : 'text-brand-200 hover:text-white'
                                    }`}
                                >
                                    Diretores
                                </button>
                            </div>
                        </div>
                    )}

                    <Project
                        nome={teamTargetActionTitle}
                        descricao={teamTargetDescription}
                        membros={
                            profile.user_role === 'Gestor' && viewMode === 'director'
                            ? gestorDirectors
                            : teamMembers
                        }
                        evaluate={setEvaluatingMember}
                        onEditTitle={(profile.user_role === 'Gestor' && viewMode === 'team') ? handleEditProjectName : undefined}
                        getMemberStatus={getMemberStatus}
                    />
                </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <Button tipo={1} submit={handleSubmitAll} onReview={() => setIsReviewOpen(true)} count={evaluationCount} />
                <Button tipo={0} submit={handleSubmitAll} loading={isSubmitting} count={evaluationCount} />
            </div>
        </section>
      </main>

      {evaluatingMember && (
        <EvaluationModal
          memberName={evaluatingMember}
          initialData={pendingEvaluations.get(evaluatingMember)}
          onClose={() => setEvaluatingMember(null)}
          onSubmit={handleSaveEvaluation}
          evaluationType={getEvaluationType(evaluatingMember)}
        />
      )}

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        items={reviewItems}
        selfEvaluation={
          selfEvaluationForReview
            ? {
                data: selfEvaluationForReview,
                periodLabel: selfEvaluationPeriodLabel,
              }
            : null
        }
        title={evaluationCount === 1 ? "Revisar avaliação do ciclo" : "Revisar avaliações do ciclo"}
      />

      {isSelfEvalOpen && (
        <SelfEvaluationModal
          userName={profile.notion_name}
          initialData={pendingSelfEvaluation ?? undefined}
          onClose={() => setIsSelfEvalOpen(false)}
          onSubmit={handleSaveSelfEvaluation}
        />
      )}

      {viewedSelfEvaluation && (
        <ViewSelfEvaluationModal
          evaluation={viewedSelfEvaluation}
          onClose={() => setViewedSelfEvaluation(null)}
        />
      )}

    </div>
  );
}

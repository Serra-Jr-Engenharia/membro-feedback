import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/AuthProvider'
import EvaluationModal from '../components/EvaluationModal'
import type { EvaluationFormData } from '../components/EvaluationModal' // Importa a interface

type PendingEvaluationsMap = Map<string, EvaluationFormData>;

export default function Dashboard() {
  const { profile, user } = useAuth()
  const [members, setMembers] = useState<string[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [evaluatingMember, setEvaluatingMember] = useState<string | null>(null)
  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvaluationsMap>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false); 

  
  useEffect(() => {
    if (profile) {
      setLoadingMembers(true);
      const fetchMembers = async () => {
        const { data, error } = await supabase.functions.invoke(
          'get-notion-members',
          {
            method: 'POST',
            body: { 
              assessoria: profile.assessoria,
              exclude_name: profile.notion_name,
            },
          }
        );
        if (error) {
          console.error('Erro ao buscar membros:', error);
          alert('Não foi possível carregar os membros do Notion.');
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
    if (pendingEvaluations.size === 0 || !user) {
      alert("Nenhuma avaliação pendente para enviar.");
      return;
    }

    setIsSubmitting(true);

    const evaluationsToInsert = Array.from(pendingEvaluations.entries()).map(
      ([memberName, formData]) => {
        return {
          director_id: user.id,
          member_name: memberName,
          week_of: new Date().toISOString().split('T')[0],
          ...formData 
        };
      }
    );

    const { error } = await supabase
      .from('evaluations')
      .insert(evaluationsToInsert); 

    if (error) {
      alert('Erro ao enviar avaliações: ' + error.message);
      console.error(error);
    } else {
      alert(`Sucesso! ${evaluationsToInsert.length} ${evaluationsToInsert.length === 1 ? 'avaliação foi enviada' : 'avaliações foram enviadas'}.`);
      setPendingEvaluations(new Map());
    }

    setIsSubmitting(false);
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#000D1A] text-gray-300">
        Carregando perfil...
      </div>
    );
  }

  const contextDisplay = profile.user_role === 'Gestor' 
    ? profile.project_name 
    : profile.assessoria;

  return (
    <div className="min-h-screen bg-[#000D1A] text-gray-200">
      
      <div className="p-8 max-w-4xl mx-auto">
        
        {/* --- Cabeçalho --- */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#001A33]">
          <div>
            <h1 className="text-3xl font-bold text-white">Olá, {profile.notion_name}</h1>
            <p className="text-xl text-gray-400">
              {profile.user_role}: <span className="font-semibold text-[#FF6600]">{contextDisplay}</span>
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-white bg-[#FF6600] rounded-lg hover:opacity-90 transition-opacity"
          >
            Sair
          </button>
        </div>

        {/* --- Card de Envio Pendente --- */}
        {pendingEvaluations.size > 0 && (
          <div className="my-6 p-4 bg-[#001A33] rounded-lg flex justify-between items-center animate-pulse">
            <span className="text-white font-medium">
              Você tem {pendingEvaluations.size} {pendingEvaluations.size === 1 ? 'avaliação preenchida' : 'avaliações preenchidas'}.
            </span>
            <button
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              className="px-5 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Todas'}
            </button>
          </div>
        )}

        {/* --- Lista de Membros --- */}
        <h2 className="mt-8 text-2xl font-bold text-white">
          Membros para Avaliar (<span className="text-[#FF6600]">{profile.assessoria}</span>)
        </h2>
        
        {loadingMembers ? (
          <p className="text-gray-400 mt-4">Carregando membros do Notion...</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {members.length === 0 ? (
              <p className="text-gray-500">Nenhum membro encontrado.</p>
            ) : (
              members.map((name) => {
                
                const isPending = pendingEvaluations.has(name);

                return (
                  <li 
                    key={name} 
                    className={`flex justify-between items-center p-4 bg-[#001429] rounded-lg shadow-xl transition-all ${
                      isPending ? 'border-l-4 border-yellow-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <span className="text-lg text-white">{name}</span>
                    
                    <button
                      onClick={() => setEvaluatingMember(name)}
                      className={`px-4 py-2 text-sm text-white font-medium rounded-lg hover:opacity-90 transition-all ${
                        isPending ? 'bg-yellow-500' : 'bg-[#FF6600]'
                      }`}
                    >
                      {isPending ? 'Editar' : 'Avaliar'}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {/* --- O Modal (Atualizado) --- */}
      {evaluatingMember && (
        <EvaluationModal
          memberName={evaluatingMember}
          initialData={pendingEvaluations.get(evaluatingMember)} 
          onClose={() => setEvaluatingMember(null)}
          onSubmit={handleSaveEvaluation} 
        />
      )}
    </div>
  )
}
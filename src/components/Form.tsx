import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import serraLogo from '/LogoSerra.png';
import { cn } from '@/lib/utils';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// Interface para os dados do membro que virão da nossa API
interface Member {
  id: string;
  name: string;
  assessoria: string; // Trocamos 'sector' por 'assessoria'
}

// Interface para os membros agrupados
interface GroupedMembers {
  [key: string]: Member[];
}

// --- NOSSAS NOVAS DEFINIÇÕES DE AVALIAÇÃO ---

// 1. Defina os aspectos (TBD)
const evaluationAspects = [
  { key: 'proatividade', label: 'Proatividade' },
  { key: 'comunicacao', label: 'Comunicação' },
  { key: 'tecnico', label: 'Conhecimento Técnico' },
  { key: 'equipe', label: 'Trabalho em Equipe' },
  { key: 'entregas', label: 'Qualidade/Prazo das Entregas' },
];

// 2. Mapeamento de notas para emotes
const emojiMap: { [key: number]: string } = {
  1: '😠', // Muito Ruim
  2: '😕', // Ruim
  3: '😐', // Regular
  4: '🙂', // Bom
  5: '😄', // Ótimo
};

// ----------------------------------------------

export function EvaluationForm() {
  // Estados para os campos do formulário
  const [directorName, setDirectorName] = useState('');
  const [evaluationText, setEvaluationText] = useState('');
  
  // Novo estado para os critérios (ex: { proatividade: 5, comunicacao: 3 })
  const [ratings, setRatings] = useState<{ [key: string]: number | null }>({});

  // Estados para a lista de membros vinda do Notion
  const [groupedMembers, setGroupedMembers] = useState<GroupedMembers>({}); // Alterado
  const [selectedMember, setSelectedMember] = useState(''); // Armazena o NOME do membro
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  
  // Estados de status do formulário
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // useEffect para buscar os membros da nossa API (agora agrupados)
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Esta é a rota que criamos (ex: /api/get-members)
        const response = await fetch('/api/get-members');
        if (!response.ok) {
          throw new Error('Falha ao buscar dados');
        }
        const data = await response.json();
        // Espera 'groupedMembers' da API atualizada
        setGroupedMembers(data.groupedMembers || {}); 
      } catch (error) {
        console.error("Não foi possível carregar os membros", error);
        setErrorMessage("Erro ao carregar a lista de membros do Notion.");
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validação
    const allAspectsRated = evaluationAspects.every(aspect => ratings[aspect.key] && ratings[aspect.key] > 0);

    if (!directorName || !selectedMember || !allAspectsRated) {
      setErrorMessage('Por favor, preencha seu nome, selecione um membro e avalie todos os critérios.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    // Inserir na tabela 'member_evaluations' do Supabase
    // ATENÇÃO: Verifique se sua tabela no Supabase agora tem a coluna 'ratings' do tipo 'jsonb'
    // e se você removeu a coluna antiga 'score'.
    const { error } = await supabase.from('member_evaluations').insert([
      { 
        director_name: directorName, 
        member_name: selectedMember, 
        evaluation_text: evaluationText,
        ratings: ratings, // Salva o objeto JSON com todas as notas
      }
    ]);

    if (error) {
      console.error('Erro do Supabase:', error.message);
      setErrorMessage('Ocorreu um erro ao enviar sua avaliação. Tente novamente.');
      setStatus('error');
    } else {
      // Sucesso!
      setStatus('success');
      // Limpa o formulário
      setDirectorName('');
      setSelectedMember('');
      setEvaluationText('');
      setRatings({}); // Limpa o estado dos ratings
    }
  };

  // JSX para a tela de sucesso (sem alteração)
  if (status === 'success') {
    return ( 
      <Card className="w-full max-w-lg bg-gray-900/80 backdrop-blur-sm border-gray-700 text-white shadow-2xl rounded-2xl"> 
        <CardHeader className="text-center items-center"> 
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}> 
            <svg className="w-20 h-20 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 
          </motion.div> 
          <CardTitle className="text-2xl mt-4">Avaliação Enviada!</CardTitle> 
          <CardDescription className="text-gray-300">Obrigado pela sua contribuição.</CardDescription> 
        </CardHeader> 
      </Card> 
    );
  }

  // JSX para o formulário principal (atualizado)
  return (
    <Card className="w-full max-w-2xl bg-gray-900/80 backdrop-blur-sm border-gray-700 text-white shadow-2xl rounded-2xl">
      <CardHeader className="text-center">
        <img src={serraLogo} alt="Logo Serra Jr. Engenharia" className="w-36 sm:w-40 mx-auto mb-6" />
        <CardTitle className="text-3xl font-bold tracking-tight">Avaliação de Membro</CardTitle>
        <CardDescription className="text-gray-400">Preencha os campos abaixo para avaliar o membro.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* --- SEÇÃO DE IDENTIFICAÇÃO --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="director-name">Seu Nome (Diretor)</Label>
              <Input 
                id="director-name" 
                value={directorName} 
                onChange={(e) => setDirectorName(e.target.value)} 
                required 
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-name">Nome do Membro Avaliado</Label>
              {/* ATUALIZADO: <select> com <optgroup> */}
              <select
                id="member-name"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                required
                disabled={isLoadingMembers}
                className={cn( 
                  "border-input placeholder:text-muted-foreground dark:bg-input/30",
                  "flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs",
                  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <option value="" disabled>
                  {isLoadingMembers ? 'Carregando membros...' : 'Selecione um membro'}
                </option>
                {/* Mapeia as chaves (Assessorias) para criar <optgroup> */}
                {Object.keys(groupedMembers).sort().map((assessoria) => (
                  <optgroup key={assessoria} label={assessoria}>
                    {/* Mapeia os membros dentro de cada assessoria */}
                    {groupedMembers[assessoria].map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-gray-700/50" />

          {/* --- SEÇÃO DE AVALIAÇÃO (EMOTES) --- */}
          <div className="space-y-6">
            <Label className="text-lg font-medium">Avaliação por Critérios</Label>
            
            {evaluationAspects.map((aspect) => (
              <div key={aspect.key} className="space-y-3">
                <Label htmlFor={aspect.key} className="text-base">{aspect.label}</Label>
                {/* Container para os botões de emote */}
                <div className="flex space-x-2 sm:space-x-3">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      type="button"
                      key={value}
                      variant={ratings[aspect.key] === value ? 'default' : 'outline'}
                      onClick={() => setRatings(prev => ({ ...prev, [aspect.key]: value }))}
                      className={cn(
                        "flex-1 text-2xl h-12 transition-all transform",
                        ratings[aspect.key] === value ? "scale-110" : "scale-100 opacity-70 hover:opacity-100"
                      )}
                    >
                      {emojiMap[value]}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <hr className="border-gray-700/50" /> 
          
          {/* --- SEÇÃO DE COMENTÁRIOS --- */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Comentário sobre o desempenho</Label>
            <Textarea 
              id="feedback" 
              value={evaluationText} 
              onChange={(e) => setEvaluationText(e.target.value)} 
              placeholder="Descreva os pontos fortes, pontos a melhorar, etc."
              rows={4}
            />
          </div>
          
          {/* Exibe mensagens de erro */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="p-3 text-center text-sm bg-red-900/50 border border-red-500/50 text-red-300 rounded-md"
              >
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div>
            <Button type="submit" className="w-full text-base font-bold h-12" disabled={status === 'loading'}>
              {status === 'loading' ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
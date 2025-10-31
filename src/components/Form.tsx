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
  sector: string;
}

export function EvaluationForm() {
  // Estados para os campos do formulário
  const [directorName, setDirectorName] = useState('');
  const [evaluationText, setEvaluationText] = useState('');
  const [score, setScore] = useState<number | null>(null);

  // Estados para a lista de membros vinda do Notion
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState(''); // Armazena o NOME do membro
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  
  // Estados de status do formulário
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // useEffect para buscar os membros da nossa API assim que o componente carregar
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Esta é a rota que criamos (ex: /api/get-members)
        const response = await fetch('/api/get-members');
        if (!response.ok) {
          throw new Error('Falha ao buscar dados');
        }
        const data = await response.json();
        setMembers(data.members || []);
      } catch (error) {
        console.error("Não foi possível carregar os membros", error);
        setErrorMessage("Erro ao carregar a lista de membros do Notion.");
      } finally {
        setIsLoadingMembers(false);
      }
    };

    // Chama a função de busca
    fetchMembers();
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validação
    if (!directorName || !selectedMember || score === null) {
      setErrorMessage('Por favor, preencha seu nome, selecione um membro e dê uma nota.');
      setStatus('error');
      return;
    }
    if (score < 0 || score > 10) {
      setErrorMessage('A nota deve ser entre 0 e 10.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    // Inserir na tabela 'member_evaluations' do Supabase
    const { error } = await supabase.from('member_evaluations').insert([
      { 
        director_name: directorName, 
        member_name: selectedMember, // Salva o nome do membro que foi selecionado
        evaluation_text: evaluationText,
        score: score,
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
      setScore(null);
    }
  };

  // JSX para a tela de sucesso
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

  // JSX para o formulário principal
  return (
    <Card className="w-full max-w-2xl bg-gray-900/80 backdrop-blur-sm border-gray-700 text-white shadow-2xl rounded-2xl">
      <CardHeader className="text-center">
        <img src={serraLogo} alt="Logo Serra Jr. Engenharia" className="w-36 sm:w-40 mx-auto mb-6" />
        <CardTitle className="text-3xl font-bold tracking-tight">Avaliação de Membro</CardTitle>
        <CardDescription className="text-gray-400">Preencha os campos abaixo para avaliar o membro.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
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
              {/* Este é o <select> dinâmico que busca dados do Notion */}
              <select
                id="member-name"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                required
                disabled={isLoadingMembers}
                className={cn( // Usando cn() para aplicar estilos consistentes
                  "border-input placeholder:text-muted-foreground dark:bg-input/30",
                  "flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs",
                  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <option value="" disabled>
                  {isLoadingMembers ? 'Carregando membros...' : 'Selecione um membro'}
                </option>
                {/* Mapeia a lista de membros para criar as opções */}
                {members.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name} ({member.sector})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-gray-700/50" />

          <div className="space-y-2">
            <Label htmlFor="score">Nota (0 a 10)</Label>
            <Input 
              id="score" 
              type="number" 
              min="0" 
              max="10" 
              step="0.5" // Permite notas como 8.5
              value={score ?? ''} 
              onChange={(e) => setScore(e.target.value === '' ? null : Number(e.target.value))} 
              required 
              placeholder="Digite uma nota de 0 a 10"
            />
          </div>

          <hr className="border-gray-700/50" /> 
          
          <div className="space-y-2">
            <Label htmlFor="feedback">Comentário sobre o desempenho</Label>
            <Textarea 
              id="feedback" 
              value={evaluationText} 
              onChange={(e) => setEvaluationText(e.target.value)} 
              placeholder="Descreva os pontos fortes, pontos a melhorar, etc." 
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
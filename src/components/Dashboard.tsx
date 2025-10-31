import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import serraLogo from '/LogoSerra.png';

interface EvaluationData { 
    id: number; 
    created_at: string; 
    director_name: string; 
    member_name: string; 
    score: number; 
    evaluation_text: string | null; 
    [key: string]: any; 
}

type DashboardView = 'overview' | 'details';

export function EvaluationDashboard() {
    const [responses, setResponses] = useState<EvaluationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<DashboardView>('overview');
    const [detailFilter, setDetailFilter] = useState('');

    useEffect(() => {
        const fetchResponses = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('member_evaluations').select('*').order('created_at', { ascending: false });
            if (error) { setError('Falha ao buscar os dados.'); } else { setResponses(data || []); }
            setLoading(false);
        };
        fetchResponses();
    }, []);

    const filteredDetails = useMemo(() => {
        if (!detailFilter) return responses;
        const lowercasedFilter = detailFilter.toLowerCase();
        return responses.filter(r => 
            r.director_name?.toLowerCase().includes(lowercasedFilter) ||
            r.member_name?.toLowerCase().includes(lowercasedFilter)
        );
    }, [responses, detailFilter]);

    const metrics = useMemo(() => {
        const total = responses.length;
        if (total === 0) return { averageScore: 0, responsesByMember: [], hasData: false };
        
        const totalScore = responses.reduce((acc, r) => acc + r.score, 0);
        const averageScore = parseFloat((totalScore / total).toFixed(1));

        const memberCounts = responses.reduce((acc, r) => {
            acc[r.member_name] = (acc[r.member_name] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        
        const responsesByMember = Object.entries(memberCounts).map(([name, value]) => ({ name, 'Avaliações': value }));

        return { averageScore, responsesByMember, hasData: true };
    }, [responses]);

    if (loading) return <div className="text-center p-10">Carregando dados...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <img src={serraLogo} alt="Logo Serra Jr. Engenharia" className="w-36 sm:w-40 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-center sm:text-left">Dashboard de Avaliações</h1>
            <div className="flex border-b border-gray-700">
                <button onClick={() => setActiveView('overview')} className={`py-2 px-4 text-lg transition-colors ${activeView === 'overview' ? 'border-b-2 border-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>Visão Geral</button>
                <button onClick={() => setActiveView('details')} className={`py-2 px-4 text-lg transition-colors ${activeView === 'details' ? 'border-b-2 border-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>Avaliações Individuais</button>
            </div>
            
            <AnimatePresence mode="wait">
            {activeView === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-gray-800/50 border-gray-700 text-white"> <CardHeader> <CardTitle>Nota Média Geral</CardTitle> </CardHeader> <CardContent className="text-5xl font-bold text-orange-400">{metrics.averageScore}</CardContent> </Card>
                        <Card className="bg-gray-800/50 border-gray-700 text-white"><CardHeader><CardTitle>Total de Avaliações</CardTitle></CardHeader><CardContent className="text-5xl font-bold text-blue-400">{responses.length}</CardContent></Card>
                    </div>
                    {metrics.hasData && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="bg-gray-800/50 border-gray-700 text-white lg:col-span-1">
                                <CardHeader> <CardTitle>Avaliações por Membro</CardTitle> </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={metrics.responsesByMember} margin={{ top: 5, right: 20, left: -10, bottom: 10 }}>
                                            <Bar dataKey="Avaliações" fill="#38A169" />
                                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                            <XAxis dataKey="name" stroke="#A0AEC0" interval={0} tick={{ fontSize: 10 }}/>
                                            <YAxis stroke="#A0AEC0" />
                                            <RechartsTooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                                            <Legend verticalAlign="top" align="center" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="bg-gray-800/50 border-gray-700 text-white lg:col-span-1">
                                <CardHeader> <CardTitle>Outro Gráfico (Placeholder)</CardTitle> </CardHeader>
                                <CardContent className="h-[300px] flex items-center justify-center text-gray-400">
                                    <p>Você pode adicionar outro gráfico aqui (ex: Média de notas por Diretor)</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </motion.div>
            )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
            {activeView === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="w-full sm:w-auto">
                        <Label htmlFor="detail-filter">Buscar por Diretor ou Membro</Label>
                        <Input id="detail-filter" placeholder="Digite para buscar..." className="max-w-md bg-gray-800 border-gray-600 text-white" value={detailFilter} onChange={e => setDetailFilter(e.target.value)} />
                    </div>
                    {filteredDetails.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDetails.map(response => (
                                <Card key={response.id} className="bg-gray-800/50 border-gray-700 text-white flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="text-xl">Membro: {response.member_name}</CardTitle>
                                        <CardDescription>Avaliado por: {response.director_name} - {new Date(response.created_at).toLocaleDateString('pt-BR')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 flex-grow">
                                        <div><h4 className="font-bold text-orange-400">Nota: {response.score}</h4></div>
                                        {response.evaluation_text && (
                                            <div className="pt-2">
                                                <h4 className="font-bold mb-1">Comentário:</h4>
                                                <p className="text-sm bg-gray-900/50 p-3 rounded-md border border-gray-600">"{response.evaluation_text}"</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-10 text-gray-400">Nenhuma avaliação encontrada para a sua busca.</p>
                    )}
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
}
'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function EnqueteDetalhePage() {
    const params = useParams();
    const id = params.id as string;
    const [enquete, setEnquete] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userUnit, setUserUnit] = useState<string | null>(null);
    const [answers, setAnswers] = useState<any>({}); // { question_id: { option_id, text } }
    const [hasVoted, setHasVoted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: resident } = await supabase.from('residents').select('unit_id').eq('user_id', user.id).single();
            if (resident) {
                setUserUnit(resident.unit_id);
                // Check if user has voted (simplified check)
                const { data: existingVotes } = await supabase
                    .from('enquete_answers')
                    .select('id')
                    .eq('unit_id', resident.unit_id);
                // We'll refine this check after loading the poll questions to be precise
            }
        }

        const res = await fetch(`/api/governanca/enquetes/${id}`);
        // Note: I need to create this specific GET endpoint or update the list one.
        // Actually GovernanceService.getEnquete(id) exists, but currently no API route exposes it specifically by ID.
        // I will assume for now I will create /api/governanca/enquetes/[id]/route.ts next.
        // Or I can use a server action. For consistency with previous steps, I will use an API route.
        // Wait, I haven't created GET /api/governanca/enquetes/[id] yet. I should do that. 
        // For this code to work, that endpoint needs to exist.

        // Let's create the UI code first and then the API.

        try {
            const response = await fetch(`/api/governanca/enquetes/${id}`);
            if (response.ok) {
                const json = await response.json();
                setEnquete(json.enquete);

                // Check if user already voted on THIS enquete
                if (user && json.enquete.questions) {
                    const qIds = json.enquete.questions.map((q: any) => q.id);
                    const { data: myVotes } = await supabase
                        .from('enquete_answers')
                        .select('question_id')
                        .in('question_id', qIds)
                        .eq('user_id', user.id); // Check by user for visual feedback

                    if (myVotes && myVotes.length > 0) setHasVoted(true);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    function handleOptionChange(qId: string, optId: string) {
        setAnswers(prev => ({
            ...prev,
            [qId]: { option_id: optId, text_response: null }
        }));
    }

    function handleTextChange(qId: string, text: string) {
        setAnswers(prev => ({
            ...prev,
            [qId]: { option_id: null, text_response: text }
        }));
    }

    async function handleSubmit() {
        if (!userUnit) return alert("Você precisa estar vinculado a uma unidade.");
        setSubmitting(true);

        // Transform answers object to array
        const question_answers = Object.keys(answers).map(qId => ({
            question_id: qId,
            option_id: answers[qId].option_id,
            text_response: answers[qId].text_response
        }));

        try {
            const res = await fetch('/api/governanca/enquetes/vote', {
                method: 'POST',
                body: JSON.stringify({
                    question_answers,
                    unit_id: userUnit
                })
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Erro ao votar');
            }

            alert("Voto registrado com sucesso!");
            setHasVoted(true);
            fetchData(); // Refresh results
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    }

    // Prepare chart data
    function getChartData(question: any) {
        if (!question.options || !question.answers) return [];

        const counts: any = {};
        question.options.forEach((opt: any) => counts[opt.id] = 0);

        question.answers.forEach((ans: any) => {
            if (ans.option_id && counts[ans.option_id] !== undefined) {
                counts[ans.option_id]++;
            }
        });

        return question.options.map((opt: any) => ({
            name: opt.label,
            value: counts[opt.id]
        })).filter((d: any) => d.value > 0);
    }

    if (loading) return <div className="p-8 text-center">Carregando enquete...</div>;
    if (!enquete) return <div className="p-8 text-center">Enquete não encontrada.</div>;

    const isExpired = new Date() > new Date(enquete.end_at);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{enquete.title}</h1>
                <p className="text-gray-600 mt-2">{enquete.description}</p>
                <div className="flex gap-2 mt-4">
                    {isExpired ? <Badge variant="secondary">Encerrada</Badge> : <Badge className="bg-green-600">Aberta</Badge>}
                    {hasVoted && <Badge variant="outline" className="border-green-600 text-green-600">Você já votou</Badge>}
                </div>
            </div>

            <div className="space-y-8">
                {enquete.questions.map((q: any, i: number) => (
                    <Card key={q.id}>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {i + 1}. {q.text}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Voting Area */}
                            {!hasVoted && !isExpired ? (
                                <div className="mb-6">
                                    {q.type === 'single_choice' && (
                                        <RadioGroup onValueChange={(v) => handleOptionChange(q.id, v)}>
                                            {q.options.map((opt: any) => (
                                                <div key={opt.id} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt.id} id={opt.id} />
                                                    <Label htmlFor={opt.id}>{opt.label}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    )}
                                    {q.type === 'text' && (
                                        <Textarea
                                            placeholder="Sua resposta..."
                                            onChange={(e) => handleTextChange(q.id, e.target.value)}
                                        />
                                    )}
                                </div>
                            ) : null}

                            {/* Results Area (Pizza Chart 🍕) */}
                            {(hasVoted || isExpired) && q.type !== 'text' && (
                                <div className="h-[300px] w-full mt-4">
                                    <h4 className="font-semibold text-sm text-gray-500 mb-2">Resultados Parciais:</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getChartData(q)}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {getChartData(q).map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Text Results (List) */}
                            {(hasVoted || isExpired) && q.type === 'text' && (
                                <div className="mt-4 bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                                    <h4 className="font-semibold text-sm text-gray-500 mb-2">Respostas:</h4>
                                    <ul className="space-y-2">
                                        {q.answers.map((ans: any) => (
                                            <li key={ans.id} className="text-sm border-b pb-2 last:border-0 italic">
                                                "{ans.text_response}"
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {!hasVoted && !isExpired && (
                <div className="flex justify-end">
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {submitting ? 'Enviando Votos...' : 'Confirmar Votos'}
                    </Button>
                </div>
            )}
        </div>
    );
}

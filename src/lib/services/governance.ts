
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface CreateAssemblyDTO {
    condo_id: string;
    title: string;
    description?: string;
    date: string;
    status?: string;
    type?: string;
    require_presence?: boolean;
    block_defaulters?: boolean;
    quorum_install?: number;
    created_by: string;
}

export interface CreatePautaDTO {
    assembleia_id: string;
    title: string;
    description?: string;
    order_index?: number;
}

export interface VotePautaDTO {
    pauta_id: string;
    user_id: string;
    unit_id: string;
    vote: 'yes' | 'no' | 'abstain';
}

export const GovernanceService = {
    // --- Assemblies ---
    async createAssembly(data: CreateAssemblyDTO) {
        const { data: assembly, error } = await supabase
            .from('assembleias')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return assembly;
    },

    async getAssemblies(condo_id: string) {
        const { data, error } = await supabase
            .from('assembleias')
            .select(`
                *,
                pautas:assembly_pautas(*)
            `)
            .eq('condo_id', condo_id)
            .order('date', { ascending: false });
        if (error) throw error;
        return data;
    },

    // SUPERADMIN: Get ALL assemblies from all condos
    async getAllAssemblies() {
        const { data, error } = await supabase
            .from('assembleias')
            .select(`
                *,
                condo:condos(name),
                pautas:assembly_pautas(*)
            `)
            .order('date', { ascending: false });
        if (error) throw error;
        return data;
    },

    // --- Pautas ---
    async createPauta(data: CreatePautaDTO) {
        const { data: pauta, error } = await supabase
            .from('assembleia_pautas')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return pauta;
    },

    async votePauta(data: VotePautaDTO) {
        // 1. Check if unit already voted
        const { data: existing } = await supabase
            .from('assembleia_votes')
            .select('id')
            .eq('pauta_id', data.pauta_id)
            .eq('unit_id', data.unit_id)
            .single();

        if (existing) {
            throw new Error('Esta unidade já votou nesta pauta.');
        }

        // 2. Cast vote
        const { data: vote, error } = await supabase
            .from('assembleia_votes')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return vote;
    },

    async getPautaResults(pauta_id: string) {
        const { data, error } = await supabase
            .from('assembleia_votes')
            .select('vote');

        if (error) throw error;

        const results = {
            yes: data.filter(v => v.vote === 'yes').length,
            no: data.filter(v => v.vote === 'no').length,
            abstain: data.filter(v => v.vote === 'abstain').length,
            total: data.length
        };
        return results;
    },

    // --- Enquetes (Polls 2.1) ---
    async createEnquete(data: any) {
        // 1. Create Enquete Base
        const { data: enquete, error: enqueteError } = await supabase
            .from('enquetes')
            .insert({
                condo_id: data.condo_id,
                title: data.title,
                description: data.description,
                start_at: data.start_at,
                end_at: data.end_at,
                created_by: data.created_by,
                one_vote_per_unit: data.one_vote_per_unit
            })
            .select()
            .single();

        if (enqueteError) throw enqueteError;

        // 2. Create Questions & Options
        if (data.questions && data.questions.length > 0) {
            for (const q of data.questions) {
                const { data: question, error: qError } = await supabase
                    .from('enquete_questions')
                    .insert({
                        enquete_id: enquete.id,
                        text: q.text,
                        type: q.type,
                        order_index: q.order_index
                    })
                    .select()
                    .single();

                if (qError) throw qError;

                if (q.options && q.options.length > 0) {
                    const optionsPayload = q.options.map((opt: string, idx: number) => ({
                        question_id: question.id,
                        label: opt,
                        order_index: idx
                    }));

                    const { error: optError } = await supabase
                        .from('enquete_options')
                        .insert(optionsPayload);

                    if (optError) throw optError;
                }
            }
        }

        return enquete;
    },

    async getEnquetes(condo_id: string) {
        const { data, error } = await supabase
            .from('enquetes')
            .select(`
                *,
                questions:enquete_questions (
                    *,
                    options:enquete_options (*)
                )
            `)
            .eq('condo_id', condo_id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async voteEnquete(data: { question_answers: any[], user_id: string, unit_id: string }) {
        // Data expects array of { question_id, option_id (optional), text_response (optional) }

        // 1. Validate One Vote Per Unit (Check first question as proxy)
        if (data.question_answers.length > 0) {
            const firstQ = data.question_answers[0];
            const { data: existing } = await supabase
                .from('enquete_answers')
                .select('id')
                .eq('question_id', firstQ.question_id)
                .eq('unit_id', data.unit_id)
                .single();

            if (existing) throw new Error('Esta unidade já respondeu a esta enquete.');
        }

        const payload = data.question_answers.map(ans => ({
            question_id: ans.question_id,
            user_id: data.user_id,
            unit_id: data.unit_id,
            option_id: ans.option_id,
            text_response: ans.text_response
        }));

        const { data: votes, error } = await supabase
            .from('enquete_answers')
            .insert(payload)
            .select();

        if (error) throw error;
        return votes;
    },

    async getEnquete(id: string) {
        const { data, error } = await supabase
            .from('enquetes')
            .select(`
                *,
                questions:enquete_questions (
                    *,
                    options:enquete_options (*),
                    answers:enquete_answers (*)
                )
            `)
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // --- Documents ---
    async getDocuments(condo_id: string) {
        const { data, error } = await supabase
            .from('governance_documents')
            .select('*')
            .eq('condo_id', condo_id)
            .order('uploaded_at', { ascending: false });
        if (error) throw error;
        return data;
    }
};

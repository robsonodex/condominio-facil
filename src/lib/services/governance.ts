
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface CreateAssemblyDTO {
    condo_id: string;
    title: string;
    description?: string;
    start_at: string;
    is_virtual?: boolean;
    virtual_link?: string;
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
                pautas:assembleia_pautas(*)
            `)
            .eq('condo_id', condo_id)
            .order('start_at', { ascending: false });
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

    // --- Enquetes ---
    async createEnquete(data: any) {
        const { data: enquete, error } = await supabase
            .from('enquetes')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return enquete;
    },

    async getEnquetes(condo_id: string) {
        const { data, error } = await supabase
            .from('enquetes')
            .select('*')
            .eq('condo_id', condo_id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async voteEnquete(data: { enquete_id: string, user_id: string, unit_id: string, option_id: string }) {
        // Check if unit already voted (if one_vote_per_unit is true)
        const { data: enquete } = await supabase
            .from('enquetes')
            .select('one_vote_per_unit')
            .eq('id', data.enquete_id)
            .single();

        if (enquete?.one_vote_per_unit) {
            const { data: existing } = await supabase
                .from('enquete_votes')
                .select('id')
                .eq('enquete_id', data.enquete_id)
                .eq('unit_id', data.unit_id)
                .single();

            if (existing) {
                // Determine if we should update or block. For now, block.
                throw new Error('Esta unidade já votou nesta enquete.');
            }
        }

        const { data: vote, error } = await supabase
            .from('enquete_votes')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return vote;
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

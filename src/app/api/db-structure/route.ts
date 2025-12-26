import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// API para ver estrutura completa do banco de dados
// REMOVER APÓS USO

export async function GET(request: NextRequest) {
    try {
        // 1. Listar todas as tabelas
        const { data: tables, error: tablesError } = await supabaseAdmin
            .rpc('get_all_tables_info');

        if (tablesError) {
            // Fallback: usar query direta
            const { data: fallbackTables, error: fallbackError } = await supabaseAdmin
                .from('information_schema.tables' as any)
                .select('table_name')
                .eq('table_schema', 'public')
                .eq('table_type', 'BASE TABLE');

            if (fallbackError) {
                // Tentar com raw SQL via REST
                const result = await supabaseAdmin.rpc('exec_sql', {
                    sql_query: `
                        SELECT 
                            t.table_name,
                            array_agg(
                                json_build_object(
                                    'column_name', c.column_name,
                                    'data_type', c.data_type,
                                    'is_nullable', c.is_nullable,
                                    'column_default', c.column_default
                                ) ORDER BY c.ordinal_position
                            ) as columns
                        FROM information_schema.tables t
                        LEFT JOIN information_schema.columns c 
                            ON t.table_name = c.table_name 
                            AND t.table_schema = c.table_schema
                        WHERE t.table_schema = 'public' 
                        AND t.table_type = 'BASE TABLE'
                        GROUP BY t.table_name
                        ORDER BY t.table_name
                    `
                });

                return NextResponse.json(result);
            }

            return NextResponse.json({ tables: fallbackTables });
        }

        return NextResponse.json({ tables });

    } catch (error: any) {
        // Usar método alternativo via query SQL simples
        try {
            // Buscar tabelas do schema public
            const tablesQuery = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            `;

            const { data: tablesList } = await supabaseAdmin.rpc('get_tables', {});

            // Listar colunas de cada tabela conhecida
            const knownTables = [
                'users', 'condos', 'units', 'residents', 'support_chats',
                'chat_messages', 'notifications', 'turbo_entries',
                'governanca_enquetes', 'occurrence_comments', 'occurrences'
            ];

            const structure: Record<string, any> = {};

            for (const tableName of knownTables) {
                try {
                    const { data: sample } = await supabaseAdmin
                        .from(tableName)
                        .select('*')
                        .limit(0);

                    // Não temos as colunas diretamente, mas podemos inferir de uma amostra
                    const { data: sampleRow } = await supabaseAdmin
                        .from(tableName)
                        .select('*')
                        .limit(1)
                        .single();

                    structure[tableName] = {
                        columns: sampleRow ? Object.keys(sampleRow) : 'empty table',
                        sampleValues: sampleRow ? Object.entries(sampleRow).map(([k, v]) => ({
                            column: k,
                            type: typeof v,
                            value: v === null ? 'NULL' : (typeof v === 'string' ? v.substring(0, 50) : v)
                        })) : null
                    };
                } catch (tableError: any) {
                    structure[tableName] = { error: tableError.message };
                }
            }

            return NextResponse.json({
                method: 'column_inference',
                timestamp: new Date().toISOString(),
                structure
            });

        } catch (fallbackError: any) {
            return NextResponse.json({
                error: error.message,
                fallbackError: fallbackError.message
            }, { status: 500 });
        }
    }
}

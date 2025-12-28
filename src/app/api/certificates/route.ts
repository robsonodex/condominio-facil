import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Lista certificados do condomínio
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar perfil do usuário para obter condo_id
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.condo_id) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
        }

        // Buscar certificados do condomínio
        const { data: certificates, error } = await supabase
            .from('condo_certificates')
            .select('*')
            .eq('condo_id', profile.condo_id)
            .order('expires_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ certificates });
    } catch (error) {
        console.error('Erro ao buscar certificados:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar certificados' },
            { status: 500 }
        );
    }
}

// POST - Criar novo certificado (com upload de documento)
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.condo_id) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
        }

        // Verificar permissão (apenas síndico e admin)
        if (!['sindico', 'admin', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const name = formData.get('name') as string;
        const type = formData.get('type') as string;
        const issued_at = formData.get('issued_at') as string;
        const expires_at = formData.get('expires_at') as string;
        const notes = formData.get('notes') as string;

        // Validações
        if (!name || !type || !issued_at || !expires_at) {
            return NextResponse.json(
                { error: 'Campos obrigatórios faltando' },
                { status: 400 }
            );
        }

        let document_url = '';

        // Upload do arquivo para o Storage se fornecido
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.condo_id}/certificates/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file, {
                    contentType: file.type,
                    upsert: false,
                });

            if (uploadError) {
                console.error('Erro no upload:', uploadError);
                return NextResponse.json(
                    { error: 'Erro ao fazer upload do documento' },
                    { status: 500 }
                );
            }

            // Obter URL pública
            const { data: urlData } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            document_url = urlData.publicUrl;
        } else {
            // Se não há arquivo, verificar se URL foi fornecida diretamente
            document_url = formData.get('document_url') as string || '';
        }

        if (!document_url) {
            return NextResponse.json(
                { error: 'Documento é obrigatório' },
                { status: 400 }
            );
        }

        // Inserir no banco de dados
        const { data: certificate, error: insertError } = await supabase
            .from('condo_certificates')
            .insert({
                condo_id: profile.condo_id,
                name,
                type,
                issued_at,
                expires_at,
                document_url,
                notes: notes || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Erro ao inserir certificado:', insertError);
            return NextResponse.json(
                { error: 'Erro ao salvar certificado' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, certificate });
    } catch (error) {
        console.error('Erro ao criar certificado:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Remover certificado
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!['sindico', 'admin', 'superadmin'].includes(profile?.role || '')) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const { error } = await supabase
            .from('condo_certificates')
            .delete()
            .eq('id', id)
            .eq('condo_id', profile?.condo_id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar certificado:', error);
        return NextResponse.json(
            { error: 'Erro ao deletar certificado' },
            { status: 500 }
        );
    }
}

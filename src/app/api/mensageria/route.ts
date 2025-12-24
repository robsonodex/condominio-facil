import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function getUserFromToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return null;

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return null;

    const { data: profile } = await supabaseAdmin
        .from('users')
        .select('id, role, condo_id, nome, email')
        .eq('email', user.email)
        .single();

    return profile;
}

// GET: Listar entregas
export async function GET(request: NextRequest) {
    try {
        const profile = await getUserFromToken(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const unitId = searchParams.get('unit_id');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabaseAdmin
            .from('mensageria_entregas')
            .select(`
                *,
                unit:units(id, bloco, numero_unidade),
                morador:users!morador_id(id, nome, email, telefone),
                recebedor:users!recebido_por(id, nome)
            `)
            .eq('condo_id', profile.condo_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) query = query.eq('status', status);
        if (unitId) query = query.eq('unit_id', unitId);

        // Se for morador, mostrar apenas suas entregas
        if (profile.role === 'morador' || profile.role === 'inquilino') {
            query = query.eq('morador_id', profile.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ entregas: data || [] });
    } catch (error: any) {
        console.error('[MENSAGERIA] GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Cadastrar nova entrega
export async function POST(request: NextRequest) {
    try {
        const profile = await getUserFromToken(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Apenas porteiro e síndico podem cadastrar
        if (!['porteiro', 'sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const body = await request.json();
        const {
            unit_id,
            morador_id,
            remetente,
            descricao,
            tipo,
            codigo_rastreio,
            foto_url,
            notificar = true
        } = body;

        if (!unit_id || !morador_id) {
            return NextResponse.json({ error: 'Unidade e morador são obrigatórios' }, { status: 400 });
        }

        const entregaData = {
            condo_id: profile.condo_id,
            unit_id,
            morador_id,
            remetente,
            descricao,
            tipo: tipo || 'encomenda',
            codigo_rastreio,
            foto_url,
            status: 'aguardando',
            recebido_por: profile.id,
            data_recebimento: new Date().toISOString(),
        };

        const { data: entrega, error } = await supabaseAdmin
            .from('mensageria_entregas')
            .insert(entregaData)
            .select(`
                *,
                unit:units(bloco, numero_unidade),
                morador:users!morador_id(id, nome, email, telefone)
            `)
            .single();

        if (error) throw error;

        // Notificar morador
        if (notificar && entrega) {
            // Criar notificação no sistema
            await supabaseAdmin.from('notifications').insert({
                condo_id: profile.condo_id,
                user_id: morador_id,
                titulo: '📦 Nova entrega na mensageria!',
                mensagem: `Você tem uma ${tipo || 'encomenda'} aguardando retirada${remetente ? ` de ${remetente}` : ''}. Retire na portaria/mensageria.`,
                tipo: 'sistema',
                link: '/minhas-notificacoes'
            });

            // Atualizar status para notificado
            await supabaseAdmin
                .from('mensageria_entregas')
                .update({
                    status: 'notificado',
                    notificado_em: new Date().toISOString(),
                    notificado_via: ['push']
                })
                .eq('id', entrega.id);

            // Enviar email se tiver
            if (entrega.morador?.email) {
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tipo: 'delivery_notification',
                            destinatario: entrega.morador.email,
                            dados: {
                                nome: entrega.morador.nome || 'Morador',
                                tipo: tipo || 'encomenda',
                                remetente: remetente || 'Não informado',
                                unidade: entrega.unit ? `${entrega.unit.bloco} ${entrega.unit.numero_unidade}` : '',
                            },
                            condoId: profile.condo_id,
                            internalCall: true
                        }),
                    });
                } catch (emailErr) {
                    console.error('[MENSAGERIA] Erro ao enviar email:', emailErr);
                }
            }
        }

        return NextResponse.json({
            entrega,
            message: notificar ? 'Entrega cadastrada e morador notificado!' : 'Entrega cadastrada!'
        });
    } catch (error: any) {
        console.error('[MENSAGERIA] POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Atualizar entrega (registrar retirada)
export async function PUT(request: NextRequest) {
    try {
        const profile = await getUserFromToken(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!['porteiro', 'sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const body = await request.json();
        const { id, action, retirado_por_nome, retirado_por_documento } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        // Buscar entrega
        const { data: entrega } = await supabaseAdmin
            .from('mensageria_entregas')
            .select('*, morador:users!morador_id(id, nome, email)')
            .eq('id', id)
            .single();

        if (!entrega) {
            return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 });
        }

        let updateData: any = { updated_at: new Date().toISOString() };

        if (action === 'retirar') {
            if (!retirado_por_nome) {
                return NextResponse.json({ error: 'Nome de quem retirou é obrigatório' }, { status: 400 });
            }

            let signatureUrl = null;

            // Se tiver assinatura em base64, fazer upload para storage
            if (body.signature_base64) {
                try {
                    const base64Data = body.signature_base64.replace(/^data:image\/\w+;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');
                    const fileName = `${entrega.condo_id}/${id}-signature-${Date.now()}.png`;

                    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                        .from('signatures')
                        .upload(fileName, buffer, {
                            contentType: 'image/png',
                            upsert: true
                        });

                    if (uploadError) {
                        console.error('[MENSAGERIA] Signature upload error:', uploadError);
                    } else {
                        const { data: publicUrl } = supabaseAdmin.storage
                            .from('signatures')
                            .getPublicUrl(fileName);
                        signatureUrl = publicUrl.publicUrl;
                    }
                } catch (e) {
                    console.error('[MENSAGERIA] Signature processing error:', e);
                }
            }

            updateData = {
                ...updateData,
                status: 'retirado',
                retirado_por_nome,
                retirado_por_documento: body.retirado_por_documento,
                data_retirada: new Date().toISOString(),
                entregue_por: profile.id,
                signature_url: signatureUrl
            };

            // Notificar morador da retirada
            await supabaseAdmin.from('notifications').insert({
                condo_id: entrega.condo_id,
                user_id: entrega.morador_id,
                titulo: '✅ Entrega retirada!',
                mensagem: `Sua ${entrega.tipo || 'encomenda'} foi retirada por ${retirado_por_nome}${retirado_por_documento ? ` (Doc: ${retirado_por_documento})` : ''}.`,
                tipo: 'sistema',
                link: '/minhas-notificacoes'
            });
        } else if (action === 'devolver') {
            updateData.status = 'devolvido';
        }

        const { data, error } = await supabaseAdmin
            .from('mensageria_entregas')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ entrega: data, message: 'Atualizado com sucesso!' });
    } catch (error: any) {
        console.error('[MENSAGERIA] PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Excluir entrega
export async function DELETE(request: NextRequest) {
    try {
        const profile = await getUserFromToken(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!['sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Apenas síndico pode excluir' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('mensageria_entregas')
            .delete()
            .eq('id', id)
            .eq('condo_id', profile.condo_id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[MENSAGERIA] DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Configuração Serverless Vercel
export const maxDuration = 60; // Evita timeout (padrão é 10s no hobby)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const condoId = formData.get('condo_id') as string;

        if (!file) {
            return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
        }

        // 1. OTIMIZAÇÃO DE IMAGEM (SHARP)
        // Convertendo File para Buffer
        const arrayBuffer = await file.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);

        try {
            console.log('[OCR] Tentando otimização com Sharp...');
            // Pipeline agressivo de pré-processamento
            buffer = await sharp(buffer)
                .resize({ width: 1000, withoutEnlargement: true }) // Reduz para acelerar
                .grayscale() // Remove cor (ruído)
                .threshold(128) // Binarização (Preto e Branco) para alto contraste
                .toBuffer();
            console.log('[OCR] Sharp: Sucesso na otimização.');
        } catch (sharpError: any) {
            console.error('[OCR] Sharp falhou, usando imagem original:', sharpError);
            // Continua com o buffer original se o sharp falhar (fallback)
        }

        // 2. OCR (TESSERACT.JS)
        // Cache em /tmp para ambiente serverless (única pasta writeable)
        const cachePath = '/tmp';

        console.log('[OCR] Iniciando Worker Tesseract...');
        const worker = await createWorker('por', 1, {
            cachePath,
            logger: m => console.log(`[Tesseract] ${m.status}: ${Math.round(m.progress * 100)}%`),
            errorHandler: err => console.error('[Tesseract Worker Error]', err)
        });

        const { data: { text } } = await worker.recognize(buffer);
        await worker.terminate();

        console.log('[OCR Raw Text]:', text);

        // 3. PARSING / EXTRAÇÃO
        const extractedData = parseCNH(text);

        // 4. INTEGRAÇÃO SUPABASE (LOG)
        // Salvando metadados da leitura (sem a imagem, para LGPD/Espaço)
        if (condoId) {
            const supabase = await createClient();
            await supabase.from('visitors').insert({ // Usando tabela 'visitors' existente como log de tentativa ou checkin
                condo_id: condoId,
                nome: extractedData.name || 'Desconhecido',
                documento: extractedData.cpf || extractedData.registro || 'Não identificado',
                tipo: 'visitante', // Default
                // Não salvamos foto_url aqui pois é só processamento, mas poderíamos salvar se tivesse upload
                registrado_por: (await supabase.auth.getUser()).data.user?.id
            }).select().single();
        }

        return NextResponse.json({
            success: true,
            data: extractedData,
            raw_text: text // Útil para debug
        });

    } catch (error: any) {
        console.error('Erro OCR:', error);
        return NextResponse.json({ error: 'Falha no processamento da imagem', details: error.message }, { status: 500 });
    }
}

// 5. REGEX PARSER (LÓGICA DE EXTRAÇÃO)
function parseCNH(text: string) {
    const cleanText = text.toUpperCase();

    // CPF: \d{3}\.\d{3}\.\d{3}-\d{2}
    // Tratando erros comuns OCR: 'O' virando '0', etc.
    // Regex flexível: permite pontos/traços ou espaços ou nada
    const cpfRegex = /(\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d{2})/;
    const cpfMatch = cleanText.match(cpfRegex);

    // Datas: DD/MM/AAAA
    const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
    const dates = cleanText.match(new RegExp(dateRegex, 'g')) || [];

    // Nome: Heurística
    // Procura linhas que NÃO são números, NÃO são rótulos comuns (NOME, FILIAÇÃO)
    // Geralmente o nome vem antes do CPF na CNH
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 5);

    let name = null;
    const ignoreList = ['REPÚBLICA', 'FEDERATIVA', 'BRASIL', 'MINISTÉRIO', 'CARTEIRA', 'NACIONAL', 'HABILITAÇÃO', 'DETRAN', 'ASSINATURA', 'VALIDADE', 'DATA', 'NOME', 'CPF', 'RG', 'DOC', 'FILIAÇÃO'];

    for (const line of lines) {
        // Se a linha tem números, provavel que não seja nome (exceto CNH muito suja)
        if (/\d/.test(line)) continue;

        // Se contem palavras proibidas
        if (ignoreList.some(w => line.includes(w))) continue;

        // Candidato a nome
        name = line;
        break; // Assume o primeiro candidato válido (top-down)
    }

    // Registro CNH (número vermelho abaixo da foto, geralmente 9 a 11 digitos)
    const registroRegex = /\b\d{9,11}\b/;
    const registroMatch = cleanText.match(registroRegex);

    return {
        cpf: cpfMatch ? cpfMatch[0].replace(/[^\d]/g, '') : null, // Limpa pontuação
        name: name,
        registro: registroMatch ? registroMatch[0] : null,
        data_nascimento: dates.length > 0 ? dates[0] : null, // Assumindo primeira data
        data_validade: dates.length > 1 ? dates[dates.length - 1] : null // Assumindo última
    };
}

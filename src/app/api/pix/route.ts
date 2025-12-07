import { NextRequest, NextResponse } from 'next/server';

// Banco Inter API Configuration
const INTER_API_URL = 'https://cdpj.partners.bancointer.com.br';
const INTER_CLIENT_ID = process.env.INTER_CLIENT_ID;
const INTER_CLIENT_SECRET = process.env.INTER_CLIENT_SECRET;
const INTER_PIX_KEY = process.env.INTER_PIX_KEY || 'email@example.com';

interface PixRequest {
    valor: number;
    descricao: string;
    devedor?: {
        nome: string;
        cpf?: string;
        cnpj?: string;
    };
}

// Get OAuth2 token from Banco Inter
async function getAccessToken(): Promise<string | null> {
    try {
        const credentials = Buffer.from(`${INTER_CLIENT_ID}:${INTER_CLIENT_SECRET}`).toString('base64');

        const response = await fetch(`${INTER_API_URL}/oauth/v2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
            },
            body: new URLSearchParams({
                'grant_type': 'client_credentials',
                'scope': 'cob.write cob.read pix.write pix.read',
            }),
        });

        if (!response.ok) {
            console.error('Token error:', await response.text());
            return null;
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
}

// Create PIX charge (cobrança imediata)
async function createPixCharge(token: string, pixData: PixRequest): Promise<any> {
    const txid = `CF${Date.now()}${Math.random().toString(36).substring(7)}`.substring(0, 35);

    const payload = {
        calendario: {
            expiracao: 86400, // 24 hours
        },
        valor: {
            original: pixData.valor.toFixed(2),
        },
        chave: INTER_PIX_KEY,
        solicitacaoPagador: pixData.descricao,
    };

    if (pixData.devedor) {
        Object.assign(payload, { devedor: pixData.devedor });
    }

    try {
        const response = await fetch(`${INTER_API_URL}/pix/v2/cob/${txid}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('PIX creation error:', errorText);
            throw new Error(`PIX error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating PIX:', error);
        throw error;
    }
}

// Generate static PIX (without API - fallback)
function generateStaticPix(valor: number, descricao: string): string {
    // EMV QR Code format for static PIX
    const pixKey = INTER_PIX_KEY || 'seu@email.com';
    const merchantName = 'CONDOMINIO FACIL';
    const city = 'SAO PAULO';

    // Simplified EMV format
    const emv = [
        '00', '02', '01', // Payload format
        '26', // Merchant Account Information
        `0014br.gov.bcb.pix`, // GUI
        `01${pixKey.length.toString().padStart(2, '0')}${pixKey}`, // PIX Key
        '52', '04', '0000', // Merchant Category Code
        '53', '03', '986', // Currency (BRL)
        '54', valor.toFixed(2).length.toString().padStart(2, '0'), valor.toFixed(2), // Transaction Amount
        '58', '02', 'BR', // Country
        '59', merchantName.length.toString().padStart(2, '0'), merchantName, // Merchant Name
        '60', city.length.toString().padStart(2, '0'), city, // City
        '62', // Additional Data
        `05${descricao.substring(0, 25).length.toString().padStart(2, '0')}${descricao.substring(0, 25)}`,
        '63', '04', // CRC placeholder
    ].join('');

    // In production, calculate proper CRC16-CCITT
    return emv + 'ABCD';
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { valor, descricao, devedor, useRealApi } = body;

        if (!valor || valor <= 0) {
            return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
        }

        // If not using real API or credentials not configured, use static PIX
        if (!useRealApi || !INTER_CLIENT_ID || !INTER_CLIENT_SECRET) {
            const pixCode = generateStaticPix(valor, descricao || 'Mensalidade Condominio');
            return NextResponse.json({
                success: true,
                type: 'static',
                pixCode,
                txid: `STATIC${Date.now()}`,
                message: 'PIX estático gerado. Para PIX dinâmico, configure as credenciais do Banco Inter.',
            });
        }

        // Try real Banco Inter API
        const token = await getAccessToken();

        if (!token) {
            // Fallback to static PIX
            const pixCode = generateStaticPix(valor, descricao || 'Mensalidade Condominio');
            return NextResponse.json({
                success: true,
                type: 'static',
                pixCode,
                message: 'Erro ao conectar com Banco Inter. PIX estático gerado.',
            });
        }

        const pixResponse = await createPixCharge(token, {
            valor,
            descricao: descricao || 'Mensalidade Condomínio Fácil',
            devedor,
        });

        return NextResponse.json({
            success: true,
            type: 'dynamic',
            txid: pixResponse.txid,
            pixCode: pixResponse.pixCopiaECola || pixResponse.brcode,
            qrcode: pixResponse.qrcode,
            status: pixResponse.status,
        });
    } catch (error: any) {
        console.error('PIX API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao gerar PIX' },
            { status: 500 }
        );
    }
}

// Webhook endpoint for payment confirmation
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        // Banco Inter sends payment confirmation here
        // In production, verify the webhook signature

        console.log('PIX Webhook received:', body);

        // TODO: Update payment status in database
        // const { txid, status } = body;
        // await updatePaymentStatus(txid, status);

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
    }
}

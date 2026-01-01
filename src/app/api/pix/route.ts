import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

// Banco Inter API Configuration
const INTER_API_URL = 'https://cdpj.partners.bancointer.com.br';
const INTER_CLIENT_ID = process.env.INTER_CLIENT_ID;
const INTER_CLIENT_SECRET = process.env.INTER_CLIENT_SECRET;
const INTER_PIX_KEY = process.env.INTER_PIX_KEY || '';

// Certificates from environment (base64 encoded) or file system
const INTER_CERT = process.env.INTER_CERT || '';
const INTER_KEY = process.env.INTER_KEY || '';

interface PixRequest {
    valor: number;
    descricao: string;
    devedor?: {
        nome: string;
        cpf?: string;
        cnpj?: string;
    };
}

// Create HTTPS agent with mTLS certificates
function createMTLSAgent(): https.Agent | null {
    try {
        // Try to load from environment variables (base64 encoded)
        if (INTER_CERT && INTER_KEY) {
            return new https.Agent({
                cert: Buffer.from(INTER_CERT, 'base64').toString(),
                key: Buffer.from(INTER_KEY, 'base64').toString(),
                rejectUnauthorized: true,
            });
        }

        // For local development, try to read from files
        if (process.env.NODE_ENV === 'development') {
            const fs = require('fs');
            const path = require('path');
            const certPath = path.join(process.cwd(), 'certificates', 'inter.crt');
            const keyPath = path.join(process.cwd(), 'certificates', 'inter.key');

            if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
                return new https.Agent({
                    cert: fs.readFileSync(certPath),
                    key: fs.readFileSync(keyPath),
                    rejectUnauthorized: true,
                });
            }
        }

        return null;
    } catch (error) {
        console.error('Error creating mTLS agent:', error);
        return null;
    }
}

// Get OAuth2 token from Banco Inter with mTLS
async function getAccessToken(agent: https.Agent | null): Promise<string | null> {
    try {
        const credentials = Buffer.from(`${INTER_CLIENT_ID}:${INTER_CLIENT_SECRET}`).toString('base64');

        const fetchOptions: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
            },
            body: new URLSearchParams({
                'grant_type': 'client_credentials',
                'scope': 'cob.write cob.read pix.write pix.read',
            }),
        };

        // Add agent for mTLS if available (Node.js specific)
        if (agent) {
            (fetchOptions as any).agent = agent;
        }

        const response = await fetch(`${INTER_API_URL}/oauth/v2/token`, fetchOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token error:', response.status, errorText);
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
async function createPixCharge(token: string, pixData: PixRequest, agent: https.Agent | null): Promise<any> {
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
        const fetchOptions: RequestInit = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        };

        if (agent) {
            (fetchOptions as any).agent = agent;
        }

        const response = await fetch(`${INTER_API_URL}/pix/v2/cob/${txid}`, fetchOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('PIX creation error:', response.status, errorText);
            throw new Error(`PIX error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating PIX:', error);
        throw error;
    }
}

// Generate static PIX (without API - fallback)
function generateStaticPix(valor: number, descricao: string): string {
    const pixKey = INTER_PIX_KEY || '57444727000185';
    const merchantName = 'CONDOMINIOFACIL';
    const city = 'BRASIL';
    const valorStr = valor.toFixed(2);

    // Build EMV QR Code
    let emv = '';

    // Payload Format Indicator
    emv += '000201';

    // Point of Initiation Method (12 = dynamic)
    emv += '010212';

    // Merchant Account Information
    const gui = '0014br.gov.bcb.pix';
    const keyField = `01${pixKey.length.toString().padStart(2, '0')}${pixKey}`;
    const mai = gui + keyField;
    emv += `26${mai.length.toString().padStart(2, '0')}${mai}`;

    // Merchant Category Code
    emv += '52040000';

    // Transaction Currency (986 = BRL)
    emv += '5303986';

    // Transaction Amount
    emv += `54${valorStr.length.toString().padStart(2, '0')}${valorStr}`;

    // Country Code
    emv += '5802BR';

    // Merchant Name
    emv += `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`;

    // Merchant City
    emv += `60${city.length.toString().padStart(2, '0')}${city}`;

    // Additional Data Field Template
    const txid = `***`;
    const additionalData = `05${txid.length.toString().padStart(2, '0')}${txid}`;
    emv += `62${additionalData.length.toString().padStart(2, '0')}${additionalData}`;

    // CRC16 placeholder (will be calculated)
    emv += '6304';

    // Calculate CRC16
    const crc = calculateCRC16(emv);
    emv = emv.slice(0, -4) + '6304' + crc;

    return emv;
}

// CRC16-CCITT calculation
function calculateCRC16(str: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
        crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { valor, descricao, devedor, useRealApi = true } = body;

        if (!valor || valor <= 0) {
            return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
        }

        // Try real Banco Inter API if credentials are configured
        if (useRealApi && INTER_CLIENT_ID && INTER_CLIENT_SECRET && INTER_PIX_KEY) {
            const agent = createMTLSAgent();

            if (agent) {
                try {
                    const token = await getAccessToken(agent);

                    if (token) {
                        const pixResponse = await createPixCharge(token, {
                            valor,
                            descricao: descricao || 'Mensalidade Condomínio Fácil',
                            devedor,
                        }, agent);

                        return NextResponse.json({
                            success: true,
                            type: 'dynamic',
                            txid: pixResponse.txid,
                            pixCode: pixResponse.pixCopiaECola || pixResponse.brcode,
                            qrcode: pixResponse.qrcode,
                            status: pixResponse.status,
                        });
                    }
                } catch (apiError) {
                    console.error('Banco Inter API failed, falling back to static PIX:', apiError);
                }
            }
        }

        // Fallback to static PIX
        const pixCode = generateStaticPix(valor, descricao || 'Mensalidade Condominio');
        return NextResponse.json({
            success: true,
            type: 'static',
            pixCode,
            txid: `STATIC${Date.now()}`,
            message: 'PIX estático gerado.',
        });
    } catch (error: any) {
        console.error('PIX API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao gerar PIX' },
            { status: 500 }
        );
    }
}

// Webhook endpoint for payment confirmation from Banco Inter
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        // Banco Inter sends payment confirmation here
        console.log('PIX Webhook received:', body);

        // TODO: Update payment status in database
        // const { pix } = body;
        // for (const p of pix) {
        //     await updatePaymentByTxid(p.txid, 'pago');
        // }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
    }
}

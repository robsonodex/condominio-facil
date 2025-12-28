'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { Camera, RefreshCw, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ValidationResult {
    valid: boolean;
    message: string;
    guest?: {
        name: string;
        unit: string;
        block: string;
        createdBy: string;
    };
}

interface QRCodeScannerProps {
    onClose?: () => void;
}

export function QRCodeScanner({ onClose }: QRCodeScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [error, setError] = useState('');
    const [validating, setValidating] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isProcessingRef = useRef(false); // Flag para prevenir chamadas duplicadas

    const stopScanner = useCallback(async () => {
        if (scannerRef.current && scanning) {
            try {
                await scannerRef.current.stop();
                setScanning(false);
            } catch {
                // Already stopped
            }
        }
    }, [scanning]);

    const validateQRCode = async (token: string) => {
        setValidating(true);
        setResult(null);
        setError('');

        try {
            const response = await fetch('/api/invites/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token }),
            });

            const data = await response.json();
            setResult(data);

            // Play sound based on result
            if (data.valid) {
                playSuccessSound();
            } else {
                playErrorSound();
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(`Erro ao validar: ${errorMessage}`);
            playErrorSound();
        } finally {
            setValidating(false);
        }
    };

    const playSuccessSound = () => {
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            osc.type = 'sine';
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch {
            // Audio not supported
        }
    };

    const playErrorSound = () => {
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 300;
            osc.type = 'square';
            gain.gain.value = 0.2;
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch {
            // Audio not supported
        }
    };

    const startScanner = async () => {
        setError('');
        setResult(null);

        if (!containerRef.current) return;

        try {
            scannerRef.current = new Html5Qrcode('qr-reader');

            await scannerRef.current.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                async (decodedText) => {
                    // Prevenir chamadas duplicadas
                    if (isProcessingRef.current) {
                        console.log('[QR Scanner] Ignorando - já processando');
                        return;
                    }
                    isProcessingRef.current = true;

                    await stopScanner();
                    await validateQRCode(decodedText);

                    // Reset após um tempo para permitir novo scan
                    setTimeout(() => {
                        isProcessingRef.current = false;
                    }, 3000);
                },
                () => {
                    // QR Code not detected, continue scanning
                }
            );

            setScanning(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            if (errorMessage.includes('Permission')) {
                setError('Permissão de câmera negada. Por favor, permita o acesso à câmera.');
            } else {
                setError(`Erro ao iniciar câmera: ${errorMessage}`);
            }
        }
    };

    const handleReset = () => {
        setResult(null);
        setError('');
        isProcessingRef.current = false; // Reset flag para permitir novo scan
        startScanner();
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, []);

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Camera className="h-5 w-5 text-blue-500" />
                        Validar QR Code
                    </h2>
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Scanner Container */}
                <div
                    ref={containerRef}
                    className="relative bg-black rounded-lg overflow-hidden mb-4"
                    style={{ minHeight: '300px' }}
                >
                    <div id="qr-reader" className="w-full" />

                    {!scanning && !result && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                            <Camera className="h-16 w-16 text-gray-500 mb-4" />
                            <Button onClick={startScanner} className="bg-blue-600 hover:bg-blue-700">
                                <Camera className="h-4 w-4 mr-2" />
                                Iniciar Câmera
                            </Button>
                        </div>
                    )}

                    {validating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                            <div className="text-center text-white">
                                <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
                                <p>Validando...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Result Display */}
                {result && (
                    <div
                        className={`rounded-lg p-6 text-center transition-all ${result.valid
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}
                    >
                        <div className="mb-4">
                            {result.valid ? (
                                <CheckCircle className="h-16 w-16 mx-auto animate-pulse" />
                            ) : (
                                <XCircle className="h-16 w-16 mx-auto" />
                            )}
                        </div>

                        <h3 className="text-3xl font-bold mb-2">
                            {result.valid ? 'LIBERADO' : 'NEGADO'}
                        </h3>

                        <p className="text-lg opacity-90 mb-4">{result.message}</p>

                        {result.guest && (
                            <div className="bg-white/20 rounded-lg p-4 text-left">
                                <p className="font-semibold text-xl">{result.guest.name}</p>
                                <p className="opacity-90">
                                    {result.guest.block
                                        ? `Bloco ${result.guest.block} - ${result.guest.unit}`
                                        : result.guest.unit}
                                </p>
                                {result.guest.createdBy && (
                                    <p className="text-sm opacity-75 mt-1">
                                        Convidado por: {result.guest.createdBy}
                                    </p>
                                )}
                            </div>
                        )}

                        <Button
                            onClick={handleReset}
                            className="mt-6 bg-white text-gray-800 hover:bg-gray-100"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Escanear Outro
                        </Button>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                            <p className="text-red-700 font-medium">Erro</p>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                {scanning && !result && (
                    <div className="text-center text-gray-500 text-sm">
                        <p>Aponte a câmera para o QR Code do convite</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

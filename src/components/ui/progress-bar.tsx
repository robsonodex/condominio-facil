'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        setPercentage(Math.round((current / total) * 100));
    }, [current, total]);

    if (total === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {label || 'Processando...'}
                </h3>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>{current} de {total}</span>
                        <span>{percentage}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300 ease-out"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>

                <p className="text-sm text-gray-500 mt-4 text-center">
                    Aguarde enquanto processamos sua solicitação...
                </p>
            </div>
        </div>
    );
}

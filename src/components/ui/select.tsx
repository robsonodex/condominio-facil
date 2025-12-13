"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps {
    label?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: SelectOption[];
    required?: boolean;
    placeholder?: string;
    className?: string;
    error?: string;
}

export function Select({
    label,
    value,
    onChange,
    options,
    required,
    placeholder = "Selecione...",
    className,
    error
}: SelectProps) {
    // Usar select nativo para garantir compatibilidade
    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <select
                value={value}
                onChange={onChange}
                required={required}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-red-500 focus:ring-red-500"
                )}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}

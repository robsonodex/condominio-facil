import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, id, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <textarea
                    id={textareaId}
                    className={cn(
                        'flex min-h-[100px] w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors',
                        'placeholder:text-gray-400',
                        'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
                        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

export { Textarea };

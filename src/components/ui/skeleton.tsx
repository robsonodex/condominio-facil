'use client';

// Skeleton components for instant page feedback

export function CardSkeleton({ count = 3, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl h-24 animate-pulse"></div>
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 h-12 animate-pulse"></div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-14 border-t border-gray-100 animate-pulse bg-gray-50/50"></div>
            ))}
        </div>
    );
}

export function PageSkeleton({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-500">{subtitle}</p>}
            </div>
            <CardSkeleton count={3} />
            <TableSkeleton rows={5} />
        </div>
    );
}

export function FilterSkeleton() {
    return (
        <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
        </div>
    );
}

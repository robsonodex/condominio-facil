'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import {
    SelectRoot,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Eye, Shield, Building2, User, DoorOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STORAGE_KEY = 'cf_view_as_role';

type ViewRole = 'superadmin' | 'sindico' | 'porteiro' | 'morador';

const roleConfig: Record<ViewRole, { label: string; icon: React.ReactNode; color: string }> = {
    superadmin: { label: 'SuperAdmin', icon: <Shield className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
    sindico: { label: 'Síndico', icon: <Building2 className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    porteiro: { label: 'Porteiro', icon: <DoorOpen className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700 border-orange-200' },
    morador: { label: 'Morador', icon: <User className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export function RoleViewSwitcher() {
    const { isSuperAdminReal, isImpersonating } = useUser();
    const [viewAsRole, setViewAsRole] = useState<ViewRole>('superadmin');
    const [mounted, setMounted] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(STORAGE_KEY) as ViewRole | null;
        if (stored && roleConfig[stored]) {
            setViewAsRole(stored);
        }
    }, []);

    // Only show for real superadmins when not impersonating
    if (!isSuperAdminReal || isImpersonating || !mounted) {
        return null;
    }

    const handleChange = (value: string) => {
        const role = value as ViewRole;
        setViewAsRole(role);
        localStorage.setItem(STORAGE_KEY, role);
        // Dispatch custom event to notify useUser hook
        window.dispatchEvent(new CustomEvent('viewAsRoleChange', { detail: role }));
    };

    const current = roleConfig[viewAsRole];

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Eye className="h-3 w-3" />
                <span>Visualizar como:</span>
            </div>
            <SelectRoot value={viewAsRole} onValueChange={handleChange}>
                <SelectTrigger className={`w-full ${current.color} border`}>
                    <SelectValue>
                        <div className="flex items-center gap-2">
                            {current.icon}
                            <span className="font-medium">{current.label}</span>
                        </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {(Object.keys(roleConfig) as ViewRole[]).map((role) => {
                        const config = roleConfig[role];
                        return (
                            <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                    {config.icon}
                                    <span>{config.label}</span>
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </SelectRoot>
            {viewAsRole !== 'superadmin' && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                    ⚠️ Modo visualização ativa
                </Badge>
            )}
        </div>
    );
}

// Hook to get current viewAs role
export function useViewAsRole(): ViewRole {
    const [viewAsRole, setViewAsRole] = useState<ViewRole>('superadmin');

    useEffect(() => {
        // Load initial value
        const stored = localStorage.getItem(STORAGE_KEY) as ViewRole | null;
        if (stored && roleConfig[stored]) {
            setViewAsRole(stored);
        }

        // Listen for changes
        const handleChange = (e: CustomEvent<ViewRole>) => {
            setViewAsRole(e.detail);
        };

        window.addEventListener('viewAsRoleChange', handleChange as EventListener);
        return () => window.removeEventListener('viewAsRoleChange', handleChange as EventListener);
    }, []);

    return viewAsRole;
}

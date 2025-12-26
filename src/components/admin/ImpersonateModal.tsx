'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Search, UserCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function ImpersonateModal() {
    const { refetchUser, isSuperAdminReal } = useUser();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [impersonating, setImpersonating] = useState(false);
    const router = useRouter();

    // Só superadmin pode ver este botão
    if (!isSuperAdminReal) {
        return null;
    }

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setSearching(true);
        const supabase = createClient();

        // Query base - busca todos se não tiver termo
        let query = supabase
            .from('users')
            .select('id, nome, email, role, condo_id, ativo')
            .in('role', ['sindico', 'porteiro', 'morador'])
            .eq('ativo', true)
            .order('nome')
            .limit(50);

        // Se tiver termo de busca, filtra
        if (search.trim()) {
            query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data, error } = await query;

        console.log('[IMPERSONATE] Search results:', data, error);
        if (data) setResults(data);
        setSearching(false);
    };

    const handleImpersonate = async (targetUser: any) => {
        if (!confirm(`Tem certeza que deseja agir como ${targetUser.nome}? Todas as ações serão auditadas.`)) return;

        setImpersonating(true);
        try {
            const res = await fetch('/api/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ target_user_id: targetUser.id })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Falha ao iniciar impersonação');
            }

            // Força atualização completa da página
            window.location.href = '/dashboard';

        } catch (error: any) {
            console.error('[ImpersonateModal] Error:', error);
            alert(`Erro ao iniciar impersonação: ${error.message}`);
            setImpersonating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                    <UserCheck className="h-4 w-4" />
                    Trocar de Conta
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-600">
                        <ShieldAlert className="h-5 w-5" />
                        Acesso Administrativo (Impersonação)
                    </DialogTitle>
                    <DialogDescription>
                        Busque um usuário para acessar o sistema como se fosse ele.
                        <br />
                        <span className="font-bold text-red-500">Atenção:</span> Todas as ações serão registradas nos logs de auditoria.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Buscar por nome..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button type="submit" disabled={searching}>
                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </form>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {results.length === 0 && !searching && search && (
                            <p className="text-center text-sm text-gray-500 py-4">Nenhum usuário encontrado</p>
                        )}

                        {results.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback>{user.nome?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{user.nome}</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs h-5 capitalize">
                                                {user.role}
                                            </Badge>
                                            {user.condo_id && <span className="text-xs text-gray-400">Condo ID: ...{user.condo_id.slice(-4)}</span>}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    disabled={impersonating}
                                    onClick={() => handleImpersonate(user)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    {impersonating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Acessar'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

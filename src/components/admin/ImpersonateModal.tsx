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
    const { refetchUser } = useUser();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [impersonating, setImpersonating] = useState(false);
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!search.trim()) return;

        setSearching(true);
        const supabase = createClient();

        // Search syndics (mostly) but allow searching anyone
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('nome', `%${search}%`)
            .in('role', ['sindico', 'porteiro', 'morador']) // Limit roles? Or allow all?
            .limit(10);

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
                body: JSON.stringify({ target_user_id: targetUser.id })
            });

            if (!res.ok) throw new Error('Falha ao iniciar impersonação');

            await refetchUser();
            setOpen(false);
            router.refresh();

        } catch (error) {
            console.error(error);
            alert('Erro ao iniciar impersonação');
        } finally {
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

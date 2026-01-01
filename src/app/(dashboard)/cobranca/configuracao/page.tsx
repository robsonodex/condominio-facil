'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Plus, Building2, CreditCard, Key } from 'lucide-react';
import { useFeature } from '@/hooks/useFeature';
import { SUPPORTED_BANKS } from '@/lib/banking/constants';

const bankAccountSchema = z.object({
    bank_code: z.string().min(3, 'Selecione um banco'),
    bank_name: z.string(),
    agency: z.string().min(2, 'Agência obrigatória'),
    agency_digit: z.string().optional(),
    account_number: z.string().min(3, 'Conta obrigatória'),
    account_digit: z.string().min(1, 'Dígito obrigatório'),
    account_type: z.enum(['corrente', 'poupanca']),
    beneficiary_name: z.string().min(3, 'Nome do beneficiário obrigatório'),
    beneficiary_document: z.string().min(14, 'CNPJ inválido'), // 14 chars for CNPJ basic validation (length)
    beneficiary_address: z.string().optional(),
    wallet_code: z.string().optional(),
    wallet_variation: z.string().optional(),
    agreement_number: z.string().optional(),
    environment: z.enum(['sandbox', 'production']),
    is_active: z.boolean().default(true),
    // Credenciais (campos dinâmicos baseados no banco)
    client_id: z.string().optional(),
    client_secret: z.string().optional(),
    developer_key: z.string().optional(),
    certificate_password: z.string().optional(),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

export default function BankingConfigPage() {
    const { isEnabled, isLoading } = useFeature('module_banking');
    const [activeTab, setActiveTab] = useState('accounts');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBank, setSelectedBank] = useState<string>('');

    const form = useForm<BankAccountFormValues>({
        resolver: zodResolver(bankAccountSchema),
        defaultValues: {
            account_type: 'corrente',
            environment: 'sandbox',
            is_active: true
        }
    });

    useEffect(() => {
        if (isEnabled) {
            loadAccounts();
        }
    }, [isEnabled]);

    const loadAccounts = async () => {
        try {
            const res = await fetch('/api/billing/bank-accounts');
            const data = await res.json();
            setAccounts(data.accounts || []);
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
            toast.error('Erro ao carregar contas bancárias');
        }
    };

    const supportedBanks = SUPPORTED_BANKS;

    const handleBankChange = (code: string) => {
        const bank = supportedBanks.find(b => b.code === code);
        if (bank) {
            setSelectedBank(code);
            form.setValue('bank_code', code);
            form.setValue('bank_name', bank.name);
        }
    };

    const onSubmit = async (values: BankAccountFormValues) => {
        try {
            // Montar objeto de credenciais baseado no banco
            let api_credentials: any = {};

            if (values.bank_code === '001') { // BB
                api_credentials = {
                    clientId: values.client_id,
                    clientSecret: values.client_secret,
                    gwAppKey: values.developer_key
                };
            } else if (values.bank_code === '341') { // Itaú
                api_credentials = {
                    clientId: values.client_id,
                    clientSecret: values.client_secret,
                    certificatePassword: values.certificate_password
                    // File upload for certificate would be handled separately usually
                };
            } // ... others

            const payload = {
                ...values,
                api_credentials
            };

            const res = await fetch('/api/billing/bank-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Falha ao salvar');

            toast.success('Conta bancária salva com sucesso!');
            setIsDialogOpen(false);
            loadAccounts();
            form.reset();
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao salvar conta bancária');
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!isEnabled) {
        return (
            <div className="p-8">
                <Card className="max-w-2xl mx-auto text-center p-8">
                    <CardTitle>Módulo não disponível</CardTitle>
                    <CardDescription>
                        O módulo bancário não está habilitado para seu plano ou condomínio.
                        Entre em contato com o suporte para ativar.
                    </CardDescription>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Configuração Bancária</h1>
                    <p className="text-gray-500">Gerencie contas e integrações bancárias</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="accounts">Contas Bancárias</TabsTrigger>
                    <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
                </TabsList>

                <TabsContent value="accounts" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Adicionar Conta
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Nova Conta Bancária</DialogTitle>
                                </DialogHeader>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="bank_code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Banco</FormLabel>
                                                    <Select onValueChange={handleBankChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione o banco" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {supportedBanks.map(bank => (
                                                                <SelectItem key={bank.code} value={bank.code}>
                                                                    {bank.code} - {bank.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="agency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Agência (sem dígito)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="account_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Conta (com dígito)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="wallet_code"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Carteira</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="agreement_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Convênio</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Campos de Credenciais Condicionais */}
                                        <div className="border-t pt-4">
                                            <h4 className="font-medium mb-3">Credenciais API</h4>
                                            {selectedBank === '001' && (
                                                <div className="space-y-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="client_id"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Client ID (Oauth)</FormLabel>
                                                                <FormControl><Input {...field} /></FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="client_secret"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Client Secret</FormLabel>
                                                                <FormControl><Input type="password" {...field} /></FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="developer_key"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Developer Key</FormLabel>
                                                                <FormControl><Input type="password" {...field} /></FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}
                                            {/* Outros bancos... */}
                                        </div>

                                        <Button type="submit" className="w-full">Salvar Conta</Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {accounts.map(account => (
                            <Card key={account.id}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {account.bank_name}
                                    </CardTitle>
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">AG: {account.agency}</div>
                                    <p className="text-xs text-muted-foreground">
                                        CC: {account.account_number}-{account.account_digit}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className={`px-2 py-1 rounded text-xs ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {account.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                        <span className="text-xs text-blue-600 font-medium">
                                            {account.environment.toUpperCase()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações Gerais</CardTitle>
                            <CardDescription>Parâmetros globais de cobrança</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">
                                Configure aqui multas padrão, juros e mensagens para boletos.
                                (Funcionalidade a ser implementada em v10.1)
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

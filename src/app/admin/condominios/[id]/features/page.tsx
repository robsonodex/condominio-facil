import { FeatureTogglePanel } from '@/components/admin/FeatureTogglePanel';

export default function CondoFeaturesPage({ params }: { params: { id: string } }) {
    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-2">Gerenciar Features</h1>
            <p className="text-gray-600 mb-6">
                Ative/desative funcionalidades específicas para este condomínio
            </p>

            <FeatureTogglePanel condoId={params.id} />
        </div>
    );
}

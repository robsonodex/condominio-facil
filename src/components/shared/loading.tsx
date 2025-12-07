export function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
        </div>
    );
}

export function PageLoading() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando...</p>
            </div>
        </div>
    );
}

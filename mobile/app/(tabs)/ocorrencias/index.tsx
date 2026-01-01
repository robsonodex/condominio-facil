import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { AlertTriangle, Clock, CheckCircle, Wrench } from 'lucide-react-native'
import { useOccurrences } from '../../../hooks/useData'
import tw from 'twrnc'

export default function Occurrences() {
    const [filter, setFilter] = useState<'all' | 'pendente' | 'em_analise' | 'em_andamento' | 'resolvido'>('all')
    const { data: occurrences, isLoading } = useOccurrences()

    const filteredOccurrences = occurrences?.filter((occ) => {
        if (filter === 'all') return true
        return occ.status === filter
    }) || []

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendente':
                return 'border-gray-300' // Custom implementation: bg is handled separately for full card or icon?
            case 'em_analise':
                return 'border-yellow-500'
            case 'em_andamento':
                return 'border-blue-500'
            case 'resolvido':
                return 'border-green-500'
            default:
                return 'border-gray-300'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pendente':
                return <Clock size={20} color="#6b7280" />
            case 'em_analise':
                return <AlertTriangle size={20} color="#eab308" />
            case 'em_andamento':
                return <Wrench size={20} color="#3b82f6" />
            case 'resolvido':
                return <CheckCircle size={20} color="#22c55e" />
            default:
                return <AlertTriangle size={20} color="#6b7280" />
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pendente':
                return 'Pendente'
            case 'em_analise':
                return 'Em Análise'
            case 'em_andamento':
                return 'Em Andamento'
            case 'resolvido':
                return 'Resolvido'
            default:
                return status
        }
    }

    if (isLoading) {
        return (
            <View style={tw`flex-1 bg-gray-50 items-center justify-center`}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        )
    }

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <View style={tw`bg-white px-6 pt-12 pb-4`}>
                <View style={tw`flex-row items-center justify-between mb-4`}>
                    <Text style={tw`text-2xl font-bold text-gray-900`}>Ocorrências</Text>
                    <TouchableOpacity style={tw`bg-blue-600 px-4 py-2 rounded-full`}>
                        <Text style={tw`text-white font-bold`}>Nova</Text>
                    </TouchableOpacity>
                </View>

                {/* Status Pills */}
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { key: 'all', label: 'Todas' },
                        { key: 'pendente', label: 'Pendente' },
                        { key: 'em_analise', label: 'Em Análise' },
                        { key: 'em_andamento', label: 'Em Andamento' },
                        { key: 'resolvido', label: 'Resolvido' },
                    ]}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setFilter(item.key as any)}
                            style={tw.style(
                                "px-4 py-2 rounded-full mr-2",
                                filter === item.key ? 'bg-blue-600' : 'bg-gray-100'
                            )}
                        >
                            <Text style={tw`${filter === item.key ? 'text-white font-semibold' : 'text-gray-700'}`}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Occurrences List */}
            <FlatList
                data={filteredOccurrences}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`px-6 pt-4`}
                ListEmptyComponent={
                    <View style={tw`bg-white rounded-2xl p-8 items-center`}>
                        <AlertTriangle size={48} color="#d1d5db" />
                        <Text style={tw`text-gray-500 text-center mt-4`}>
                            Nenhuma ocorrência encontrada
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={tw.style(
                            "bg-white rounded-2xl p-4 mb-3 border-l-4",
                            getStatusColor(item.status)
                        )}
                    >
                        <View style={tw`flex-row items-start`}>
                            <View style={tw`mr-3 mt-1`}>{getStatusIcon(item.status)}</View>
                            <View style={tw`flex-1`}>
                                <View style={tw`flex-row items-center justify-between mb-2`}>
                                    <View style={tw`px-3 py-1 rounded-full bg-gray-100`}>
                                        <Text style={tw`text-xs font-semibold text-gray-700 uppercase`}>
                                            {getStatusLabel(item.status)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={tw`text-base font-semibold text-gray-900 mb-1`}>
                                    {item.titulo}
                                </Text>
                                <Text style={tw`text-sm text-gray-600 mb-2`} numberOfLines={2}>
                                    {item.descricao}
                                </Text>
                                <Text style={tw`text-xs text-gray-500`}>
                                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}

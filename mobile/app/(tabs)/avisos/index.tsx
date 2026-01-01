import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { Bell, Megaphone, AlertCircle } from 'lucide-react-native'
import tw from 'twrnc'

interface Notice {
    id: string
    titulo: string
    preview: string
    prioridade: 'normal' | 'urgente' | 'oficial'
    lido: boolean
    data: string
    autor: string
}

const mockNotices: Notice[] = [
    {
        id: '1',
        titulo: 'Manutenção do Elevador',
        preview: 'Informamos que será realizada manutenção preventiva no elevador social...',
        prioridade: 'urgente',
        lido: false,
        data: '14 Jan 2024',
        autor: 'Síndico José',
    },
    {
        id: '2',
        titulo: 'Assembleia Geral Ordinária',
        preview: 'Convocamos todos os condôminos para a assembleia geral...',
        prioridade: 'oficial',
        lido: false,
        data: '12 Jan 2024',
        autor: 'Administração',
    },
    {
        id: '3',
        titulo: 'Horário da Coleta de Lixo',
        preview: 'Lembramos que a coleta de lixo será alterada temporariamente...',
        prioridade: 'normal',
        lido: true,
        data: '10 Jan 2024',
        autor: 'Síndico José',
    },
]

export default function Notices() {
    const [filter, setFilter] = useState<'all' | 'urgente' | 'oficial' | 'unread'>('all')

    const filteredNotices = mockNotices.filter((notice) => {
        if (filter === 'all') return true
        if (filter === 'unread') return !notice.lido
        return notice.prioridade === filter
    })

    const getPriorityColor = (prioridade: string) => {
        switch (prioridade) {
            case 'urgente':
                return 'bg-red-500'
            case 'oficial':
                return 'bg-yellow-500'
            default:
                return 'bg-gray-400'
        }
    }

    const getPriorityIcon = (prioridade: string) => {
        switch (prioridade) {
            case 'urgente':
                return <AlertCircle size={20} color="#ef4444" />
            case 'oficial':
                return <Megaphone size={20} color="#eab308" />
            default:
                return <Bell size={20} color="#6b7280" />
        }
    }

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <View style={tw`bg-white px-6 pt-12 pb-4`}>
                <View style={tw`flex-row items-center justify-between mb-4`}>
                    <Text style={tw`text-2xl font-bold text-gray-900`}>Avisos</Text>
                    <View style={tw`w-6 h-6 bg-red-500 rounded-full items-center justify-center`}>
                        <Text style={tw`text-white text-xs font-bold`}>3</Text>
                    </View>
                </View>

                {/* Filters */}
                <View style={tw`flex-row`}>
                    <TouchableOpacity
                        onPress={() => setFilter('all')}
                        style={tw.style(
                            "px-4 py-2 rounded-full mr-2",
                            filter === 'all' ? 'bg-blue-600' : 'bg-gray-100'
                        )}
                    >
                        <Text style={tw`${filter === 'all' ? 'text-white font-semibold' : 'text-gray-700'}`}>
                            Todos
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilter('urgente')}
                        style={tw.style(
                            "px-4 py-2 rounded-full mr-2",
                            filter === 'urgente' ? 'bg-blue-600' : 'bg-gray-100'
                        )}
                    >
                        <Text style={tw`${filter === 'urgente' ? 'text-white font-semibold' : 'text-gray-700'}`}>
                            Urgentes
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilter('oficial')}
                        style={tw.style(
                            "px-4 py-2 rounded-full",
                            filter === 'oficial' ? 'bg-blue-600' : 'bg-gray-100'
                        )}
                    >
                        <Text style={tw`${filter === 'oficial' ? 'text-white font-semibold' : 'text-gray-700'}`}>
                            Oficiais
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notices List */}
            <FlatList
                data={filteredNotices}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`px-6 pt-4`}
                renderItem={({ item }) => (
                    <TouchableOpacity style={tw`bg-white rounded-2xl p-4 mb-3 relative`}>
                        {!item.lido && (
                            <View style={tw`absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full`} />
                        )}
                        <View style={tw`flex-row items-start mb-2`}>
                            <View style={tw`mr-3 mt-1`}>{getPriorityIcon(item.prioridade)}</View>
                            <View style={tw`flex-1`}>
                                <View style={tw`flex-row items-center mb-1`}>
                                    {item.prioridade !== 'normal' && (
                                        <View
                                            style={tw.style(
                                                "px-2 py-1 rounded-full mr-2",
                                                getPriorityColor(item.prioridade)
                                            )}
                                        >
                                            <Text style={tw`text-white text-xs font-bold uppercase`}>
                                                {item.prioridade}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={tw`text-base font-semibold text-gray-900 mb-1`} numberOfLines={2}>
                                    {item.titulo}
                                </Text>
                                <Text style={tw`text-sm text-gray-600 mb-2`} numberOfLines={2}>
                                    {item.preview}
                                </Text>
                                <Text style={tw`text-xs text-gray-500`}>
                                    {item.autor} • {item.data}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}

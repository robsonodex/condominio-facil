import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { Calendar as CalendarIcon, Users, MapPin } from 'lucide-react-native'
import tw from 'twrnc'

interface CommonArea {
    id: string
    nome: string
    capacidade: number
    disponivel: boolean
    imagem?: string
}

const mockAreas: CommonArea[] = [
    { id: '1', nome: 'Salão de Festas', capacidade: 50, disponivel: true },
    { id: '2', nome: 'Churrasqueira', capacidade: 20, disponivel: true },
    { id: '3', nome: 'Quadra Poliesportiva', capacidade: 16, disponivel: false },
    { id: '4', nome: 'Piscina', capacidade: 30, disponivel: true },
]

export default function Reservations() {
    const [selectedTab, setSelectedTab] = useState<'areas' | 'minhas'>('areas')

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <View style={tw`bg-white px-6 pt-12 pb-4`}>
                <View style={tw`flex-row items-center justify-between mb-4`}>
                    <Text style={tw`text-2xl font-bold text-gray-900`}>Reservas</Text>
                    <TouchableOpacity style={tw`bg-blue-600 px-4 py-2 rounded-full`}>
                        <Text style={tw`text-white font-bold`}>Reservar</Text>
                    </TouchableOpacity>
                </View>

                {/* Calendar Strip */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
                    {[...Array(7)].map((_, i) => {
                        const date = new Date()
                        date.setDate(date.getDate() + i)
                        const isSelected = i === 0

                        return (
                            <TouchableOpacity
                                key={i}
                                style={tw.style(
                                    "w-14 h-16 rounded-xl mr-2 items-center justify-center",
                                    isSelected ? 'bg-blue-600' : 'bg-gray-100'
                                )}
                            >
                                <Text
                                    style={tw.style(
                                        "text-xs font-medium",
                                        isSelected ? 'text-white' : 'text-gray-500'
                                    )}
                                >
                                    {date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                                </Text>
                                <Text
                                    style={tw.style(
                                        "text-xl font-bold mt-1",
                                        isSelected ? 'text-white' : 'text-gray-900'
                                    )}
                                >
                                    {date.getDate()}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>

                {/* Tabs */}
                <View style={tw`flex-row`}>
                    <TouchableOpacity
                        onPress={() => setSelectedTab('areas')}
                        style={tw.style(
                            "flex-1 py-3 rounded-full mr-1",
                            selectedTab === 'areas' ? 'bg-blue-600' : 'bg-gray-100'
                        )}
                    >
                        <Text
                            style={tw.style(
                                "text-center font-semibold",
                                selectedTab === 'areas' ? 'text-white' : 'text-gray-700'
                            )}
                        >
                            Áreas Comuns
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setSelectedTab('minhas')}
                        style={tw.style(
                            "flex-1 py-3 rounded-full ml-1",
                            selectedTab === 'minhas' ? 'bg-blue-600' : 'bg-gray-100'
                        )}
                    >
                        <Text
                            style={tw.style(
                                "text-center font-semibold",
                                selectedTab === 'minhas' ? 'text-white' : 'text-gray-700'
                            )}
                        >
                            Minhas Reservas
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <ScrollView style={tw`px-6 pt-4`}>
                {selectedTab === 'areas' ? (
                    <View style={tw`flex-row flex-wrap -mx-2`}>
                        {mockAreas.map((area) => (
                            <View key={area.id} style={tw`w-1/2 px-2 mb-4`}>
                                <TouchableOpacity style={tw`bg-white rounded-2xl overflow-hidden`}>
                                    <View style={tw`h-32 bg-gray-200 items-center justify-center`}>
                                        <MapPin size={40} color="#9ca3af" />
                                    </View>
                                    <View style={tw`p-3`}>
                                        <View style={tw`flex-row items-center justify-between mb-2`}>
                                            <View
                                                style={tw.style(
                                                    "px-2 py-1 rounded-full",
                                                    area.disponivel ? 'bg-green-100' : 'bg-red-100'
                                                )}
                                            >
                                                <Text
                                                    style={tw.style(
                                                        "text-xs font-bold",
                                                        area.disponivel ? 'text-green-700' : 'text-red-700'
                                                    )}
                                                >
                                                    {area.disponivel ? 'Disponível' : 'Indisponível'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={tw`font-semibold text-gray-900 mb-1`}>{area.nome}</Text>
                                        <View style={tw`flex-row items-center`}>
                                            <Users size={14} color="#6b7280" />
                                            <Text style={tw`text-xs text-gray-600 ml-1`}>
                                                {area.capacidade} pessoas
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={tw`bg-white rounded-2xl p-8 items-center`}>
                        <CalendarIcon size={48} color="#d1d5db" />
                        <Text style={tw`text-gray-500 text-center mt-4`}>
                            Você não tem reservas ativas
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

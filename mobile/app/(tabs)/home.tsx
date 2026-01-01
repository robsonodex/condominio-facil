import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useAuthStore } from '../../lib/store'
import { Home as HomeIcon, Bell, AlertTriangle, DollarSign, Calendar } from 'lucide-react-native'
import tw from 'twrnc'

export default function Home() {
    const { user } = useAuthStore()

    const quickActions = [
        { id: 'avisos', label: 'Avisos', icon: Bell, badge: 3, color: 'bg-red-500' },
        { id: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle, badge: 2, color: 'bg-yellow-500' },
        { id: 'cobrancas', label: 'Cobranças', icon: DollarSign, badge: 1, color: 'bg-red-500' },
        { id: 'reservas', label: 'Reservas', icon: Calendar, badge: 0, color: 'bg-blue-500' },
    ]

    return (
        <ScrollView style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <View style={tw`bg-white px-6 pt-12 pb-6`}>
                <View style={tw`flex-row items-center`}>
                    <View style={tw`w-14 h-14 rounded-full bg-blue-500 items-center justify-center mr-4`}>
                        <Text style={tw`text-white text-xl font-bold`}>
                            {user?.nome?.charAt(0) || 'U'}
                        </Text>
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-2xl font-bold text-gray-900`}>
                            Olá, {user?.nome || 'Usuário'} 👋
                        </Text>
                        <Text style={tw`text-gray-600 mt-1`}>
                            Residencial {user?.condominio_id ? 'Condomínio...' : 'Seu Condomínio'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={tw`px-6 py-6`}>
                <View style={tw`flex-row flex-wrap -mx-2`}>
                    {quickActions.map((action) => (
                        <View key={action.id} style={tw`w-1/2 px-2 mb-4`}>
                            <TouchableOpacity style={tw`bg-white rounded-2xl p-4 items-center relative`}>
                                {action.badge > 0 && (
                                    <View style={tw`absolute top-2 right-2 ${action.color} rounded-full w-6 h-6 items-center justify-center`}>
                                        <Text style={tw`text-white text-xs font-bold`}>{action.badge}</Text>
                                    </View>
                                )}
                                <View style={tw`w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-3`}>
                                    <action.icon size={24} color="#6b7280" />
                                </View>
                                <Text style={tw`text-gray-900 font-semibold text-center`}>{action.label}</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>

            {/* Recent Activity */}
            <View style={tw`px-6 pb-6`}>
                <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Atividade Recente</Text>

                <View style={tw`bg-red-50 rounded-2xl p-4 mb-3 border-l-4 border-red-500`}>
                    <View style={tw`flex-row items-start`}>
                        <View style={tw`w-10 h-10 bg-red-500 rounded-full items-center justify-center mr-3`}>
                            <Bell size={20} color="white" />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`font-semibold text-gray-900 mb-1`}>Aviso Urgente</Text>
                            <Text style={tw`text-gray-600 text-sm`}>Manutenção no elevador programada</Text>
                            <Text style={tw`text-gray-500 text-xs mt-1`}>há 2 horas</Text>
                        </View>
                    </View>
                </View>

                <View style={tw`bg-blue-50 rounded-2xl p-4 mb-3`}>
                    <View style={tw`flex-row items-start`}>
                        <View style={tw`w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3`}>
                            <AlertTriangle size={20} color="white" />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`font-semibold text-gray-900 mb-1`}>Ocorrência Respondida</Text>
                            <Text style={tw`text-gray-600 text-sm`}>Seu chamado #123 foi atualizado</Text>
                            <Text style={tw`text-gray-500 text-xs mt-1`}>há 5 horas</Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}

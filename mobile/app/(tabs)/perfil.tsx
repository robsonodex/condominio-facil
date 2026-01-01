import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useAuthStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'expo-router'
import { Mail, Phone, Home, Edit, Bell, Shield, Moon, LogOut } from 'lucide-react-native'
import tw from 'twrnc'

export default function Profile() {
    const { user, logout } = useAuthStore()
    const router = useRouter()

    const handleLogout = async () => {
        Alert.alert(
            'Sair',
            'Tem certeza que deseja sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.auth.signOut()
                        logout()
                        router.replace('/(auth)/login')
                    },
                },
            ]
        )
    }

    return (
        <ScrollView style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <View style={tw`bg-white px-6 pt-12 pb-6 items-center`}>
                <View style={tw`w-20 h-20 rounded-full bg-blue-500 items-center justify-center mb-4`}>
                    <Text style={tw`text-white text-3xl font-bold`}>
                        {user?.nome?.charAt(0) || 'U'}
                    </Text>
                </View>
                <Text style={tw`text-xl font-bold text-gray-900`}>{user?.nome || 'Usuário'}</Text>
                <Text style={tw`text-sm text-gray-600 mt-1`}>
                    {user?.role === 'morador' ? 'Morador' : user?.role === 'sindico' ? 'Síndico' : 'Porteiro'}
                </Text>
            </View>

            {/* Info Cards */}
            <View style={tw`px-6 py-6`}>
                <View style={tw`bg-white rounded-2xl p-4 mb-3 flex-row items-center`}>
                    <View style={tw`w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3`}>
                        <Mail size={20} color="#2563eb" />
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-xs text-gray-500 mb-1`}>Email</Text>
                        <Text style={tw`text-gray-900`}>{user?.email || 'não informado'}</Text>
                    </View>
                </View>

                <View style={tw`bg-white rounded-2xl p-4 mb-3 flex-row items-center`}>
                    <View style={tw`w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3`}>
                        <Phone size={20} color="#22c55e" />
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-xs text-gray-500 mb-1`}>Telefone</Text>
                        <Text style={tw`text-gray-900`}>{user?.telefone || 'não informado'}</Text>
                    </View>
                </View>

                <View style={tw`bg-white rounded-2xl p-4 mb-3 flex-row items-center`}>
                    <View style={tw`w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3`}>
                        <Home size={20} color="#f97316" />
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-xs text-gray-500 mb-1`}>Unidade</Text>
                        <Text style={tw`text-gray-900`}>{user?.unidade || 'não informada'}</Text>
                    </View>
                </View>
            </View>

            {/* Settings Section */}
            <View style={tw`px-6 pb-6`}>
                <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-3`}>Conta</Text>

                <TouchableOpacity style={tw`bg-white rounded-2xl p-4 mb-2 flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                        <Edit size={20} color="#6b7280" />
                        <Text style={tw`text-gray-900 ml-3 font-medium`}>Editar Perfil</Text>
                    </View>
                    <Text style={tw`text-gray-400`}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={tw`bg-white rounded-2xl p-4 mb-2 flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                        <Bell size={20} color="#6b7280" />
                        <Text style={tw`text-gray-900 ml-3 font-medium`}>Notificações</Text>
                    </View>
                    <Text style={tw`text-gray-400`}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={tw`bg-white rounded-2xl p-4 mb-4 flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                        <Shield size={20} color="#6b7280" />
                        <Text style={tw`text-gray-900 ml-3 font-medium`}>Segurança</Text>
                    </View>
                    <Text style={tw`text-gray-400`}>›</Text>
                </TouchableOpacity>

                <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-3 mt-4`}>Preferências</Text>

                <View style={tw`bg-white rounded-2xl p-4 mb-4 flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                        <Moon size={20} color="#6b7280" />
                        <Text style={tw`text-gray-900 ml-3 font-medium`}>Tema Escuro</Text>
                    </View>
                    <View style={tw`w-12 h-6 bg-gray-200 rounded-full`} />
                </View>

                <TouchableOpacity
                    onPress={handleLogout}
                    style={tw`bg-red-500 rounded-2xl p-4 flex-row items-center justify-center`}
                >
                    <LogOut size={20} color="white" />
                    <Text style={tw`text-white ml-2 font-bold`}>Sair</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

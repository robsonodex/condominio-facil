import { supabase } from './supabase'

export async function fetchUserProfile(userId: string) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.warn('Error fetching profile:', error.message)
            return null
        }
        return data
    } catch (e) {
        console.error('Exception fetching profile:', e)
        return null
    }
}

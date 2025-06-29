import { supabase } from '@/lib/supabaseClient'

export const authService = {
    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        })

        if (error) throw error
        return data
    },

    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    async getSession(){
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        return session
    },

    async getUser() {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return user
    }
}

import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { authService } from 

export function useAuth(){
    const [user, setUser] = useState< | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        authService.getSession().then((session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })
    })


}
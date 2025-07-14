// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authProvider'
import { supabase } from '@/lib/supabaseClient'
import { LandingPage } from '@/components/auth/LandingPage'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  console.log('Component render:', { user: !!user, loading, mounted })
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || loading || !user) return

    const checkUserSetup = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('degree_program_id, graduation_year')
          .eq('auth_id', user.id)
          .single()

        if (!data?.degree_program_id || !data?.graduation_year) {
          router.replace('/setup')
        } else {
          router.replace('/dashboard')
        }
      } catch (error) {
        console.error('User check error:', error)
        router.replace('/setup')
      }
    }

    checkUserSetup()
  }, [user, loading, mounted, router])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return <LandingPage />
}
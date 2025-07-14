// app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, GraduationCap } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = () => {
      // Check for OAuth errors
      const error = searchParams.get('error')
      if (error) {
        router.push(`/?error=${error}`)
        return
      }

      // If there's a code, Supabase will handle it automatically
      // Just redirect to dashboard and let dashboard handle the rest
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500) // Small delay to let any background auth processing finish
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-900 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="text-white" size={32} />
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-900" />
          <h2 className="text-2xl font-bold text-gray-900">Authentication successful!</h2>
        </div>
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  )
}
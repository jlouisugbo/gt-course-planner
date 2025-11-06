// app/auth/callback/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, GraduationCap, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 5

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for OAuth errors
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (errorParam) {
          console.error('[Auth Callback] OAuth error:', errorParam, errorDescription)
          setError(errorDescription || errorParam)
          setTimeout(() => router.push(`/?error=${encodeURIComponent(errorParam)}`), 2000)
          return
        }

        // Check for authorization code
        const code = searchParams.get('code')
        if (!code) {
          console.error('[Auth Callback] No authorization code received')
          setError('No authorization code received')
          setTimeout(() => router.push('/?error=no_code'), 2000)
          return
        }

        console.log('[Auth Callback] Authorization code received, verifying session...')

        // Verify session is established with retries
        let session = null
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          setRetryCount(attempt)

          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

          if (sessionError) {
            console.error('[Auth Callback] Session verification error:', sessionError)
            if (attempt === MAX_RETRIES) {
              setError('Failed to establish session')
              setTimeout(() => router.push('/?error=session_failed'), 2000)
              return
            }
            // Wait before retry (exponential backoff: 500ms, 1s, 2s, 4s, 8s)
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)))
            continue
          }

          if (currentSession) {
            session = currentSession
            console.log('[Auth Callback] Session verified successfully')
            break
          }

          // Session not ready yet, wait and retry
          if (attempt < MAX_RETRIES) {
            console.log(`[Auth Callback] Session not ready, retrying... (${attempt + 1}/${MAX_RETRIES})`)
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)))
          }
        }

        if (!session) {
          console.error('[Auth Callback] Session not established after retries')
          setError('Session could not be established')
          setTimeout(() => router.push('/?error=session_timeout'), 2000)
          return
        }

        // Session verified - safe to proceed
        console.log('[Auth Callback] Redirecting to dashboard...')
        router.push('/dashboard')

      } catch (err) {
        console.error('[Auth Callback] Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        setTimeout(() => router.push('/?error=unexpected'), 2000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-900 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="text-white" size={32} />
        </div>

        {error ? (
          <>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Authentication Error</h2>
            </div>
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-gray-600 text-sm">Redirecting back to login...</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-900" />
              <h2 className="text-2xl font-bold text-gray-900">Authentication successful!</h2>
            </div>
            <p className="text-gray-600">Verifying your session...</p>
            {retryCount > 0 && (
              <p className="text-gray-500 text-sm mt-2">
                Establishing connection... ({retryCount}/{MAX_RETRIES})
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-900 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-white" size={32} />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-900" />
            <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
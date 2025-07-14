// middleware.ts - temporary debug version
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow debug page during development
  if (pathname.startsWith('/debug-auth')) {
    return NextResponse.next()
  }

  // Allow all public routes
  if (pathname === '/' || 
      pathname.startsWith('/auth') || 
      pathname.startsWith('/setup') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  console.log('Middleware - pathname:', pathname)
  console.log('Middleware - user exists:', !!user)

  // NOT AUTHENTICATED
  if (!user) {
    console.log('Middleware - No user, redirecting to home')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // AUTHENTICATED - check profile setup
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('degree_program_id, full_name, graduation_year')
    .eq('auth_id', user.id)
    .single()

  console.log('Middleware - userProfile:', userProfile)
  console.log('Middleware - profileError:', profileError)

  // If no profile exists, redirect to setup
  if (profileError?.code === 'PGRST116') {
    console.log('Middleware - No profile, redirecting to setup')
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  const isSetupComplete = Boolean(
    userProfile?.degree_program_id && 
    userProfile?.full_name && 
    userProfile?.graduation_year
  )

  console.log('Middleware - isSetupComplete:', isSetupComplete)

  // AUTHENTICATED + SETUP NOT COMPLETE
  if (!isSetupComplete) {
    console.log('Middleware - Setup not complete, redirecting to setup')
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  // AUTHENTICATED + SETUP COMPLETE - allow access
  console.log('Middleware - Setup complete, allowing access')
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
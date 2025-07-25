import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow debug page during development
  if (pathname.startsWith('/debug-auth')) {
    return NextResponse.next()
  }

  // Allow auth callback route
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  // Public routes that don't need authentication
  const publicRoutes = ['/landing']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Root route handling - will be managed by page.tsx
  if (pathname === '/') {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('Middleware - pathname:', pathname)
  console.log('Middleware - user exists:', !!user)

  // Check if user is authenticated
  if (!user) {
    console.log('Middleware - No user, redirecting to landing')
    const url = request.nextUrl.clone()
    url.pathname = '/landing' 
    return NextResponse.redirect(url)
  }

  // Get user profile from database
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('major, full_name, graduation_year')
    .eq('auth_id', user.id)
    .single()

  console.log('Middleware - userProfile:', userProfile)
  console.log('Middleware - profileError:', profileError)

  // If user doesn't exist in database, redirect to landing
  if (profileError?.code === 'PGRST116') {
    console.log('Middleware - No user profile in database, redirecting to landing')
    const url = request.nextUrl.clone()
    url.pathname = '/landing'
    return NextResponse.redirect(url)
  }

  // Check if setup is complete (graduation_year and major are set)
  const isSetupComplete = Boolean(userProfile?.graduation_year && userProfile?.major)

  console.log('Middleware - isSetupComplete:', isSetupComplete)

  // If setup is not complete and not on setup page, redirect to setup
  if (!isSetupComplete && !pathname.startsWith('/setup')) {
    console.log('Middleware - Setup not complete, redirecting to setup')
    const url = request.nextUrl.clone()
    url.pathname = '/setup'
    return NextResponse.redirect(url)
  }

  // If setup is complete and on setup page, redirect to dashboard
  if (isSetupComplete && pathname.startsWith('/setup')) {
    console.log('Middleware - Setup complete, redirecting to dashboard')
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Allow access to protected routes if authenticated and setup complete
  console.log('Middleware - Allowing access to protected route')
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
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
      pathname.startsWith('/landing') || 
      pathname.startsWith('/setup') ||
      pathname.startsWith('/')) {
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

  if (!user) {
    console.log('Middleware - No user, redirecting to home')
    const url = request.nextUrl.clone()
    url.pathname = '/landing' 
    return NextResponse.redirect(url)
  }

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
    const url = request.nextUrl.clone()
    url.pathname = '/setup'
    return NextResponse.redirect(url)
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
    const url = request.nextUrl.clone()
    url.pathname = '/setup'
    return NextResponse.redirect(url)
  }

  // AUTHENTICATED + SETUP COMPLETE - allow access
  console.log('Middleware - Setup complete, allowing access')
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
// app/api/admin/refresh-data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

// Lazy initialization to avoid build-time environment variable issues
function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you'd implement this check)
    const isAdmin = await checkIfUserIsAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { forceRefresh = false } = await request.json()

    // Check last update time
    const { data: lastUpdate } = await supabase
      .from('system_config')
      .select('last_crawler_run')
      .single()

    const lastRun = lastUpdate?.last_crawler_run
    const daysSinceUpdate = lastRun 
      ? (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity

    if (!forceRefresh && daysSinceUpdate < 1) {
      return NextResponse.json({
        message: 'Data is recent, skipping update',
        lastUpdate: lastRun
      })
    }

    // Run crawler
    console.log('🕷️ Running GT Scheduler crawler...')
    await execAsync('cd crawler && npm run crawl')

    // Import data
    console.log('📥 Importing crawler data...')
    await execAsync('ts-node scripts/import-gt-data.ts ./crawler/data')

    // Update last run timestamp
    await supabase
      .from('system_config')
      .upsert({
        key: 'last_crawler_run',
        value: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: 'Data refreshed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error refreshing data:', error)
    return NextResponse.json({
      error: 'Failed to refresh data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  // Implement your admin check logic
  // For example, check user role in database
  const supabase = getSupabaseClient()
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', userId)
    .single()

  return data?.role === 'admin'
}
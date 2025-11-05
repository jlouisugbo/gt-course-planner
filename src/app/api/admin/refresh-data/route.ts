// app/api/admin/refresh-data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

// SECURITY: Validate that required scripts exist before execution
function validateScriptPaths(): { isValid: boolean; missingPaths: string[] } {
    const requiredPaths = [
        path.join(process.cwd(), 'crawler'),
        path.join(process.cwd(), 'crawler', 'package.json'),
        path.join(process.cwd(), 'scripts', 'import-gt-data.ts')
    ];

    const missingPaths: string[] = [];
    for (const p of requiredPaths) {
        if (!fs.existsSync(p)) {
            missingPaths.push(p);
        }
    }

    return {
        isValid: missingPaths.length === 0,
        missingPaths
    };
}

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
    // SECURITY: Disable in production or when scripts are missing
    if (process.env.NODE_ENV === 'production' || process.env.DISABLE_DATA_REFRESH === 'true') {
      return NextResponse.json({
        error: 'Data refresh is disabled in this environment',
        message: 'Use manual database operations or enable DISABLE_DATA_REFRESH=false'
      }, { status: 403 });
    }

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

    // SECURITY: Validate that required scripts exist before execution
    const validation = validateScriptPaths();
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Required crawler scripts not found',
        message: 'This endpoint requires the GT Scheduler crawler to be set up',
        missingPaths: validation.missingPaths,
        setup: 'Run: npm run crawler:setup'
      }, { status: 503 });
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

    // SECURITY: Run commands with timeout and error handling
    console.log('🕷️ Running GT Scheduler crawler...')
    try {
      const { stdout: crawlOutput, stderr: crawlError } = await execAsync(
        'cd crawler && npm run crawl',
        { timeout: 300000, maxBuffer: 10 * 1024 * 1024 } // 5min timeout, 10MB buffer
      );
      console.log('Crawler output:', crawlOutput);
      if (crawlError) console.warn('Crawler warnings:', crawlError);
    } catch (crawlErr) {
      console.error('Crawler failed:', crawlErr);
      return NextResponse.json({
        error: 'Crawler execution failed',
        details: crawlErr instanceof Error ? crawlErr.message : 'Unknown error'
      }, { status: 500 });
    }

    // Import data
    console.log('📥 Importing crawler data...')
    try {
      const { stdout: importOutput, stderr: importError } = await execAsync(
        'ts-node scripts/import-gt-data.ts ./crawler/data',
        { timeout: 300000, maxBuffer: 10 * 1024 * 1024 } // 5min timeout, 10MB buffer
      );
      console.log('Import output:', importOutput);
      if (importError) console.warn('Import warnings:', importError);
    } catch (importErr) {
      console.error('Import failed:', importErr);
      return NextResponse.json({
        error: 'Data import failed',
        details: importErr instanceof Error ? importErr.message : 'Unknown error'
      }, { status: 500 });
    }

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
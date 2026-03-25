import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'

export async function POST() {
  const scriptsDir = path.join(process.cwd(), 'scripts')
  const scriptPath = path.join(scriptsDir, 'email_flight_scanner.py')

  return new Promise<Response>((resolve) => {
    exec(
      `py "${scriptPath}"`,
      {
        cwd: scriptsDir,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        },
        timeout: 120000,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error('Scan error:', error.message)
          resolve(NextResponse.json({
            success: false,
            error: 'Scanner failed — only works on local dev server',
            detail: error.message,
          }, { status: 500 }))
        } else {
          resolve(NextResponse.json({
            success: true,
            output: stdout,
          }))
        }
      }
    )
  })
}

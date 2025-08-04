import { NextRequest, NextResponse } from 'next/server'
import * as path from 'path'
import * as fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    // Construct path to scraped data file
    const dataDir = path.join(process.cwd(), '..', '..', 'data', 'raw-scrapes')
    const filePath = path.join(dataDir, filename)

    // Security check - ensure file is within data directory
    if (!filePath.startsWith(dataDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Read and parse JSONL file
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const lines = fileContent.trim().split('\n')
    const data = []

    for (const line of lines) {
      if (line.trim()) {
        try {
          const item = JSON.parse(line)
          data.push(item)
        } catch (parseError) {
          console.error('Error parsing line:', parseError)
        }
      }
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Raw data API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
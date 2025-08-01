import { NextRequest, NextResponse } from 'next/server'
import * as path from 'path'
import * as fs from 'fs'

interface DashboardStats {
  scrapedPages: number
  parsedDocuments: number
  trainingBlocks: number
  annotatedItems: number
  lastActivity: string
}

export async function GET(request: NextRequest) {
  try {
    const stats: DashboardStats = {
      scrapedPages: 0,
      parsedDocuments: 0,
      trainingBlocks: 0,
      annotatedItems: 0,
      lastActivity: 'Never'
    }

    let mostRecentActivity = 0
    const dataDir = path.join(process.cwd(), '..', '..', 'data')
    const trainingDir = path.join(process.cwd(), '..', '..', 'diablo-agent-training')

    // Count scraped pages
    const scrapesDir = path.join(dataDir, 'raw-scrapes')
    if (fs.existsSync(scrapesDir)) {
      const scrapeFiles = fs.readdirSync(scrapesDir)
      for (const file of scrapeFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(scrapesDir, file)
          const fileStats = fs.statSync(filePath)
          
          // Update most recent activity
          if (fileStats.mtime.getTime() > mostRecentActivity) {
            mostRecentActivity = fileStats.mtime.getTime()
          }

          // Count items in file
          try {
            const content = fs.readFileSync(filePath, 'utf-8')
            // Try JSON array first
            try {
              const jsonArray = JSON.parse(content)
              if (Array.isArray(jsonArray)) {
                stats.scrapedPages += jsonArray.length
              }
            } catch {
              // Try JSONL format
              const lines = content.trim().split('\n').filter(line => line.trim())
              stats.scrapedPages += lines.length
            }
          } catch {
            // If we can't count, assume 1 page per file
            stats.scrapedPages += 1
          }
        }
      }
    }

    // Count training files and blocks
    if (fs.existsSync(trainingDir)) {
      const scanDirectory = (dir: string) => {
        const items = fs.readdirSync(dir)
        for (const item of items) {
          const itemPath = path.join(dir, item)
          const itemStats = fs.statSync(itemPath)
          
          if (itemStats.isDirectory()) {
            // Recursively scan subdirectories
            scanDirectory(itemPath)
          } else if (item.endsWith('.json')) {
            stats.parsedDocuments += 1
            
            // Update most recent activity
            if (itemStats.mtime.getTime() > mostRecentActivity) {
              mostRecentActivity = itemStats.mtime.getTime()
            }

            // Count training blocks
            try {
              const content = fs.readFileSync(itemPath, 'utf-8')
              const jsonData = JSON.parse(content)
              if (Array.isArray(jsonData)) {
                stats.trainingBlocks += jsonData.length
              }
            } catch {
              // If we can't count, assume 1 block per file
              stats.trainingBlocks += 1
            }
          }
        }
      }
      
      scanDirectory(trainingDir)
    }

    // Format last activity time
    if (mostRecentActivity > 0) {
      const now = Date.now()
      const diffMs = now - mostRecentActivity
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 1) {
        stats.lastActivity = 'Just now'
      } else if (diffMins < 60) {
        stats.lastActivity = `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
      } else if (diffHours < 24) {
        stats.lastActivity = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
      } else {
        stats.lastActivity = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
      }
    }

    // For now, annotated items is 0 (TODO: implement when we have annotation feature)
    stats.annotatedItems = 0

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load stats', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
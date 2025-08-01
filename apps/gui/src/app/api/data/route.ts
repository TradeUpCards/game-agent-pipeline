import { NextRequest, NextResponse } from 'next/server'
import * as path from 'path'
import * as fs from 'fs'

interface DataFile {
  name: string
  path: string
  size: number
  type: 'scraped' | 'parsed' | 'training'
  lastModified: string
  itemCount?: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all'
    const file = searchParams.get('file')
    
    // If file parameter is provided, return file content
    if (file && type === 'parsed') {
      const trainingDir = path.join(process.cwd(), '..', '..', 'diablo-agent-training')
      const filePath = path.join(trainingDir, file)
      
      // Security check - ensure file is within training directory
      if (!filePath.startsWith(trainingDir)) {
        return NextResponse.json(
          { success: false, error: 'Invalid file path' },
          { status: 400 }
        )
      }
      
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        )
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const jsonContent = JSON.parse(content)
        
        return NextResponse.json({
          success: true,
          content: jsonContent,
          fileName: file
        })
      } catch (parseError) {
        return NextResponse.json(
          { success: false, error: 'Failed to parse file content' },
          { status: 500 }
        )
      }
    }

    // If file parameter is provided for original data, search scraped files
    if (file && type === 'original') {
      const dataDir = path.join(process.cwd(), '..', '..', 'data')
      const scrapesDir = path.join(dataDir, 'raw-scrapes')
      
      console.log('Looking for original data for file:', file)
      
      if (!fs.existsSync(scrapesDir)) {
        return NextResponse.json(
          { success: false, error: 'Scrapes directory not found' },
          { status: 404 }
        )
      }
      
      try {
        // Look for scraped files that might contain this data
        const scrapeFiles = fs.readdirSync(scrapesDir).filter(f => f.endsWith('.json'))
        
        for (const scrapeFile of scrapeFiles) {
          const scrapeFilePath = path.join(scrapesDir, scrapeFile)
          try {
            const content = fs.readFileSync(scrapeFilePath, 'utf-8')
            
            // Try parsing as JSON array first
            let jsonData
            try {
              jsonData = JSON.parse(content)
            } catch (jsonError) {
              // If that fails, try parsing as JSONL (JSON Lines)
              const lines = content.trim().split('\n').filter(line => line.trim())
              jsonData = lines.map(line => JSON.parse(line))
            }
          
            if (Array.isArray(jsonData)) {
              // Search for a page that matches the file name pattern
              const matchingPage = jsonData.find((page: any) => {
                if (page.url) {
                  try {
                    const url = new URL(page.url)
                    const pathParts = url.pathname.split('/')
                    // Extract the last part of the URL path (the actual page slug)
                    const pageSlug = pathParts[pathParts.length - 1]
                    
                    // Extract just the filename from the file parameter (remove directory path)
                    // Handle both forward slashes and backslashes for cross-platform compatibility
                    const fileName = file.split(/[/\\]/).pop() || file
                    const fileNameWithoutExt = fileName.replace('.json', '')
                    
                    console.log('Comparing:', pageSlug, 'vs', fileNameWithoutExt)
                    
                    // Check if the page slug matches the filename
                    return pageSlug === fileNameWithoutExt
                  } catch (urlError) {
                    console.error('Error parsing URL:', page.url, urlError)
                    return false
                  }
                }
                return false
              })
              
              if (matchingPage) {
                console.log('Found matching page for', file, 'in', scrapeFile)
                return NextResponse.json({
                  success: true,
                  content: matchingPage,
                  fileName: file,
                  sourceFile: scrapeFile
                })
              }
            }
          } catch (fileError) {
            console.error('Error parsing JSON file:', scrapeFile, fileError.message)
            // Continue to next file if this one fails
            continue
          }
        }
        
        console.log('No matching page found for file:', file)
        return NextResponse.json(
          { success: false, error: 'Original data not found' },
          { status: 404 }
        )
      } catch (parseError) {
        console.error('Error searching original data:', parseError)
        return NextResponse.json(
          { success: false, error: 'Failed to search original data', details: parseError.message },
          { status: 500 }
        )
      }
    }
    
    const files: DataFile[] = []
    const dataDir = path.join(process.cwd(), '..', '..', 'data')
    const trainingDir = path.join(process.cwd(), '..', '..', 'diablo-agent-training')

    // Scan raw scrapes directory
    const scrapesDir = path.join(dataDir, 'raw-scrapes')
    if (fs.existsSync(scrapesDir)) {
      const scrapeFiles = fs.readdirSync(scrapesDir)
      for (const file of scrapeFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(scrapesDir, file)
          const stats = fs.statSync(filePath)
          
          // Count items in file
          let itemCount = 0
          try {
            const content = fs.readFileSync(filePath, 'utf-8')
            // Try JSON array first
            try {
              const jsonArray = JSON.parse(content)
              if (Array.isArray(jsonArray)) {
                itemCount = jsonArray.length
              }
            } catch {
              // Try JSONL format
              const lines = content.trim().split('\n').filter(line => line.trim())
              itemCount = lines.length
            }
          } catch {
            // If we can't count, that's okay
          }

          files.push({
            name: file,
            path: '/data/raw-scrapes/',
            size: stats.size,
            type: 'scraped',
            lastModified: stats.mtime.toISOString(),
            itemCount
          })
        }
      }
    }

    // Scan training directories
    if (fs.existsSync(trainingDir)) {
      const scanDirectory = (dir: string, relativePath: string = '') => {
        const items = fs.readdirSync(dir)
        for (const item of items) {
          const itemPath = path.join(dir, item)
          const stats = fs.statSync(itemPath)
          
          if (stats.isDirectory()) {
            // Recursively scan subdirectories
            scanDirectory(itemPath, path.join(relativePath, item))
          } else if (item.endsWith('.json')) {
            // Count items in training file
            let itemCount = 0
            try {
              const content = fs.readFileSync(itemPath, 'utf-8')
              const jsonData = JSON.parse(content)
              if (Array.isArray(jsonData)) {
                itemCount = jsonData.length
              }
            } catch {
              // If we can't count, that's okay
            }

            files.push({
              name: item,
              path: `/${path.relative(process.cwd(), dir).replace(/\\/g, '/')}/`,
              size: stats.size,
              type: 'training',
              lastModified: stats.mtime.toISOString(),
              itemCount
            })
          }
        }
      }
      
      scanDirectory(trainingDir)
    }

    // Filter by type if specified
    const filteredFiles = type === 'all' 
      ? files 
      : files.filter(file => file.type === type)

    // Sort by last modified (newest first)
    filteredFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

    return NextResponse.json({
      success: true,
      files: filteredFiles,
      count: filteredFiles.length
    })

  } catch (error) {
    console.error('Data API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load files', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
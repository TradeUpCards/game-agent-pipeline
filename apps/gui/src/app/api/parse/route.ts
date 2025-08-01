import { NextRequest, NextResponse } from 'next/server'
import * as path from 'path'
import * as fs from 'fs'
import { ContentParser } from '@game-agent-pipeline/parser'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inputFile, outputDir, contentType = 'auto', dryRun = false } = body

    if (!inputFile) {
      return NextResponse.json(
        { success: false, error: 'Input file is required' },
        { status: 400 }
      )
    }

    // Construct full paths
    const dataDir = path.join(process.cwd(), '..', '..', 'data')
    const scrapesDir = path.join(dataDir, 'raw-scrapes')
    const inputPath = path.join(scrapesDir, inputFile)
    const outputPath = path.join(process.cwd(), '..', '..', outputDir || 'diablo-agent-training')

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      return NextResponse.json(
        { success: false, error: 'Input file not found', path: inputPath },
        { status: 404 }
      )
    }

    // Create parser instance
    const parser = new ContentParser({
      inputFile: inputPath,
      outputDir: outputPath,
      dryRun,
      verbose: true
    })

    // Run the parser
    const result = await parser.parse()

    // Count created files by scanning output directories
    const createdFiles: string[] = []
    if (!dryRun && result.outputFolders.length > 0) {
      for (const folder of result.outputFolders) {
        const folderPath = path.join(outputPath, folder)
        if (fs.existsSync(folderPath)) {
          const files = fs.readdirSync(folderPath)
          files.forEach(file => {
            if (file.endsWith('.json')) {
              createdFiles.push(path.join(folder, file))
            }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        filesCreated: createdFiles.length,
        itemsProcessed: result.pagesParsed,
        categoriesFound: result.outputFolders.length
      },
      files: createdFiles,
      result: {
        totalPages: result.totalPages,
        pagesParsed: result.pagesParsed,
        pagesSkipped: result.pagesSkipped,
        outputFolders: result.outputFolders,
        errors: result.errors
      }
    })

  } catch (error) {
    console.error('Parser API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Parser failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
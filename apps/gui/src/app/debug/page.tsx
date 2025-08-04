'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ScrapedPage {
  url: string
  title: string
  content: Array<{
    type: string
    text?: string
    level?: number
    items?: string[]
    list_type?: string
  }>
}

interface ParsedContent {
  heading: string
  content: string
}

interface HierarchicalContent {
  title: string
  url: string
  bossStats?: {
    level: number
    hp: string
    staggerHp: number
  }
  bossVersions?: Array<{
    name: string
    abilities: Array<{
      name: string
      description: string
    }>
    strategies?: Array<{
      name: string
      description: string
    }>
  }>
  generalContent?: Array<{
    heading: string
    content: string
  }>
}

export default function DebugPage() {
  const [files, setFiles] = useState<string[]>([])
  const [scrapedData, setScrapedData] = useState<ScrapedPage[]>([])
  const [selectedPage, setSelectedPage] = useState<ScrapedPage | null>(null)
  const [parsedData, setParsedData] = useState<ParsedContent[] | HierarchicalContent | null>(null)
  const [viewMode, setViewMode] = useState<'scraped' | 'parsed' | 'hierarchical'>('scraped')
  const [parsedFile, setParsedFile] = useState<string | null>(null)
  const [availableParsedFiles, setAvailableParsedFiles] = useState<string[]>([])

  // Load available scraped files
  const loadScrapedFiles = async () => {
    try {
      const response = await fetch('/api/data?type=scraped')
      const data = await response.json()
      return data.success ? data.files.map((f: any) => f.name) : []
    } catch (error) {
      console.error('Failed to load scraped files:', error)
      return []
    }
  }

  // Load scraped data from a file
  const loadScrapedData = async (filename: string) => {
    try {
      const response = await fetch(`/api/data?type=scraped&file=${encodeURIComponent(filename)}`)
      const data = await response.json()
      
      if (data.success) {
        setScrapedData(data.content)
        setSelectedPage(null)
        setParsedData(null)
        await loadAvailableParsedFiles()
      } else {
        console.error('Failed to load scraped data:', data.error)
      }
    } catch (error) {
      console.error('Failed to load scraped data:', error)
    }
  }

  // Load available parsed files
  const loadAvailableParsedFiles = async () => {
    try {
      const response = await fetch('/api/data?type=parsed')
      const data = await response.json()
      if (data.success) {
        setAvailableParsedFiles(data.files.map((f: any) => f.name))
      }
    } catch (error) {
      console.error('Failed to load parsed files:', error)
    }
  }

  // Load parsed data for a specific file
  const loadParsedData = async (filename: string) => {
    try {
      const response = await fetch(`/api/data?type=parsed&file=${encodeURIComponent(filename)}`)
      const data = await response.json()
      
      if (data.success) {
        setParsedData(data.content)
        setParsedFile(filename)
      } else {
        console.error('Failed to load parsed data:', data.error)
        setParsedData(null)
      }
    } catch (error) {
      console.error('Failed to load parsed data:', error)
      setParsedData(null)
    }
  }

  // Convert scraped content to parsed format (simulate parser logic)
  const convertToParsed = (page: ScrapedPage): ParsedContent[] => {
    const contentBlocks: ParsedContent[] = []
    let currentHeading = page.title || 'Content'
    let currentContent: string[] = []

    for (const item of page.content || []) {
      if (item.type === 'heading') {
        if (currentContent.length > 0) {
          contentBlocks.push({
            heading: currentHeading,
            content: currentContent.join(' ').trim()
          })
          currentContent = []
        }
        currentHeading = item.text || 'Heading'
      } else if (item.type === 'paragraph') {
        currentContent.push(item.text || '')
      } else if (item.type === 'list') {
        currentContent.push((item.items || []).join(', '))
      } else if (item.type === 'blockquote') {
        currentContent.push(`"${item.text || ''}"`)
      } else if (item.type === 'figcaption') {
        currentContent.push(`Caption: ${item.text || ''}`)
      }
    }

    if (currentContent.length > 0) {
      contentBlocks.push({
        heading: currentHeading,
        content: currentContent.join(' ').trim()
      })
    }

    return contentBlocks
  }

  useEffect(() => {
    if (selectedPage) {
      const pageSlug = selectedPage.url.split('/').pop()?.split('?')[0] || ''
      const titleSlug = selectedPage.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      
      const matchingParsedFile = availableParsedFiles.find(file => {
        const fileName = file.split('/').pop() || file
        const fileNameWithoutExt = fileName.replace('.json', '')
        
        return fileNameWithoutExt === pageSlug || 
               fileNameWithoutExt === titleSlug || 
               fileName.includes('echo-of-lilith')
      })
      
      if (matchingParsedFile) {
        loadParsedData(matchingParsedFile)
      } else {
        setParsedData(convertToParsed(selectedPage))
        setParsedFile(null)
      }
    }
  }, [selectedPage, availableParsedFiles])

  useEffect(() => {
    loadScrapedFiles().then(setFiles)
  }, [])

  const isHierarchicalData = (data: any): data is HierarchicalContent => {
    return data && typeof data === 'object' && 'bossVersions' in data
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Content Debug Tool
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compare original websites with scraped and parsed content
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Selection</CardTitle>
            <CardDescription>
              Choose a scraped file and page to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select scraped file:
              </label>
              <select 
                className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => e.target.value && loadScrapedData(e.target.value)}
              >
                <option value="" className="text-gray-500 dark:text-gray-400">
                  Choose a file...
                </option>
                {files.map(file => (
                  <option key={file} value={file} className="text-gray-900 dark:text-white">
                    {file}
                  </option>
                ))}
              </select>
            </div>

            {scrapedData && scrapedData.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select page:
                </label>
                <select 
                  className="w-full max-w-2xl px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const page = scrapedData.find(p => p.url === e.target.value)
                    setSelectedPage(page || null)
                  }}
                >
                  {scrapedData.map(page => (
                    <option key={page.url} value={page.url} className="text-gray-900 dark:text-white">
                      {page.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedPage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Original Website</CardTitle>
                <CardDescription className="text-sm break-all">
                  {selectedPage.url}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-b-lg p-6">
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedPage.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {selectedPage.content?.length || 0} content items
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Parsed Content
                  {parsedFile && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      (from {parsedFile})
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {isHierarchicalData(parsedData) ? 'Hierarchical structure with boss versions' : 'Standard content blocks'}
                </CardDescription>
              </CardHeader>
              
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    View Mode:
                  </span>
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('scraped')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'scraped'
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${viewMode === 'scraped' ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                        Raw Scraped
                      </span>
                    </button>
                    <button
                      onClick={() => setViewMode('parsed')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'parsed'
                          ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm border border-gray-200 dark:border-gray-600'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${viewMode === 'parsed' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        Content Blocks
                      </span>
                    </button>
                    <button
                      onClick={() => setViewMode('hierarchical')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'hierarchical'
                          ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm border border-gray-200 dark:border-gray-600'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${viewMode === 'hierarchical' ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
                        Hierarchical
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <CardContent className="flex-1 p-0">
                <div className="h-full overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
                  {viewMode === 'scraped' && (
                    <div className="space-y-4">
                      {selectedPage?.content?.map((item, i) => (
                        <div key={i} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {item.type}
                            </span>
                            {item.level && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                H{item.level}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-900 dark:text-gray-100">
                            {item.type === 'list' ? (
                              <ul className="list-disc list-inside space-y-1">
                                {item.items?.map((listItem, j) => (
                                  <li key={j} className="text-gray-700 dark:text-gray-300">{listItem}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{item.text}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewMode === 'parsed' && (
                    <div className="space-y-4">
                      {parsedData ? (
                        Array.isArray(parsedData) ? (
                          parsedData.map((block, index) => (
                            <div key={index} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{block.heading}</h4>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{block.content}</p>
                            </div>
                          ))
                        ) : (
                          convertToParsed(selectedPage).map((block, index) => (
                            <div key={index} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{block.heading}</h4>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{block.content}</p>
                            </div>
                          ))
                        )
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                          No parsed data available
                        </div>
                      )}
                    </div>
                  )}

                  {viewMode === 'hierarchical' && (
                    <div className="space-y-6">
                      {parsedData && isHierarchicalData(parsedData) ? (
                        <>
                          {parsedData.bossStats && (
                            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Boss Stats</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {parsedData.bossStats.level}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {parsedData.bossStats.hp}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">HP</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {parsedData.bossStats.staggerHp}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Stagger HP</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {parsedData.bossVersions && parsedData.bossVersions.length > 0 && (
                            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Boss Versions</h4>
                              <div className="space-y-4">
                                {parsedData.bossVersions.map((version, index) => (
                                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                    <h5 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                                      {version.name}
                                    </h5>
                                    
                                    {version.abilities && version.abilities.length > 0 && (
                                      <div className="mb-4">
                                        <h6 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Abilities:</h6>
                                        <div className="space-y-2">
                                          {version.abilities.map((ability, abilityIndex) => (
                                            <div key={abilityIndex} className="pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                                              <div className="font-medium text-blue-600 dark:text-blue-400">
                                                {ability.name}
                                              </div>
                                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {ability.description}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {version.strategies && version.strategies.length > 0 && (
                                      <div>
                                        <h6 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Strategies:</h6>
                                        <div className="space-y-2">
                                          {version.strategies.map((strategy, strategyIndex) => (
                                            <div key={strategyIndex} className="pl-4 border-l-2 border-green-200 dark:border-green-800">
                                              <div className="font-medium text-green-600 dark:text-green-400">
                                                {strategy.name}
                                              </div>
                                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {strategy.description}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {parsedData.generalContent && parsedData.generalContent.length > 0 && (
                            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">General Content</h4>
                              <div className="space-y-4">
                                {parsedData.generalContent.map((block, index) => (
                                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                                      {block.heading}
                                    </h5>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {block.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                          No hierarchical data available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
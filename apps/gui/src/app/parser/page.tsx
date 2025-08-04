'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FolderOpen, 
  FileText, 
  Upload,
  Play,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Eye
} from 'lucide-react'

export default function Parser() {
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [availableFiles, setAvailableFiles] = useState<string[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<any>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'parsed' | 'original'>('parsed')
  const [originalContent, setOriginalContent] = useState<any>(null)
  const [outputDir, setOutputDir] = useState('diablo-agent-training')
  const [contentType, setContentType] = useState('auto')

  useEffect(() => {
    loadAvailableFiles()
  }, [])

  const loadAvailableFiles = async () => {
    try {
      const response = await fetch('/api/data?type=scraped')
      const data = await response.json()
      
      if (data.success) {
        const fileNames = data.files.map((file: any) => file.name)
        setAvailableFiles(fileNames)
      } else {
        console.error('Failed to load files:', data.error)
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setLoadingFiles(false)
    }
  }

  const [preserveHierarchy, setPreserveHierarchy] = useState(true)

  const parseFile = async () => {
    if (!selectedFile) return
    
    setParsing(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          inputFile: selectedFile,
          outputDir: outputDir,
          contentType: contentType,
          preserveHierarchy: preserveHierarchy
        })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to parse file',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setParsing(false)
    }
  }

  const previewFileContent = async (fileName: string) => {
    setPreviewFile(fileName)
    setLoadingPreview(true)
    setPreviewContent(null)
    setOriginalContent(null)
    setPreviewMode('parsed')
    
    try {
      // Load parsed content
      const parsedResponse = await fetch(`/api/data?type=parsed&file=${encodeURIComponent(fileName)}`)
      const parsedData = await parsedResponse.json()
      
      if (parsedData.success) {
        setPreviewContent(parsedData.content)
      } else {
        setPreviewContent({ error: parsedData.error || 'Failed to load parsed file' })
      }

      // Try to load original content by finding the source file
      // Pass the full filename with extension to the API
      const originalResponse = await fetch(`/api/data?type=original&file=${encodeURIComponent(fileName)}`)
      const originalData = await originalResponse.json()
      
      if (originalData.success) {
        setOriginalContent(originalData.content)
      }
    } catch (error) {
      setPreviewContent({ error: 'Failed to load file content' })
    } finally {
      setLoadingPreview(false)
    }
  }

  const closePreview = () => {
    setPreviewFile(null)
    setPreviewContent(null)
    setOriginalContent(null)
    setPreviewMode('parsed')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Parser</h1>
            <p className="text-muted-foreground">
              Convert scraped data into structured training blocks for AI model training
            </p>
          </div>

          {/* File Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Select Input File
              </CardTitle>
              <CardDescription>
                Choose a scraped data file to parse into training blocks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Available Files
                  </label>
                  <select
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={parsing || loadingFiles}
                  >
                    <option value="">
                      {loadingFiles ? 'Loading files...' : 'Select a file...'}
                    </option>
                    {availableFiles.map((file) => (
                      <option key={file} value={file}>
                        {file}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={parseFile}
                    disabled={!selectedFile || parsing}
                    className="flex items-center gap-2"
                  >
                    {parsing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Parse File
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" disabled={parsing}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parser Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Parser Configuration</CardTitle>
              <CardDescription>
                Configure how the parser processes your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Output Directory
                  </label>
                  <input
                    type="text"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={parsing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={parsing}
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="builds">Build Guides</option>
                    <option value="gameplay">Gameplay Mechanics</option>
                    <option value="bosses">Boss Guides</option>
                    <option value="news">News & Updates</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveHierarchy}
                    onChange={(e) => setPreserveHierarchy(e.target.checked)}
                    disabled={parsing}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">
                    Preserve Hierarchy (Boss Versions, Abilities, Strategies)
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Enable hierarchical parsing for boss pages to preserve boss version context and organize abilities/strategies properly
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  Parsing Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.success ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {result.stats?.filesCreated || 0}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Files Created
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {result.stats?.itemsProcessed || 0}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          Items Processed
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {result.stats?.categoriesFound || 0}
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">
                          Categories Found
                        </div>
                      </div>
                    </div>

                    {result.files && (
                      <div>
                        <h4 className="font-medium mb-2">Generated Files:</h4>
                        <div className="max-h-60 overflow-y-auto border border-input rounded-md p-3 space-y-1">
                          {result.files.map((file: string, index: number) => (
                            <div 
                              key={index} 
                              className="flex items-center gap-2 text-sm p-2 rounded hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                              onClick={() => previewFileContent(file)}
                            >
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="flex-1">{file}</span>
                              <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600 dark:text-red-400">
                    <p className="font-medium">{result.error}</p>
                    {result.message && (
                      <p className="text-sm mt-1">{result.message}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* File Preview Modal */}
          {previewFile && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background border border-input rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-input">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {previewFile}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={closePreview}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex border-b border-input">
                  <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      previewMode === 'parsed'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setPreviewMode('parsed')}
                  >
                    Parsed Content
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      previewMode === 'original'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    } ${!originalContent ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => originalContent && setPreviewMode('original')}
                    disabled={!originalContent}
                  >
                    Original Data {!originalContent && '(Not Available)'}
                  </button>
                </div>
                
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                  {loadingPreview ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading preview...</span>
                    </div>
                  ) : previewMode === 'parsed' ? (
                    previewContent?.error ? (
                      <div className="text-red-600 dark:text-red-400 py-4">
                        <p className="font-medium">Error loading parsed file:</p>
                        <p className="text-sm">{previewContent.error}</p>
                      </div>
                    ) : previewContent ? (
                      <div className="space-y-4">
                        {Array.isArray(previewContent) ? (
                          previewContent.map((block: any, index: number) => (
                            <div key={index} className="border border-input rounded-lg p-4">
                              <h4 className="font-semibold text-lg mb-2">{block.heading}</h4>
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {block.content}
                              </div>
                            </div>
                          ))
                        ) : (
                          <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                            {JSON.stringify(previewContent, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : null
                  ) : previewMode === 'original' ? (
                    originalContent ? (
                      <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Original scraped data</strong> - This is the raw content before parsing into training blocks.
                          </p>
                        </div>
                        {originalContent ? (
                          <div className="space-y-3">
                            <div className="border border-input rounded-lg p-4">
                              <h4 className="font-semibold text-lg mb-2">Page Info</h4>
                              <div className="text-sm space-y-1">
                                <p><strong>Title:</strong> {originalContent.title || 'N/A'}</p>
                                <p><strong>URL:</strong> {originalContent.url || 'N/A'}</p>
                                {originalContent.metadata?.description && (
                                  <p><strong>Description:</strong> {originalContent.metadata.description}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="border border-input rounded-lg p-4">
                              <h4 className="font-semibold text-lg mb-2">Original Page Content</h4>
                              <div className="prose prose-sm max-w-none max-h-96 overflow-y-auto text-muted-foreground">
                                {/* Main title */}
                                <h1 className="text-xl font-bold text-foreground mb-4">{originalContent.title}</h1>
                                
                                {/* Check if content is in the new ordered format (array) or old format (separate arrays) */}
                                {Array.isArray(originalContent.content) ? (
                                  // New format: render content in document order
                                  originalContent.content.map((item: any, idx: number) => {
                                    if (item.type === 'heading') {
                                      const HeadingTag = `h${Math.min(item.level + 1, 6)}` as keyof JSX.IntrinsicElements;
                                      return (
                                        <HeadingTag key={idx} className="font-semibold text-foreground mt-4 mb-2">
                                          {item.text}
                                        </HeadingTag>
                                      );
                                    } else if (item.type === 'paragraph') {
                                      return (
                                        <p key={idx} className="mb-3 leading-relaxed">
                                          {item.text}
                                        </p>
                                      );
                                    } else if (item.type === 'list') {
                                      const ListTag = item.list_type === 'ol' ? 'ol' : 'ul';
                                      const listClass = item.list_type === 'ol' ? 'list-decimal list-inside space-y-1' : 'list-disc list-inside space-y-1';
                                      return (
                                        <ListTag key={idx} className={listClass}>
                                          {item.items.map((listItem: string, itemIdx: number) => (
                                            <li key={itemIdx}>{listItem}</li>
                                          ))}
                                        </ListTag>
                                      );
                                    } else if (item.type === 'figcaption') {
                                      return (
                                        <div key={idx} className="italic text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded mb-3">
                                          <strong>Figure Caption:</strong> {item.text}
                                        </div>
                                      );
                                    } else if (item.type === 'blockquote') {
                                      return (
                                        <blockquote key={idx} className="border-l-4 border-gray-300 pl-4 italic mb-3">
                                          {item.text}
                                        </blockquote>
                                      );
                                    } else if (item.type === 'definition_list') {
                                      return (
                                        <dl key={idx} className="mb-3">
                                          {item.items.map((defItem: string, itemIdx: number) => {
                                            const [term, definition] = defItem.split(': ', 2);
                                            return (
                                              <div key={itemIdx} className="mb-2">
                                                <dt className="font-medium">{term}</dt>
                                                <dd className="ml-4">{definition}</dd>
                                              </div>
                                            );
                                          })}
                                        </dl>
                                      );
                                    } else {
                                      // Fallback for unknown content types
                                      return (
                                        <div key={idx} className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                          <strong>{item.type}:</strong> {JSON.stringify(item, null, 2)}
                                        </div>
                                      );
                                    }
                                  })
                                ) : originalContent.content ? (
                                  // Old format: render separated arrays
                                  <>
                                    {/* Render headings and paragraphs in a more natural flow */}
                                    {originalContent.content?.headings && originalContent.content.headings.map((heading: any, idx: number) => {
                                      const HeadingTag = `h${Math.min(heading.level + 1, 6)}` as keyof JSX.IntrinsicElements;
                                      return (
                                        <HeadingTag key={`heading-${idx}`} className="font-semibold text-foreground mt-4 mb-2">
                                          {heading.text}
                                        </HeadingTag>
                                      );
                                    })}
                                    
                                    {/* Render paragraphs */}
                                    {originalContent.content?.paragraphs && originalContent.content.paragraphs.map((paragraph: any, idx: number) => (
                                      <p key={`paragraph-${idx}`} className="mb-3 leading-relaxed">
                                        {typeof paragraph === 'string' ? paragraph : JSON.stringify(paragraph)}
                                      </p>
                                    ))}
                                    
                                    {/* Render lists */}
                                    {originalContent.content?.lists && originalContent.content.lists.map((list: any, idx: number) => (
                                      <div key={`list-${idx}`} className="mb-3">
                                        {Array.isArray(list) ? (
                                          <ul className="list-disc list-inside space-y-1">
                                            {list.map((item: any, itemIdx: number) => (
                                              <li key={itemIdx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <div>{JSON.stringify(list)}</div>
                                        )}
                                      </div>
                                    ))}
                                  </>
                                ) : null}
                                
                                {/* Show additional data if available */}
                                {originalContent.additional_data?.links && originalContent.additional_data.links.length > 0 && (
                                  <div className="mt-6 pt-4 border-t border-muted">
                                    <h5 className="font-medium mb-2">Links ({originalContent.additional_data.links.length})</h5>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {originalContent.additional_data.links.slice(0, 10).map((link: any, idx: number) => (
                                        <div key={idx} className="text-xs">
                                          <a href={link.url} className="text-blue-500 hover:underline" target="_blank" rel="noopener">
                                            {link.text}
                                          </a>
                                        </div>
                                      ))}
                                      {originalContent.additional_data.links.length > 10 && (
                                        <div className="text-xs">... and {originalContent.additional_data.links.length - 10} more links</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                            {JSON.stringify(originalContent, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground py-4 text-center">
                        <p>Original data not available for this file.</p>
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Information */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Content Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      The parser analyzes scraped content and identifies different content types (builds, guides, news, etc.)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Structure Extraction</h4>
                    <p className="text-sm text-muted-foreground">
                      Extracts meaningful content blocks, headings, and metadata from each page
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-white text-sm flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-medium">File Organization</h4>
                    <p className="text-sm text-muted-foreground">
                      Creates organized training files in appropriate directories (builds/, gameplay_mechanics/, etc.)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
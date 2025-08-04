'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Database, 
  FileText, 
  Search, 
  Filter,
  Eye,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react'

interface DataFile {
  name: string
  path: string
  size: number
  type: 'scraped' | 'parsed' | 'training'
  lastModified: string
  itemCount?: number
}

export default function DataBrowser() {
  const [files, setFiles] = useState<DataFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadFiles()
  }, [selectedType])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedType !== 'all') {
        params.append('type', selectedType)
      }
      
      const response = await fetch(`/api/data?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.files)
      } else {
        console.error('Failed to load files:', data.error)
        setFiles([])
      }
    } catch (error) {
      console.error('Failed to load files:', error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scraped': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'parsed': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'training': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Data Browser</h1>
              <p className="text-muted-foreground">
                Browse and manage your scraped data, parsed documents, and training sets
              </p>
            </div>
            <Button onClick={loadFiles} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{files.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Training Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {files.reduce((acc, file) => acc + (file.itemCount || 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All Types</option>
                    <option value="scraped">Scraped Data</option>
                    <option value="parsed">Parsed Data</option>
                    <option value="training">Training Data</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          <Card>
            <CardHeader>
              <CardTitle>Files ({filteredFiles.length})</CardTitle>
              <CardDescription>
                Your data files organized by type and ready for processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading files...
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{file.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(file.type)}`}>
                              {file.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{file.path}</span>
                            <span>{formatFileSize(file.size)}</span>
                            {file.itemCount && <span>{file.itemCount} items</span>}
                            <span>{formatDate(file.lastModified)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
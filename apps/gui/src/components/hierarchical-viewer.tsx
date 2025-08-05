'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, FileText, Sword, Shield, Target, BookOpen, Info, AlertTriangle } from 'lucide-react'

interface BossAbility {
  name: string
  description: string
  strategy?: string
  phase?: string
  mechanics?: string[]
}

interface BossVersion {
  name: string
  level?: number
  hp?: string
  staggerHp?: number
  abilities: BossAbility[]
}

interface ParsedContent {
  heading: string
  content: string
}

interface HierarchicalContent {
  title: string
  url: string
  bossVersions?: BossVersion[]
  generalContent?: ParsedContent[]
  sections?: {
    introduction?: ParsedContent[]
    mechanics?: ParsedContent[]
    fightProgression?: ParsedContent[]
    advancedStrategy?: ParsedContent[]
    summary?: ParsedContent[]
    footer?: ParsedContent[]
  }
}

interface HierarchicalViewerProps {
  content: HierarchicalContent
}

const CollapsibleSection: React.FC<{
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {children}
        </div>
      )}
    </div>
  )
}

const BossVersionCard: React.FC<{ bossVersion: BossVersion }> = ({ bossVersion }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showStrategies, setShowStrategies] = useState(true)

  return (
    <div className="border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {bossVersion.name}
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Boss Stats */}
        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
          {bossVersion.level && (
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <div className="font-medium text-gray-600 dark:text-gray-400">Level</div>
              <div className="font-bold">{bossVersion.level}</div>
            </div>
          )}
          {bossVersion.hp && (
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <div className="font-medium text-gray-600 dark:text-gray-400">HP</div>
              <div className="font-bold">{bossVersion.hp}</div>
            </div>
          )}
          {bossVersion.staggerHp && (
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <div className="font-medium text-gray-600 dark:text-gray-400">Stagger HP</div>
              <div className="font-bold">{bossVersion.staggerHp}</div>
            </div>
          )}
        </div>

        {/* Abilities Count */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {bossVersion.abilities.length} abilities
          </span>
          <button
            onClick={() => setShowStrategies(!showStrategies)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            {showStrategies ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showStrategies ? 'Hide' : 'Show'} Strategies
          </button>
        </div>

        {/* Abilities */}
        {isOpen && (
          <div className="space-y-3">
            {bossVersion.abilities.map((ability, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    {ability.name}
                  </h4>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {ability.description}
                </p>
                {showStrategies && ability.strategy && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400">
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="h-3 w-3 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Strategy</span>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      {ability.strategy}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const ContentSection: React.FC<{ title: string; content: ParsedContent[] }> = ({ title, content }) => {
  if (!content || content.length === 0) return null

  return (
    <div className="space-y-3">
      {content.map((item, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {item.heading}
          </h4>
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {item.content}
          </div>
        </div>
      ))}
    </div>
  )
}

export const HierarchicalViewer: React.FC<HierarchicalViewerProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bosses' | 'sections'>('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Info className="h-4 w-4" /> },
    { id: 'bosses', label: 'Boss Versions', icon: <Sword className="h-4 w-4" /> },
    { id: 'sections', label: 'Sections', icon: <BookOpen className="h-4 w-4" /> }
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
        <p className="text-blue-100 text-sm">{content.url}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Sword className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Boss Versions</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {content.bossVersions?.length || 0}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Total Abilities</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {content.bossVersions?.reduce((total, bv) => total + bv.abilities.length, 0) || 0}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Content Sections</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {Object.values(content.sections || {}).filter(section => section && section.length > 0).length}
                </div>
              </div>
            </div>

            {/* Quick Boss Preview */}
            {content.bossVersions && content.bossVersions.length > 0 && (
              <CollapsibleSection title="Boss Versions Preview" icon={<Sword className="h-5 w-5" />} defaultOpen={true}>
                <div className="space-y-3">
                  {content.bossVersions.map((bossVersion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <div className="font-semibold">{bossVersion.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Level {bossVersion.level} • {bossVersion.hp} HP • {bossVersion.staggerHp} Stagger HP
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {bossVersion.abilities.length} abilities
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        )}

        {activeTab === 'bosses' && (
          <div className="space-y-4">
            {content.bossVersions && content.bossVersions.length > 0 ? (
              content.bossVersions.map((bossVersion, index) => (
                <BossVersionCard key={index} bossVersion={bossVersion} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No boss versions found in this content.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-4">
            {content.sections?.introduction && content.sections.introduction.length > 0 && (
              <CollapsibleSection title="Introduction" icon={<Info className="h-5 w-5" />} defaultOpen={true}>
                <ContentSection title="Introduction" content={content.sections.introduction} />
              </CollapsibleSection>
            )}

            {content.sections?.mechanics && content.sections.mechanics.length > 0 && (
              <CollapsibleSection title="Mechanics" icon={<Shield className="h-5 w-5" />}>
                <ContentSection title="Mechanics" content={content.sections.mechanics} />
              </CollapsibleSection>
            )}

            {content.sections?.fightProgression && content.sections.fightProgression.length > 0 && (
              <CollapsibleSection title="Fight Progression" icon={<Target className="h-5 w-5" />}>
                <ContentSection title="Fight Progression" content={content.sections.fightProgression} />
              </CollapsibleSection>
            )}

            {content.sections?.advancedStrategy && content.sections.advancedStrategy.length > 0 && (
              <CollapsibleSection title="Advanced Strategy" icon={<Sword className="h-5 w-5" />}>
                <ContentSection title="Advanced Strategy" content={content.sections.advancedStrategy} />
              </CollapsibleSection>
            )}

            {content.sections?.summary && content.sections.summary.length > 0 && (
              <CollapsibleSection title="Summary" icon={<FileText className="h-5 w-5" />}>
                <ContentSection title="Summary" content={content.sections.summary} />
              </CollapsibleSection>
            )}

            {content.sections?.footer && content.sections.footer.length > 0 && (
              <CollapsibleSection title="Footer" icon={<FileText className="h-5 w-5" />}>
                <ContentSection title="Footer" content={content.sections.footer} />
              </CollapsibleSection>
            )}

            {content.generalContent && content.generalContent.length > 0 && (
              <CollapsibleSection title="General Content" icon={<FileText className="h-5 w-5" />}>
                <ContentSection title="General Content" content={content.generalContent} />
              </CollapsibleSection>
            )}

            {(!content.sections || Object.values(content.sections).every(section => !section || section.length === 0)) &&
             (!content.generalContent || content.generalContent.length === 0) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No content sections found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
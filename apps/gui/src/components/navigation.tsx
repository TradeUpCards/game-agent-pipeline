'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Globe, 
  Database, 
  MessageSquare, 
  Settings,
  FolderOpen,
  Sparkles
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Scraper', href: '/scraper', icon: Globe },
  { name: 'Data Browser', href: '/data', icon: Database },
  { name: 'Parser', href: '/parser', icon: FolderOpen },
  { name: 'Annotator', href: '/annotator', icon: MessageSquare },
  { name: 'Training Sets', href: '/training', icon: Sparkles },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-6 lg:space-x-8">
      {navigation.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href))
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
              isActive
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden md:inline-block">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
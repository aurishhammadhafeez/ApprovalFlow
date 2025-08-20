'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  BarChart3, Clock, CheckCircle, Users, FileText, 
  Plus, Search, Bell, Settings, LogOut
} from 'lucide-react'

type DashboardLayoutProps = {
  children: React.ReactNode
  orgData: any
  onLogout: () => void
  onCreateWorkflow: () => void
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  orgData, 
  onLogout, 
  onCreateWorkflow 
}) => {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ApprovalFlow
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {orgData.name}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search workflows..." className="pl-10 w-64" />
            </div>
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen">
          <nav className="p-4 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => router.push('/dashboard')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => router.push('/workflows')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Workflows
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => router.push('/users')}
            >
              <Users className="mr-2 h-4 w-4" />
              Users
            </Button>
            <Button 
              onClick={onCreateWorkflow}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

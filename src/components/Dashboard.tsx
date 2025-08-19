import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, Clock, CheckCircle, AlertCircle, Users, FileText, 
  Plus, Filter, Search, Bell, Settings, LogOut, Wand2, Edit, Trash2, Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SupabaseService } from '@/lib/supabase-service';
import { toast } from '@/components/ui/sonner';

interface DashboardProps {
  orgData: any;
  onCreateWorkflow: () => void;
  onLogout: () => void;
}

interface Workflow {
  id: string;
  name: string;
  department: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

const Dashboard: React.FC<DashboardProps> = ({ orgData, onCreateWorkflow, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);

  const stats = [
    { title: 'Pending Approvals', value: '12', icon: <Clock className="h-5 w-5" />, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Completed Today', value: '8', icon: <CheckCircle className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Total Workflows', value: workflows.length.toString(), icon: <FileText className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active Users', value: '15', icon: <Users className="h-5 w-5" />, color: 'bg-purple-600', bg: 'bg-purple-50' }
  ];

  const recentApprovals = [
    { id: 1, title: 'Marketing Campaign Budget', department: 'Marketing', status: 'pending', amount: '$5,000', submitter: 'John Doe', date: '2024-01-15' },
    { id: 2, title: 'New Employee Onboarding', department: 'HR', status: 'approved', amount: '-', submitter: 'Jane Smith', date: '2024-01-14' },
    { id: 3, title: 'IT Equipment Purchase', department: 'IT', status: 'rejected', amount: '$2,500', submitter: 'Mike Johnson', date: '2024-01-14' },
    { id: 4, title: 'Travel Expense Reimbursement', department: 'Finance', status: 'pending', amount: '$850', submitter: 'Sarah Wilson', date: '2024-01-13' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const { data: userData } = await SupabaseService.getCurrentUserWithOrganization();
      
      if (!userData?.organization) {
        toast.error('Organization not found');
        return;
      }

      const { data, error } = await SupabaseService.getWorkflows(userData.organization.id);
      
      if (error) {
        console.error('Error fetching workflows:', error);
        toast.error('Failed to fetch workflows');
        return;
      }

      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleWorkflowCreated = () => {
    // Refresh workflows after creating a new one
    fetchWorkflows();
    onCreateWorkflow();
  };

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
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => setActiveTab('workflows')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Workflows
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => setActiveTab('users')}
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {orgData.adminName}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bg}`}>
                          <div className={stat.color}>{stat.icon}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* AI Document Generator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wand2 className="h-5 w-5 mr-2 text-purple-600" />
                    AI Document Generator
                  </CardTitle>
                  <CardDescription>Generate workflow documents using AI</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                      Describe what you need: "Create a job contract for a UI designer at $2,000/month"
                    </p>
                    <div className="flex space-x-2">
                      <Input placeholder="Describe your document needs..." className="flex-1" />
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Approvals */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Recent Approvals</CardTitle>
                      <CardDescription>Latest approval requests in your organization</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentApprovals.map((approval) => (
                      <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <h4 className="font-medium">{approval.title}</h4>
                          <p className="text-sm text-gray-600">
                            {approval.department} • Submitted by {approval.submitter} • {approval.date}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          {approval.amount !== '-' && (
                            <span className="font-medium">{approval.amount}</span>
                          )}
                          <Badge className={getStatusColor(approval.status)}>
                            {approval.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
                <Button onClick={handleWorkflowCreated} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New
                </Button>
              </div>
              
              {loading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading workflows...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : workflows.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
                      <p className="text-gray-600 mb-4">Get started by creating your first approval workflow</p>
                      <Button onClick={handleWorkflowCreated} className="bg-gradient-to-r from-blue-600 to-purple-600">
                        Create Workflow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {workflow.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                {workflow.department} • {workflow.type}
                              </span>
                              <span>
                                Created {new Date(workflow.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Manage your team</h3>
                    <p className="text-gray-600 mb-4">Invite users and assign roles for approval workflows</p>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                      Invite Users
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
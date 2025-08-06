import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Wand2, FileText, Users, Settings, 
  Plus, Trash2, ArrowRight, CheckCircle 
} from 'lucide-react';

interface WorkflowBuilderProps {
  onBack: () => void;
  onSave: (workflow: any) => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onBack, onSave }) => {
  const [workflow, setWorkflow] = useState({
    name: '',
    department: '',
    type: '',
    description: '',
    steps: [{ id: 1, name: 'Initial Review', approver: '', required: true }]
  });

  const departments = [
    'HR', 'Finance', 'Marketing', 'Legal', 'IT', 'Operations', 
    'Sales', 'Strategy', 'Design', 'Procurement', 'Admin'
  ];

  const workflowTypes = {
    'HR': ['Hiring Approval', 'Leave Request', 'Exit Clearance', 'Performance Review'],
    'Finance': ['Budget Approval', 'Invoice Processing', 'Expense Reimbursement', 'Payment Authorization'],
    'Marketing': ['Campaign Budget', 'Content Approval', 'PR Release', 'Event Sponsorship'],
    'Legal': ['Contract Review', 'Policy Change', 'Compliance Check', 'Legal Opinion'],
    'IT': ['Software Purchase', 'Access Request', 'Change Request', 'Security Review'],
    'Operations': ['Maintenance Request', 'Equipment Purchase', 'Process Change', 'Quality Check'],
    'Sales': ['Proposal Approval', 'Discount Authorization', 'Credit Limit', 'Deal Closure'],
    'Strategy': ['Investment Decision', 'Partnership Agreement', 'Strategic Initiative', 'Budget Planning'],
    'Design': ['Brand Approval', 'Asset Review', 'Creative Brief', 'Design Change'],
    'Procurement': ['Purchase Order', 'Vendor Selection', 'Contract Negotiation', 'Supplier Audit'],
    'Admin': ['Facility Request', 'Supply Order', 'Policy Update', 'Administrative Change']
  };

  const templates = [
    { 
      name: 'Simple Approval', 
      description: 'Single approver workflow',
      icon: <CheckCircle className="h-5 w-5" />,
      steps: [{ id: 1, name: 'Manager Approval', approver: '', required: true }]
    },
    { 
      name: 'Sequential Approval', 
      description: 'Multi-level approval chain',
      icon: <ArrowRight className="h-5 w-5" />,
      steps: [
        { id: 1, name: 'Direct Manager', approver: '', required: true },
        { id: 2, name: 'Department Head', approver: '', required: true },
        { id: 3, name: 'Executive Approval', approver: '', required: true }
      ]
    },
    { 
      name: 'Parallel Review', 
      description: 'Multiple approvers simultaneously',
      icon: <Users className="h-5 w-5" />,
      steps: [
        { id: 1, name: 'Technical Review', approver: '', required: true },
        { id: 2, name: 'Budget Review', approver: '', required: true }
      ]
    }
  ];

  const addStep = () => {
    const newStep = {
      id: workflow.steps.length + 1,
      name: `Step ${workflow.steps.length + 1}`,
      approver: '',
      required: true
    };
    setWorkflow(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
  };

  const removeStep = (stepId: number) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }));
  };

  const updateStep = (stepId: number, field: string, value: any) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, [field]: value } : step
      )
    }));
  };

  const useTemplate = (template: any) => {
    setWorkflow(prev => ({ ...prev, steps: template.steps }));
  };

  const handleSave = () => {
    onSave(workflow);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-bold">Workflow Builder</h1>
              <p className="text-sm text-gray-600">Create and configure approval workflows</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">Preview</Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600">
              Save Workflow
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="steps">Approval Steps</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Information</CardTitle>
                <CardDescription>Define the basic details of your approval workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workflowName">Workflow Name</Label>
                    <Input
                      id="workflowName"
                      placeholder="e.g., Marketing Budget Approval"
                      value={workflow.name}
                      onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select onValueChange={(value) => setWorkflow(prev => ({ ...prev, department: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {workflow.department && (
                  <div className="space-y-2">
                    <Label htmlFor="workflowType">Workflow Type</Label>
                    <Select onValueChange={(value) => setWorkflow(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workflow type" />
                      </SelectTrigger>
                      <SelectContent>
                        {workflowTypes[workflow.department as keyof typeof workflowTypes]?.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of this workflow"
                    value={workflow.description}
                    onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

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
          </TabsContent>

          <TabsContent value="steps" className="space-y-6">
            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Templates</CardTitle>
                <CardDescription>Start with a pre-built workflow template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {templates.map((template, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => useTemplate(template)}>
                      <CardContent className="p-4 text-center">
                        <div className="mb-2 text-blue-600">{template.icon}</div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Approval Steps */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Approval Steps</CardTitle>
                    <CardDescription>Configure the approval workflow steps</CardDescription>
                  </div>
                  <Button onClick={addStep} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {workflow.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Step name"
                        value={step.name}
                        onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Approver email"
                        value={step.approver}
                        onChange={(e) => updateStep(step.id, 'approver', e.target.value)}
                      />
                    </div>
                    {workflow.steps.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeStep(step.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Settings</CardTitle>
                <CardDescription>Configure advanced workflow options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Settings</h3>
                  <p className="text-gray-600">SLA timers, escalation rules, and notifications will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Heart, DollarSign, ShoppingCart, Scale, 
  Monitor, Cog, TrendingUp, Palette, Package, 
  Users, Headphones, GraduationCap, Home
} from 'lucide-react';

interface IndustryTemplatesProps {
  onSelectTemplate: (template: any) => void;
}

const IndustryTemplates: React.FC<IndustryTemplatesProps> = ({ onSelectTemplate }) => {
  const industryTemplates = [
    {
      industry: 'Technology',
      icon: <Monitor className="h-6 w-6" />,
      color: 'bg-blue-50 text-blue-600',
      templates: [
        { name: 'Software License Approval', description: 'Approve new software purchases and licenses', department: 'IT' },
        { name: 'Code Deployment', description: 'Production deployment approval process', department: 'IT' },
        { name: 'Security Access Request', description: 'Grant system access permissions', department: 'IT' }
      ]
    },
    {
      industry: 'Healthcare',
      icon: <Heart className="h-6 w-6" />,
      color: 'bg-red-50 text-red-600',
      templates: [
        { name: 'Patient Treatment Plan', description: 'Medical treatment approval workflow', department: 'Medical' },
        { name: 'Equipment Procurement', description: 'Medical equipment purchase approval', department: 'Procurement' },
        { name: 'Staff Certification', description: 'Healthcare staff certification process', department: 'HR' }
      ]
    },
    {
      industry: 'Finance',
      icon: <DollarSign className="h-6 w-6" />,
      color: 'bg-green-50 text-green-600',
      templates: [
        { name: 'Loan Approval', description: 'Multi-tier loan approval process', department: 'Finance' },
        { name: 'Investment Decision', description: 'Investment committee approval', department: 'Strategy' },
        { name: 'Risk Assessment', description: 'Financial risk evaluation workflow', department: 'Risk' }
      ]
    },
    {
      industry: 'Manufacturing',
      icon: <Cog className="h-6 w-6" />,
      color: 'bg-orange-50 text-orange-600',
      templates: [
        { name: 'Production Change Order', description: 'Manufacturing process changes', department: 'Operations' },
        { name: 'Quality Control', description: 'Product quality approval workflow', department: 'Quality' },
        { name: 'Supplier Qualification', description: 'New supplier approval process', department: 'Procurement' }
      ]
    },
    {
      industry: 'Retail',
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'bg-purple-50 text-purple-600',
      templates: [
        { name: 'Product Launch', description: 'New product introduction approval', department: 'Marketing' },
        { name: 'Pricing Strategy', description: 'Price change approval workflow', department: 'Sales' },
        { name: 'Store Operations', description: 'Store policy and procedure changes', department: 'Operations' }
      ]
    },
    {
      industry: 'Education',
      icon: <GraduationCap className="h-6 w-6" />,
      color: 'bg-indigo-50 text-indigo-600',
      templates: [
        { name: 'Course Approval', description: 'New course curriculum approval', department: 'Academic' },
        { name: 'Faculty Hiring', description: 'Academic staff recruitment process', department: 'HR' },
        { name: 'Research Grant', description: 'Research funding approval workflow', department: 'Research' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Industry-Specific Templates</h2>
        <p className="text-gray-600">Pre-built workflows tailored for your industry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {industryTemplates.map((industry, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${industry.color}`}>
                  {industry.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{industry.industry}</CardTitle>
                  <CardDescription>{industry.templates.length} templates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {industry.templates.map((template, templateIndex) => (
                <div key={templateIndex} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {template.department}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs"
                    onClick={() => onSelectTemplate({ ...template, industry: industry.industry })}
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-dashed">
          <CardContent className="p-6">
            <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Don't see your industry?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Our AI can create custom workflows for any industry or use case
            </p>
            <Button variant="outline">
              Request Custom Templates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IndustryTemplates;
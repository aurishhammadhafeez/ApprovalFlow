# ApprovalFlow - AI-Powered Approval Workflow Platform

A modern React-based web application for streamlining approval workflows across different departments and industries.

## 🚀 Features

- **AI-Powered Workflows**: Generate documents and automate approvals with AI
- **Enterprise Security**: RBAC, audit logs, and compliance ready
- **Universal Integration**: Connect with any ERP, CRM, or business system
- **Modern UI**: Built with Shadcn/ui and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/aurishhammadhafeez/ApprovalFlow.git
cd ApprovalFlow

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Environment Setup

1. Copy `env.example` to `.env.local`
2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard

2. **Set Environment Variables**:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. **Deploy**: Vercel will automatically deploy on every push to main branch

### Supabase Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

2. **Database Schema** (Optional):
   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     name TEXT,
     role TEXT DEFAULT 'user',
     organization_id UUID REFERENCES organizations(id),
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Organizations table
   CREATE TABLE organizations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     industry TEXT,
     size TEXT,
     admin_id UUID REFERENCES users(id),
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Workflows table
   CREATE TABLE workflows (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     department TEXT,
     type TEXT,
     description TEXT,
     organization_id UUID REFERENCES organizations(id),
     created_by UUID REFERENCES users(id),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

## 📱 Application Flow

1. **Landing Page** → Product overview and pricing
2. **Organization Setup** → Multi-step onboarding wizard
3. **Dashboard** → Main application interface
4. **Workflow Builder** → Create and configure approval workflows

## 🎨 UI Components

Built with a comprehensive component library including:
- Cards, Buttons, Forms
- Modals, Dropdowns, Tabs
- Charts, Tables, Navigation
- Responsive design patterns

## 🔐 Authentication

- Supabase Auth integration
- Role-based access control
- Organization-based user management

## 📊 Current Status

- ✅ Frontend: Fully functional with mock data
- ✅ UI Components: Complete component library
- ✅ Responsive Design: Mobile-friendly
- 🔄 Backend: Supabase integration in progress
- 🔄 AI Features: UI ready for AI integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email support@approvalflow.com or create an issue in this repository.

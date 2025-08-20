# ApprovalFlow - AI-Powered Approval Workflow Platform

ApprovalFlow is a modern, AI-powered approval workflow platform that streamlines business processes across different departments and industries. Built with Next.js, TypeScript, and Supabase, it provides enterprise-grade security with role-based access control (RBAC).

## ✨ Features

- **AI-Powered Workflows**: Generate documents and automate approvals with AI
- **Enterprise Security**: RBAC, audit logs, and compliance ready
- **Universal Integration**: Connect with any ERP, CRM, or business system
- **Real-time Collaboration**: Live updates and notifications
- **Mobile Responsive**: Works seamlessly across all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aurishhammadhafeez/ApprovalFlow.git
   cd ApprovalFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp env.example .env.local
   
   # Update with your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

Optional:
- `NEXT_PUBLIC_OPENAI_API_KEY`: OpenAI API key for AI document generation

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── setup/            # Organization setup
│   ├── workflow/         # Workflow builder
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── Dashboard.tsx     # Main dashboard
│   ├── WorkflowBuilder.tsx # Workflow creation
│   └── UserManagement.tsx # User management
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── lib/                   # Utility libraries
└── types/                 # TypeScript types
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Connect your GitHub repository
   - Add environment variables
   - Deploy automatically

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access Control (RBAC)**: Granular permission management
- **Organization Isolation**: Complete data separation between organizations
- **Audit Logging**: Track all user actions and changes
- **Secure Authentication**: Supabase Auth with email confirmation

## 📊 Database Schema

The platform uses a robust PostgreSQL schema with:

- **Users**: Authentication and profile management
- **Organizations**: Multi-tenant organization support
- **Workflows**: Approval workflow definitions
- **Workflow Steps**: Individual approval steps
- **Roles**: Permission definitions
- **User Roles**: Role assignments within organizations
- **Invitations**: Secure user onboarding

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.approvalflow.com](https://docs.approvalflow.com)
- **Issues**: [GitHub Issues](https://github.com/aurishhammadhafeez/ApprovalFlow/issues)
- **Discord**: [Join our community](https://discord.gg/approvalflow)

---

Built with ❤️ by the ApprovalFlow Team

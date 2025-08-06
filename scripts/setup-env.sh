#!/bin/bash

# Setup environment variables for ApprovalFlow
# This script sets up the necessary environment variables

echo "🔧 Setting up environment variables for ApprovalFlow..."

# Create .env.local file
cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://vusxtpupkiwhnvynqgus.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase Database Password (for CLI operations)
SUPABASE_DB_PASSWORD=Oy5RvYziaK8xqVG

# Optional: AI Service (for document generation)
VITE_OPENAI_API_KEY=your_openai_api_key
EOF

echo "✅ Environment file created: .env.local"
echo "📝 Please update VITE_SUPABASE_ANON_KEY with your actual anon key"
echo "🔐 Database password is saved as SUPABASE_DB_PASSWORD"
echo ""
echo "To use the database password in scripts:"
echo "export SUPABASE_DB_PASSWORD=Oy5RvYziaK8xqVG" 
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up ApprovalFlow environment...${NC}"

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local already exists. Backing up to .env.local.backup${NC}"
    cp .env.local .env.local.backup
fi

# Create .env.local with Next.js environment variables
cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vusxtpupkiwhnvynqgus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: AI Service (for document generation)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
EOF

echo -e "${GREEN}✅ Created .env.local file${NC}"
echo -e "${YELLOW}📝 Please update NEXT_PUBLIC_SUPABASE_ANON_KEY with your actual anon key${NC}"
echo -e "${YELLOW}📝 You can get this from your Supabase project dashboard${NC}"
echo -e "${BLUE}🔗 Dashboard: https://supabase.com/dashboard/project/vusxtpupkiwhnvynqgus/settings/api${NC}" 
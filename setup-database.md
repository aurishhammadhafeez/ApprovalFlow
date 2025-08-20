# Database Setup Guide for ApprovalFlow

This guide will help you set up the database for ApprovalFlow using Supabase.

## Prerequisites

- Supabase account
- Supabase CLI installed
- Docker Desktop running (for local development)

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vusxtpupkiwhnvynqgus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-actual-anon-key]

# Database password (for CLI operations)
SUPABASE_DB_PASSWORD=[your-database-password]
```

## Quick Setup

Run the automated setup script:

```bash
./scripts/setup-env.sh
```

This will:
1. Create the `.env.local` file
2. Set up the correct environment variable names
3. Provide instructions for getting your Supabase credentials

## Manual Setup

### 1. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon key

### 2. Set Environment Variables

```bash
# Copy the example file
cp env.example .env.local

# Edit the file and add your credentials
nano .env.local
```

### 3. Initialize Supabase

```bash
# Link to your project
supabase link --project-ref vusxtpupkiwhnvynqgus

# Start local development (optional)
supabase start

# Apply database schema
supabase db push
```

## Database Schema

The complete schema is defined in `supabase-schema.sql` and includes:

- Users and organizations
- Workflows and approval steps
- Roles and permissions
- User invitations system
- Row Level Security (RLS) policies

## Verification

After setup, verify everything is working:

```bash
# Check database status
npm run db:status

# View migrations
supabase migration list
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 54322, 54323, and 54324 are available
2. **Docker not running**: Ensure Docker Desktop is started
3. **Environment variables**: Double-check your `.env.local` file

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review the project's [README.md](README.md)
- Create an issue in the GitHub repository 
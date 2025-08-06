# Database Setup Guide

## Step 1: Set Up Supabase Database Schema

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/vusxtpupkiwhnvynqgus
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the Database Schema**
   - Copy the entire contents of `supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute all the SQL commands

3. **Verify Tables Created**
   - Go to **Table Editor** in the left sidebar
   - You should see these tables:
     - `organizations`
     - `users`
     - `workflows`
     - `workflow_steps`
     - `approvals`

## Step 2: Test Database Connection

1. **Get your Supabase Anon Key**
   - Go to **Settings** → **API**
   - Copy the **anon public** key

2. **Update Environment Variables**
   - In your Vercel dashboard, add/update:
     ```
     VITE_SUPABASE_URL=https://vusxtpupkiwhnvynqgus.supabase.co
     VITE_SUPABASE_ANON_KEY=[your-actual-anon-key]
     ```

3. **Test the Connection**
   - Your app will automatically test the connection
   - Check the browser console for any errors

## Step 3: Verify Setup

After running the schema, you should see:
- ✅ All tables created successfully
- ✅ Row Level Security enabled
- ✅ Indexes created for performance
- ✅ Triggers set up for updated_at timestamps 
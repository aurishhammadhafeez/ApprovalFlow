#!/bin/bash

# Database push script for ApprovalFlow
# This script pushes migrations and seed data to Supabase

echo "🚀 Pushing database changes to Supabase..."

# Push migrations
echo "📦 Pushing migrations..."
supabase db push

# Push seed data
echo "🌱 Pushing seed data..."
supabase db push --include-seed

echo "✅ Database push complete!"
echo "🌐 Check your Supabase dashboard: https://supabase.com/dashboard/project/vusxtpupkiwhnvynqgus" 
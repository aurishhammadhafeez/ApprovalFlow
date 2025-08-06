#!/bin/bash

# Database operations script for ApprovalFlow
# Uses the saved database password

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Set database password
export SUPABASE_DB_PASSWORD=Oy5RvYziaK8xqVG

echo "🔐 Using saved database password for Supabase operations"

# Function to push migrations
push_migrations() {
    echo "📦 Pushing database migrations..."
    echo $SUPABASE_DB_PASSWORD | supabase db push
}

# Function to push with seed data
push_with_seed() {
    echo "🌱 Pushing migrations with seed data..."
    echo $SUPABASE_DB_PASSWORD | supabase db push --include-seed
}

# Function to check database status
check_status() {
    echo "📊 Checking database status..."
    echo $SUPABASE_DB_PASSWORD | supabase db status
}

# Function to reset database
reset_db() {
    echo "🔄 Resetting database (WARNING: This will delete all data)..."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo $SUPABASE_DB_PASSWORD | supabase db reset
    else
        echo "Database reset cancelled."
    fi
}

# Main script logic
case "$1" in
    "push")
        push_migrations
        ;;
    "push-seed")
        push_with_seed
        ;;
    "status")
        check_status
        ;;
    "reset")
        reset_db
        ;;
    *)
        echo "Usage: $0 {push|push-seed|status|reset}"
        echo ""
        echo "Commands:"
        echo "  push       - Push migrations only"
        echo "  push-seed  - Push migrations with seed data"
        echo "  status     - Check database status"
        echo "  reset      - Reset database (WARNING: deletes all data)"
        exit 1
        ;;
esac 
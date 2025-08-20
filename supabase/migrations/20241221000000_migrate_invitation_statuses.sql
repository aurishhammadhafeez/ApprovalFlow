-- Migration: Update invitation statuses and ensure data consistency
-- Date: 2024-12-21
-- Description: Migrate existing invitations to have proper status values and ensure all required fields are present

-- First, let's check what invitations exist and their current status
DO $$
DECLARE
    invitation_count INTEGER;
    pending_count INTEGER;
    accepted_count INTEGER;
    expired_count INTEGER;
    null_status_count INTEGER;
BEGIN
    -- Count total invitations
    SELECT COUNT(*) INTO invitation_count FROM invitations;
    
    -- Count by status
    SELECT COUNT(*) INTO pending_count FROM invitations WHERE status = 'pending';
    SELECT COUNT(*) INTO accepted_count FROM invitations WHERE status = 'accepted';
    SELECT COUNT(*) INTO expired_count FROM invitations WHERE status = 'expired';
    SELECT COUNT(*) INTO null_status_count FROM invitations WHERE status IS NULL;
    
    RAISE NOTICE 'Invitation Status Summary:';
    RAISE NOTICE 'Total invitations: %', invitation_count;
    RAISE NOTICE 'Pending: %', pending_count;
    RAISE NOTICE 'Accepted: %', accepted_count;
    RAISE NOTICE 'Expired: %', expired_count;
    RAISE NOTICE 'Null status: %', null_status_count;
END $$;

-- Update invitations with NULL status to 'pending' (default status)
UPDATE invitations 
SET status = 'pending' 
WHERE status IS NULL;

-- Update invitations that have expired (expires_at < now) to 'expired' status
UPDATE invitations 
SET status = 'expired' 
WHERE expires_at < NOW() AND status = 'pending';

-- For invitations that have been accepted (if we can determine this), update their status
-- This is a bit tricky since we need to check if the user exists and has the organization_id
-- We'll update invitations where the email matches a user in the same organization
UPDATE invitations 
SET 
    status = 'accepted',
    accepted_at = NOW()
WHERE 
    status = 'pending' 
    AND EXISTS (
        SELECT 1 FROM users 
        WHERE users.email = invitations.email 
        AND users.organization_id = invitations.organization_id
    );

-- Ensure all invitations have the required fields
-- Add accepted_at for accepted invitations if missing
UPDATE invitations 
SET accepted_at = NOW() 
WHERE status = 'accepted' AND accepted_at IS NULL;

-- Verify the migration results
DO $$
DECLARE
    final_pending_count INTEGER;
    final_accepted_count INTEGER;
    final_expired_count INTEGER;
    final_null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_pending_count FROM invitations WHERE status = 'pending';
    SELECT COUNT(*) INTO final_accepted_count FROM invitations WHERE status = 'accepted';
    SELECT COUNT(*) INTO final_expired_count FROM invitations WHERE status = 'expired';
    SELECT COUNT(*) INTO final_null_count FROM invitations WHERE status IS NULL;
    
    RAISE NOTICE 'Migration Complete! Final Status Summary:';
    RAISE NOTICE 'Pending: %', final_pending_count;
    RAISE NOTICE 'Accepted: %', final_accepted_count;
    RAISE NOTICE 'Expired: %', final_expired_count;
    RAISE NOTICE 'Null status: %', final_null_count;
    
    -- Ensure no invitations have null status
    IF final_null_count > 0 THEN
        RAISE WARNING 'Some invitations still have null status!';
    ELSE
        RAISE NOTICE 'All invitations now have valid status values.';
    END IF;
END $$;

-- Create index on status for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Create index on organization_id and status for filtered queries
CREATE INDEX IF NOT EXISTS idx_invitations_org_status ON invitations(organization_id, status);

-- Ensure the invitations table has the correct structure
-- Add status column if it doesn't exist (should already exist, but just in case)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitations' AND column_name = 'status'
    ) THEN
        ALTER TABLE invitations ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column to invitations table';
    ELSE
        RAISE NOTICE 'Status column already exists in invitations table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitations' AND column_name = 'accepted_at'
    ) THEN
        ALTER TABLE invitations ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added accepted_at column to invitations table';
    ELSE
        RAISE NOTICE 'Accepted_at column already exists in invitations table';
    END IF;
END $$;

-- Final verification query
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM invitations 
GROUP BY status 
ORDER BY status;

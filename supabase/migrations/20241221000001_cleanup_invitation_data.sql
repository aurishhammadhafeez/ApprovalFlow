-- Migration: Cleanup and verify invitation data
-- Date: 2024-12-21
-- Description: Additional cleanup and verification for invitation data

-- Clean up any orphaned invitations (where organization doesn't exist)
DELETE FROM invitations 
WHERE organization_id NOT IN (SELECT id FROM organizations);

-- Clean up any orphaned invitations (where role doesn't exist)
DELETE FROM invitations 
WHERE role_id NOT IN (SELECT id FROM roles);

-- Update invitations that might have been accepted but don't have accepted_at timestamp
-- This handles cases where the status was manually set but timestamp wasn't updated
UPDATE invitations 
SET accepted_at = created_at 
WHERE status = 'accepted' AND accepted_at IS NULL;

-- Set a reasonable accepted_at for invitations that were accepted but have no timestamp
-- Use created_at + 1 day as a reasonable estimate
UPDATE invitations 
SET accepted_at = created_at + INTERVAL '1 day'
WHERE status = 'accepted' AND accepted_at IS NULL;

-- Verify that all invitations have valid organization_id references
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count 
    FROM invitations i 
    LEFT JOIN organizations o ON i.organization_id = o.id 
    WHERE o.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE WARNING 'Found % orphaned invitations with invalid organization_id', orphaned_count;
    ELSE
        RAISE NOTICE 'All invitations have valid organization references';
    END IF;
END $$;

-- Verify that all invitations have valid role_id references
DO $$
DECLARE
    invalid_role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_role_count 
    FROM invitations i 
    LEFT JOIN roles r ON i.role_id = r.id 
    WHERE r.id IS NULL;
    
    IF invalid_role_count > 0 THEN
        RAISE WARNING 'Found % invitations with invalid role_id', invalid_role_count;
    ELSE
        RAISE NOTICE 'All invitations have valid role references';
    END IF;
END $$;

-- Final data integrity check
SELECT 
    'Data Integrity Check' as check_type,
    COUNT(*) as total_invitations,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as with_status,
    COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as with_org,
    COUNT(CASE WHEN role_id IS NOT NULL THEN 1 END) as with_role,
    COUNT(CASE WHEN token IS NOT NULL THEN 1 END) as with_token,
    COUNT(CASE WHEN expires_at IS NOT NULL THEN 1 END) as with_expiry
FROM invitations;

-- Show current invitation distribution
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM invitations), 2) as percentage
FROM invitations 
GROUP BY status 
ORDER BY count DESC;

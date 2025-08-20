-- Manual Migration Script for Invitation Status Updates
-- Run this in your Supabase SQL editor or via psql

-- Step 1: Check current invitation statuses
SELECT 
    status,
    COUNT(*) as count,
    CASE 
        WHEN status IS NULL THEN 'NULL (needs fixing)'
        ELSE status
    END as status_display
FROM invitations 
GROUP BY status 
ORDER BY count DESC;

-- Step 2: Update NULL statuses to 'pending'
UPDATE invitations 
SET status = 'pending' 
WHERE status IS NULL;

-- Step 3: Mark expired invitations
UPDATE invitations 
SET status = 'expired' 
WHERE expires_at < NOW() AND status = 'pending';

-- Step 4: Mark accepted invitations (where user exists in same org)
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

-- Step 5: Verify the results
SELECT 
    'After Migration' as check_type,
    status,
    COUNT(*) as count
FROM invitations 
GROUP BY status 
ORDER BY count DESC;

-- Step 6: Show any remaining issues
SELECT 
    'Issues Found' as issue_type,
    COUNT(*) as count,
    'invitations with NULL status' as description
FROM invitations 
WHERE status IS NULL

UNION ALL

SELECT 
    'Issues Found' as issue_type,
    COUNT(*) as count,
    'invitations without organization_id' as description
FROM invitations 
WHERE organization_id IS NULL

UNION ALL

SELECT 
    'Issues Found' as issue_type,
    COUNT(*) as count,
    'invitations without role_id' as description
FROM invitations 
WHERE role_id IS NULL;

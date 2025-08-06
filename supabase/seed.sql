-- Seed data for testing
-- This will be automatically run when you use supabase db reset

-- Insert a sample organization
INSERT INTO organizations (id, name, industry, size, description) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Company',
  'Technology',
  '11-50 employees',
  'A demo organization for testing ApprovalFlow features'
);

-- Insert a sample user
INSERT INTO users (id, email, name, role, organization_id) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'admin@demo.com',
  'Demo Admin',
  'admin',
  '550e8400-e29b-41d4-a716-446655440000'
);

-- Insert sample workflows
INSERT INTO workflows (id, name, department, type, description, organization_id, created_by, status) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'Marketing Budget Approval',
  'Marketing',
  'Budget Approval',
  'Approval workflow for marketing campaign budgets',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'active'
);

INSERT INTO workflows (id, name, department, type, description, organization_id, created_by, status) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'HR Hiring Process',
  'HR',
  'Hiring Approval',
  'Complete hiring approval workflow',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'active'
);

-- Insert workflow steps for Marketing Budget Approval
INSERT INTO workflow_steps (id, workflow_id, name, approver_email, order_index, required) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440002',
  'Marketing Manager Review',
  'marketing@demo.com',
  1,
  true
);

INSERT INTO workflow_steps (id, workflow_id, name, approver_email, order_index, required) VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440002',
  'Finance Approval',
  'finance@demo.com',
  2,
  true
);

INSERT INTO workflow_steps (id, workflow_id, name, approver_email, order_index, required) VALUES (
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440002',
  'CEO Final Approval',
  'ceo@demo.com',
  3,
  true
);

-- Insert workflow steps for HR Hiring Process
INSERT INTO workflow_steps (id, workflow_id, name, approver_email, order_index, required) VALUES (
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440003',
  'HR Manager Review',
  'hr@demo.com',
  1,
  true
);

INSERT INTO workflow_steps (id, workflow_id, name, approver_email, order_index, required) VALUES (
  '550e8400-e29b-41d4-a716-446655440008',
  '550e8400-e29b-41d4-a716-446655440003',
  'Department Head Approval',
  'dept@demo.com',
  2,
  true
);

-- Insert sample approvals
INSERT INTO approvals (id, workflow_id, step_id, approver_id, status, comments) VALUES (
  '550e8400-e29b-41d4-a716-446655440009',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440001',
  'approved',
  'Budget looks good, approved for Q1 campaign'
);

INSERT INTO approvals (id, workflow_id, step_id, approver_id, status, comments) VALUES (
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440001',
  'pending',
  NULL
); 
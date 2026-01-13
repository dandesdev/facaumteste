-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enables defense-in-depth security for all tables
-- ============================================

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM facaumteste_user
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$;

-- Check if user is member of an organization
CREATE OR REPLACE FUNCTION is_org_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM facaumteste_organization_member
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
$$;

-- Check if user is admin/owner of an organization
CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM facaumteste_organization_member
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
$$;

-- Check if user has permission on an evaluation
CREATE OR REPLACE FUNCTION has_eval_permission(eval_id uuid, permission text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM facaumteste_evaluation_permission
    WHERE evaluation_id = eval_id
    AND (
      (principal_type = 'user' AND principal_id = auth.uid())
      OR (principal_type = 'org' AND is_org_member(principal_id))
    )
    AND (
      (permission = 'view' AND can_view = true)
      OR (permission = 'edit' AND can_edit = true)
      OR (permission = 'results' AND can_view_results = true)
    )
  );
$$;

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE facaumteste_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_organization_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_org_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_org_group_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_skill ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_item_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_item_subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_item_skill ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_anonymous_creator ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_evaluation_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_evaluation_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_response ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_evaluation_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE facaumteste_item_permission ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. USER TABLE
-- ============================================

-- Super admins can see all users
CREATE POLICY "user_select_super_admin" ON facaumteste_user
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- Users can see their own profile
CREATE POLICY "user_select_own" ON facaumteste_user
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "user_update_own" ON facaumteste_user
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM facaumteste_user WHERE id = auth.uid()));

-- ============================================
-- 3. ORGANIZATION TABLE
-- ============================================

-- Super admins can see all orgs
CREATE POLICY "org_select_super_admin" ON facaumteste_organization
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- Members can view their organizations
CREATE POLICY "org_select_members" ON facaumteste_organization
  FOR SELECT TO authenticated
  USING (is_org_member(id));

-- Only owners can update org
CREATE POLICY "org_update_owner" ON facaumteste_organization
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR is_super_admin());

-- Authenticated users can create orgs (they become owner)
CREATE POLICY "org_insert_authenticated" ON facaumteste_organization
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Only owners or super admins can delete
CREATE POLICY "org_delete_owner" ON facaumteste_organization
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR is_super_admin());

-- ============================================
-- 4. ORGANIZATION MEMBER TABLE
-- ============================================

-- Super admins see all
CREATE POLICY "org_member_select_super_admin" ON facaumteste_organization_member
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- Users see their own memberships
CREATE POLICY "org_member_select_own" ON facaumteste_organization_member
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Org members can see fellow members
CREATE POLICY "org_member_select_org" ON facaumteste_organization_member
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

-- Org admins can manage members
CREATE POLICY "org_member_insert_admin" ON facaumteste_organization_member
  FOR INSERT TO authenticated
  WITH CHECK (is_org_admin(organization_id) OR is_super_admin());

CREATE POLICY "org_member_update_admin" ON facaumteste_organization_member
  FOR UPDATE TO authenticated
  USING (is_org_admin(organization_id) OR is_super_admin());

CREATE POLICY "org_member_delete_admin" ON facaumteste_organization_member
  FOR DELETE TO authenticated
  USING (is_org_admin(organization_id) OR user_id = auth.uid() OR is_super_admin());

-- ============================================
-- 5. ORG GROUPS TABLE
-- ============================================

-- Super admins see all
CREATE POLICY "org_group_select_super_admin" ON facaumteste_org_group
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- Org members can see their org's groups
CREATE POLICY "org_group_select_org" ON facaumteste_org_group
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

-- Org admins can manage groups
CREATE POLICY "org_group_insert_admin" ON facaumteste_org_group
  FOR INSERT TO authenticated
  WITH CHECK (is_org_admin(organization_id) OR is_super_admin());

CREATE POLICY "org_group_update_admin" ON facaumteste_org_group
  FOR UPDATE TO authenticated
  USING (is_org_admin(organization_id) OR is_super_admin());

CREATE POLICY "org_group_delete_admin" ON facaumteste_org_group
  FOR DELETE TO authenticated
  USING (is_org_admin(organization_id) OR is_super_admin());

-- ============================================
-- 6. ORG GROUP MEMBERS TABLE
-- ============================================

-- Similar pattern to org members
CREATE POLICY "org_group_member_select_super_admin" ON facaumteste_org_group_member
  FOR SELECT TO authenticated
  USING (is_super_admin());

CREATE POLICY "org_group_member_select_own" ON facaumteste_org_group_member
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "org_group_member_select_group" ON facaumteste_org_group_member
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_org_group g
      WHERE g.id = group_id AND is_org_member(g.organization_id)
    )
  );

-- ============================================
-- 7. SUBJECTS TABLE
-- ============================================

-- Super admins see all
CREATE POLICY "subject_select_super_admin" ON facaumteste_subject
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- Global subjects visible to all authenticated
CREATE POLICY "subject_select_global" ON facaumteste_subject
  FOR SELECT TO authenticated
  USING (scope = 'global');

-- Users see their own subjects
CREATE POLICY "subject_select_own" ON facaumteste_subject
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- Org members see org subjects
CREATE POLICY "subject_select_org" ON facaumteste_subject
  FOR SELECT TO authenticated
  USING (owner_org_id IS NOT NULL AND is_org_member(owner_org_id));

-- Users can create their own subjects
CREATE POLICY "subject_insert_own" ON facaumteste_subject
  FOR INSERT TO authenticated
  WITH CHECK (
    (scope = 'user' AND owner_user_id = auth.uid())
    OR (scope = 'organization' AND is_org_admin(owner_org_id))
    OR is_super_admin()
  );

-- ============================================
-- 8. SKILLS TABLE (same pattern as subjects)
-- ============================================

CREATE POLICY "skill_select_super_admin" ON facaumteste_skill
  FOR SELECT TO authenticated
  USING (is_super_admin());

CREATE POLICY "skill_select_global" ON facaumteste_skill
  FOR SELECT TO authenticated
  USING (scope = 'global');

CREATE POLICY "skill_select_own" ON facaumteste_skill
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "skill_select_org" ON facaumteste_skill
  FOR SELECT TO authenticated
  USING (owner_org_id IS NOT NULL AND is_org_member(owner_org_id));

CREATE POLICY "skill_insert_own" ON facaumteste_skill
  FOR INSERT TO authenticated
  WITH CHECK (
    (scope = 'user' AND owner_user_id = auth.uid())
    OR (scope = 'organization' AND is_org_admin(owner_org_id))
    OR is_super_admin()
  );

-- ============================================
-- 9. ITEMS TABLE
-- ============================================

-- Super admins see all
CREATE POLICY "item_select_super_admin" ON facaumteste_item
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- Creators can see their own items
CREATE POLICY "item_select_creator" ON facaumteste_item
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Org members can see org items
CREATE POLICY "item_select_org" ON facaumteste_item
  FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- Public items visible to all authenticated
CREATE POLICY "item_select_public" ON facaumteste_item
  FOR SELECT TO authenticated
  USING (is_public = true);

-- Users with permission can see items
CREATE POLICY "item_select_permission" ON facaumteste_item
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_item_permission ip
      WHERE ip.item_id = id
      AND ip.can_view = true
      AND (
        (ip.principal_type = 'user' AND ip.principal_id = auth.uid())
        OR (ip.principal_type = 'org' AND is_org_member(ip.principal_id))
      )
    )
  );

-- Creators can insert items
CREATE POLICY "item_insert_creator" ON facaumteste_item
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Creators and org admins can update
CREATE POLICY "item_update_creator" ON facaumteste_item
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() 
    OR (organization_id IS NOT NULL AND is_org_admin(organization_id))
    OR is_super_admin()
  );

-- Creators can delete their items
CREATE POLICY "item_delete_creator" ON facaumteste_item
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR is_super_admin());

-- ============================================
-- 10. ITEM VERSIONS TABLE
-- ============================================

CREATE POLICY "item_version_select" ON facaumteste_item_version
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_item i
      WHERE i.id = item_id
      AND (i.created_by = auth.uid() OR i.is_public = true OR is_org_member(i.organization_id))
    )
    OR is_super_admin()
  );

-- ============================================
-- 11. ITEM SUBJECTS & SKILLS (junction tables)
-- ============================================

CREATE POLICY "item_subject_select" ON facaumteste_item_subject
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_item i
      WHERE i.id = item_id
      AND (i.created_by = auth.uid() OR i.is_public = true OR is_org_member(i.organization_id))
    )
    OR is_super_admin()
  );

CREATE POLICY "item_skill_select" ON facaumteste_item_skill
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_item i
      WHERE i.id = item_id
      AND (i.created_by = auth.uid() OR i.is_public = true OR is_org_member(i.organization_id))
    )
    OR is_super_admin()
  );

-- ============================================
-- 12. EVALUATIONS TABLE
-- ============================================

-- Super admins see all
CREATE POLICY "eval_select_super_admin" ON facaumteste_evaluation
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- Creators can see their evaluations
CREATE POLICY "eval_select_creator" ON facaumteste_evaluation
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Org members can see org evaluations
CREATE POLICY "eval_select_org" ON facaumteste_evaluation
  FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- Public evaluations visible to authenticated users
CREATE POLICY "eval_select_public" ON facaumteste_evaluation
  FOR SELECT TO authenticated
  USING ((access_policy->>'accessMode')::text = 'public');

-- Anonymous users can see public evaluations
CREATE POLICY "eval_select_anon_public" ON facaumteste_evaluation
  FOR SELECT TO anon
  USING ((access_policy->>'accessMode')::text = 'public');

-- Link-based evaluations (anyone with the link)
CREATE POLICY "eval_select_link" ON facaumteste_evaluation
  FOR SELECT TO authenticated
  USING ((access_policy->>'accessMode')::text = 'link');

CREATE POLICY "eval_select_anon_link" ON facaumteste_evaluation
  FOR SELECT TO anon
  USING ((access_policy->>'accessMode')::text = 'link');

-- Users with explicit permission
CREATE POLICY "eval_select_permission" ON facaumteste_evaluation
  FOR SELECT TO authenticated
  USING (has_eval_permission(id, 'view'));

-- Creators can insert
CREATE POLICY "eval_insert_creator" ON facaumteste_evaluation
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Creators and org admins can update
CREATE POLICY "eval_update_creator" ON facaumteste_evaluation
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (organization_id IS NOT NULL AND is_org_admin(organization_id))
    OR has_eval_permission(id, 'edit')
    OR is_super_admin()
  );

-- Creators can delete
CREATE POLICY "eval_delete_creator" ON facaumteste_evaluation
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR is_super_admin());

-- ============================================
-- 13. ANONYMOUS CREATORS TABLE
-- ============================================

-- Only accessible via server-side (service role)
-- No direct client access needed

-- ============================================
-- 14. EVALUATION ITEMS TABLE
-- ============================================

CREATE POLICY "eval_item_select" ON facaumteste_evaluation_item
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_evaluation e
      WHERE e.id = evaluation_id
      AND (
        e.created_by = auth.uid()
        OR is_org_member(e.organization_id)
        OR (e.access_policy->>'accessMode')::text IN ('public', 'link')
        OR has_eval_permission(e.id, 'view')
      )
    )
    OR is_super_admin()
  );

CREATE POLICY "eval_item_select_anon" ON facaumteste_evaluation_item
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_evaluation e
      WHERE e.id = evaluation_id
      AND (e.access_policy->>'accessMode')::text IN ('public', 'link')
    )
  );

-- ============================================
-- 15. EVALUATION ATTEMPTS TABLE
-- ============================================

-- Super admins see all
CREATE POLICY "attempt_select_super_admin" ON facaumteste_evaluation_attempt
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- Respondents can see their own attempts
CREATE POLICY "attempt_select_own" ON facaumteste_evaluation_attempt
  FOR SELECT TO authenticated
  USING (respondent_id = auth.uid());

-- Evaluation creators/org admins can see attempts on their evals
CREATE POLICY "attempt_select_eval_owner" ON facaumteste_evaluation_attempt
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_evaluation e
      WHERE e.id = evaluation_id
      AND (e.created_by = auth.uid() OR is_org_admin(e.organization_id))
    )
  );

-- Authenticated users can create attempts on accessible evaluations
CREATE POLICY "attempt_insert_authenticated" ON facaumteste_evaluation_attempt
  FOR INSERT TO authenticated
  WITH CHECK (
    respondent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM facaumteste_evaluation e
      WHERE e.id = evaluation_id
      AND (
        (e.access_policy->>'accessMode')::text IN ('public', 'link')
        OR is_org_member(e.organization_id)
        OR has_eval_permission(e.id, 'view')
      )
    )
  );

-- Anonymous users can create attempts on public/link evaluations
CREATE POLICY "attempt_insert_anon" ON facaumteste_evaluation_attempt
  FOR INSERT TO anon
  WITH CHECK (
    is_anonymous = true
    AND respondent_id IS NULL
    AND EXISTS (
      SELECT 1 FROM facaumteste_evaluation e
      WHERE e.id = evaluation_id
      AND (e.access_policy->>'accessMode')::text IN ('public', 'link')
      AND (e.access_policy->>'requireAuthToRespond')::boolean = false
    )
  );

-- Respondents can update their own attempts
CREATE POLICY "attempt_update_own" ON facaumteste_evaluation_attempt
  FOR UPDATE TO authenticated
  USING (respondent_id = auth.uid());

-- Anonymous can update via session id
CREATE POLICY "attempt_update_anon" ON facaumteste_evaluation_attempt
  FOR UPDATE TO anon
  USING (is_anonymous = true AND respondent_session_id IS NOT NULL);

-- ============================================
-- 16. RESPONSES TABLE
-- ============================================

-- Super admins see all
CREATE POLICY "response_select_super_admin" ON facaumteste_response
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- Users can see responses on their attempts
CREATE POLICY "response_select_own" ON facaumteste_response
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_evaluation_attempt ea
      WHERE ea.id = attempt_id
      AND ea.respondent_id = auth.uid()
    )
  );

-- Eval owners can see responses
CREATE POLICY "response_select_eval_owner" ON facaumteste_response
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_evaluation_attempt ea
      JOIN facaumteste_evaluation e ON e.id = ea.evaluation_id
      WHERE ea.id = attempt_id
      AND (e.created_by = auth.uid() OR is_org_admin(e.organization_id))
    )
  );

-- Users can insert responses on their attempts
CREATE POLICY "response_insert_own" ON facaumteste_response
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facaumteste_evaluation_attempt ea
      WHERE ea.id = attempt_id
      AND ea.respondent_id = auth.uid()
    )
  );

-- Anonymous can insert on their session attempts
CREATE POLICY "response_insert_anon" ON facaumteste_response
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facaumteste_evaluation_attempt ea
      WHERE ea.id = attempt_id
      AND ea.is_anonymous = true
    )
  );

-- ============================================
-- 17. EVALUATION PERMISSIONS TABLE
-- ============================================

CREATE POLICY "eval_permission_select" ON facaumteste_evaluation_permission
  FOR SELECT TO authenticated
  USING (
    (principal_type = 'user' AND principal_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM facaumteste_evaluation e
      WHERE e.id = evaluation_id
      AND (e.created_by = auth.uid() OR is_org_admin(e.organization_id))
    )
    OR is_super_admin()
  );

CREATE POLICY "eval_permission_insert" ON facaumteste_evaluation_permission
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facaumteste_evaluation e
      WHERE e.id = evaluation_id
      AND (e.created_by = auth.uid() OR is_org_admin(e.organization_id))
    )
    OR is_super_admin()
  );

CREATE POLICY "eval_permission_delete" ON facaumteste_evaluation_permission
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_evaluation e
      WHERE e.id = evaluation_id
      AND (e.created_by = auth.uid() OR is_org_admin(e.organization_id))
    )
    OR is_super_admin()
  );

-- ============================================
-- 18. ITEM PERMISSIONS TABLE
-- ============================================

CREATE POLICY "item_permission_select" ON facaumteste_item_permission
  FOR SELECT TO authenticated
  USING (
    (principal_type = 'user' AND principal_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM facaumteste_item i
      WHERE i.id = item_id
      AND (i.created_by = auth.uid() OR is_org_admin(i.organization_id))
    )
    OR is_super_admin()
  );

CREATE POLICY "item_permission_insert" ON facaumteste_item_permission
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facaumteste_item i
      WHERE i.id = item_id
      AND (i.created_by = auth.uid() OR is_org_admin(i.organization_id))
    )
    OR is_super_admin()
  );

CREATE POLICY "item_permission_delete" ON facaumteste_item_permission
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facaumteste_item i
      WHERE i.id = item_id
      AND (i.created_by = auth.uid() OR is_org_admin(i.organization_id))
    )
    OR is_super_admin()
  );

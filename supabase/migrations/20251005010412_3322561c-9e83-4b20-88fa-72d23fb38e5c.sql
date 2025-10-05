-- Phase 1: Fix Group Chat RLS Policies (Simplify to avoid circular dependencies)

-- Drop existing complex policies on group_chats
DROP POLICY IF EXISTS "Authenticated users can create group chats" ON public.group_chats;
DROP POLICY IF EXISTS "Group creators can delete their group chats" ON public.group_chats;
DROP POLICY IF EXISTS "Group creators can update their group chats" ON public.group_chats;
DROP POLICY IF EXISTS "Users can view group chats they are members of" ON public.group_chats;

-- Drop existing policies on group_chat_participants
DROP POLICY IF EXISTS "Group creators can add participants" ON public.group_chat_participants;
DROP POLICY IF EXISTS "Group creators can remove participants" ON public.group_chat_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_chat_participants;
DROP POLICY IF EXISTS "Users can view participants of groups they are in" ON public.group_chat_participants;

-- Create simple, non-circular policies for group_chats
CREATE POLICY "Authenticated users can create group chats"
ON public.group_chats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their created group chats"
ON public.group_chats
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can view group chats they participate in"
ON public.group_chats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_participants
    WHERE group_chat_participants.chat_id = group_chats.id
    AND group_chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Group creators can update their chats"
ON public.group_chats
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their chats"
ON public.group_chats
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Create simple policies for group_chat_participants
CREATE POLICY "Authenticated users can add participants"
ON public.group_chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is the group creator
  EXISTS (
    SELECT 1 FROM public.group_chats
    WHERE group_chats.id = group_chat_participants.chat_id
    AND group_chats.created_by = auth.uid()
  )
);

CREATE POLICY "Users can view participants in their groups"
ON public.group_chat_participants
FOR SELECT
TO authenticated
USING (
  -- Can see participants if they are in the group or created it
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.group_chat_participants gcp2
    WHERE gcp2.chat_id = group_chat_participants.chat_id
    AND gcp2.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.group_chats
    WHERE group_chats.id = group_chat_participants.chat_id
    AND group_chats.created_by = auth.uid()
  )
);

CREATE POLICY "Group creators can remove participants"
ON public.group_chat_participants
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_chats
    WHERE group_chats.id = group_chat_participants.chat_id
    AND group_chats.created_by = auth.uid()
  )
);

CREATE POLICY "Users can leave groups"
ON public.group_chat_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
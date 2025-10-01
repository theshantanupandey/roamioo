-- Create group_chats table
CREATE TABLE IF NOT EXISTS public.group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create group_chat_participants table
CREATE TABLE IF NOT EXISTS public.group_chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  UNIQUE(chat_id, user_id)
);

-- Add chat_id to messages table for group chat support
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES public.group_chats(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_participants ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is in a group chat (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.is_group_chat_member(p_chat_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_chat_participants
    WHERE chat_id = p_chat_id
      AND user_id = p_user_id
  );
$$;

-- RLS Policies for group_chats
CREATE POLICY "Users can view group chats they are members of"
ON public.group_chats
FOR SELECT
USING (public.is_group_chat_member(id, auth.uid()));

CREATE POLICY "Authenticated users can create group chats"
ON public.group_chats
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their group chats"
ON public.group_chats
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their group chats"
ON public.group_chats
FOR DELETE
USING (auth.uid() = created_by);

-- RLS Policies for group_chat_participants
CREATE POLICY "Users can view participants of groups they are in"
ON public.group_chat_participants
FOR SELECT
USING (public.is_group_chat_member(chat_id, auth.uid()));

CREATE POLICY "Group creators can add participants"
ON public.group_chat_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_chats
    WHERE id = chat_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Group creators can remove participants"
ON public.group_chat_participants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.group_chats
    WHERE id = chat_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can leave groups"
ON public.group_chat_participants
FOR DELETE
USING (user_id = auth.uid());

-- Update messages RLS to support group chats
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    -- For direct messages
    (chat_id IS NULL AND recipient_id IS NOT NULL) OR
    -- For group chats
    (chat_id IS NOT NULL AND public.is_group_chat_member(chat_id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
CREATE POLICY "Users can view messages they sent or received"
ON public.messages
FOR SELECT
USING (
  -- Direct messages
  (auth.uid() = sender_id OR auth.uid() = recipient_id) OR
  -- Group chat messages
  (chat_id IS NOT NULL AND public.is_group_chat_member(chat_id, auth.uid()))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_chat_participants_chat_id ON public.group_chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_participants_user_id ON public.group_chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
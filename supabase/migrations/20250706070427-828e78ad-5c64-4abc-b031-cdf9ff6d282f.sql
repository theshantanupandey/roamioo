
-- Create messages table for direct messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  message_type VARCHAR DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_rooms table for group conversations
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_group BOOLEAN DEFAULT false,
  room_type VARCHAR DEFAULT 'private' CHECK (room_type IN ('private', 'public', 'trip')),
  trip_id UUID REFERENCES trips(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_room_members table for room participants
CREATE TABLE public.chat_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role VARCHAR DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create room_messages table for group messages
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  message_type VARCHAR DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_url TEXT,
  reply_to_id UUID REFERENCES room_messages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view rooms they are members of" ON public.chat_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE room_id = chat_rooms.id AND user_id = auth.uid()
    ) OR created_by = auth.uid()
  );

CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update rooms" ON public.chat_rooms
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for chat_room_members
CREATE POLICY "Users can view room members of rooms they belong to" ON public.chat_room_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_room_members crm2 
      WHERE crm2.room_id = chat_room_members.room_id AND crm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Room admins can manage members" ON public.chat_room_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE room_id = chat_room_members.room_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    ) OR 
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = chat_room_members.room_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms" ON public.chat_room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for room_messages
CREATE POLICY "Room members can view messages" ON public.room_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE room_id = room_messages.room_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can send messages" ON public.room_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE room_id = room_messages.room_id AND user_id = auth.uid()
    )
  );

-- Enable realtime for messages tables
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.room_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_room_members REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_members;

-- Create indexes for better performance
CREATE INDEX idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_room_messages_room_created ON public.room_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_room_members_user ON public.chat_room_members(user_id);

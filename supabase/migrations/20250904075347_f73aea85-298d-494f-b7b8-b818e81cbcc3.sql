-- First, let's ensure the room_messages table has proper structure for our chat system
-- Create a simple direct messages setup using room_messages table

-- Add index for better performance on room_messages
CREATE INDEX IF NOT EXISTS idx_room_messages_room_sender ON room_messages(room_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at DESC);

-- Create a function to get or create a direct message room between two users
CREATE OR REPLACE FUNCTION get_or_create_dm_room(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    room_id UUID;
    room_name TEXT;
BEGIN
    -- Try to find an existing DM room between these users
    SELECT cr.id INTO room_id
    FROM chat_rooms cr
    WHERE cr.is_group = false 
    AND cr.room_type = 'private'
    AND EXISTS (
        SELECT 1 FROM chat_room_members crm1 
        WHERE crm1.room_id = cr.id AND crm1.user_id = user1_id
    )
    AND EXISTS (
        SELECT 1 FROM chat_room_members crm2 
        WHERE crm2.room_id = cr.id AND crm2.user_id = user2_id
    )
    AND (
        SELECT COUNT(*) FROM chat_room_members crm 
        WHERE crm.room_id = cr.id
    ) = 2;
    
    -- If no room exists, create one
    IF room_id IS NULL THEN
        -- Create room name from user IDs (deterministic)
        room_name := CASE 
            WHEN user1_id::text < user2_id::text 
            THEN user1_id::text || '_' || user2_id::text
            ELSE user2_id::text || '_' || user1_id::text
        END;
        
        -- Create the room
        INSERT INTO chat_rooms (name, is_group, room_type, created_by)
        VALUES (room_name, false, 'private', user1_id)
        RETURNING id INTO room_id;
        
        -- Add both users as members
        INSERT INTO chat_room_members (room_id, user_id, role)
        VALUES 
            (room_id, user1_id, 'admin'),
            (room_id, user2_id, 'member');
    END IF;
    
    RETURN room_id;
END;
$$;
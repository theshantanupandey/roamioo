import { supabase } from '@/integrations/supabase/client';

interface CreateGroupChatParams {
  name: string;
  description: string;
  createdBy: string;
  participantIds: string[];
}

export const GroupChatService = {
  createGroupChat: async ({ name, description, createdBy, participantIds }: CreateGroupChatParams) => {
    try {
      console.log("Attempting to create group chat with:", { name, description, createdBy, participantIds });

      // Create chat and return id only (min payload)
      const { data: chatInsert, error: chatInsertErr } = await supabase
        .from('group_chats')
        .insert({
          name,
          description,
          created_by: createdBy,
        })
        .select('id')
        .single();

      if (chatInsertErr) {
        console.error("Supabase Error (group_chats insert): ", chatInsertErr);
        throw new Error(chatInsertErr.message || "Failed to create group chat entry.");
      }
      if (!chatInsert?.id) {
        throw new Error("Group chat id not returned by Supabase.");
      }
      const chatId = chatInsert.id as string;
      console.log("Group chat created with ID:", chatId);

      // Ensure creator included and unique
      const allParticipantIds = [...new Set([createdBy, ...participantIds])];
      if (allParticipantIds.length === 0) {
        console.warn('No participants to add to group chat');
        return { id: chatId } as any;
      }

      const participantRows = allParticipantIds.map((userId) => ({
        chat_id: chatId,
        user_id: userId,
      }));

      // Try insert; if duplicates policy exists, upsert for safety
      const { error: participantsError } = await supabase
        .from('group_chat_participants')
        .upsert(participantRows, { onConflict: 'chat_id,user_id' });

      if (participantsError) {
        console.error("Supabase Error (group_chat_participants upsert): ", participantsError);
        throw new Error(participantsError.message || "Failed to add participants to group chat.");
      }
      console.log("Participants added to group chat.");

      return { id: chatId } as any;
    } catch (error) {
      console.error('Comprehensive Error creating group chat:', error);
      throw error;
    }
  },

  // TODO: Add functions for fetching group chats, adding/removing participants, etc.
};

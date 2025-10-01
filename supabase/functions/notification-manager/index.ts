import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    console.log('Notification manager action:', action, data);

    switch (action) {
      case 'schedule_like_notification':
        return await scheduleLikeNotification(data);
      case 'remove_like_notification':
        return await removeLikeNotification(data);
      case 'schedule_comment_notification':
        return await scheduleCommentNotification(data);
      case 'schedule_follow_notification':
        return await scheduleFollowNotification(data);
      case 'remove_follow_notification':
        return await removeFollowNotification(data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in notification manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function scheduleLikeNotification(data: {
  postId: string;
  postOwnerId: string;
  actorId: string;
  actorName: string;
}) {
  const { postId, postOwnerId, actorId, actorName } = data;
  
  // Don't notify self
  if (actorId === postOwnerId) {
    return new Response(
      JSON.stringify({ success: true, message: 'Self-notification skipped' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Wait 1 minute before creating notification
  await new Promise(resolve => setTimeout(resolve, 60000));

  // Check if the like still exists
  const { data: likeExists, error: likeError } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', actorId)
    .single();

  if (likeError || !likeExists) {
    console.log('Like no longer exists, not creating notification');
    return new Response(
      JSON.stringify({ success: true, message: 'Like removed, notification cancelled' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create the notification
  const { error: notificationError } = await supabase
    .from('activities')
    .insert({
      user_id: postOwnerId,
      actor_id: actorId,
      entity_id: postId,
      entity_type: 'post',
      type: 'post_liked',
      message: `${actorName} liked your post`
    });

  if (notificationError) {
    throw notificationError;
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Like notification created' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function removeLikeNotification(data: {
  postId: string;
  actorId: string;
}) {
  const { postId, actorId } = data;

  // Remove existing like notification
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('entity_id', postId)
    .eq('actor_id', actorId)
    .eq('type', 'post_liked')
    .eq('entity_type', 'post');

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Like notification removed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function scheduleCommentNotification(data: {
  postId: string;
  postOwnerId: string;
  actorId: string;
  actorName: string;
}) {
  const { postId, postOwnerId, actorId, actorName } = data;
  
  // Don't notify self
  if (actorId === postOwnerId) {
    return new Response(
      JSON.stringify({ success: true, message: 'Self-notification skipped' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Wait 1 minute before creating notification
  await new Promise(resolve => setTimeout(resolve, 60000));

  // Create the notification (comments are rarely undone, so we don't check)
  const { error: notificationError } = await supabase
    .from('activities')
    .insert({
      user_id: postOwnerId,
      actor_id: actorId,
      entity_id: postId,
      entity_type: 'post',
      type: 'post_commented',
      message: `${actorName} commented on your post`
    });

  if (notificationError) {
    throw notificationError;
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Comment notification created' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function scheduleFollowNotification(data: {
  followedUserId: string;
  actorId: string;
  actorName: string;
}) {
  const { followedUserId, actorId, actorName } = data;
  
  // Don't notify self
  if (actorId === followedUserId) {
    return new Response(
      JSON.stringify({ success: true, message: 'Self-notification skipped' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Wait 1 minute before creating notification
  await new Promise(resolve => setTimeout(resolve, 60000));

  // Check if the follow still exists
  const { data: followExists, error: followError } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', actorId)
    .eq('following_id', followedUserId)
    .single();

  if (followError || !followExists) {
    console.log('Follow no longer exists, not creating notification');
    return new Response(
      JSON.stringify({ success: true, message: 'Follow removed, notification cancelled' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create the notification
  const { error: notificationError } = await supabase
    .from('activities')
    .insert({
      user_id: followedUserId,
      actor_id: actorId,
      entity_id: actorId,
      entity_type: 'user',
      type: 'user_followed',
      message: `${actorName} started following you`
    });

  if (notificationError) {
    throw notificationError;
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Follow notification created' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function removeFollowNotification(data: {
  followedUserId: string;
  actorId: string;
}) {
  const { followedUserId, actorId } = data;

  // Remove existing follow notification
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('entity_id', actorId)
    .eq('actor_id', actorId)
    .eq('type', 'user_followed')
    .eq('entity_type', 'user')
    .eq('user_id', followedUserId);

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Follow notification removed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
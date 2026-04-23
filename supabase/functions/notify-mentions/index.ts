import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { arena_id, message_id, content, sender_username, sender_user_id } = await req.json()

    // Extract @mentions
    const mentions: string[] = [...content.matchAll(/@(\w+)/g)].map((m: RegExpMatchArray) => m[1])
    if (mentions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service-role client to read push tokens and write notifications
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )

    // Find matching profiles (excluding sender)
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, username, push_token')
      .in('username', mentions)
      .neq('id', sender_user_id)

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Only notify users who are actually arena members
    const { data: members } = await admin
      .from('arena_members')
      .select('user_id')
      .eq('arena_id', arena_id)
      .in('user_id', profiles.map((p: { id: string }) => p.id))

    const memberIds = new Set((members ?? []).map((m: { user_id: string }) => m.user_id))
    const targets = profiles.filter((p: { id: string }) => memberIds.has(p.id))

    if (targets.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create in-app notification records
    await admin.from('arena_notifications').insert(
      targets.map((p: { id: string }) => ({
        user_id: p.id,
        arena_id,
        message_id,
        actor_username: sender_username,
        content_preview: content.slice(0, 100),
        is_read: false,
      })),
    )

    // Send Expo push notifications to users with tokens
    const pushMessages = targets
      .filter((p: { push_token: string | null }) => p.push_token)
      .map((p: { push_token: string }) => ({
        to: p.push_token,
        sound: 'default',
        title: `${sender_username} mentioned you`,
        body: content.length > 150 ? content.slice(0, 147) + '…' : content,
        data: { type: 'mention', arena_id, message_id },
        channelId: 'mentions',
      }))

    if (pushMessages.length > 0) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(pushMessages),
      })
    }

    return new Response(JSON.stringify({ sent: targets.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

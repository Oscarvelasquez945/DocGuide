import type { ConversationRow, MessageRow, MessageSender } from '../types/database';
import { supabase } from '../lib/supabase';

export async function listConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ConversationRow[];
}

export async function createConversation(title = 'Nueva conversación') {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('An authenticated session is required');

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: user.id, title })
    .select()
    .single();

  if (error) throw error;
  return data as ConversationRow;
}

export async function listMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function addMessage(
  conversationId: string,
  sender: MessageSender,
  content: string,
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as MessageRow;
}

export async function renameConversation(id: string, title: string) {
  const { error } = await supabase
    .from('conversations')
    .update({ title: title.trim() })
    .eq('id', id);

  if (error) throw error;
}

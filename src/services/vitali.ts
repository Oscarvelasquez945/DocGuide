import type { MessageRow } from '../types/database';
import { supabase } from '../lib/supabase';

export type SearchContext = { latitude: number; longitude: number; radiusMeters: number };

export async function askVitali(
  conversationId: string,
  message: string,
  context: SearchContext,
) {
  const { data, error } = await supabase.functions.invoke('vitali-chat', {
    body: { conversationId, message, ...context },
  });
  if (error) {
    let detail = error.message;
    try {
      const response = (error as any).context as Response | undefined;
      const payload = response ? await response.json() : null;
      if (payload?.error) detail = payload.error;
    } catch {}
    throw new Error(detail);
  }
  return data as { reply: string; userMessage: MessageRow; assistantMessage: MessageRow };
}

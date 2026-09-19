import { supabase } from '@/lib/supabase'
import { runLocalAgent } from '@/lib/localAgent'
import { chatList, chatInsert, chatClear } from '@/lib/db'
import { isDemo } from '@/lib/config'
import type { ChatRole, MessageMeta } from '@/types'

export type AskInput = {
  text?: string
  audioBase64?: string
  audioMime?: string
}

const NEEDS_SERVER = 'Pra entender áudio eu preciso de conexão com o servidor. Por enquanto, me conta o compromisso por texto. 🙂'

export async function askMia(input: AskInput): Promise<{ reply: string; meta: MessageMeta }> {
  const { text, audioBase64, audioMime } = input
  if (!isDemo) {
    const { data, error } = await supabase.functions.invoke('agent', {
      body: { message: text ?? '', audio: audioBase64 ?? null, audioMime: audioMime ?? null },
    })
    if (error) throw error
    if (data && typeof data.reply === 'string') return { reply: data.reply, meta: (data.meta ?? null) as MessageMeta }
    throw new Error('Resposta inválida')
  }
  if (audioBase64) return { reply: NEEDS_SERVER, meta: null }
  return runLocalAgent(text ?? '')
}

export async function loadHistory(limit = 50) {
  return chatList(limit)
}

export async function saveMessage(role: ChatRole, content: string, meta?: MessageMeta) {
  await chatInsert(role, content, meta)
}

export async function clearConversation() {
  await chatClear()
}

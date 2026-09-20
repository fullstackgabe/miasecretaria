import type { MessageMeta } from '@/types'

export const DONT_GET = `Me manda tudo em uma mensagem só:

📝 O compromisso
📅 O dia
🕐 A hora

Ex.: "dentista amanhã às 15h, me avisa 1h antes" 🙂`

export async function runLocalAgent(_text: string): Promise<{ reply: string; meta: MessageMeta }> {
  return { reply: DONT_GET, meta: null }
}

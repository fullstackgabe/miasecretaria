import type { MessageMeta } from '@/types'

export const DONT_GET = `Pra marcar eu preciso de 3 coisas:

📝 O compromisso
📅 O dia
🕐 A hora

E, se quiser, quando te aviso (ex.: "1h antes").
Ex.: "dentista amanhã às 15h, me avisa 1h antes" 🙂`

export async function runLocalAgent(_text: string): Promise<{ reply: string; meta: MessageMeta }> {
  return { reply: DONT_GET, meta: null }
}

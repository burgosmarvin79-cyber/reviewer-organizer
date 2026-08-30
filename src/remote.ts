import { supabase } from './lib/supabase'
import type { Subject } from './types'

async function userId() {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Please sign in again before saving data.')
  return data.user.id
}

export async function saveSubject(subject: Subject) {
  const id = await userId()
  const { error } = await supabase!.from('subjects').upsert({ id: subject.id, user_id: id, name: subject.name, description: subject.description, color: subject.color, created_at: subject.createdAt, updated_at: subject.updatedAt })
  if (error) throw error
}

export async function deleteSubject(subjectId: string) {
  const id = await userId()
  const { error } = await supabase!.from('subjects').delete().eq('id', subjectId).eq('user_id', id)
  if (error) throw error
}

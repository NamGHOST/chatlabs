import { createClient } from '@/lib/supabase/server'
import { SavedMeeting } from '@/lib/types/meeting'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient()

  if (req.method === 'GET') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { data: meetings } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return res.json(meetings)
  }

  if (req.method === 'POST') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const meetingData: Partial<SavedMeeting> = {
      ...req.body,
      user_id: user.id,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('meetings')
      .insert(meetingData)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.json(data)
  }
} 
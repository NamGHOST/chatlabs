import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/browser-client'
import { User } from '@supabase/supabase-js'
import { Tables } from '@/supabase/types'

interface UserData extends User {
  plan?: string;
  profile?: Tables<"profiles">;
  app_metadata: {
    [key: string]: any;
  };
  user_metadata: {
    [key: string]: any;
  };
}

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError) throw profileError

      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError) throw userError

      if (!authUser) {
        setUser(null)
        return
      }

      const userData: UserData = {
        ...authUser,
        plan: profile?.plan || 'free',
        profile: profile,
        app_metadata: authUser.app_metadata || {},
        user_metadata: authUser.user_metadata || {}
      }

      setUser(userData)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user.id)
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isLoading }
}
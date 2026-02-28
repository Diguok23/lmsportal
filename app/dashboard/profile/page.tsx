import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, country')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account information</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</span>
          <span className="text-sm text-foreground">{profile?.full_name ?? '—'}</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</span>
          <span className="text-sm text-foreground">{user.email}</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Country</span>
          <span className="text-sm text-foreground">{profile?.country ?? '—'}</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</span>
          <span className="text-sm text-foreground">{profile?.phone ?? '—'}</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member Since</span>
          <span className="text-sm text-foreground">{new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  )
}

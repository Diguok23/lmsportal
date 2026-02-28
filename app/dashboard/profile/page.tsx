import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = profile?.is_admin ? 'Administrator' : 'Student'

  const fields = [
    { label: 'Full Name', value: profile?.full_name ?? '—' },
    { label: 'Email', value: user.email },
    { label: 'Phone', value: profile?.phone ?? '—' },
    { label: 'Country', value: profile?.country ?? '—' },
    { label: 'Role', value: role },
    { label: 'Member Since', value: new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
  ]

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account information</p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid gap-0 divide-y divide-border">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 sm:mb-0">{label}</span>
              <span className="text-sm font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

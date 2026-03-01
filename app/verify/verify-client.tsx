'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Award, CheckCircle, XCircle, Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface CertResult {
  cert_id: string
  issued_at: string
  final_score: number
  revoked: boolean
  profiles: { full_name: string; country: string }
  programs: { title: string; level: string }
}

export default function VerifyPageClient() {
  const searchParams = useSearchParams()
  const [certId, setCertId] = useState(searchParams.get('id') ?? '')
  const [result, setResult] = useState<CertResult | null | 'not-found'>(null)
  const [loading, setLoading] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!certId.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/verify-certificate?id=${certId.trim().toUpperCase()}`)
      const data = await res.json()
      setResult(res.ok ? data : 'not-found')
    } catch {
      setResult('not-found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-primary">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="IICAR" width={40} height={40} className="rounded-lg" />
            <span className="text-sm font-bold text-primary-foreground uppercase tracking-widest">IICAR Global College</span>
          </Link>
          <Button asChild variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground text-sm">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="mb-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
                <Award className="h-9 w-9 text-accent" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground">Certificate Verification</h1>
            <p className="mt-2 text-sm text-primary-foreground/60">Enter an IICAR certificate ID to verify its authenticity</p>
          </div>

          <div className="rounded-2xl bg-card border border-border p-8">
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cert">Certificate ID</Label>
                <Input id="cert" value={certId} onChange={e => setCertId(e.target.value.toUpperCase())}
                  placeholder="IICAR-2025-XXXXXXXX" className="font-mono tracking-wider" />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" disabled={loading}>
                {loading ? 'Verifying…' : <><Search className="mr-2 h-4 w-4" /> Verify Certificate</>}
              </Button>
            </form>

            {result && result !== 'not-found' && (
              <div className={`mt-6 rounded-xl border p-6 flex flex-col gap-4 ${result.revoked ? 'border-destructive/40 bg-destructive/5' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center gap-3">
                  {result.revoked
                    ? <XCircle className="h-8 w-8 text-destructive" />
                    : <CheckCircle className="h-8 w-8 text-green-600" />}
                  <div>
                    <p className="font-bold text-foreground">{result.revoked ? 'Certificate Revoked' : 'Certificate Valid'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{result.cert_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Student</p>
                    <p className="text-foreground font-medium">{result.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{result.profiles?.country}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Program</p>
                    <p className="text-foreground font-medium">{result.programs?.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{result.programs?.level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Issued</p>
                    <p className="text-foreground">{new Date(result.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Final Score</p>
                    <p className="text-foreground font-semibold">{result.final_score}%</p>
                  </div>
                </div>
              </div>
            )}

            {result === 'not-found' && (
              <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex items-center gap-3">
                <XCircle className="h-7 w-7 text-destructive shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Certificate Not Found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">No valid certificate with this ID exists in our records.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

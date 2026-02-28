'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Phone, AlertCircle } from 'lucide-react'

export function EnrollmentPayment({
  programId,
  programTitle,
  amount,
  onSuccess,
}: {
  programId: string
  programTitle: string
  amount: number
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phoneNumber.trim()) {
      setError('Phone number is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          phoneNumber,
          amount,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Payment failed')
      }

      setSuccess(true)
      if (onSuccess) onSuccess()
      
      setTimeout(() => {
        router.refresh()
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200">
            <span className="text-lg">✓</span>
          </div>
          <div>
            <h3 className="font-semibold text-green-900">M-Pesa Prompt Sent</h3>
            <p className="mt-1 text-sm text-green-800">
              Enter your M-Pesa PIN on your phone to complete the payment for {programTitle}.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handlePayment} className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h3 className="font-semibold text-foreground">Complete Enrollment</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay KES {amount.toLocaleString()} to enroll in {programTitle}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">M-Pesa Phone Number</label>
        <div className="mt-2 flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="254712345678 or 0712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading}
            className="font-mono"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          We'll send an M-Pesa prompt to this number
        </p>
      </div>

      {error && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !phoneNumber.trim()}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Send M-Pesa Prompt - KES ${amount.toLocaleString()}`
        )}
      </Button>
    </form>
  )
}

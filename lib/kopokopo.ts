import axios from 'axios'

const KOPOKOPO_API_BASE = 'https://api.kopokopo.com/v1'
const CLIENT_ID = process.env.KOPOKOPO_CLIENT_ID
const CLIENT_SECRET = process.env.KOPOKOPO_CLIENT_SECRET

let accessToken: string | null = null
let tokenExpiry: number = 0

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken
  }

  try {
    const response = await axios.post(`${KOPOKOPO_API_BASE}/oauth/token`, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
    })

    accessToken = response.data.access_token
    tokenExpiry = Date.now() + response.data.expires_in * 1000
    return accessToken
  } catch (error) {
    console.error('[IICAR] Kopo Kopo token error:', error)
    throw new Error('Failed to authenticate with payment provider')
  }
}

export async function initiatePayment(params: {
  phoneNumber: string
  amount: number
  description: string
  externalId: string
  callbackUrl: string
}) {
  try {
    const token = await getAccessToken()

    const response = await axios.post(
      `${KOPOKOPO_API_BASE}/payment_requests`,
      {
        payment_request: {
          amount: params.amount,
          currency: 'KES',
          description: params.description,
          mpesa_phone_number: params.phoneNumber,
          external_id: params.externalId,
          originator_id: 'default',
          callback_url: params.callbackUrl,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return {
      success: true,
      transactionId: response.data.data.id,
      reference: response.data.data.reference,
    }
  } catch (error) {
    console.error('[IICAR] Payment initiation error:', error)
    throw new Error('Failed to initiate payment')
  }
}

export async function checkPaymentStatus(transactionId: string) {
  try {
    const token = await getAccessToken()

    const response = await axios.get(
      `${KOPOKOPO_API_BASE}/payment_requests/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return {
      status: response.data.data.status,
      amount: response.data.data.amount,
      reference: response.data.data.reference,
    }
  } catch (error) {
    console.error('[IICAR] Status check error:', error)
    return null
  }
}

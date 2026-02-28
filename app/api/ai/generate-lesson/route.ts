import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonTitle } = await request.json()
  if (!lessonTitle) return NextResponse.json({ error: 'Missing lessonTitle' }, { status: 400 })

  const prompt = `You are an academic content writer for IICAR Global College, a professional certification institute.

Write a comprehensive, well-structured lesson on the topic: "${lessonTitle}"

The lesson should include:
1. A brief introduction explaining why this topic matters for professionals
2. Key concepts explained clearly with real-world examples
3. Practical applications and best practices
4. A summary of key takeaways

Write in a clear, professional academic tone suitable for working professionals. Length: approximately 600-900 words. Use clear paragraphs — do not use markdown headers or bullet points.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ content: `AI generation unavailable. Please add your lesson content manually.\n\nError: ${errText}` })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? 'No content generated.'
    return NextResponse.json({ content })
  } catch (err) {
    return NextResponse.json({
      content: `AI generation requires an OPENAI_API_KEY environment variable. Please add your lesson content manually.\n\nLesson: ${lessonTitle}`,
    })
  }
}

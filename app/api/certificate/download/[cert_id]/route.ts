import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cert_id: string }> }
) {
  const { cert_id } = await params
  
  // Fetch certificate from database
  const adminDb = createAdminClient()
  const { data: cert } = await adminDb
    .from('certificates')
    .select('cert_id, issued_at, final_score, student_id, program_id, profiles(full_name), programs(title, level)')
    .eq('cert_id', cert_id)
    .single()

  if (!cert) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const profile = cert.profiles as { full_name: string } | null
  const program = cert.programs as { title: string; level: string } | null

  // Create PDF
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
  })

  // Convert stream to buffer
  const chunks: Buffer[] = []
  doc.on('data', chunk => chunks.push(chunk))
  
  await new Promise((resolve, reject) => {
    doc.on('end', resolve)
    doc.on('error', reject)

    // Certificate background gradient (light gold)
    doc.rect(0, 0, 612, 792).fill('#fffef5')

    // Border
    doc.lineWidth(3)
    doc.strokeColor('#8b7355')
    doc.rect(30, 30, 552, 732)

    // Inner border
    doc.lineWidth(1)
    doc.strokeColor('#d4af37')
    doc.rect(50, 50, 512, 692)

    // Header with school name
    doc.fontSize(36)
    doc.fillColor('#1a1a1a')
    doc.font('Helvetica-Bold')
    doc.text('IICAR', 0, 80, { align: 'center', width: 612 })

    doc.fontSize(14)
    doc.fillColor('#666')
    doc.font('Helvetica')
    doc.text('Professional School', 0, 125, { align: 'center', width: 612 })

    // Logo placeholder (centered)
    doc.fontSize(48)
    doc.fillColor('#d4af37')
    doc.text('🎓', 0, 165, { align: 'center', width: 612 })

    // Main title
    doc.fontSize(24)
    doc.fillColor('#1a1a1a')
    doc.font('Helvetica-Bold')
    doc.text('Certificate of Completion', 0, 240, { align: 'center', width: 612 })

    // Certificate text
    doc.fontSize(12)
    doc.fillColor('#333')
    doc.font('Helvetica')
    doc.text('This is to certify that', 0, 280, { align: 'center', width: 612 })

    // Recipient name (underlined)
    doc.fontSize(16)
    doc.font('Helvetica-Bold')
    doc.fillColor('#1a1a1a')
    doc.text(profile?.full_name || 'Student', 80, 310, { width: 452, align: 'center' })
    doc.moveTo(80, 330).lineTo(532, 330).stroke()

    // Program info
    doc.fontSize(12)
    doc.font('Helvetica')
    doc.fillColor('#333')
    doc.text(`has successfully completed the professional certification program`, 0, 360, { align: 'center', width: 612 })
    
    doc.fontSize(14)
    doc.font('Helvetica-Bold')
    doc.fillColor('#1a1a1a')
    doc.text(program?.title || 'Professional Certification', 0, 385, { align: 'center', width: 612 })

    // Level and score
    doc.fontSize(11)
    doc.font('Helvetica')
    doc.fillColor('#666')
    const levelText = program?.level ? `${program.level.charAt(0).toUpperCase() + program.level.slice(1)} Level` : 'Professional Level'
    const scoreText = cert.final_score ? ` · Final Score: ${cert.final_score}%` : ''
    doc.text(levelText + scoreText, 0, 415, { align: 'center', width: 612 })

    // Date issued
    const issuedDate = new Date(cert.issued_at).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
    doc.fontSize(11)
    doc.fillColor('#333')
    doc.text(`Issued: ${issuedDate}`, 0, 450, { align: 'center', width: 612 })

    // Certificate ID
    doc.fontSize(9)
    doc.fillColor('#999')
    doc.font('Helvetica')
    doc.text(`Certificate ID: ${cert_id}`, 0, 475, { align: 'center', width: 612 })

    // Signature section
    doc.fontSize(10)
    doc.fillColor('#333')
    doc.font('Helvetica')
    doc.text('Signed by:', 80, 530)
    
    // Principal name (with line for signature)
    doc.moveTo(80, 555).lineTo(280, 555).stroke()
    doc.fontSize(10)
    doc.text('Principal Malinar Hellen', 80, 560)
    
    doc.fontSize(9)
    doc.fillColor('#666')
    doc.text('IICAR Professional School', 80, 575)

    // Seal/badge placeholder
    doc.fontSize(36)
    doc.fillColor('#d4af37')
    doc.text('★', 480, 540, { align: 'center', width: 80 })

    // Footer
    doc.fontSize(9)
    doc.fillColor('#999')
    doc.text('This certificate is a formal recognition of professional achievement.', 0, 650, { align: 'center', width: 612 })
    doc.text('For verification, visit: iicar.school/verify', 0, 665, { align: 'center', width: 612 })

    doc.end()
  })

  const pdfBuffer = Buffer.concat(chunks)

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${profile?.full_name || 'Certificate'} - ${program?.title || 'Certificate'}.pdf"`,
      'Cache-Control': 'no-cache',
    },
  })
}

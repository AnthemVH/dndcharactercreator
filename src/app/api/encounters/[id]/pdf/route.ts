import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import puppeteer from 'puppeteer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.userId
    const { id: encounterId } = await params

    const { data: encounter, error } = await supabaseAdmin
      .from('encounters')
      .select('*')
      .eq('id', encounterId)
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Merge Supabase row with JSON data and normalize portrait
    const mergedEncounter: any = {
      ...(encounter as any)?.data,
      ...(encounter as any),
      portrait: (encounter as any)?.portrait_url || (encounter as any)?.data?.portrait || (encounter as any)?.data?.portrait_url,
    }

    // Generate HTML content (no watermark)
    const htmlContent = generateEncounterGuideHTML(mergedEncounter as any, false)
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    await page.setViewport({ width: 1200, height: 1600 })

    // Generate PDF (Letter)
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.35in', right: '0.35in', bottom: '0.35in', left: '0.35in' }
    })

    await browser.close()

    // Return PDF buffer
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encounter.title.replace(/\s+/g, '_')}_Encounter_Guide.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

interface EncounterForPDF {
  id: string
  title: string
  encounterType: string
  difficulty: string
  description: string
  objectives: string
  rewards: string
  requirements: string
  location: string
  duration: string
  enemies: string
  allies: string
  challenges: string
  backstory: string
  consequences: string
  quote: string
  uniqueTrait: string
  portrait?: string
}

function generateEncounterGuideHTML(encounter: EncounterForPDF, isFreeTier: boolean = false) {
  const watermark = isFreeTier ? '' : ''
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${encounter.title} - Encounter Guide</title>
      <style>
        :root{--ink:#2b2b2b;--accent:#7a3e2e;--border:#caa56a;--parchment:#f7f1df;--panel:#fffaf0}
        *{box-sizing:border-box}
        body{font-family:Georgia,'Times New Roman',serif;color:var(--ink);margin:0;background:radial-gradient(1200px 600px at 50% -10%,#fff7e6,var(--parchment)),linear-gradient(180deg,rgba(0,0,0,.03),rgba(0,0,0,0) 120px);padding:12px}
        .page{width:8.5in;max-width:8.5in;margin:0 auto;background:var(--panel);border:1px solid var(--border);box-shadow:0 6px 14px rgba(0,0,0,.12);position:relative;padding:18px 22px}
        .page:before{content:'';position:absolute;inset:6px;border:2px solid rgba(122,62,46,.35);pointer-events:none}
        .header{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:3px double var(--accent);padding-bottom:10px;margin-bottom:14px}
        .title{font-variant:small-caps;letter-spacing:.5px;color:var(--accent);font-size:28px;margin:0;text-shadow:0 1px 0 rgba(0,0,0,.06)}
        .panel{background:#fffdf6;border:1.5px solid var(--border);border-radius:8px;padding:12px 14px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .label{color:#6b5a4f}.value{font-weight:700;color:#3a2f2a}
        .portrait{text-align:center;margin:8px 0}
        .portrait img{max-width:180px;max-height:180px;border-radius:6px;border:1px solid var(--border);box-shadow:0 3px 8px rgba(0,0,0,.15)}
        .badge{display:inline-block;padding:6px 10px;border-radius:16px;background:#b97a3d;color:#fff;font-weight:700}
        .section{margin-top:12px}
        /* Pagination-friendly rules */
        .panel,.section,.grid2,.header{break-inside: avoid; page-break-inside: avoid}
        @media print{body{background:white;-webkit-print-color-adjust:exact} .page{box-shadow:none;border:none}}
      </style>
    </head>
    <body>
      ${watermark}
      <div class="page">
        <div class="header">
          <div>
            <h1 class="title">${encounter.title}</h1>
            <div>${encounter.encounterType} Encounter</div>
          </div>
          <div class="badge">${encounter.difficulty}</div>
        </div>

        ${encounter.portrait ? `<div class="portrait"><img src="${encounter.portrait}" alt="Portrait"/></div>` : ''}

        <div class="panel grid2">
          <div>
            <h3>Details</h3>
            <div><span class="label">Location:</span> <span class="value">${encounter.location || '-'}</span></div>
            <div><span class="label">Duration:</span> <span class="value">${encounter.duration || '-'}</span></div>
            <div><span class="label">Requirements:</span> <span class="value">${encounter.requirements || '-'}</span></div>
            <div><span class="label">Rewards:</span> <span class="value">${encounter.rewards || '-'}</span></div>
          </div>
          <div>
            <h3>Description</h3>
            <div class="value">${encounter.description || '-'}</div>
          </div>
        </div>

        <div class="panel section"><h3>Objectives</h3><div class="value">${encounter.objectives || '-'}</div></div>
        <div class="panel section"><h3>Backstory</h3><div class="value">${encounter.backstory || '-'}</div></div>
        <div class="panel section"><h3>Challenges</h3><div class="value">${encounter.challenges || '-'}</div></div>
        <div class="panel section"><h3>Combatants</h3><div class="value"><strong>Enemies:</strong> ${encounter.enemies || '-'}<br/><strong>Allies:</strong> ${encounter.allies || '-'}</div></div>
        <div class="panel section"><h3>Consequences</h3><div class="value">${encounter.consequences || '-'}</div></div>
        <div class="panel section"><h3>Unique Trait</h3><div class="value">${encounter.uniqueTrait || '-'}</div></div>
      </div>
    </body>
    </html>
  `
}
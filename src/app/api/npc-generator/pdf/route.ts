import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { npc, isFreeTier = true } = await request.json()

    if (!npc) {
      return NextResponse.json({ error: 'NPC data required' }, { status: 400 })
    }

    // Generate HTML content
    const htmlContent = generateNPCProfileHTML(npc, isFreeTier)

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    // Generate PDF (Letter, unified)
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.35in', right: '0.35in', bottom: '0.35in', left: '0.35in' }
    })

    await browser.close()

    // Return PDF buffer
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${npc.name.replace(/\s+/g, '_')}_NPC_Profile.pdf"`,
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

interface NPCForPDF {
  name: string
  location: string
  role: string
  mood: string
  backstory: string
  personalityTraits: string[]
  appearance: string
  motivations: string[]
  relationships: string[]
  secrets: string[]
  quote: string
  uniqueTrait: string
  stats: {
    STR: number
    DEX: number
    CON: number
    INT: number
    WIS: number
    CHA: number
  }
  skills: string[]
  equipment: string[]
  goals: string[]
  portrait?: string
}

function generateNPCProfileHTML(npc: NPCForPDF, isFreeTier: boolean = true) {
  const stats = npc.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${npc.name} - NPC Profile</title>
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
      .section{margin-top:12px}
      @media print{body{background:white}.page{box-shadow:none}}
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div>
          <h1 class="title">${npc.name}</h1>
          <div>${npc.role} • ${npc.location || ''}</div>
        </div>
      </div>
      ${npc.portrait ? `<div class="portrait"><img src="${npc.portrait}" alt="Portrait"/></div>` : ''}
      <div class="panel grid2">
        <div>
          <h3>Basics</h3>
          <div><span class="label">Mood:</span> <span class="value">${npc.mood || '-'}</span></div>
          <div><span class="label">Equipment:</span> <span class="value">${(npc.equipment||[]).join(', ') || '-'}</span></div>
        </div>
        <div>
          <h3>Stats</h3>
          <div class="value">${Object.entries(stats).map(([k,v])=>`${k}:${v}`).join(' · ')}</div>
        </div>
      </div>
      <div class="panel section"><h3>Appearance</h3><div class="value">${npc.appearance || '-'}</div></div>
      <div class="panel section"><h3>Backstory</h3><div class="value">${npc.backstory || '-'}</div></div>
      <div class="panel section"><h3>Personality Traits</h3><div class="value">${(npc.personalityTraits||[]).join(', ') || '-'}</div></div>
      <div class="panel section"><h3>Motivations & Goals</h3><div class="value"><strong>Motivations:</strong> ${(npc.motivations||[]).join(', ') || '-'}<br/><strong>Goals:</strong> ${(npc.goals||[]).join(', ') || '-'}</div></div>
      <div class="panel section"><h3>Relationships & Secrets</h3><div class="value"><strong>Relationships:</strong> ${(npc.relationships||[]).join(', ') || '-'}<br/><strong>Secrets:</strong> ${(npc.secrets||[]).join(', ') || '-'}</div></div>
    </div>
  </body>
  </html>
  `
}
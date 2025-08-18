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

    const { quest, isFreeTier = true } = await request.json()

    if (!quest) {
      return NextResponse.json({ error: 'Quest data required' }, { status: 400 })
    }

    // Generate HTML content
    const htmlContent = generateQuestGuideHTML(quest, isFreeTier)

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
        'Content-Disposition': `attachment; filename="${quest.name.replace(/\s+/g, '_')}_Quest_Guide.pdf"`,
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

interface QuestForPDF {
  name: string
  partyLevel: string
  theme: string
  setting: string
  difficulty: string
  storyHook: string
  plotTwist: string
  objectives: string[]
  rewards: string[]
  npcs: string[]
  locations: string[]
  challenges: string[]
  timeline: string
  consequences: string[]
  quote: string
  uniqueElement: string
  estimatedDuration: string
  recommendedPartySize: string
}

function generateQuestGuideHTML(quest: QuestForPDF, isFreeTier: boolean = true) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${quest.name} - Quest Guide</title>
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
      /* Pagination-friendly rules */
      .panel,.section,.grid2,.header{break-inside: avoid; page-break-inside: avoid}
      @media print{body{background:white;-webkit-print-color-adjust:exact} .page{box-shadow:none;border:none}}
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div>
          <h1 class="title">${quest.name}</h1>
          <div>Level ${quest.partyLevel} • ${quest.theme} • ${quest.setting}</div>
        </div>
        <div>${quest.difficulty}</div>
      </div>
      ${quest.portrait ? `<div class="portrait"><img src="${(quest as any).portrait}" alt="Portrait"/></div>` : ''}
      <div class="panel grid2">
        <div>
          <h3>Details</h3>
          <div><span class="label">Party Size:</span> <span class="value">${quest.recommendedPartySize}</span></div>
          <div><span class="label">Duration:</span> <span class="value">${quest.estimatedDuration}</span></div>
        </div>
        <div>
          <h3>Story Hook</h3>
          <div class="value">${quest.storyHook}</div>
        </div>
      </div>
      <div class="panel section"><h3>Plot Twist</h3><div class="value">${quest.plotTwist}</div></div>
      <div class="panel section"><h3>Objectives</h3><div class="value">${(quest.objectives||[]).join(', ')}</div></div>
      <div class="panel section"><h3>Rewards</h3><div class="value">${(quest.rewards||[]).join(', ')}</div></div>
      <div class="panel section"><h3>Key NPCs</h3><div class="value">${(quest.npcs||[]).join(', ')}</div></div>
      <div class="panel section"><h3>Locations</h3><div class="value">${(quest.locations||[]).join(', ')}</div></div>
      <div class="panel section"><h3>Challenges</h3><div class="value">${(quest.challenges||[]).join(', ')}</div></div>
      <div class="panel section"><h3>Timeline</h3><div class="value">${quest.timeline}</div></div>
      <div class="panel section"><h3>Potential Consequences</h3><div class="value">${(quest.consequences||[]).join(', ')}</div></div>
      <div class="panel section"><h3>Unique Element</h3><div class="value">${quest.uniqueElement}</div></div>
    </div>
  </body>
  </html>
  `
}
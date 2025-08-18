import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import puppeteer from 'puppeteer'

interface EncounterForPDF {
  name: string
  difficulty?: string
  environment?: string
  enemies?: string
  objectives?: string[]
  rewards?: string
  terrain?: string
  hazards?: string
  reinforcements?: string
  levelRange?: string
  estimatedDuration?: string
  tactics?: string
  connection?: string
  portrait?: string
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const parsed = await request.json().catch(() => ({} as any))
    const enc: EncounterForPDF | undefined = parsed.encounter || parsed.data
    if (!enc) return NextResponse.json({ error: 'Encounter data required' }, { status: 400 })

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    const html = generateEncounterHTML(enc)
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'Letter', printBackground: true, margin: { top: '0.35in', right: '0.35in', bottom: '0.35in', left: '0.35in' } })
    await browser.close()

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(enc.name || 'Encounter').replace(/\s+/g, '_')}_Encounter.pdf"`,
      },
    })
  } catch (error) {
    console.error('Encounter generator PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generateEncounterHTML(e: EncounterForPDF): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${e.name} - Encounter</title>
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
          <h1 class="title">${e.name}</h1>
          <div>${[e.difficulty, e.environment].filter(Boolean).join(' • ')}</div>
        </div>
      </div>
      ${e.portrait ? `<div class="portrait"><img src="${e.portrait}" alt="Portrait"/></div>` : ''}
      <div class="panel grid2">
        <div>
          <h3>Overview</h3>
          <div><span class="label">Enemies:</span> <span class="value">${e.enemies || '-'}</span></div>
          <div><span class="label">Objectives:</span> <span class="value">${Array.isArray(e.objectives) ? e.objectives.join(', ') : (e.objectives || '-')}</span></div>
          <div><span class="label">Rewards:</span> <span class="value">${e.rewards || '-'}</span></div>
        </div>
        <div>
          <h3>Details</h3>
          <div><span class="label">Terrain:</span> <span class="value">${e.terrain || '-'}</span></div>
          <div><span class="label">Hazards:</span> <span class="value">${e.hazards || '-'}</span></div>
          <div><span class="label">Reinforcements:</span> <span class="value">${e.reinforcements || '-'}</span></div>
          <div><span class="label">Level Range:</span> <span class="value">${e.levelRange || '-'}</span></div>
          <div><span class="label">Estimated Duration:</span> <span class="value">${e.estimatedDuration || '-'}</span></div>
        </div>
      </div>
      ${e.tactics ? `<div class="panel section"><h3>Tactics</h3><div class="value">${e.tactics}</div></div>` : ''}
      ${e.connection ? `<div class="panel section"><h3>Story Connection</h3><div class="value">${e.connection}</div></div>` : ''}
    </div>
  </body>
  </html>
  `
}








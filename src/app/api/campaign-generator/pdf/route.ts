import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import puppeteer from 'puppeteer'

interface CampaignForPDF {
  name: string
  theme?: string
  setting?: string
  description?: string
  mainPlot?: string
  subPlots?: unknown[]
  characters?: unknown[]
  locations?: unknown[]
  quests?: unknown[]
  encounters?: unknown[]
  rewards?: unknown[]
  challenges?: unknown[]
  timeline?: string
  consequences?: unknown[]
  quote?: string
  uniqueTrait?: string
  portrait?: string
  portraitUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const parsed = await request.json().catch(() => ({} as any))
    const campaign: CampaignForPDF | undefined = parsed.campaign || parsed.data
    if (!campaign) return NextResponse.json({ error: 'Campaign data required' }, { status: 400 })

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()

    const html = generateCampaignHTML(campaign)
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.35in', right: '0.35in', bottom: '0.35in', left: '0.35in' },
    })

    await browser.close()

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(campaign.name || 'Campaign').replace(/\s+/g, '_')}_Campaign.pdf"`,
      },
    })
  } catch (error) {
    console.error('Campaign generator PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function toList(value: unknown): string {
  if (!value) return '-'
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(', ')
  return toText(value)
}

function toText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return String((obj.title as string) || (obj.name as string) || (obj.description as string) || '')
  }
  return ''
}

function generateCampaignHTML(c: CampaignForPDF): string {
  const portrait = c.portrait || c.portraitUrl
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${c.name} - Campaign</title>
    <style>
      :root{--ink:#2b2b2b;--accent:#7a3e2e;--border:#caa56a;--parchment:#f7f1df;--panel:#fffaf0}
      *{box-sizing:border-box}
      body{font-family:Georgia,'Times New Roman',serif;color:var(--ink);margin:0;background:radial-gradient(1200px 600px at 50% -10%,#fff7e6,var(--parchment)),linear-gradient(180deg,rgba(0,0,0,.03),rgba(0,0,0,0) 120px);padding:12px}
      .page{width:8.5in;max-width:8.5in;margin:0 auto;background:var(--panel);border:1px solid var(--border);box-shadow:0 6px 14px rgba(0,0,0,.12);position:relative;padding:18px 22px}
      .page:before{content:'';position:absolute;inset:6px;border:2px solid rgba(122,62,46,.35);pointer-events:none}
      .header{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:3px double var(--accent);padding-bottom:10px;margin-bottom:14px}
      .title{font-variant:small-caps;letter-spacing:.5px;color:var(--accent);font-size:30px;margin:0;text-shadow:0 1px 0 rgba(0,0,0,.06)}
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
          <h1 class="title">${c.name}</h1>
          <div>${[c.theme, c.setting].filter(Boolean).join(' • ')}</div>
        </div>
      </div>
      ${portrait ? `<div class="portrait"><img src="${portrait}" alt="Portrait"/></div>` : ''}
      ${c.description ? `<div class="panel section"><h3>Description</h3><div class="value">${c.description}</div></div>` : ''}
      ${c.mainPlot ? `<div class="panel section"><h3>Main Plot</h3><div class="value">${c.mainPlot}</div></div>` : ''}
      ${toList(c.subPlots) !== '-' ? `<div class="panel section"><h3>Sub-plots</h3><div class="value">${toList(c.subPlots)}</div></div>` : ''}
      ${toList(c.characters) !== '-' ? `<div class="panel section"><h3>Characters</h3><div class="value">${toList(c.characters)}</div></div>` : ''}
      ${toList(c.locations) !== '-' ? `<div class="panel section"><h3>Locations</h3><div class="value">${toList(c.locations)}</div></div>` : ''}
      ${toList(c.quests) !== '-' ? `<div class="panel section"><h3>Quests</h3><div class="value">${toList(c.quests)}</div></div>` : ''}
      ${toList(c.encounters) !== '-' ? `<div class="panel section"><h3>Encounters</h3><div class="value">${toList(c.encounters)}</div></div>` : ''}
      ${toList(c.rewards) !== '-' ? `<div class="panel section"><h3>Rewards</h3><div class="value">${toList(c.rewards)}</div></div>` : ''}
      ${toList(c.challenges) !== '-' ? `<div class="panel section"><h3>Challenges</h3><div class="value">${toList(c.challenges)}</div></div>` : ''}
      ${c.timeline ? `<div class="panel section"><h3>Timeline</h3><div class="value">${c.timeline}</div></div>` : ''}
      ${toList(c.consequences) !== '-' ? `<div class="panel section"><h3>Consequences</h3><div class="value">${toList(c.consequences)}</div></div>` : ''}
      ${c.quote ? `<div class="panel section"><h3>Quote</h3><div class="value"><em>"${c.quote}"</em></div></div>` : ''}
      ${c.uniqueTrait ? `<div class="panel section"><h3>Unique Trait</h3><div class="value">${c.uniqueTrait}</div></div>` : ''}
    </div>
  </body>
  </html>
  `
}



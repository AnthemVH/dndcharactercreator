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

    const { character, isFreeTier = true, unitSystem = 'imperial' } = await request.json()

    if (!character) {
      return NextResponse.json({ error: 'Character data required' }, { status: 400 })
    }

    // Generate HTML content
    const htmlContent = generateCharacterSheetHTML(character, isFreeTier, unitSystem)

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    // Generate PDF (Letter, unified style)
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
        'Content-Disposition': `attachment; filename="${character.name.replace(/\s+/g, '_')}_Character_Sheet.pdf"`,
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

interface CharacterForPDF {
  name: string
  race: string
  class: string
  background: string
  backstory: string
  personalityTraits: string[]
  stats: {
    STR: number
    DEX: number
    CON: number
    INT: number
    WIS: number
    CHA: number
  }
  quote: string
  uniqueTrait: string
  level: number
  hitPoints: number
  armorClass: number
  initiative: number
  speed: number
  proficiencies: string[]
  features: string[]
  portrait?: string
}

function generateCharacterSheetHTML(character: CharacterForPDF, isFreeTier: boolean = true, unitSystem: 'metric' | 'imperial' = 'imperial') {
  const getModifier = (stat: number) => (Math.floor((stat - 10) / 2))
  const speedDisplay = unitSystem === 'metric' ? `${Math.round(character.speed * 0.3048)} m/round` : `${character.speed} ft/round`
  const stats = character.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${character.name} - Character Sheet</title>
    <style>
      :root{--ink:#2b2b2b;--accent:#7a3e2e;--border:#caa56a;--parchment:#f7f1df;--panel:#fffaf0}
      *{box-sizing:border-box}
      body{font-family:Georgia,'Times New Roman',serif;color:var(--ink);margin:0;background:radial-gradient(1200px 600px at 50% -10%,#fff7e6,var(--parchment)),linear-gradient(180deg,rgba(0,0,0,.03),rgba(0,0,0,0) 120px);padding:12px}
      .page{width:8.5in;max-width:8.5in;margin:0 auto;background:var(--panel);border:1px solid var(--border);box-shadow:0 6px 14px rgba(0,0,0,.12);position:relative;padding:18px 22px}
      .page:before{content:'';position:absolute;inset:6px;border:2px solid rgba(122,62,46,.35);pointer-events:none}
      .header{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:3px double var(--accent);padding-bottom:10px;margin-bottom:14px}
      .title{font-variant:small-caps;letter-spacing:.5px;color:var(--accent);font-size:32px;margin:0;text-shadow:0 1px 0 rgba(0,0,0,.06)}
      .cols{display:grid;grid-template-columns:260px 1fr;gap:16px}
      .abilities{display:grid;grid-template-columns:1fr;gap:10px}
      .score{background:linear-gradient(180deg,#fffdf6,#f4e8cc);border:1.5px solid var(--border);border-radius:8px;padding:10px;text-align:center}
      .score .name{font-variant:small-caps;color:#5a463d;font-weight:700;margin-bottom:2px}
      .score .val{font-size:22px;font-weight:800;color:var(--accent)}
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
          <h1 class="title">${character.name}</h1>
          <div>Level ${character.level} ${character.race} ${character.class}</div>
        </div>
      </div>
      ${character.portrait ? `<div class="portrait"><img src="${character.portrait}" alt="Portrait"/></div>` : ''}
      <div class="cols">
        <div class="abilities">
          ${Object.entries(stats).map(([k,v]) => `<div class=\"score\"><div class=\"name\">${k}</div><div class=\"val\">${v}</div></div>`).join('')}
        </div>
        <div class="right">
          <div class="panel grid2">
            <div>
              <h3>Basics</h3>
              <div><span class="label">Background:</span> <span class="value">${character.background || '-'}</span></div>
            </div>
            <div>
              <h3>Combat</h3>
              <div><span class="label">Armor Class:</span> <span class="value">${character.armorClass}</span></div>
              <div><span class="label">Initiative:</span> <span class="value">${getModifier(stats.DEX) >= 0 ? '+' : ''}${getModifier(stats.DEX)}</span></div>
              <div><span class="label">Speed:</span> <span class="value">${speedDisplay}</span></div>
              <div><span class="label">Hit Points:</span> <span class="value">${character.hitPoints}</span></div>
            </div>
          </div>
          <div class="panel section"><h3>Personality</h3><div class="value">${(character.personalityTraits||[]).join(', ')}</div></div>
          <div class="panel section"><h3>Backstory</h3><div class="value">${character.backstory || '-'}</div></div>
          <div class="panel section"><h3>Proficiencies & Features</h3><div class="value"><strong>Proficiencies:</strong> ${(character.proficiencies||[]).join(', ') || '-'}<br/><strong>Features:</strong> ${(character.features||[]).join(', ') || '-'}</div></div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}
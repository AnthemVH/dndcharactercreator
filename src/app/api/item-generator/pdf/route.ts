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

    const { item, isFreeTier = true, unitSystem = 'imperial' } = await request.json()

    if (!item) {
      return NextResponse.json({ error: 'Item data required' }, { status: 400 })
    }

    // Generate HTML content
    const htmlContent = generateItemCardHTML(item, isFreeTier, unitSystem)

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
        'Content-Disposition': `attachment; filename="${item.name.replace(/\s+/g, '_')}_Item_Card.pdf"`,
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

interface ItemForPDF {
  name: string
  itemType: string
  theme: string
  rarity: string
  description: string
  properties: string[]
  magicalEffects: string[]
  history: string
  value: string
  weight: string
  requirements: string[]
  attunement: boolean
  quote: string
  uniqueTrait: string
  craftingMaterials: string[]
  enchantments: string[]
  restrictions: string[]
  portrait?: string
}

function generateItemCardHTML(item: ItemForPDF, isFreeTier: boolean = true, unitSystem: 'metric' | 'imperial' = 'imperial') {
  const convertWeight = (w: string) => unitSystem === 'metric' ? `${Math.round(parseFloat(String(w||'0'))*0.453592)} kg` : `${w} lbs`
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${item.name} - Item Card</title>
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
          <h1 class="title">${item.name}</h1>
          <div>${item.itemType} • ${item.theme}</div>
        </div>
        <div>${item.rarity}</div>
      </div>
      ${item.portrait ? `<div class="portrait"><img src="${item.portrait}" alt="Portrait"/></div>` : ''}
      <div class="panel grid2">
        <div>
          <h3>Basics</h3>
          <div><span class="label">Value:</span> <span class="value">${item.value}</span></div>
          <div><span class="label">Weight:</span> <span class="value">${convertWeight(item.weight)}</span></div>
          <div><span class="label">Attunement:</span> <span class="value">${item.attunement ? 'Required' : 'Not Required'}</span></div>
        </div>
        <div>
          <h3>Properties</h3>
          <div class="value">${(item.properties||[]).join(', ') || '-'}</div>
        </div>
      </div>
      <div class="panel section"><h3>Description</h3><div class="value">${item.description || '-'}</div></div>
      <div class="panel section"><h3>Magical Effects</h3><div class="value">${(item.magicalEffects||[]).join(', ') || '-'}</div></div>
      <div class="panel section"><h3>History</h3><div class="value">${item.history || '-'}</div></div>
      <div class="panel section"><h3>Unique Trait</h3><div class="value">${item.uniqueTrait || '-'}</div></div>
      <div class="panel section"><h3>Crafting</h3><div class="value"><strong>Materials:</strong> ${(item.craftingMaterials||[]).join(', ') || '-'}<br/><strong>Enchantments:</strong> ${(item.enchantments||[]).join(', ') || '-'}</div></div>
      ${(item.requirements||[]).length ? `<div class=\"panel section\"><h3>Requirements</h3><div class=\"value\">${(item.requirements||[]).join(', ')}</div></div>` : ''}
      ${(item.restrictions||[]).length ? `<div class=\"panel section\"><h3>Restrictions</h3><div class=\"value\">${(item.restrictions||[]).join(', ')}</div></div>` : ''}
    </div>
  </body>
  </html>
  `
}
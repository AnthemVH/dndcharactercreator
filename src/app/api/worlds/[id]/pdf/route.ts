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
    const { id: worldId } = await params

    const { data: world, error } = await supabaseAdmin
      .from('worlds')
      .select('*')
      .eq('id', worldId)
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 })
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Merge Supabase row with JSON data and normalize portrait
    const mergedWorld: any = {
      ...(world as any)?.data,
      ...(world as any),
      portrait: (world as any)?.portrait_url || (world as any)?.data?.portrait || (world as any)?.data?.portrait_url,
    }

    // Generate HTML content (no watermark)
    const htmlContent = generateWorldLoreHTML(mergedWorld as any, false)
    
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
        'Content-Disposition': `attachment; filename="${world.name.replace(/\s+/g, '_')}_World_Lore.pdf"`,
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

interface WorldForPDF {
  id: string
  name: string
  theme: string
  landName: string
  description: string
  history: string
  geography: string
  climate: string
  culture: string
  government: string
  religion: string
  economy: string
  conflicts: string
  legends: string
  notableEvents: string
  majorFactions: string
  landmarks: string
  resources: string
  portrait?: string
}

function generateWorldLoreHTML(world: WorldForPDF, isFreeTier: boolean = false) {
  const watermark = isFreeTier ? '' : ''
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${world.name} - World Lore</title>
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
      ${watermark}
      <div class="page">
        <div class="header">
          <div>
            <h1 class="title">${world.name}</h1>
            <div>${world.theme} • ${world.landName}</div>
          </div>
        </div>

        ${world.portrait ? `<div class="portrait"><img src="${world.portrait}" alt="Portrait"/></div>` : ''}

        <div class="panel grid2">
          <div>
            <h3>Basics</h3>
            <div><span class="label">Theme:</span> <span class="value">${world.theme}</span></div>
            <div><span class="label">Land Name:</span> <span class="value">${world.landName}</span></div>
            <div><span class="label">Geography:</span> <span class="value">${world.geography || '-'}</span></div>
            <div><span class="label">Climate:</span> <span class="value">${world.climate || '-'}</span></div>
          </div>
          <div>
            <h3>Description</h3>
            <div class="value">${world.description || '-'}</div>
          </div>
        </div>

        <div class="panel section"><h3>History</h3><div class="value">${world.history || '-'}</div></div>
        <div class="panel section"><h3>Culture & Society</h3><div class="value"><strong>Culture:</strong> ${world.culture || '-'}<br/><strong>Government:</strong> ${world.government || '-'}<br/><strong>Religion:</strong> ${world.religion || '-'}<br/><strong>Economy:</strong> ${world.economy || '-'}</div></div>
        <div class="panel section"><h3>Notable Elements</h3><div class="value"><strong>Major Factions:</strong> ${world.majorFactions || '-'}<br/><strong>Landmarks:</strong> ${world.landmarks || '-'}<br/><strong>Resources:</strong> ${world.resources || '-'}</div></div>
        <div class="panel section"><h3>Conflicts & Events</h3><div class="value"><strong>Conflicts:</strong> ${world.conflicts || '-'}<br/><strong>Notable Events:</strong> ${world.notableEvents || '-'}</div></div>
        <div class="panel section"><h3>Legends</h3><div class="value">${world.legends || '-'}</div></div>
      </div>
    </body>
    </html>
  `
}
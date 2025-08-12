import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

    // Get the world
    const world = await prisma.world.findFirst({
      where: {
        id: worldId,
        userId: userId
      }
    })

    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 })
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Generate HTML content
    const htmlContent = generateWorldLoreHTML(world as WorldForPDF, true)
    
    await page.setContent(htmlContent)
    await page.setViewport({ width: 1200, height: 1600 })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
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

function generateWorldLoreHTML(world: WorldForPDF, isFreeTier: boolean = true) {
  const watermark = isFreeTier ? '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 48px; color: rgba(0,0,0,0.1); z-index: 1000; pointer-events: none;">FREE TIER</div>' : ''
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${world.name} - World Lore</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
          color: #333;
        }
        .page-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          position: relative;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #8B4513;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #8B4513;
          font-size: 2.5em;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .world-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .info-group {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #8B4513;
        }
        .info-group h3 {
          color: #8B4513;
          margin: 0 0 10px 0;
          font-size: 1.2em;
        }
        .section {
          margin: 25px 0;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
          border-left: 4px solid #8B4513;
        }
        .section h3 {
          color: #8B4513;
          margin: 0 0 15px 0;
          font-size: 1.3em;
        }
        .portrait {
          text-align: center;
          margin: 20px 0;
        }
        .portrait img {
          max-width: 200px;
          max-height: 200px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        @media print {
          body { background: white; }
          .page-container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      ${watermark}
      <div class="page-container">
        <div class="header">
          <h1>${world.name}</h1>
          <p>${world.theme} • ${world.landName}</p>
        </div>

        ${world.portrait ? `
        <div class="portrait">
          <img src="${world.portrait}" alt="World Portrait" />
        </div>
        ` : ''}

        <div class="world-info">
          <div class="info-group">
            <h3>Basic Information</h3>
            <p><strong>Theme:</strong> ${world.theme}</p>
            <p><strong>Land Name:</strong> ${world.landName}</p>
          </div>
          <div class="info-group">
            <h3>Physical Characteristics</h3>
            <p><strong>Geography:</strong> ${world.geography}</p>
            <p><strong>Climate:</strong> ${world.climate}</p>
          </div>
        </div>

        <div class="section">
          <h3>Description</h3>
          <p>${world.description}</p>
        </div>

        <div class="section">
          <h3>History</h3>
          <p>${world.history}</p>
        </div>

        <div class="section">
          <h3>Culture & Society</h3>
          <p><strong>Culture:</strong> ${world.culture}</p>
          <p><strong>Government:</strong> ${world.government}</p>
          <p><strong>Religion:</strong> ${world.religion}</p>
          <p><strong>Economy:</strong> ${world.economy}</p>
        </div>

        <div class="section">
          <h3>Notable Elements</h3>
          <p><strong>Major Factions:</strong> ${world.majorFactions}</p>
          <p><strong>Landmarks:</strong> ${world.landmarks}</p>
          <p><strong>Resources:</strong> ${world.resources}</p>
        </div>

        <div class="section">
          <h3>Conflicts & Events</h3>
          <p><strong>Conflicts:</strong> ${world.conflicts}</p>
          <p><strong>Notable Events:</strong> ${world.notableEvents}</p>
        </div>

        <div class="section">
          <h3>Legends</h3>
          <p>${world.legends}</p>
        </div>
      </div>
    </body>
    </html>
  `
} 
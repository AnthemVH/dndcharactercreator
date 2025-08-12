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
    const { id: encounterId } = await params

    // Get the encounter
    const encounter = await prisma.encounter.findFirst({
      where: {
        id: encounterId,
        userId: userId
      }
    })

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Generate HTML content
    const htmlContent = generateEncounterGuideHTML(encounter as EncounterForPDF, true)
    
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

function generateEncounterGuideHTML(encounter: EncounterForPDF, isFreeTier: boolean = true) {
  const watermark = isFreeTier ? '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 48px; color: rgba(0,0,0,0.1); z-index: 1000; pointer-events: none;">FREE TIER</div>' : ''
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${encounter.title} - Encounter Guide</title>
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
        .encounter-info {
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
        .quote {
          font-style: italic;
          font-size: 1.1em;
          color: #8B4513;
          text-align: center;
          margin: 20px 0;
          padding: 15px;
          background: #f0f0f0;
          border-radius: 8px;
          border-left: 4px solid #8B4513;
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
        .difficulty-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          color: white;
          margin: 10px 0;
        }
        .difficulty-easy { background: #28a745; }
        .difficulty-medium { background: #ffc107; color: #333; }
        .difficulty-hard { background: #fd7e14; }
        .difficulty-deadly { background: #dc3545; }
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
          <h1>${encounter.title}</h1>
          <p>${encounter.encounterType} Encounter</p>
          <div class="difficulty-badge difficulty-${encounter.difficulty.toLowerCase()}">
            ${encounter.difficulty}
          </div>
        </div>

        ${encounter.portrait ? `
        <div class="portrait">
          <img src="${encounter.portrait}" alt="Encounter Portrait" />
        </div>
        ` : ''}

        <div class="encounter-info">
          <div class="info-group">
            <h3>Encounter Details</h3>
            <p><strong>Type:</strong> ${encounter.encounterType}</p>
            <p><strong>Difficulty:</strong> ${encounter.difficulty}</p>
            <p><strong>Location:</strong> ${encounter.location}</p>
            <p><strong>Duration:</strong> ${encounter.duration}</p>
          </div>
          <div class="info-group">
            <h3>Requirements & Rewards</h3>
            <p><strong>Requirements:</strong> ${encounter.requirements}</p>
            <p><strong>Rewards:</strong> ${encounter.rewards}</p>
          </div>
        </div>

        ${encounter.quote ? `
        <div class="quote">
          "${encounter.quote}"
        </div>
        ` : ''}

        <div class="section">
          <h3>Description</h3>
          <p>${encounter.description}</p>
        </div>

        <div class="section">
          <h3>Objectives</h3>
          <p>${encounter.objectives}</p>
        </div>

        <div class="section">
          <h3>Backstory</h3>
          <p>${encounter.backstory}</p>
        </div>

        <div class="section">
          <h3>Challenges</h3>
          <p>${encounter.challenges}</p>
        </div>

        <div class="section">
          <h3>Combatants</h3>
          <p><strong>Enemies:</strong> ${encounter.enemies}</p>
          <p><strong>Allies:</strong> ${encounter.allies}</p>
        </div>

        <div class="section">
          <h3>Consequences</h3>
          <p>${encounter.consequences}</p>
        </div>

        <div class="section">
          <h3>Unique Trait</h3>
          <p>${encounter.uniqueTrait}</p>
        </div>
      </div>
    </body>
    </html>
  `
} 
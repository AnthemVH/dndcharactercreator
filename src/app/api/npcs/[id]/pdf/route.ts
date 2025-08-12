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
    const { id } = await params

    // Get the NPC
    const npc = await prisma.nPC.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })

    if (!npc) {
      return NextResponse.json({ error: 'NPC not found' }, { status: 404 })
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Generate HTML content
    const htmlContent = generateNPCProfileHTML(npc as NPCForPDF, true)
    
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
  id: string
  name: string
  race: string
  role: string
  location: string
  mood: string
  backstory: string
  personalityTraits: string
  appearance: string
  motivations: string
  relationships: string
  secrets: string
  quote: string
  uniqueTrait: string
  stats: string
  skills: string
  equipment: string
  goals: string
  portrait?: string
}

function generateNPCProfileHTML(npc: NPCForPDF, isFreeTier: boolean = true) {
  const watermark = isFreeTier ? '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 48px; color: rgba(0,0,0,0.1); z-index: 1000; pointer-events: none;">FREE TIER</div>' : ''
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${npc.name} - NPC Profile</title>
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
        .npc-info {
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
          <h1>${npc.name}</h1>
          <p>${npc.race} ${npc.role}</p>
        </div>

        ${npc.portrait ? `
        <div class="portrait">
          <img src="${npc.portrait}" alt="NPC Portrait" />
        </div>
        ` : ''}

        <div class="npc-info">
          <div class="info-group">
            <h3>Basic Information</h3>
            <p><strong>Race:</strong> ${npc.race}</p>
            <p><strong>Role:</strong> ${npc.role}</p>
            <p><strong>Location:</strong> ${npc.location}</p>
            <p><strong>Mood:</strong> ${npc.mood}</p>
          </div>
          <div class="info-group">
            <h3>Stats & Skills</h3>
            <p><strong>Stats:</strong> ${npc.stats}</p>
            <p><strong>Skills:</strong> ${npc.skills}</p>
            <p><strong>Equipment:</strong> ${npc.equipment}</p>
          </div>
        </div>

        ${npc.quote ? `
        <div class="quote">
          "${npc.quote}"
        </div>
        ` : ''}

        <div class="section">
          <h3>Backstory</h3>
          <p>${npc.backstory}</p>
        </div>

        <div class="section">
          <h3>Personality & Traits</h3>
          <p><strong>Personality Traits:</strong> ${npc.personalityTraits}</p>
          <p><strong>Unique Trait:</strong> ${npc.uniqueTrait}</p>
        </div>

        <div class="section">
          <h3>Appearance</h3>
          <p>${npc.appearance}</p>
        </div>

        <div class="section">
          <h3>Motivations & Goals</h3>
          <p><strong>Motivations:</strong> ${npc.motivations}</p>
          <p><strong>Goals:</strong> ${npc.goals}</p>
        </div>

        <div class="section">
          <h3>Relationships & Secrets</h3>
          <p><strong>Relationships:</strong> ${npc.relationships}</p>
          <p><strong>Secrets:</strong> ${npc.secrets}</p>
        </div>
      </div>
    </body>
    </html>
  `
} 
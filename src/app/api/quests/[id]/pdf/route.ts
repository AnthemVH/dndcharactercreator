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
    const { id: questId } = await params

    // Get the quest
    const quest = await prisma.quest.findFirst({
      where: {
        id: questId,
        userId: userId
      }
    })

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Generate HTML content
    const htmlContent = generateQuestGuideHTML(quest as QuestForPDF, true)
    
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
        'Content-Disposition': `attachment; filename="${quest.title.replace(/\s+/g, '_')}_Quest_Guide.pdf"`,
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
  id: string
  title: string
  questType: string
  difficulty: string
  description: string
  objectives: string
  rewards: string
  requirements: string
  location: string
  duration: string
  npcs: string
  items: string
  challenges: string
  backstory: string
  consequences: string
  quote: string
  uniqueTrait: string
  portrait?: string
}

function generateQuestGuideHTML(quest: QuestForPDF, isFreeTier: boolean = true) {
  const watermark = isFreeTier ? '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 48px; color: rgba(0,0,0,0.1); z-index: 1000; pointer-events: none;">FREE TIER</div>' : ''
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${quest.title} - Quest Guide</title>
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
        .quest-info {
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
          <h1>${quest.title}</h1>
          <p>${quest.questType} Quest</p>
          <div class="difficulty-badge difficulty-${quest.difficulty.toLowerCase()}">
            ${quest.difficulty}
          </div>
        </div>

        ${quest.portrait ? `
        <div class="portrait">
          <img src="${quest.portrait}" alt="Quest Portrait" />
        </div>
        ` : ''}

        <div class="quest-info">
          <div class="info-group">
            <h3>Quest Details</h3>
            <p><strong>Type:</strong> ${quest.questType}</p>
            <p><strong>Difficulty:</strong> ${quest.difficulty}</p>
            <p><strong>Location:</strong> ${quest.location}</p>
            <p><strong>Duration:</strong> ${quest.duration}</p>
          </div>
          <div class="info-group">
            <h3>Requirements & Rewards</h3>
            <p><strong>Requirements:</strong> ${quest.requirements}</p>
            <p><strong>Rewards:</strong> ${quest.rewards}</p>
          </div>
        </div>

        ${quest.quote ? `
        <div class="quote">
          "${quest.quote}"
        </div>
        ` : ''}

        <div class="section">
          <h3>Description</h3>
          <p>${quest.description}</p>
        </div>

        <div class="section">
          <h3>Objectives</h3>
          <p>${quest.objectives}</p>
        </div>

        <div class="section">
          <h3>Backstory</h3>
          <p>${quest.backstory}</p>
        </div>

        <div class="section">
          <h3>Challenges</h3>
          <p>${quest.challenges}</p>
        </div>

        <div class="section">
          <h3>NPCs & Items</h3>
          <p><strong>NPCs:</strong> ${quest.npcs}</p>
          <p><strong>Items:</strong> ${quest.items}</p>
        </div>

        <div class="section">
          <h3>Consequences</h3>
          <p>${quest.consequences}</p>
        </div>

        <div class="section">
          <h3>Unique Trait</h3>
          <p>${quest.uniqueTrait}</p>
        </div>
      </div>
    </body>
    </html>
  `
} 
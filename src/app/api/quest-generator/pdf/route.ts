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

    const payload = verifyToken(token)
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

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
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
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#059669'
      case 'medium': return '#d97706'
      case 'hard': return '#ea580c'
      case 'deadly': return '#dc2626'
      default: return '#6b7280'
    }
  }

  // Watermark removed as requested
  const watermark = ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${quest.name} - Quest Guide</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            color: #333;
            line-height: 1.4;
        }
        
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            z-index: 1000;
            pointer-events: none;
        }
        
        .watermark-text {
            font-size: 48px;
            color: rgba(0, 0, 0, 0.1);
            font-weight: bold;
            white-space: nowrap;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
            page-break-after: avoid;
        }
        
        .quest-name {
            font-size: 2.5em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .quest-subtitle {
            font-size: 1.2em;
            color: #7f8c8d;
        }
        
        .difficulty-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            color: white;
            font-weight: bold;
            margin-top: 10px;
        }
        
        .quest-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .detail-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        
        .detail-label {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .detail-value {
            color: #7f8c8d;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 1.3em;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        
        .story-hook, .plot-twist, .timeline {
            line-height: 1.6;
            text-align: justify;
        }
        
        .list-item {
            margin-bottom: 5px;
            padding-left: 15px;
        }
        
        .list-item:before {
            content: "•";
            color: #3498db;
            font-weight: bold;
            margin-right: 8px;
        }
        
        .quote {
            font-style: italic;
            background: #f39c12;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .unique-element {
            background: #9b59b6;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #7f8c8d;
            font-size: 0.8em;
            border-top: 1px solid #ecf0f1;
            padding-top: 20px;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .header {
                margin-bottom: 20px;
            }
        }
    </style>
</head>
<body>
    ${watermark}
    
    <div class="header">
        <div class="quest-name">${quest.name}</div>
        <div class="quest-subtitle">
            Level ${quest.partyLevel} • ${quest.theme} • ${quest.setting}
        </div>
        <div class="difficulty-badge" style="background-color: ${getDifficultyColor(quest.difficulty)};">
            ${quest.difficulty}
        </div>
    </div>

    <div class="quest-details">
        <div class="detail-box">
            <div class="detail-label">Party Size</div>
            <div class="detail-value">${quest.recommendedPartySize}</div>
        </div>
        <div class="detail-box">
            <div class="detail-label">Duration</div>
            <div class="detail-value">${quest.estimatedDuration}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Story Hook</div>
        <div class="story-hook">${quest.storyHook}</div>
    </div>

    <div class="section">
        <div class="section-title">Plot Twist</div>
        <div class="plot-twist">${quest.plotTwist}</div>
    </div>

    <div class="section">
        <div class="section-title">Objectives</div>
        <div class="space-y-2">
            ${quest.objectives.map(objective => `
                <div class="list-item">${objective}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Rewards</div>
        <div class="space-y-2">
            ${quest.rewards.map(reward => `
                <div class="list-item">${reward}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Key NPCs</div>
        <div class="space-y-2">
            ${quest.npcs.map(npc => `
                <div class="list-item">${npc}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Locations</div>
        <div class="space-y-2">
            ${quest.locations.map(location => `
                <div class="list-item">${location}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Challenges</div>
        <div class="space-y-2">
            ${quest.challenges.map(challenge => `
                <div class="list-item">${challenge}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Timeline</div>
        <div class="timeline">${quest.timeline}</div>
    </div>

    <div class="section">
        <div class="section-title">Potential Consequences</div>
        <div class="space-y-2">
            ${quest.consequences.map(consequence => `
                <div class="list-item">${consequence}</div>
            `).join('')}
        </div>
    </div>

    <div class="quote">
        "${quest.quote}"
        <br><small>— Quest Giver</small>
    </div>

    <div class="unique-element">
        <strong>Unique Element:</strong> ${quest.uniqueElement}
    </div>

    <div class="footer">
        Generated by D&D Master Tools
        ${isFreeTier ? '• Free Tier' : '• Premium'}
    </div>
</body>
</html>
  `
} 
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

    const { npc, isFreeTier = true } = await request.json()

    if (!npc) {
      return NextResponse.json({ error: 'NPC data required' }, { status: 400 })
    }

    // Generate HTML content
    const htmlContent = generateNPCProfileHTML(npc, isFreeTier)

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
  name: string
  location: string
  role: string
  mood: string
  backstory: string
  personalityTraits: string[]
  appearance: string
  motivations: string[]
  relationships: string[]
  secrets: string[]
  quote: string
  uniqueTrait: string
  stats: {
    STR: number
    DEX: number
    CON: number
    INT: number
    WIS: number
    CHA: number
  }
  skills: string[]
  equipment: string[]
  goals: string[]
  portrait?: string
}

function generateNPCProfileHTML(npc: NPCForPDF, isFreeTier: boolean = true) {
  const getModifier = (stat: number) => {
    const modifier = Math.floor((stat - 10) / 2)
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
  }

  // Watermark removed as requested
  const watermark = ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${npc.name} - NPC Profile</title>
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
        
        .npc-name {
            font-size: 2.5em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .npc-subtitle {
            font-size: 1.2em;
            color: #7f8c8d;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .stat-box {
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            background: #ecf0f1;
        }
        
        .stat-name {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .stat-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #e74c3c;
        }
        
        .stat-modifier {
            color: #7f8c8d;
            font-size: 0.9em;
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
        
        .backstory, .appearance {
            line-height: 1.6;
            text-align: justify;
        }
        
        .traits {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .trait {
            background: #3498db;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.9em;
        }
        
        .quote {
            font-style: italic;
            background: #f39c12;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .unique-trait {
            background: #9b59b6;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
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
        <div class="npc-name">${npc.name}</div>
        <div class="npc-subtitle">
            ${npc.role} in ${npc.location} • ${npc.mood}
        </div>
    </div>

    <div class="stats-grid">
        ${Object.entries(npc.stats).map(([stat, value]) => `
            <div class="stat-box">
                <div class="stat-name">${stat}</div>
                <div class="stat-value">${value}</div>
                <div class="stat-modifier">${getModifier(value)}</div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <div class="section-title">Appearance</div>
        <div class="appearance">${npc.appearance}</div>
    </div>

    <div class="section">
        <div class="section-title">Backstory</div>
        <div class="backstory">${npc.backstory}</div>
    </div>

    <div class="section">
        <div class="section-title">Personality Traits</div>
        <div class="traits">
            ${npc.personalityTraits.map(trait => `
                <span class="trait">${trait}</span>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Motivations</div>
        <div class="space-y-2">
            ${npc.motivations.map(motivation => `
                <div class="list-item">${motivation}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Relationships</div>
        <div class="space-y-2">
            ${npc.relationships.map(relationship => `
                <div class="list-item">${relationship}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Secrets</div>
        <div class="space-y-2">
            ${npc.secrets.map(secret => `
                <div class="list-item">${secret}</div>
            `).join('')}
        </div>
    </div>

    <div class="quote">
        "${npc.quote}"
        <br><small>— ${npc.name}</small>
    </div>

    <div class="unique-trait">
        <strong>Unique Trait:</strong> ${npc.uniqueTrait}
    </div>

    <div class="section">
        <div class="section-title">Skills</div>
        <div class="space-y-2">
            ${npc.skills.map(skill => `
                <div class="list-item">${skill}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Equipment</div>
        <div class="space-y-2">
            ${npc.equipment.map(item => `
                <div class="list-item">${item}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Goals</div>
        <div class="space-y-2">
            ${npc.goals.map(goal => `
                <div class="list-item">${goal}</div>
            `).join('')}
        </div>
    </div>

    <div class="footer">
        Generated by D&D Master Tools
        ${isFreeTier ? '• Free Tier' : '• Premium'}
    </div>
</body>
</html>
  `
} 
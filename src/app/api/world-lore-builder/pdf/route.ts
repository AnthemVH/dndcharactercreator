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

    const { world, isFreeTier = true } = await request.json()

    if (!world) {
      return NextResponse.json({ error: 'World data required' }, { status: 400 })
    }

    // Generate HTML content
    const htmlContent = generateWorldLoreHTML(world, isFreeTier)

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
  name: string
  theme: string
  landName: string
  geography: string
  politics: string
  culture: string
  notableEvents: string[]
  majorFactions: string[]
  landmarks: string[]
  climate: string
  resources: string[]
  population: string
  government: string
  religion: string
  economy: string
  conflicts: string[]
  legends: string[]
  quote: string
  uniqueFeature: string
  history: string
}

function generateWorldLoreHTML(world: WorldForPDF, isFreeTier: boolean = true) {
  // Watermark removed as requested
  const watermark = ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${world.name} - World Lore</title>
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
        
        .world-name {
            font-size: 2.5em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .world-subtitle {
            font-size: 1.2em;
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
        
        .geography, .politics, .culture, .climate, .economy, .history {
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
        
        .unique-feature {
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
        <div class="world-name">${world.name}</div>
        <div class="world-subtitle">
            ${world.theme} • ${world.landName}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Geography</div>
        <div class="geography">${world.geography}</div>
    </div>

    <div class="section">
        <div class="section-title">Climate</div>
        <div class="climate">${world.climate}</div>
    </div>

    <div class="section">
        <div class="section-title">Politics & Government</div>
        <div class="politics">${world.politics}</div>
        <p><strong>Government:</strong> ${world.government}</p>
    </div>

    <div class="section">
        <div class="section-title">Culture & Society</div>
        <div class="culture">${world.culture}</div>
        <p><strong>Population:</strong> ${world.population}</p>
        <p><strong>Religion:</strong> ${world.religion}</p>
    </div>

    <div class="section">
        <div class="section-title">Economy</div>
        <div class="economy">${world.economy}</div>
    </div>

    <div class="section">
        <div class="section-title">Resources</div>
        <div class="space-y-2">
            ${world.resources.map(resource => `
                <div class="list-item">${resource}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Major Factions</div>
        <div class="space-y-2">
            ${world.majorFactions.map(faction => `
                <div class="list-item">${faction}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Landmarks</div>
        <div class="space-y-2">
            ${world.landmarks.map(landmark => `
                <div class="list-item">${landmark}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Notable Events</div>
        <div class="space-y-2">
            ${world.notableEvents.map(event => `
                <div class="list-item">${event}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Current Conflicts</div>
        <div class="space-y-2">
            ${world.conflicts.map(conflict => `
                <div class="list-item">${conflict}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Legends & Myths</div>
        <div class="space-y-2">
            ${world.legends.map(legend => `
                <div class="list-item">${legend}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">History</div>
        <div class="history">${world.history}</div>
    </div>

    <div class="quote">
        "${world.quote}"
        <br><small>— Ancient Lore</small>
    </div>

    <div class="unique-feature">
        <strong>Unique Feature:</strong> ${world.uniqueFeature}
    </div>

    <div class="footer">
        Generated by D&D Master Tools
        ${isFreeTier ? '• Free Tier' : '• Premium'}
    </div>
</body>
</html>
  `
} 
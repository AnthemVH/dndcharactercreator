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
  const getModifier = (stat: number) => {
    const modifier = Math.floor((stat - 10) / 2)
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
  }

  const getStatColor = (stat: number) => {
    if (stat >= 18) return '#8B5CF6' // purple
    if (stat >= 16) return '#3B82F6' // blue
    if (stat >= 14) return '#10B981' // green
    if (stat >= 12) return '#F59E0B' // yellow
    if (stat >= 10) return '#6B7280' // gray
    return '#EF4444' // red
  }

  const convertDistance = (distance: string, targetSystem: 'metric' | 'imperial'): string => {
    if (!distance) return distance
    
    const numMatch = distance.match(/(\d+(?:\.\d+)?)/)
    if (!numMatch) return distance
    
    const num = parseFloat(numMatch[1])
    const unit = distance.replace(numMatch[1], '').trim().toLowerCase()
    
    if (targetSystem === 'metric') {
      // Convert to metric
      if (unit.includes('ft') || unit.includes('foot') || unit.includes('feet')) {
        return `${(num * 0.3048).toFixed(1)} m`
      }
      if (unit.includes('mi') || unit.includes('mile')) {
        return `${(num * 1.60934).toFixed(1)} km`
      }
      if (unit.includes('in') || unit.includes('inch')) {
        return `${(num * 0.0254).toFixed(2)} m`
      }
      return distance // Assume already metric if no imperial units found
    } else {
      // Convert to imperial
      if (unit.includes('m') || unit.includes('meter')) {
        return `${(num * 3.28084).toFixed(1)} ft`
      }
      if (unit.includes('km') || unit.includes('kilometer')) {
        return `${(num * 0.621371).toFixed(1)} mi`
      }
      if (unit.includes('cm') || unit.includes('centimeter')) {
        return `${(num * 0.393701).toFixed(1)} in`
      }
      return distance // Assume already imperial if no metric units found
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
    <title>${character.name} - Character Sheet</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
            color: #2d3748;
            line-height: 1.6;
        }
        
        .page-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            padding: 40px;
            margin: 20px;
            position: relative;
            overflow: hidden;
        }
        
        .page-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
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
            font-size: 36px;
            color: rgba(0, 0, 0, 0.08);
            font-weight: bold;
            white-space: nowrap;
        }
        
        .header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 16px;
            margin-bottom: 40px;
            page-break-after: avoid;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            pointer-events: none;
        }
        
        .character-name {
            font-size: 3.2em;
            font-weight: bold;
            margin-bottom: 15px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        .character-subtitle {
            font-size: 1.4em;
            opacity: 0.95;
            font-weight: 400;
            position: relative;
            z-index: 1;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .stat-box {
            border: 3px solid #e2e8f0;
            border-radius: 16px;
            padding: 25px;
            text-align: center;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            transition: transform 0.2s;
            box-shadow: 0 8px 16px rgba(0,0,0,0.08);
            position: relative;
            overflow: hidden;
        }
        
        .stat-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        
        .stat-name {
            font-weight: bold;
            color: #4a5568;
            margin-bottom: 8px;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-modifier {
            color: #718096;
            font-size: 1em;
            font-weight: 500;
        }
        
        .combat-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .combat-stat {
            border: 3px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        
        .combat-stat-title {
            font-weight: bold;
            color: #4a5568;
            margin-bottom: 10px;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .combat-stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #2d3748;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 1.5em;
            font-weight: bold;
            color: #2d3748;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .section-title::before {
            content: "⚔";
            margin-right: 10px;
            font-size: 1.2em;
        }
        
        .backstory {
            line-height: 1.8;
            text-align: justify;
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .personality-traits {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .trait {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }
        
        .quote-box {
            background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%);
            border-left: 4px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
            font-style: italic;
            font-size: 1.1em;
            text-align: center;
        }
        
        .unique-trait {
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
            border-left: 4px solid #8b5cf6;
            padding: 20px;
            border-radius: 8px;
        }
        
        .proficiencies-features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            page-break-inside: avoid;
        }
        
        .list-container {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        
        .list-title {
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        
        .list-item {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        
        .list-item::before {
            content: "•";
            color: #10b981;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            color: #718096;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    ${watermark}
    <div class="page-container">
        <div class="header">
            <div class="character-name">${character.name}</div>
            <div class="character-subtitle">Level ${character.level} ${character.race} ${character.class} • ${character.background}</div>
        </div>

        <div class="stats-grid">
            ${Object.entries(character.stats).map(([stat, value]) => `
                <div class="stat-box">
                    <div class="stat-name">${stat}</div>
                    <div class="stat-value" style="color: ${getStatColor(value)}">${value}</div>
                    <div class="stat-modifier">${getModifier(value)}</div>
                </div>
            `).join('')}
        </div>

        <div class="combat-stats">
            <div class="combat-stat">
                <div class="combat-stat-title">Hit Points</div>
                <div class="combat-stat-value" style="color: #e53e3e">${character.hitPoints}</div>
            </div>
            <div class="combat-stat">
                <div class="combat-stat-title">Armor Class</div>
                <div class="combat-stat-value" style="color: #3182ce">${character.armorClass}</div>
            </div>
            <div class="combat-stat">
                <div class="combat-stat-title">Initiative</div>
                <div class="combat-stat-value" style="color: #d69e2e">${getModifier(character.stats.DEX)}</div>
            </div>
            <div class="combat-stat">
                <div class="combat-stat-title">Speed</div>
                <div class="combat-stat-value" style="color: #38a169">${convertDistance(`${character.speed} ft`, unitSystem)}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Backstory</div>
            <div class="backstory">${character.backstory}</div>
        </div>

        <div class="section">
            <div class="section-title">Personality Traits</div>
            <div class="personality-traits">
                ${character.personalityTraits.map(trait => `<span class="trait">${trait}</span>`).join('')}
            </div>
        </div>

        <div class="section">
            <div class="quote-box">
                "${character.quote}"
                <br><small>— ${character.name}</small>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Unique Trait</div>
            <div class="unique-trait">${character.uniqueTrait}</div>
        </div>

        <div class="proficiencies-features">
            <div class="list-container">
                <div class="list-title">Proficiencies</div>
                ${character.proficiencies.map(prof => `<div class="list-item">${prof}</div>`).join('')}
            </div>
            <div class="list-container">
                <div class="list-title">Features</div>
                ${character.features.map(feature => `<div class="list-item">${feature}</div>`).join('')}
            </div>
        </div>

        <div class="footer">
            Generated with D&D Master Tools • ${new Date().toLocaleDateString()}
        </div>
    </div>
</body>
</html>
  `
} 
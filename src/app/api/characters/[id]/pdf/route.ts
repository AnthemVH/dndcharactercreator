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
    const { id: characterId } = await params

    // Get the character
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        userId: userId
      }
    })

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Generate HTML content
    const htmlContent = generateCharacterSheetHTML(character as CharacterForPDF, true, 'imperial')
    
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
  id: string
  name: string
  race: string
  class: string
  level: number
  background: string
  alignment: string
  experience: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  armorClass: number
  initiative: number
  speed: number
  hitPoints: number
  hitDice: string
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  proficiencies: string
  features: string
  equipment: string
  backstory: string
  appearance: string
  abilities: string
  spells: string
  portrait?: string
}

function generateCharacterSheetHTML(character: CharacterForPDF, isFreeTier: boolean = true, unitSystem: 'metric' | 'imperial' = 'imperial') {
  const watermark = isFreeTier ? '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 48px; color: rgba(0,0,0,0.1); z-index: 1000; pointer-events: none;">FREE TIER</div>' : ''
  
  // Convert speed based on unit system
  const speedDisplay = unitSystem === 'metric' ? 
    `${Math.round(character.speed * 1.60934)} km/h` : 
    `${character.speed} mph`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${character.name} - Character Sheet</title>
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
        .character-info {
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
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .stat-box {
          background: linear-gradient(135deg, #8B4513, #A0522D);
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          position: relative;
        }
        .stat-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
          border-radius: 8px;
        }
        .stat-name {
          font-size: 0.9em;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 1.5em;
          font-weight: bold;
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
        .trait-list {
          list-style: none;
          padding: 0;
        }
        .trait-list li {
          padding: 8px 0;
          border-bottom: 1px solid #ddd;
        }
        .trait-list li:last-child {
          border-bottom: none;
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
          <h1>${character.name}</h1>
          <p>Level ${character.level} ${character.race} ${character.class}</p>
        </div>

        ${character.portrait ? `
        <div class="portrait">
          <img src="${character.portrait}" alt="Character Portrait" />
        </div>
        ` : ''}

        <div class="character-info">
          <div class="info-group">
            <h3>Basic Information</h3>
            <p><strong>Race:</strong> ${character.race}</p>
            <p><strong>Class:</strong> ${character.class}</p>
            <p><strong>Level:</strong> ${character.level}</p>
            <p><strong>Background:</strong> ${character.background}</p>
            <p><strong>Alignment:</strong> ${character.alignment}</p>
            <p><strong>Experience:</strong> ${character.experience}</p>
          </div>
          <div class="info-group">
            <h3>Combat</h3>
            <p><strong>Armor Class:</strong> ${character.armorClass}</p>
            <p><strong>Initiative:</strong> ${character.initiative}</p>
            <p><strong>Speed:</strong> ${speedDisplay}</p>
            <p><strong>Hit Points:</strong> ${character.hitPoints}</p>
            <p><strong>Hit Dice:</strong> ${character.hitDice}</p>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-name">STR</div>
            <div class="stat-value">${character.strength}</div>
          </div>
          <div class="stat-box">
            <div class="stat-name">DEX</div>
            <div class="stat-value">${character.dexterity}</div>
          </div>
          <div class="stat-box">
            <div class="stat-name">CON</div>
            <div class="stat-value">${character.constitution}</div>
          </div>
          <div class="stat-box">
            <div class="stat-name">INT</div>
            <div class="stat-value">${character.intelligence}</div>
          </div>
          <div class="stat-box">
            <div class="stat-name">WIS</div>
            <div class="stat-value">${character.wisdom}</div>
          </div>
          <div class="stat-box">
            <div class="stat-name">CHA</div>
            <div class="stat-value">${character.charisma}</div>
          </div>
        </div>

        <div class="section">
          <h3>Personality</h3>
          <ul class="trait-list">
            <li><strong>Traits:</strong> ${character.personalityTraits}</li>
            <li><strong>Ideals:</strong> ${character.ideals}</li>
            <li><strong>Bonds:</strong> ${character.bonds}</li>
            <li><strong>Flaws:</strong> ${character.flaws}</li>
          </ul>
        </div>

        <div class="section">
          <h3>Proficiencies & Features</h3>
          <p><strong>Proficiencies:</strong> ${character.proficiencies}</p>
          <p><strong>Features:</strong> ${character.features}</p>
        </div>

        <div class="section">
          <h3>Equipment</h3>
          <p>${character.equipment}</p>
        </div>

        <div class="section">
          <h3>Backstory</h3>
          <p>${character.backstory}</p>
        </div>

        <div class="section">
          <h3>Appearance</h3>
          <p>${character.appearance}</p>
        </div>

        ${character.abilities ? `
        <div class="section">
          <h3>Abilities</h3>
          <p>${character.abilities}</p>
        </div>
        ` : ''}

        ${character.spells ? `
        <div class="section">
          <h3>Spells</h3>
          <p>${character.spells}</p>
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `
} 
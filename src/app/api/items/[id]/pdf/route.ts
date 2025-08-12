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
    const { id: itemId } = await params

    // Get the item
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        userId: userId
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Generate HTML content
    const htmlContent = generateItemCardHTML(item as ItemForPDF, true, 'imperial')
    
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
        'Content-Disposition': `attachment; filename="${item.name.replace(/\s+/g, '_')}_Item_Profile.pdf"`,
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

interface ItemForPDF {
  id: string
  name: string
  itemType: string
  theme: string
  rarity: string
  description: string
  properties: string
  magicalEffects: string
  history: string
  value: string
  weight: string
  requirements: string
  attunement: boolean
  quote: string
  uniqueTrait: string
  craftingMaterials: string
  enchantments: string
  restrictions: string
  portrait?: string
}

function generateItemCardHTML(item: ItemForPDF, isFreeTier: boolean = true, unitSystem: 'metric' | 'imperial' = 'imperial') {
  const watermark = isFreeTier ? '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 48px; color: rgba(0,0,0,0.1); z-index: 1000; pointer-events: none;">FREE TIER</div>' : ''
  
  // Convert weight based on unit system
  const weightDisplay = unitSystem === 'metric' ? 
    `${Math.round(parseFloat(item.weight) * 0.453592)} kg` : 
    `${item.weight} lbs`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${item.name} - Item Profile</title>
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
        .item-info {
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
        .rarity-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          color: white;
          margin: 10px 0;
        }
        .rarity-common { background: #6c757d; }
        .rarity-uncommon { background: #28a745; }
        .rarity-rare { background: #007bff; }
        .rarity-very-rare { background: #6f42c1; }
        .rarity-legendary { background: #fd7e14; }
        .rarity-artifact { background: #dc3545; }
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
          <h1>${item.name}</h1>
          <p>${item.itemType} • ${item.theme}</p>
          <div class="rarity-badge rarity-${item.rarity.toLowerCase().replace(' ', '-')}">
            ${item.rarity}
          </div>
        </div>

        ${item.portrait ? `
        <div class="portrait">
          <img src="${item.portrait}" alt="Item Portrait" />
        </div>
        ` : ''}

        <div class="item-info">
          <div class="info-group">
            <h3>Basic Information</h3>
            <p><strong>Type:</strong> ${item.itemType}</p>
            <p><strong>Theme:</strong> ${item.theme}</p>
            <p><strong>Rarity:</strong> ${item.rarity}</p>
            <p><strong>Value:</strong> ${item.value}</p>
            <p><strong>Weight:</strong> ${weightDisplay}</p>
            <p><strong>Attunement:</strong> ${item.attunement ? 'Required' : 'Not Required'}</p>
          </div>
          <div class="info-group">
            <h3>Properties & Effects</h3>
            <p><strong>Properties:</strong> ${item.properties}</p>
            <p><strong>Magical Effects:</strong> ${item.magicalEffects}</p>
            <p><strong>Requirements:</strong> ${item.requirements}</p>
            <p><strong>Restrictions:</strong> ${item.restrictions}</p>
          </div>
        </div>

        ${item.quote ? `
        <div class="quote">
          "${item.quote}"
        </div>
        ` : ''}

        <div class="section">
          <h3>Description</h3>
          <p>${item.description}</p>
        </div>

        <div class="section">
          <h3>History</h3>
          <p>${item.history}</p>
        </div>

        <div class="section">
          <h3>Unique Trait</h3>
          <p>${item.uniqueTrait}</p>
        </div>

        <div class="section">
          <h3>Crafting & Enchantments</h3>
          <p><strong>Crafting Materials:</strong> ${item.craftingMaterials}</p>
          <p><strong>Enchantments:</strong> ${item.enchantments}</p>
        </div>
      </div>
    </body>
    </html>
  `
} 
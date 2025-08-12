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

    const { item, isFreeTier = true, unitSystem = 'imperial' } = await request.json()

    if (!item) {
      return NextResponse.json({ error: 'Item data required' }, { status: 400 })
    }

    // Generate HTML content
    const htmlContent = generateItemCardHTML(item, isFreeTier, unitSystem)

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
        'Content-Disposition': `attachment; filename="${item.name.replace(/\s+/g, '_')}_Item_Card.pdf"`,
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
  name: string
  itemType: string
  theme: string
  rarity: string
  description: string
  properties: string[]
  magicalEffects: string[]
  history: string
  value: string
  weight: string
  requirements: string[]
  attunement: boolean
  quote: string
  uniqueTrait: string
  craftingMaterials: string[]
  enchantments: string[]
  restrictions: string[]
  portrait?: string
}

function generateItemCardHTML(item: ItemForPDF, isFreeTier: boolean = true, unitSystem: 'metric' | 'imperial' = 'imperial') {
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#6b7280'
      case 'uncommon': return '#059669'
      case 'rare': return '#2563eb'
      case 'very rare': return '#7c3aed'
      case 'legendary': return '#ea580c'
      case 'artifact': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const convertWeight = (weight: string, targetSystem: 'metric' | 'imperial'): string => {
    if (!weight) return weight
    
    const numMatch = weight.match(/(\d+(?:\.\d+)?)/)
    if (!numMatch) return weight
    
    const num = parseFloat(numMatch[1])
    const unit = weight.replace(numMatch[1], '').trim().toLowerCase()
    
    if (targetSystem === 'metric') {
      // Convert to metric
      if (unit.includes('lb') || unit.includes('pound')) {
        return `${(num * 0.453592).toFixed(1)} kg`
      }
      if (unit.includes('oz') || unit.includes('ounce')) {
        return `${(num * 0.0283495).toFixed(2)} kg`
      }
      return weight // Assume already metric if no imperial units found
    } else {
      // Convert to imperial
      if (unit.includes('kg') || unit.includes('kilogram')) {
        return `${(num * 2.20462).toFixed(1)} lbs`
      }
      if (unit.includes('g') || unit.includes('gram')) {
        return `${(num * 0.035274).toFixed(1)} oz`
      }
      return weight // Assume already imperial if no metric units found
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
    <title>${item.name} - Item Card</title>
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
        
        .item-name {
            font-size: 2.5em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .item-subtitle {
            font-size: 1.2em;
            color: #7f8c8d;
        }
        
        .rarity-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            color: white;
            font-weight: bold;
            margin-top: 10px;
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
        
        .description, .history {
            line-height: 1.6;
            text-align: justify;
        }
        
        .properties {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .property {
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
        
        .item-details {
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
        
        .attunement-notice {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
            font-weight: bold;
            color: #92400e;
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
        <div class="item-name">${item.name}</div>
        <div class="item-subtitle">
            ${item.itemType} • ${item.theme}
        </div>
        <div class="rarity-badge" style="background-color: ${getRarityColor(item.rarity)};">
            ${item.rarity}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Description</div>
        <div class="description">${item.description}</div>
    </div>

    <div class="section">
        <div class="section-title">Properties</div>
        <div class="properties">
            ${item.properties.map(property => `
                <span class="property">${property}</span>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Magical Effects</div>
        <div class="space-y-2">
            ${item.magicalEffects.map(effect => `
                <div class="list-item">${effect}</div>
            `).join('')}
        </div>
    </div>

    <div class="item-details">
        <div class="detail-box">
            <div class="detail-label">Value</div>
            <div class="detail-value">${item.value}</div>
        </div>
        <div class="detail-box">
                            <div class="detail-label">Weight</div>
                <div class="detail-value">${convertWeight(item.weight, unitSystem)}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Requirements</div>
        <div class="space-y-2">
            ${item.requirements.map(req => `
                <div class="list-item">${req}</div>
            `).join('')}
        </div>
    </div>

    ${item.attunement ? `
        <div class="attunement-notice">
            ⚠️ This item requires attunement
        </div>
    ` : ''}

    <div class="section">
        <div class="section-title">History</div>
        <div class="history">${item.history}</div>
    </div>

    <div class="quote">
        "${item.quote}"
        <br><small>— Ancient Lore</small>
    </div>

    <div class="unique-trait">
        <strong>Unique Trait:</strong> ${item.uniqueTrait}
    </div>

    <div class="section">
        <div class="section-title">Crafting Materials</div>
        <div class="space-y-2">
            ${item.craftingMaterials.map(material => `
                <div class="list-item">${material}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Enchantments</div>
        <div class="space-y-2">
            ${item.enchantments.map(enchantment => `
                <div class="list-item">${enchantment}</div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Restrictions</div>
        <div class="space-y-2">
            ${item.restrictions.map(restriction => `
                <div class="list-item">${restriction}</div>
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
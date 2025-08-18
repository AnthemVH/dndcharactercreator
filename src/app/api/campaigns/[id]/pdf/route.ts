import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
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
    const { id: campaignId } = await params

    // Fetch campaign
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Merge Supabase row with JSON data and normalize portrait
    const mergedCampaign: any = {
      ...(campaign as any)?.data,
      ...(campaign as any),
      portrait: (campaign as any)?.portrait_url || (campaign as any)?.data?.portrait || (campaign as any)?.data?.portrait_url,
    }

    const htmlContent = generateCampaignOverviewHTML(mergedCampaign as any, false)
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    })

    await browser.close()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(mergedCampaign.name || 'Campaign').replace(/\s+/g, '_')}_Campaign_Overview.pdf"`,
      },
    })
  } catch (error) {
    console.error('Campaign PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

interface CampaignForPDF {
  id: string
  name: string
  theme?: string
  difficulty?: string
  playerCount?: number
  description?: string
  setting?: string
  mainPlot?: string
  portrait?: string
}

function generateCampaignOverviewHTML(c: CampaignForPDF, isFreeTier: boolean = false) {
  const watermark = isFreeTier ? '' : ''
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${c.name} - Campaign Overview</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; background: #f5f5f5; color: #333; }
        .page-container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 0 20px rgba(0,0,0,0.1); position: relative; }
        .header { text-align: center; border-bottom: 3px solid #8B4513; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #8B4513; font-size: 2.5em; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }
        .portrait { text-align: center; margin: 20px 0; }
        .portrait img { max-width: 200px; max-height: 200px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
        .info-group { background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #8B4513; margin-bottom: 20px; }
        .info-group h3 { color: #8B4513; margin: 0 0 10px 0; font-size: 1.2em; }
      </style>
    </head>
    <body>
      ${watermark}
      <div class="page-container">
        <div class="header">
          <h1>${c.name}</h1>
          <p>${c.theme || ''} ${c.theme && c.difficulty ? '•' : ''} ${c.difficulty || ''} ${c.playerCount ? `• ${c.playerCount} Players` : ''}</p>
        </div>
        ${c.portrait ? `<div class="portrait"><img src="${c.portrait}" alt="Campaign Portrait" /></div>` : ''}
        ${c.description ? `<div class="info-group"><h3>Description</h3><p>${c.description}</p></div>` : ''}
        ${c.setting ? `<div class="info-group"><h3>Setting</h3><p>${c.setting}</p></div>` : ''}
        ${c.mainPlot ? `<div class="info-group"><h3>Main Plot</h3><p>${c.mainPlot}</p></div>` : ''}
      </div>
    </body>
    </html>
  `
}
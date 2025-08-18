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
    const { id: characterId } = await params

    const { data: character, error } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Merge Supabase row with JSON data, then normalize to the shape the PDF expects
    const mergedCharacter: any = {
      ...(character as any)?.data,
      ...(character as any),
      portrait: (character as any)?.portrait_url || (character as any)?.data?.portrait || (character as any)?.data?.portrait_url,
    }

    const normalized = normalizeCharacterForPDF(mergedCharacter)

    // Generate HTML content (no watermark)
    const htmlContent = generateCharacterSheetHTML(normalized, false, 'imperial')
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    await page.setViewport({ width: 1200, height: 1600 })

    // Generate PDF (Letter matches common 5E sheets)
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.35in',
        right: '0.35in',
        bottom: '0.35in',
        left: '0.35in'
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

function normalizeCharacterForPDF(input: any): CharacterForPDF {
  const stats = input.stats || {}

  const strength = Number(
    input.strength ?? input.STR ?? stats.STR ?? stats.strength ?? stats.str ?? 10
  )
  const dexterity = Number(
    input.dexterity ?? input.DEX ?? stats.DEX ?? stats.dexterity ?? stats.dex ?? 10
  )
  const constitution = Number(
    input.constitution ?? input.CON ?? stats.CON ?? stats.constitution ?? stats.con ?? 10
  )
  const intelligence = Number(
    input.intelligence ?? input.INT ?? stats.INT ?? stats.intelligence ?? stats.int ?? 10
  )
  const wisdom = Number(
    input.wisdom ?? input.WIS ?? stats.WIS ?? stats.wisdom ?? stats.wis ?? 10
  )
  const charisma = Number(
    input.charisma ?? input.CHA ?? stats.CHA ?? stats.charisma ?? stats.cha ?? 10
  )

  const dexMod = Math.floor((dexterity - 10) / 2)

  const toText = (val: unknown): string => {
    if (val == null) return ''
    if (Array.isArray(val)) return val.map(v => String(v)).filter(Boolean).join(', ')
    if (typeof val === 'object') return Object.values(val as Record<string, unknown>).map(v => String(v)).join(', ')
    return String(val)
  }

  return {
    id: String(input.id ?? ''),
    name: String(input.name ?? 'Unnamed Adventurer'),
    race: String(input.race ?? ''),
    class: String(input.class ?? ''),
    level: Number(input.level ?? 1),
    background: String(input.background ?? ''),
    alignment: String(input.alignment ?? ''),
    experience: Number(input.experience ?? 0),
    strength,
    dexterity,
    constitution,
    intelligence,
    wisdom,
    charisma,
    armorClass: Number(input.armorClass ?? input.armor_class ?? 10 + dexMod),
    initiative: Number(input.initiative ?? dexMod),
    speed: Number(input.speed ?? input.movement?.walk ?? 30),
    hitPoints: Number(input.hitPoints ?? input.hp ?? 10 + Math.floor((constitution - 10) / 2)),
    hitDice: String(input.hitDice ?? input.hit_dice ?? '1d8'),
    personalityTraits: toText(input.personalityTraits ?? input.traits ?? input.personality ?? ''),
    ideals: toText(input.ideals ?? ''),
    bonds: toText(input.bonds ?? ''),
    flaws: toText(input.flaws ?? ''),
    proficiencies: toText(input.proficiencies ?? ''),
    features: toText(input.features ?? ''),
    equipment: toText(input.equipment ?? ''),
    backstory: toText(input.backstory ?? ''),
    appearance: toText(input.appearance ?? ''),
    abilities: toText(input.abilities ?? ''),
    spells: toText(input.spells ?? ''),
    portrait: input.portrait ?? null,
  }
}

function generateCharacterSheetHTML(
  character: CharacterForPDF,
  isFreeTier: boolean = false,
  unitSystem: 'metric' | 'imperial' = 'imperial'
) {
  const watermark = isFreeTier ? '' : ''
  
  // Display D&D movement speed (feet per round) or metric equivalent
  const speedDisplay = unitSystem === 'metric' ? 
    `${Math.round((character.speed ?? 30) * 0.3048)} m/round` : 
    `${character.speed ?? 30} ft/round`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${character.name} - Character Sheet</title>
      <style>
        /* Parchment-inspired, colored 5E-style layout */
        :root{
          --ink:#2b2b2b;
          --accent:#7a3e2e; /* warm brown-red */
          --accent-2:#b97a3d; /* gold/burnished */
          --parchment:#f7f1df;
          --panel:#fffaf0;
          --border:#caa56a;
        }
        *{box-sizing:border-box}
        body{
          font-family: Georgia, "Times New Roman", serif;
          color:var(--ink);
          margin:0;
          background: radial-gradient(1200px 600px at 50% -10%, #fff7e6, var(--parchment))
                      , linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0) 120px);
          padding:12px;
        }
        .page{
          width: 8.5in; /* Letter width */
          max-width: 8.5in;
          margin: 0 auto;
          background: var(--panel);
          border: 1px solid var(--border);
          box-shadow: 0 6px 14px rgba(0,0,0,.12);
          position: relative;
          padding: 18px 22px;
        }
        .page:before{
          content:'';position:absolute;inset:6px;pointer-events:none;
          border: 2px solid rgba(122,62,46,.35);
        }
        .header{
          display:flex;align-items:center;justify-content:space-between;gap:16px;
          border-bottom: 3px double var(--accent);
          padding-bottom: 10px;margin-bottom: 14px;
        }
        .title{
          font-variant: small-caps;letter-spacing:.5px;color:var(--accent);
          font-size: 32px;margin:0;text-shadow:0 1px 0 rgba(0,0,0,.06);
        }
        .subtitle{margin:2px 0 0 0;color:#5a463d;font-weight:600}
        .cols{
          display:grid;grid-template-columns: 260px 1fr;gap:16px;
        }
        /* Left rail: ability scores */
        .abilities{display:grid;grid-template-columns:1fr;gap:10px}
        .score{
          background: linear-gradient(180deg,#fffdf6,#f4e8cc);
          border:1.5px solid var(--border);border-radius:8px;padding:10px;text-align:center;
        }
        .score .name{font-variant:small-caps;color:#5a463d;font-weight:700;margin-bottom:2px}
        .score .val{font-size:22px;font-weight:800;color:var(--accent)}
        /* Right column panels */
        .panel{background:#fffdf6;border:1.5px solid var(--border);border-radius:8px;padding:12px 14px}
        .panel h3{margin:0 0 8px 0;font-variant:small-caps;color:var(--accent);font-size:16px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .label{color:#6b5a4f}
        .value{font-weight:700;color:#3a2f2a}
        .list{margin:0;padding-left:16px}
        .portrait{text-align:center;margin:8px 0}
        .portrait img{max-width:180px;max-height:180px;border-radius:6px;border:1px solid var(--border);box-shadow:0 3px 8px rgba(0,0,0,.15)}
        .section{margin-top:12px}
        .muted{color:#7a6b60}
        /* Pagination-friendly rules */
        .panel,.section,.abilities,.grid2,.header,.score{break-inside: avoid; page-break-inside: avoid}
        @media print{body{background:white;-webkit-print-color-adjust:exact} .page{box-shadow:none;border:none}}
      </style>
    </head>
    <body>
      ${watermark}
      <div class="page">
        <div class="header">
          <div>
            <h1 class="title">${character.name}</h1>
            <div class="subtitle">Level ${character.level} ${character.race} ${character.class}</div>
          </div>
          ${character.portrait ? `
            <div class="portrait"><img src="${character.portrait}" alt="Portrait"/></div>
          ` : ''}
        </div>

        <div class="cols">
          <div class="abilities">
            <div class="score"><div class="name">STR</div><div class="val">${character.strength}</div></div>
            <div class="score"><div class="name">DEX</div><div class="val">${character.dexterity}</div></div>
            <div class="score"><div class="name">CON</div><div class="val">${character.constitution}</div></div>
            <div class="score"><div class="name">INT</div><div class="val">${character.intelligence}</div></div>
            <div class="score"><div class="name">WIS</div><div class="val">${character.wisdom}</div></div>
            <div class="score"><div class="name">CHA</div><div class="val">${character.charisma}</div></div>
          </div>
          <div class="right">
            <div class="panel grid2">
              <div>
                <h3>Basics</h3>
                <div><span class="label">Background:</span> <span class="value">${character.background || '-'}</span></div>
                <div><span class="label">Alignment:</span> <span class="value">${character.alignment || '-'}</span></div>
                <div><span class="label">Experience:</span> <span class="value">${character.experience || 0}</span></div>
              </div>
              <div>
                <h3>Combat</h3>
                <div><span class="label">Armor Class:</span> <span class="value">${character.armorClass}</span></div>
                <div><span class="label">Initiative:</span> <span class="value">${character.initiative}</span></div>
                <div><span class="label">Speed:</span> <span class="value">${speedDisplay}</span></div>
                <div><span class="label">Hit Points:</span> <span class="value">${character.hitPoints}</span></div>
                <div><span class="label">Hit Dice:</span> <span class="value">${character.hitDice || '-'}</span></div>
              </div>
            </div>

            <div class="panel section">
              <h3>Personality</h3>
              <ul class="list">
                <li><span class="label">Traits:</span> ${character.personalityTraits || '-'}</li>
                <li><span class="label">Ideals:</span> ${character.ideals || '-'}</li>
                <li><span class="label">Bonds:</span> ${character.bonds || '-'}</li>
                <li><span class="label">Flaws:</span> ${character.flaws || '-'}</li>
              </ul>
            </div>

            <div class="panel section">
              <h3>Proficiencies & Features</h3>
              <div class="muted"><strong>Proficiencies:</strong> ${character.proficiencies || '-'}</div>
              <div class="muted"><strong>Features:</strong> ${character.features || '-'}</div>
            </div>

            <div class="panel section">
              <h3>Equipment</h3>
              <div class="muted">${character.equipment || '-'}</div>
            </div>

            <div class="panel section">
              <h3>Backstory</h3>
              <div class="muted">${character.backstory || '-'}</div>
            </div>

            ${character.appearance ? `
            <div class="panel section">
              <h3>Appearance</h3>
              <div class="muted">${character.appearance}</div>
            </div>` : ''}

            ${character.abilities ? `
            <div class="panel section">
              <h3>Abilities</h3>
              <div class="muted">${character.abilities}</div>
            </div>` : ''}

            ${character.spells ? `
            <div class="panel section">
              <h3>Spells</h3>
              <div class="muted">${character.spells}</div>
            </div>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `
} 
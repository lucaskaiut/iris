type ThemeVars = Record<string, string>

const LIGHT_VARS: ThemeVars = {
  '--text': '#6b6375',
  '--text-h': '#08060d',
  '--bg': '#fff',
  '--border': '#e5e4e7',
  '--code-bg': '#f4f3ec',
  '--accent': '#aa3bff',
  '--accent-bg': 'rgba(170, 59, 255, 0.1)',
  '--accent-border': 'rgba(170, 59, 255, 0.5)',
  '--social-bg': 'rgba(244, 243, 236, 0.5)',
  '--shadow':
    'rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px',
}

const DARK_VARS: ThemeVars = {
  '--text': '#9ca3af',
  '--text-h': '#f3f4f6',
  '--bg': '#16171d',
  '--border': '#2e303a',
  '--code-bg': '#1f2028',
  '--accent': '#c084fc',
  '--accent-bg': 'rgba(192, 132, 252, 0.15)',
  '--accent-border': 'rgba(192, 132, 252, 0.5)',
  '--social-bg': 'rgba(47, 48, 58, 0.5)',
  '--shadow':
    'rgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px',
}

function applyVars(vars: ThemeVars) {
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
}

function applyTypography() {
  const root = document.documentElement
  root.style.setProperty('--sans', "var(--font-sans)")
  root.style.setProperty('--heading', "var(--font-heading)")
  root.style.setProperty('--mono', "var(--font-mono)")
  root.style.fontFamily = 'var(--sans)'
  root.style.lineHeight = '145%'
  root.style.letterSpacing = '0.18px'
  root.style.fontSynthesis = 'none'
  root.style.textRendering = 'optimizeLegibility'
  ;(root.style as CSSStyleDeclaration & { WebkitFontSmoothing?: string }).WebkitFontSmoothing =
    'antialiased'
  ;(root.style as CSSStyleDeclaration & { MozOsxFontSmoothing?: string }).MozOsxFontSmoothing =
    'grayscale'
  root.style.colorScheme = 'light dark'
}

function applyResponsiveFontSize() {
  const root = document.documentElement
  root.style.fontSize = window.innerWidth <= 1024 ? '16px' : '18px'
}

async function loadFont(name: string, url: string) {
  const face = new FontFace(name, `url(${url})`, { style: 'normal', weight: '400' })
  const loaded = await face.load()
  document.fonts.add(loaded)
}

export async function setupTheme() {
  document.body.style.margin = '0'

  await Promise.all([
    loadFont('Kenney Future', new URL('./assets/fonts/Kenney Future.ttf', import.meta.url).toString()),
    loadFont(
      'Kenney Future Narrow',
      new URL('./assets/fonts/Kenney Future Narrow.ttf', import.meta.url).toString(),
    ),
    loadFont(
      'Kenney Mini Square Mono',
      new URL('./assets/fonts/Kenney Mini Square Mono.ttf', import.meta.url).toString(),
    ),
  ])

  const root = document.documentElement
  root.style.setProperty(
    '--font-sans',
    "'Kenney Future', system-ui, 'Segoe UI', Roboto, sans-serif",
  )
  root.style.setProperty(
    '--font-heading',
    "'Kenney Future Narrow', system-ui, 'Segoe UI', Roboto, sans-serif",
  )
  root.style.setProperty(
    '--font-mono',
    "'Kenney Mini Square Mono', ui-monospace, Consolas, monospace",
  )

  applyTypography()

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    applyVars(mq.matches ? DARK_VARS : LIGHT_VARS)
    root.style.color = 'var(--text)'
    root.style.background = 'var(--bg)'
    document.body.style.background = 'var(--bg)'
    document.body.style.color = 'var(--text)'
  }
  apply()

  mq.addEventListener('change', apply)
  applyResponsiveFontSize()
  window.addEventListener('resize', applyResponsiveFontSize, { passive: true })
}


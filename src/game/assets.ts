export type ModelAssetMap = Record<string, Record<string, string>>

const PNGS = import.meta.glob('../assets/models/*/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

export const MODEL_ANIMATION_URLS: ModelAssetMap = Object.entries(PNGS).reduce<ModelAssetMap>(
  (acc, [path, url]) => {
    const match = path.match(/\/assets\/models\/([^/]+)\/([^/]+)\.png$/)
    if (!match) return acc
    const model = match[1]
    const animation = match[2]
    acc[model] ??= {}
    acc[model][animation] = url
    return acc
  },
  {},
)

export function getAvailableModels() {
  const models = Object.keys(MODEL_ANIMATION_URLS)
  models.sort()
  return models
}

export function getAvailableAnimations(model: string, opts?: { exclude?: string[] }) {
  const exclude = new Set(opts?.exclude ?? [])
  const entries = Object.keys(MODEL_ANIMATION_URLS[model] ?? {}).filter((a) => !exclude.has(a))
  entries.sort()
  return entries
}

export function getAnimationUrl(model: string, animation: string) {
  return MODEL_ANIMATION_URLS[model]?.[animation]
}


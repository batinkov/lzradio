import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'fs'

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Extract section names from question bank JSON files at build time
function extractSectionNames() {
  const locales = ['en', 'bg']
  const classes = [1, 2]
  const sections = [1, 2, 3]
  const result = {}

  for (const locale of locales) {
    result[locale] = {}
    for (const cls of classes) {
      result[locale][cls] = {}
      for (const sec of sections) {
        const filePath = `./data_${locale}/Class${cls}_Section${sec}.json`
        try {
          const data = JSON.parse(readFileSync(filePath, 'utf-8'))
          result[locale][cls][sec] = data.section
        } catch {
          result[locale][cls][sec] = `Section ${sec}`
        }
      }
    }
  }
  return result
}

const sectionNames = extractSectionNames()

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __MAINTAINER_CALLSIGN__: JSON.stringify(pkg.maintainer.callsign),
    __GITHUB_REPO__: JSON.stringify(pkg.maintainer.github),
    __SECTION_NAMES__: JSON.stringify(sectionNames)
  }
})

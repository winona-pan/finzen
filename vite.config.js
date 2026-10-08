import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/* 讓 src/ 底下的 JSX 都經過翻譯層（src/i18nRuntime.js）；node_modules 和翻譯層自己不受影響 */
const WRAPPERS = {
  'react/jsx-runtime': path.resolve(__dirname, 'src/i18nJsxRuntime.js'),
  'react/jsx-dev-runtime': path.resolve(__dirname, 'src/i18nJsxDevRuntime.js'),
}
function i18nJsx() {
  return {
    name: 'finzen-i18n-jsx',
    enforce: 'pre',
    resolveId(source, importer) {
      const target = WRAPPERS[source]
      if (!target || !importer) return null
      const file = importer.split('?')[0]
      if (!file.startsWith(path.resolve(__dirname, 'src')) || Object.values(WRAPPERS).includes(file)) return null
      return target
    },
  }
}

export default defineConfig({
  plugins: [i18nJsx(), react()],
  base: './',
})

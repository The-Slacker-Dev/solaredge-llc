import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const pages = await fetch('http://127.0.0.1:9222/json').then((r) => r.json())
const socket = new WebSocket(pages.find((page) => page.webSocketDebuggerUrl).webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
let nextId = 0
const pending = new Map()
socket.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (!message.id) return
  const callback = pending.get(message.id)
  if (!callback) return
  pending.delete(message.id)
  callback(message)
}
function send(method, params = {}) {
  const id = ++nextId
  return new Promise((resolve, reject) => {
    pending.set(id, (message) => message.error ? reject(new Error(message.error.message)) : resolve(message.result))
    socket.send(JSON.stringify({ id, method, params }))
  })
}
await send('Page.enable')
await send('Runtime.enable')
const widths = [390, 768, 1440]
const routes = ['/', '/shop', '/p/SE-P410', '/trade', '/about', '/faq', '/contact', '/privacy', '/terms', '/shipping', '/returns', '/warranty', '/checkout']
for (const width of widths) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 })
  for (const route of routes) {
    await send('Page.navigate', { url: `http://127.0.0.1:5173/#${route}` })
    await new Promise((resolve) => setTimeout(resolve, 200))
    const result = await send('Runtime.evaluate', { expression: `(() => {
      const rect = (selector) => { const el = document.querySelector(selector); if (!el) return null; const r = el.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width) } };
      return { route: location.hash, title: document.querySelector('main h1')?.textContent?.trim() || '', viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, header: rect('header.site'), pricing: rect('header.site .mode'), cookie: rect('.cookie'), hero: rect('.hero'), heroActions: rect('.hero .ctas'), shop: rect('.shop'), filters: rect('.filters'), firstCard: rect('.card'), firstPrice: rect('.card .pr'), doc: rect('.doc') };
    })()`, returnByValue: true })
    console.log(JSON.stringify({ width, ...result.result.value }))
    if (width === 390 && ['/', '/shop', '/p/SE-P410'].includes(route)) {
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
      fs.writeFileSync(path.join(os.tmpdir(), `se-cdp-${route.replaceAll('/', '_') || 'home'}.png`), Buffer.from(shot.data, 'base64'))
    }
  }
}
socket.close()

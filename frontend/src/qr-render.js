import qrcode from 'qrcode-generator'

const EC_LEVELS = ['L', 'M', 'Q', 'H']

// Check if content contains non-ASCII characters (e.g. Japanese, emoji)
function needsUTF8(str) {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) return true
  }
  return false
}

// Convert string to UTF-8 byte string for the QR encoder
function toUTF8Bytes(str) {
  return String.fromCharCode(...new TextEncoder().encode(str))
}

export function generateMatrix(content, ecLevel) {
  if (!content) throw new Error('No content')
  const startIdx = EC_LEVELS.indexOf(ecLevel)
  const tryOrder = EC_LEVELS.slice(0, startIdx + 1).reverse()
  let lastError
  for (const ec of tryOrder) {
    try {
      const qr = qrcode(0, ec)
      if (needsUTF8(content)) {
        qr.addData(toUTF8Bytes(content), 'Byte')
      } else {
        qr.addData(content)
      }
      qr.make()
      const count = qr.getModuleCount()
      const matrix = []
      for (let r = 0; r < count; r++) {
        const row = []
        for (let c = 0; c < count; c++) row.push(qr.isDark(r, c))
        matrix.push(row)
      }
      return { matrix, actualEC: ec }
    } catch (e) { lastError = e }
  }
  throw lastError
}

// --- Geometry helpers ---

function isFinderBlock(row, col, count) {
  return (row < 7 && col < 7) || (row < 7 && col >= count - 7) || (row >= count - 7 && col < 7)
}

function roundedRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function svgHexPoints(cx, cy, r) {
  let pts = ''
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2
    pts += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `
  }
  return pts.trim()
}

function drawHexagon(ctx, cx, cy, r) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2
    const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a)
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
}

// --- Gradient helper ---

function applyFill(ctx, fillOpts, x, y, w, h) {
  const { color, gradient, gradientType, gradientColor } = fillOpts
  if (gradient && gradientColor) {
    let grad
    if (gradientType === 'radial') {
      const cx = x + w / 2, cy = y + h / 2, r = Math.max(w, h) / 2
      grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    } else {
      grad = ctx.createLinearGradient(x, y, x + w, y + h)
    }
    grad.addColorStop(0, color)
    grad.addColorStop(1, gradientColor)
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = color
  }
}

// --- Body shape drawing ---

const SHAPE_GAP = {
  square: 0, rounded: 0.04, dots: 0.08, diamond: 0.06,
  star: 0.03, classy: 0, 'classy-rounded': 0.02, 'edge-cut': 0, hexagon: 0.06,
  connected: 0,
}

// Connected shape: draw modules that merge with adjacent neighbors
function drawConnectedModules(ctx, matrix, count, offsetPx, moduleSize) {
  const ms = moduleSize
  const r = ms * 0.35 // corner radius

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (!matrix[row][col] || isFinderBlock(row, col, count)) continue
      const x = offsetPx + col * ms
      const y = offsetPx + row * ms

      // Check neighbors
      const top = row > 0 && matrix[row - 1][col] && !isFinderBlock(row - 1, col, count)
      const bottom = row < count - 1 && matrix[row + 1][col] && !isFinderBlock(row + 1, col, count)
      const left = col > 0 && matrix[row][col - 1] && !isFinderBlock(row, col - 1, count)
      const right = col < count - 1 && matrix[row][col + 1] && !isFinderBlock(row, col + 1, count)

      // Round only corners that have no adjacent neighbor
      const tl = (!top && !left) ? r : 0
      const tr = (!top && !right) ? r : 0
      const br = (!bottom && !right) ? r : 0
      const bl = (!bottom && !left) ? r : 0

      ctx.beginPath()
      ctx.moveTo(x + tl, y)
      ctx.lineTo(x + ms - tr, y)
      if (tr) ctx.quadraticCurveTo(x + ms, y, x + ms, y + tr)
      else ctx.lineTo(x + ms, y)
      ctx.lineTo(x + ms, y + ms - br)
      if (br) ctx.quadraticCurveTo(x + ms, y + ms, x + ms - br, y + ms)
      else ctx.lineTo(x + ms, y + ms)
      ctx.lineTo(x + bl, y + ms)
      if (bl) ctx.quadraticCurveTo(x, y + ms, x, y + ms - bl)
      else ctx.lineTo(x, y + ms)
      ctx.lineTo(x, y + tl)
      if (tl) ctx.quadraticCurveTo(x, y, x + tl, y)
      else ctx.lineTo(x, y)
      ctx.closePath()
      ctx.fill()
    }
  }
}

function drawModule(ctx, x, y, size, shape) {
  const gap = SHAPE_GAP[shape] || 0
  const s = size * (1 - gap)
  const off = (size - s) / 2

  switch (shape) {
    case 'square':
      ctx.fillRect(x, y, size, size)
      break
    case 'rounded':
      roundedRect(ctx, x + off, y + off, s, s, s * 0.3)
      ctx.fill()
      break
    case 'dots':
      ctx.beginPath()
      ctx.arc(x + size / 2, y + size / 2, s / 2, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'diamond': {
      const cx = x + size / 2, cy = y + size / 2, half = s / 2
      ctx.beginPath()
      ctx.moveTo(cx, cy - half); ctx.lineTo(cx + half, cy)
      ctx.lineTo(cx, cy + half); ctx.lineTo(cx - half, cy)
      ctx.closePath(); ctx.fill()
      break
    }
    case 'hexagon': {
      drawHexagon(ctx, x + size / 2, y + size / 2, s / 2)
      ctx.fill()
      break
    }
    case 'star': {
      const cx = x + size / 2, cy = y + size / 2
      const outerR = s / 2, innerR = outerR * 0.5
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        const a = (Math.PI * i) / 4 - Math.PI / 2
        const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a)
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath(); ctx.fill()
      break
    }
    case 'classy':
      // Square with bottom-right notch
      ctx.beginPath()
      ctx.moveTo(x, y); ctx.lineTo(x + size, y)
      ctx.lineTo(x + size, y + size * 0.5)
      ctx.lineTo(x + size * 0.5, y + size * 0.5)
      ctx.lineTo(x + size * 0.5, y + size)
      ctx.lineTo(x, y + size)
      ctx.closePath(); ctx.fill()
      ctx.fillRect(x + size * 0.55, y + size * 0.55, size * 0.45, size * 0.45)
      break
    case 'classy-rounded': {
      // Two offset rounded rects
      const r = s * 0.3
      roundedRect(ctx, x + off, y + off, s * 0.65, s * 0.65, r)
      ctx.fill()
      roundedRect(ctx, x + off + s * 0.35, y + off + s * 0.35, s * 0.65, s * 0.65, r)
      ctx.fill()
      break
    }
    case 'edge-cut':
      // Square with corner cuts
      ctx.beginPath()
      const c = size * 0.2
      ctx.moveTo(x + c, y); ctx.lineTo(x + size - c, y)
      ctx.lineTo(x + size, y + c); ctx.lineTo(x + size, y + size - c)
      ctx.lineTo(x + size - c, y + size); ctx.lineTo(x + c, y + size)
      ctx.lineTo(x, y + size - c); ctx.lineTo(x, y + c)
      ctx.closePath(); ctx.fill()
      break
    default:
      ctx.fillRect(x, y, size, size)
  }
}

// --- Eye (finder pattern) drawing ---

// Draw eye frame as a ring (outer shape minus inner cutout).
// Uses offscreen canvas so destination-out doesn't bleed through layers beneath.
function drawEyeFrame(ctx, sx, sy, ms, shape, color, bgColor) {
  const outerSize = ms * 7

  if (shape === 'square') {
    ctx.fillStyle = color
    ctx.fillRect(sx, sy, outerSize, outerSize)
    if (bgColor === 'transparent') {
      ctx.clearRect(sx + ms, sy + ms, ms * 5, ms * 5)
    } else {
      ctx.fillStyle = bgColor
      ctx.fillRect(sx + ms, sy + ms, ms * 5, ms * 5)
    }
    return
  }

  // Offscreen canvas for clean cutout compositing
  const pad = 2
  const oc = document.createElement('canvas')
  oc.width = outerSize + pad * 2; oc.height = outerSize + pad * 2
  const o = oc.getContext('2d')
  const cx = outerSize / 2 + pad, cy = outerSize / 2 + pad

  // Draw outer shape
  o.fillStyle = color
  switch (shape) {
    case 'rounded': {
      const r = ms * 1.2
      roundedRect(o, pad, pad, outerSize, outerSize, r)
      o.fill()
      break
    }
    case 'circle':
      o.beginPath(); o.arc(cx, cy, outerSize / 2, 0, Math.PI * 2); o.fill()
      break
    case 'cushion': {
      const r = ms * 2.5
      roundedRect(o, pad, pad, outerSize, outerSize, r)
      o.fill()
      break
    }
    case 'leaf': {
      const r = ms * 2.2
      o.beginPath()
      o.moveTo(pad + r, pad)
      o.lineTo(pad + outerSize, pad)
      o.lineTo(pad + outerSize, pad + outerSize - r)
      o.quadraticCurveTo(pad + outerSize, pad + outerSize, pad + outerSize - r, pad + outerSize)
      o.lineTo(pad, pad + outerSize)
      o.lineTo(pad, pad + r)
      o.quadraticCurveTo(pad, pad, pad + r, pad)
      o.closePath(); o.fill()
      break
    }
    case 'hexagon':
      drawHexagon(o, cx, cy, outerSize / 2)
      o.fill()
      break
    default:
      o.fillRect(pad, pad, outerSize, outerSize)
  }

  // Cut inner shape
  o.globalCompositeOperation = 'destination-out'
  const ix = pad + ms, iy = pad + ms, iw = ms * 5
  switch (shape) {
    case 'rounded': {
      const r = ms * 1.2
      roundedRect(o, ix, iy, iw, iw, r * 0.65)
      o.fill()
      break
    }
    case 'circle':
      o.beginPath(); o.arc(cx, cy, ms * 2.5, 0, Math.PI * 2); o.fill()
      break
    case 'cushion': {
      const r = ms * 2.5
      roundedRect(o, ix, iy, iw, iw, r * 0.6)
      o.fill()
      break
    }
    case 'leaf': {
      const r = ms * 2.2, ir = r * 0.55
      o.beginPath()
      o.moveTo(ix + ir, iy)
      o.lineTo(ix + iw, iy)
      o.lineTo(ix + iw, iy + iw - ir)
      o.quadraticCurveTo(ix + iw, iy + iw, ix + iw - ir, iy + iw)
      o.lineTo(ix, iy + iw)
      o.lineTo(ix, iy + ir)
      o.quadraticCurveTo(ix, iy, ix + ir, iy)
      o.closePath(); o.fill()
      break
    }
    case 'hexagon':
      drawHexagon(o, cx, cy, outerSize / 2 - ms)
      o.fill()
      break
    default:
      o.fillRect(ix, iy, iw, iw)
  }

  ctx.drawImage(oc, sx - pad, sy - pad)
}

function drawEyeBall(ctx, sx, sy, ms, shape, color) {
  ctx.fillStyle = color
  const bx = sx + ms * 2, by = sy + ms * 2, bs = ms * 3

  switch (shape) {
    case 'square':
      ctx.fillRect(bx, by, bs, bs)
      break
    case 'rounded':
      roundedRect(ctx, bx, by, bs, bs, ms * 0.8)
      ctx.fill()
      break
    case 'circle':
      ctx.beginPath()
      ctx.arc(bx + bs / 2, by + bs / 2, bs / 2, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'diamond': {
      const cx = bx + bs / 2, cy = by + bs / 2, half = bs / 2
      ctx.beginPath()
      ctx.moveTo(cx, cy - half); ctx.lineTo(cx + half, cy)
      ctx.lineTo(cx, cy + half); ctx.lineTo(cx - half, cy)
      ctx.closePath(); ctx.fill()
      break
    }
    case 'star': {
      const cx = bx + bs / 2, cy = by + bs / 2
      const outerR = bs / 2, innerR = outerR * 0.5
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        const a = (Math.PI * i) / 4 - Math.PI / 2
        i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                 : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
      }
      ctx.closePath(); ctx.fill()
      break
    }
    case 'cushion':
      roundedRect(ctx, bx, by, bs, bs, ms * 1.2)
      ctx.fill()
      break
    case 'leaf': {
      const r = bs * 0.45
      ctx.beginPath()
      ctx.moveTo(bx + r, by)
      ctx.lineTo(bx + bs, by)
      ctx.lineTo(bx + bs, by + bs - r)
      ctx.quadraticCurveTo(bx + bs, by + bs, bx + bs - r, by + bs)
      ctx.lineTo(bx, by + bs)
      ctx.lineTo(bx, by + r)
      ctx.quadraticCurveTo(bx, by, bx + r, by)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'hexagon': {
      drawHexagon(ctx, bx + bs / 2, by + bs / 2, bs / 2)
      ctx.fill()
      break
    }
    default:
      ctx.fillRect(bx, by, bs, bs)
  }
}

function drawFinders(ctx, count, offsetPx, moduleSize, opts) {
  const { bgColor, eyeFrameShape, eyeBallShape, eyeFrameColor, eyeBallColor, fgColor } = opts
  const frameColor = eyeFrameColor || fgColor
  const ballColor = eyeBallColor || fgColor
  const frameShape = eyeFrameShape || 'square'
  const ballShape = eyeBallShape || 'square'

  const positions = [[0, 0], [0, count - 7], [count - 7, 0]]
  for (const [fr, fc] of positions) {
    const sx = offsetPx + fc * moduleSize, sy = offsetPx + fr * moduleSize

    // Fill bg behind finder first to ensure clean compositing
    if (bgColor === 'transparent') {
      ctx.clearRect(sx, sy, moduleSize * 7, moduleSize * 7)
    } else {
      ctx.fillStyle = bgColor
      ctx.fillRect(sx, sy, moduleSize * 7, moduleSize * 7)
    }

    // Frame is drawn via offscreen canvas (no bleed), bg underneath is intact
    drawEyeFrame(ctx, sx, sy, moduleSize, frameShape, frameColor, bgColor)
    drawEyeBall(ctx, sx, sy, moduleSize, ballShape, ballColor)
  }
}

// --- Main render ---

export function renderToCanvas(canvas, matrix, options) {
  const {
    size = 1024, fgColor = '#000000', bgColor = '#ffffff', margin = 4,
    shape = 'square', gradient = false, gradientType = 'linear', gradientColor = '',
    eyeFrameShape = 'square', eyeBallShape = 'square',
    eyeFrameColor = '', eyeBallColor = '',
    logoImg = null, logoSize = 0.2, logoColor = '', logoPadding = 4,
  } = options

  const count = matrix.length
  const totalModules = count + margin * 2
  const moduleSize = size / totalModules
  const offsetPx = margin * moduleSize

  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Background
  // Background (transparent = clear canvas)
  if (bgColor === 'transparent') {
    ctx.clearRect(0, 0, size, size)
  } else {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, size, size)
  }

  // Body modules with optional gradient
  const bodyFill = { color: fgColor, gradient, gradientType, gradientColor }
  const qrAreaX = offsetPx, qrAreaY = offsetPx
  const qrAreaW = count * moduleSize, qrAreaH = count * moduleSize
  applyFill(ctx, bodyFill, qrAreaX, qrAreaY, qrAreaW, qrAreaH)

  if (shape === 'connected') {
    drawConnectedModules(ctx, matrix, count, offsetPx, moduleSize)
  } else {
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (isFinderBlock(r, c, count) || !matrix[r][c]) continue
        const x = offsetPx + c * moduleSize
        const y = offsetPx + r * moduleSize
        drawModule(ctx, x, y, moduleSize, shape)
      }
    }
  }

  // Finder patterns (drawn on top with their own colors)
  drawFinders(ctx, count, offsetPx, moduleSize, {
    bgColor, fgColor, eyeFrameShape, eyeBallShape,
    eyeFrameColor: eyeFrameColor || fgColor,
    eyeBallColor: eyeBallColor || fgColor,
  })

  // Logo
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    const logoW = size * logoSize
    const logoH = (logoImg.naturalHeight / logoImg.naturalWidth) * logoW
    const lx = (size - logoW) / 2, ly = (size - logoH) / 2
    const padded = logoPadding * (size / 512)

    if (bgColor === 'transparent') {
      ctx.clearRect(lx - padded, ly - padded, logoW + padded * 2, logoH + padded * 2)
    } else {
      ctx.fillStyle = bgColor
      ctx.fillRect(lx - padded, ly - padded, logoW + padded * 2, logoH + padded * 2)
    }

    if (logoColor) {
      const oc = document.createElement('canvas')
      oc.width = logoImg.naturalWidth; oc.height = logoImg.naturalHeight
      const octx = oc.getContext('2d')
      octx.drawImage(logoImg, 0, 0)
      octx.globalCompositeOperation = 'source-in'
      octx.fillStyle = logoColor
      octx.fillRect(0, 0, oc.width, oc.height)
      ctx.drawImage(oc, lx, ly, logoW, logoH)
    } else {
      ctx.drawImage(logoImg, lx, ly, logoW, logoH)
    }
  }
}

// --- SVG export ---

export function renderToSVG(matrix, options) {
  const {
    size = 1024, fgColor = '#000000', bgColor = '#ffffff', margin = 4,
    shape = 'square', gradient = false, gradientType = 'linear', gradientColor = '',
    eyeFrameShape = 'square', eyeBallShape = 'square',
    eyeFrameColor = '', eyeBallColor = '',
    logoImg = null, logoSize = 0.2, logoColor = '', logoPadding = 4,
  } = options

  const count = matrix.length
  const totalModules = count + margin * 2
  const ms = size / totalModules
  const off = margin * ms
  const frameColor = eyeFrameColor || fgColor
  const ballColor = eyeBallColor || fgColor

  let defs = ''
  let bodyFill = fgColor
  if (gradient && gradientColor) {
    const gradId = 'bodyGrad'
    if (gradientType === 'radial') {
      defs += `<radialGradient id="${gradId}"><stop offset="0%" stop-color="${fgColor}"/><stop offset="100%" stop-color="${gradientColor}"/></radialGradient>`
    } else {
      defs += `<linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${fgColor}"/><stop offset="100%" stop-color="${gradientColor}"/></linearGradient>`
    }
    bodyFill = `url(#${gradId})`
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">\n`
  if (defs) svg += `<defs>${defs}</defs>\n`
  if (bgColor !== 'transparent') {
    svg += `<rect width="${size}" height="${size}" fill="${bgColor}"/>\n`
  }

  // Data modules
  const gap = SHAPE_GAP[shape] || 0
  const s = ms * (1 - gap)
  const sOff = (ms - s) / 2

  if (shape === 'connected') {
    // Connected: rounded rects that merge with neighbors
    const cr = ms * 0.35
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (!matrix[row][col] || isFinderBlock(row, col, count)) continue
        const x = off + col * ms, y = off + row * ms
        const top = row > 0 && matrix[row - 1][col] && !isFinderBlock(row - 1, col, count)
        const bottom = row < count - 1 && matrix[row + 1][col] && !isFinderBlock(row + 1, col, count)
        const left = col > 0 && matrix[row][col - 1] && !isFinderBlock(row, col - 1, count)
        const right = col < count - 1 && matrix[row][col + 1] && !isFinderBlock(row, col + 1, count)
        const tl = (!top && !left) ? cr : 0, tr = (!top && !right) ? cr : 0
        const br = (!bottom && !right) ? cr : 0, bl = (!bottom && !left) ? cr : 0
        // Build path with individual corner radii
        let d = `M${x + tl},${y}`
        d += `L${x + ms - tr},${y}`
        d += tr ? `Q${x + ms},${y},${x + ms},${y + tr}` : `L${x + ms},${y}`
        d += `L${x + ms},${y + ms - br}`
        d += br ? `Q${x + ms},${y + ms},${x + ms - br},${y + ms}` : `L${x + ms},${y + ms}`
        d += `L${x + bl},${y + ms}`
        d += bl ? `Q${x},${y + ms},${x},${y + ms - bl}` : `L${x},${y + ms}`
        d += `L${x},${y + tl}`
        d += tl ? `Q${x},${y},${x + tl},${y}` : `L${x},${y}`
        d += 'Z'
        svg += `<path d="${d}" fill="${bodyFill}"/>\n`
      }
    }
  } else {
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (!matrix[r][c] || isFinderBlock(r, c, count)) continue
        const x = off + c * ms, y = off + r * ms

        switch (shape) {
          case 'square':
            svg += `<rect x="${x}" y="${y}" width="${ms}" height="${ms}" fill="${bodyFill}"/>\n`; break
          case 'rounded':
            svg += `<rect x="${x + sOff}" y="${y + sOff}" width="${s}" height="${s}" rx="${s * 0.3}" fill="${bodyFill}"/>\n`; break
          case 'dots':
            svg += `<circle cx="${x + ms / 2}" cy="${y + ms / 2}" r="${s / 2}" fill="${bodyFill}"/>\n`; break
          case 'diamond': {
            const cx = x + ms / 2, cy = y + ms / 2, half = s / 2
            svg += `<polygon points="${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}" fill="${bodyFill}"/>\n`; break
          }
          case 'hexagon':
            svg += `<polygon points="${svgHexPoints(x + ms / 2, y + ms / 2, s / 2)}" fill="${bodyFill}"/>\n`; break
          case 'star': {
            const cx = x + ms / 2, cy = y + ms / 2, outerR = s / 2, innerR = outerR * 0.5
            let pts = ''
            for (let i = 0; i < 8; i++) {
              const rr = i % 2 === 0 ? outerR : innerR
              const a = (Math.PI * i) / 4 - Math.PI / 2
              pts += `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)} `
            }
            svg += `<polygon points="${pts.trim()}" fill="${bodyFill}"/>\n`; break
          }
          case 'edge-cut': {
            const ct = ms * 0.2
            svg += `<polygon points="${x + ct},${y} ${x + ms - ct},${y} ${x + ms},${y + ct} ${x + ms},${y + ms - ct} ${x + ms - ct},${y + ms} ${x + ct},${y + ms} ${x},${y + ms - ct} ${x},${y + ct}" fill="${bodyFill}"/>\n`; break
          }
          default:
            svg += `<rect x="${x}" y="${y}" width="${ms}" height="${ms}" fill="${bodyFill}"/>\n`
        }
      }
    }
  }

  // Finder patterns (SVG)
  const finderPositions = [[0, 0], [0, count - 7], [count - 7, 0]]
  for (const [fr, fc] of finderPositions) {
    const sx = off + fc * ms, sy = off + fr * ms
    const outerSize = ms * 7
    const fShape = eyeFrameShape || 'square'
    const bShape = eyeBallShape || 'square'

    // Frame
    const fcx = sx + outerSize / 2, fcy = sy + outerSize / 2
    const fR = fShape === 'rounded' ? ms * 1.2 : fShape === 'cushion' ? ms * 2.5 : 0
    if (fShape === 'circle') {
      svg += `<circle cx="${fcx}" cy="${fcy}" r="${outerSize / 2}" fill="${frameColor}"/>\n`
      svg += `<circle cx="${fcx}" cy="${fcy}" r="${ms * 2.5}" fill="${bgColor}"/>\n`
    } else if (fShape === 'hexagon') {
      svg += `<polygon points="${svgHexPoints(fcx, fcy, outerSize / 2)}" fill="${frameColor}"/>\n`
      svg += `<polygon points="${svgHexPoints(fcx, fcy, outerSize / 2 - ms)}" fill="${bgColor}"/>\n`
    } else if (fShape === 'leaf') {
      const r = ms * 2.2, ir = r * 0.55
      svg += `<path d="M${sx + r},${sy}L${sx + outerSize},${sy}L${sx + outerSize},${sy + outerSize - r}Q${sx + outerSize},${sy + outerSize},${sx + outerSize - r},${sy + outerSize}L${sx},${sy + outerSize}L${sx},${sy + r}Q${sx},${sy},${sx + r},${sy}Z" fill="${frameColor}"/>\n`
      svg += `<path d="M${sx + ms + ir},${sy + ms}L${sx + ms + ms * 5},${sy + ms}L${sx + ms + ms * 5},${sy + ms + ms * 5 - ir}Q${sx + ms + ms * 5},${sy + ms + ms * 5},${sx + ms + ms * 5 - ir},${sy + ms + ms * 5}L${sx + ms},${sy + ms + ms * 5}L${sx + ms},${sy + ms + ir}Q${sx + ms},${sy + ms},${sx + ms + ir},${sy + ms}Z" fill="${bgColor}"/>\n`
    } else {
      svg += `<rect x="${sx}" y="${sy}" width="${outerSize}" height="${outerSize}" rx="${fR}" fill="${frameColor}"/>\n`
      const innerR = fShape === 'rounded' ? fR * 0.65 : fShape === 'cushion' ? fR * 0.6 : 0
      svg += `<rect x="${sx + ms}" y="${sy + ms}" width="${ms * 5}" height="${ms * 5}" rx="${innerR}" fill="${bgColor}"/>\n`
    }

    // Ball
    const bx = sx + ms * 2, by = sy + ms * 2, bs = ms * 3
    const bcx = bx + bs / 2, bcy = by + bs / 2
    const bR = bShape === 'rounded' ? ms * 0.8 : bShape === 'cushion' ? ms * 1.2 : 0
    if (bShape === 'circle') {
      svg += `<circle cx="${bcx}" cy="${bcy}" r="${bs / 2}" fill="${ballColor}"/>\n`
    } else if (bShape === 'diamond') {
      const half = bs / 2
      svg += `<polygon points="${bcx},${bcy - half} ${bcx + half},${bcy} ${bcx},${bcy + half} ${bcx - half},${bcy}" fill="${ballColor}"/>\n`
    } else if (bShape === 'star') {
      const outerR = bs / 2, innerR = outerR * 0.5
      let pts = ''
      for (let i = 0; i < 8; i++) {
        const rr = i % 2 === 0 ? outerR : innerR
        const a = (Math.PI * i) / 4 - Math.PI / 2
        pts += `${bcx + rr * Math.cos(a)},${bcy + rr * Math.sin(a)} `
      }
      svg += `<polygon points="${pts.trim()}" fill="${ballColor}"/>\n`
    } else if (bShape === 'hexagon') {
      svg += `<polygon points="${svgHexPoints(bcx, bcy, bs / 2)}" fill="${ballColor}"/>\n`
    } else if (bShape === 'leaf') {
      const r = bs * 0.45
      svg += `<path d="M${bx + r},${by}L${bx + bs},${by}L${bx + bs},${by + bs - r}Q${bx + bs},${by + bs},${bx + bs - r},${by + bs}L${bx},${by + bs}L${bx},${by + r}Q${bx},${by},${bx + r},${by}Z" fill="${ballColor}"/>\n`
    } else {
      svg += `<rect x="${bx}" y="${by}" width="${bs}" height="${bs}" rx="${bR}" fill="${ballColor}"/>\n`
    }
  }

  // Logo
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    const logoW = size * logoSize
    const logoH = (logoImg.naturalHeight / logoImg.naturalWidth) * logoW
    const lx = (size - logoW) / 2, ly = (size - logoH) / 2
    const padded = logoPadding * (size / 512)
    svg += `<rect x="${lx - padded}" y="${ly - padded}" width="${logoW + padded * 2}" height="${logoH + padded * 2}" fill="${bgColor}"/>\n`
    const tc = document.createElement('canvas')
    tc.width = logoImg.naturalWidth; tc.height = logoImg.naturalHeight
    const tctx = tc.getContext('2d')
    tctx.drawImage(logoImg, 0, 0)
    if (logoColor) {
      tctx.globalCompositeOperation = 'source-in'
      tctx.fillStyle = logoColor
      tctx.fillRect(0, 0, tc.width, tc.height)
    }
    svg += `<image x="${lx}" y="${ly}" width="${logoW}" height="${logoH}" href="${tc.toDataURL('image/png')}"/>\n`
  }

  svg += `</svg>`
  return svg
}

<script>
  import { generateMatrix, renderToCanvas, renderToSVG } from './qr-render.js'

  let content = $state('https://example.com')
  let size = $state(1024)
  let errorCorrection = $state('M')
  let fgColor = $state('#000000')
  let bgColor = $state('#ffffff')
  let transparentBg = $state(false)
  let margin = $state(4)
  let shape = $state('square')
  let exportFormat = $state('png')
  let jpegQuality = $state(95)

  // Gradient
  let gradient = $state(false)
  let gradientType = $state('linear')
  let gradientColor = $state('#4b76c2')

  // Eye customization
  let eyeFrameShape = $state('square')
  let eyeBallShape = $state('square')
  let eyeColorEnabled = $state(false)
  let eyeFrameColor = $state('#000000')
  let eyeBallColor = $state('#000000')

  // Logo
  let logoFile = $state(null)
  let logoImg = $state(null)
  let logoSize = $state(20)
  let logoColor = $state('')
  let logoColorEnabled = $state(false)
  let logoPadding = $state(6)

  let panelSections = $state({ content: true, presets: true, colors: false, size: false, shapes: false, logo: false, export: true })
  let canvas = $state(null)
  let errorMsg = $state('')
  let ecWarning = $state('')

  function toggleSection(key) { panelSections[key] = !panelSections[key] }

  function getOpts() {
    return {
      size, fgColor, bgColor: transparentBg ? 'transparent' : bgColor, margin, shape,
      gradient, gradientType, gradientColor,
      eyeFrameShape, eyeBallShape,
      eyeFrameColor: eyeColorEnabled ? eyeFrameColor : '',
      eyeBallColor: eyeColorEnabled ? eyeBallColor : '',
      logoImg, logoSize: logoSize / 100,
      logoColor: logoColorEnabled ? logoColor : '',
      logoPadding,
    }
  }

  function render() {
    if (!canvas || !content.trim()) {
      if (canvas) {
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#282828'; ctx.fillRect(0, 0, size, size)
        ctx.fillStyle = '#555'; ctx.font = `${Math.max(14, size / 40)}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Enter content to generate a QR code', size / 2, size / 2)
      }
      errorMsg = ''; ecWarning = ''; return
    }
    try {
      const { matrix, actualEC } = generateMatrix(content, errorCorrection)
      ecWarning = actualEC !== errorCorrection ? `EC fell back to ${actualEC}` : ''
      errorMsg = ''
      renderToCanvas(canvas, matrix, getOpts())
    } catch (e) {
      errorMsg = 'Content too long to encode'
      ecWarning = ''
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#282828'; ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#e87d0d'
      ctx.font = `${Math.max(14, size / 40)}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Content too long to encode', size / 2, size / 2 - 10)
      ctx.fillStyle = '#888'; ctx.font = `${Math.max(11, size / 55)}px Inter, sans-serif`
      ctx.fillText('Try shorter text or lower error correction', size / 2, size / 2 + 15)
    }
  }

  $effect(() => {
    content; size; errorCorrection; fgColor; bgColor; transparentBg; margin; shape;
    gradient; gradientType; gradientColor;
    eyeFrameShape; eyeBallShape; eyeColorEnabled; eyeFrameColor; eyeBallColor;
    logoImg; logoSize; logoColor; logoColorEnabled; logoPadding;
    if (canvas) render()
  })

  function onLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    logoFile = file
    const img = new Image()
    img.onload = () => { logoImg = img }
    img.src = URL.createObjectURL(file)
  }

  function removeLogo() {
    logoFile = null; logoImg = null
    const input = document.getElementById('logo-input')
    if (input) input.value = ''
  }

  function download() {
    if (!content.trim()) return
    try {
      const { matrix } = generateMatrix(content, errorCorrection)
      const opts = getOpts()
      if (exportFormat === 'svg') {
        downloadBlob(new Blob([renderToSVG(matrix, opts)], { type: 'image/svg+xml' }), 'qrcode.svg')
      } else {
        const oc = document.createElement('canvas')
        renderToCanvas(oc, matrix, opts)
        const mime = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
        oc.toBlob(b => downloadBlob(b, `qrcode.${exportFormat}`), mime, exportFormat === 'jpeg' ? jpegQuality / 100 : undefined)
      }
    } catch (e) {}
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const ecLevels = [
    { value: 'L', label: 'Low (7%)' },
    { value: 'M', label: 'Medium (15%)' },
    { value: 'Q', label: 'Quartile (25%)' },
    { value: 'H', label: 'High (30%)' },
  ]
  const bodyShapes = [
    { value: 'square', label: 'Square' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'dots', label: 'Dots' },
    { value: 'connected', label: 'Connected' },
    { value: 'classy', label: 'Classy' },
    { value: 'classy-rounded', label: 'Classy Rounded' },
    { value: 'edge-cut', label: 'Edge Cut' },
    { value: 'diamond', label: 'Diamond' },
    { value: 'hexagon', label: 'Hexagon' },
    { value: 'star', label: 'Star' },
  ]
  const eyeFrameShapes = [
    { value: 'square', label: 'Square' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'circle', label: 'Circle' },
    { value: 'cushion', label: 'Cushion' },
    { value: 'leaf', label: 'Leaf' },
    { value: 'hexagon', label: 'Hexagon' },
  ]
  const eyeBallShapes = [
    { value: 'square', label: 'Square' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'circle', label: 'Circle' },
    { value: 'diamond', label: 'Diamond' },
    { value: 'star', label: 'Star' },
    { value: 'cushion', label: 'Cushion' },
    { value: 'leaf', label: 'Leaf' },
    { value: 'hexagon', label: 'Hexagon' },
  ]

  // Full presets: each sets ALL design settings
  const fullPresets = [
    { label: 'Classic', fg: '#000000', bg: '#ffffff', shape: 'square', eyeFrame: 'square', eyeBall: 'square', grad: false, gradType: 'linear', gradColor: '', eyeFc: '', eyeBc: '' },
    { label: 'Soft Rounded', fg: '#2d3436', bg: '#ffffff', shape: 'rounded', eyeFrame: 'rounded', eyeBall: 'rounded', grad: false, gradType: 'linear', gradColor: '', eyeFc: '', eyeBc: '' },
    { label: 'Dotty', fg: '#1a1a2e', bg: '#f5f5f5', shape: 'dots', eyeFrame: 'circle', eyeBall: 'circle', grad: false, gradType: 'linear', gradColor: '', eyeFc: '', eyeBc: '' },
    { label: 'Connected Flow', fg: '#1b1b2f', bg: '#ffffff', shape: 'connected', eyeFrame: 'rounded', eyeBall: 'rounded', grad: false, gradType: 'linear', gradColor: '', eyeFc: '', eyeBc: '' },
    { label: 'Ocean Gradient', fg: '#0077b6', bg: '#ffffff', shape: 'rounded', eyeFrame: 'cushion', eyeBall: 'circle', grad: true, gradType: 'linear', gradColor: '#00b4d8', eyeFc: '#023e8a', eyeBc: '#0096c7' },
    { label: 'Sunset', fg: '#e63946', bg: '#f1faee', shape: 'connected', eyeFrame: 'rounded', eyeBall: 'rounded', grad: true, gradType: 'linear', gradColor: '#f4a261', eyeFc: '#e63946', eyeBc: '#f4a261' },
    { label: 'Purple Haze', fg: '#6c2bd9', bg: '#faf5ff', shape: 'dots', eyeFrame: 'cushion', eyeBall: 'star', grad: true, gradType: 'radial', gradColor: '#d946ef', eyeFc: '#6c2bd9', eyeBc: '#d946ef' },
    { label: 'Emerald Hex', fg: '#065f46', bg: '#ecfdf5', shape: 'edge-cut', eyeFrame: 'hexagon', eyeBall: 'hexagon', grad: false, gradType: 'linear', gradColor: '', eyeFc: '#047857', eyeBc: '#059669' },
    { label: 'Blender', fg: '#e87d0d', bg: '#232323', shape: 'connected', eyeFrame: 'rounded', eyeBall: 'rounded', grad: false, gradType: 'linear', gradColor: '', eyeFc: '#e87d0d', eyeBc: '#ff9f43' },
    { label: 'Nature Leaf', fg: '#2d6a4f', bg: '#ffffff', shape: 'rounded', eyeFrame: 'leaf', eyeBall: 'leaf', grad: true, gradType: 'linear', gradColor: '#52b788', eyeFc: '#1b4332', eyeBc: '#40916c' },
    { label: 'Dark Diamond', fg: '#c9a227', bg: '#1a1a1a', shape: 'diamond', eyeFrame: 'square', eyeBall: 'diamond', grad: true, gradType: 'radial', gradColor: '#f0d060', eyeFc: '#c9a227', eyeBc: '#f0d060' },
    { label: 'Classy Mono', fg: '#333333', bg: '#f8f8f8', shape: 'classy', eyeFrame: 'square', eyeBall: 'square', grad: false, gradType: 'linear', gradColor: '', eyeFc: '', eyeBc: '' },
    { label: 'Inverted', fg: '#ffffff', bg: '#000000', shape: 'square', eyeFrame: 'square', eyeBall: 'square', grad: false, gradType: 'linear', gradColor: '', eyeFc: '', eyeBc: '' },
    { label: 'Cosmic', fg: '#4361ee', bg: '#0f0e17', shape: 'dots', eyeFrame: 'circle', eyeBall: 'star', grad: true, gradType: 'radial', gradColor: '#f72585', eyeFc: '#7209b7', eyeBc: '#f72585' },
  ]

  function applyPreset(p) {
    fgColor = p.fg; bgColor = p.bg; shape = p.shape
    eyeFrameShape = p.eyeFrame; eyeBallShape = p.eyeBall
    gradient = p.grad; gradientType = p.gradType; gradientColor = p.gradColor
    eyeColorEnabled = !!(p.eyeFc || p.eyeBc)
    eyeFrameColor = p.eyeFc || p.fg; eyeBallColor = p.eyeBc || p.fg
  }

  // SVG icon paths for shapes
  const shapeIcons = {
    square: 'M2,2H14V14H2Z',
    rounded: 'M5,2H11A3,3,0,0,1,14,5V11A3,3,0,0,1,11,14H5A3,3,0,0,1,2,11V5A3,3,0,0,1,5,2Z',
    dots: null,
    connected: null,
    diamond: 'M8,1L15,8L8,15L1,8Z',
    star: null,
    classy: 'M2,2H14V8H8V14H2Z M9,9H14V14H9Z',
    'classy-rounded': null,
    'edge-cut': 'M4,2H12L14,4V12L12,14H4L2,12V4Z',
    circle: null,
    cushion: 'M4,2H12A2,2,0,0,1,14,4V12A2,2,0,0,1,12,14H4A2,2,0,0,1,2,12V4A2,2,0,0,1,4,2Z',
  }
</script>

<div class="blender-app">
  <div class="header-bar">
    <div class="header-left">
      <button class="bw header-type-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z"/></svg>
        QR Generator
      </button>
      <div class="header-sep"></div>
    </div>
    <div class="header-right">
      <a class="bw icon-sq" href="https://github.com/umarbektokyo/qr" target="_blank" rel="noopener" title="GitHub">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
      </a>
    </div>
  </div>

  <div class="blender-main">
    <div class="n-panel">

      <!-- Content -->
      <div class="bp">
        <button class="bp-header" onclick={() => toggleSection('content')}>
          <svg class="bp-disc" class:open={panelSections.content} width="10" height="10" viewBox="0 0 10 10"><path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <svg class="bp-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
          Content
        </button>
        {#if panelSections.content}
        <div class="bp-body">
          <div class="field-group">
            <span class="field-label">Data / URL</span>
            <textarea class="field-textarea" rows="3" bind:value={content} placeholder="Enter URL or text..."></textarea>
          </div>
          <div class="field-group">
            <span class="field-label">Error Correction</span>
            <div class="btn-row">
              {#each ecLevels as ec}
                <button class="bw btn-sm" class:active={errorCorrection === ec.value} onclick={() => errorCorrection = ec.value} title={ec.label}>{ec.value}</button>
              {/each}
            </div>
          </div>
        </div>
        {/if}
      </div>

      <!-- Presets -->
      <div class="bp">
        <button class="bp-header" onclick={() => toggleSection('presets')}>
          <svg class="bp-disc" class:open={panelSections.presets} width="10" height="10" viewBox="0 0 10 10"><path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <svg class="bp-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 7h20M7 7v14"/></svg>
          Presets
        </button>
        {#if panelSections.presets}
        <div class="bp-body">
          <div class="preset-grid-full">
            {#each fullPresets as preset}
              <button class="preset-card" onclick={() => applyPreset(preset)} title={preset.label}>
                <span class="preset-swatch">
                  <span class="preset-swatch-bg" style="background: {preset.bg}"></span>
                  <span class="preset-swatch-fg" style="background: {preset.grad && preset.gradColor ? `linear-gradient(135deg, ${preset.fg}, ${preset.gradColor})` : preset.fg}"></span>
                </span>
                <span class="preset-card-label">{preset.label}</span>
              </button>
            {/each}
          </div>
        </div>
        {/if}
      </div>

      <!-- Colors -->
      <div class="bp">
        <button class="bp-header" onclick={() => toggleSection('colors')}>
          <svg class="bp-disc" class:open={panelSections.colors} width="10" height="10" viewBox="0 0 10 10"><path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <svg class="bp-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><circle cx="8.5" cy="15.5" r="2.5"/></svg>
          Colors
        </button>
        {#if panelSections.colors}
        <div class="bp-body">
          <div class="color-row">
            <div class="field-group color-field">
              <span class="field-label">Foreground</span>
              <div class="color-input-wrap">
                <input type="color" class="color-swatch" bind:value={fgColor} />
                <input type="text" class="field-text color-hex" bind:value={fgColor} maxlength="7" />
              </div>
            </div>
            <div class="field-group color-field">
              <span class="field-label">Background</span>
              {#if !transparentBg}
                <div class="color-input-wrap">
                  <input type="color" class="color-swatch" bind:value={bgColor} />
                  <input type="text" class="field-text color-hex" bind:value={bgColor} maxlength="7" />
                </div>
              {/if}
            </div>
          </div>
          <div class="field-group">
            <div class="checkbox-row">
              <button class="bw checkbox-btn" class:active={transparentBg} onclick={() => transparentBg = !transparentBg}>
                {#if transparentBg}<svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 3L8 2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>{/if}
              </button>
              <span class="field-label" style="text-transform: none; font-size: 11px">Transparent Background</span>
            </div>
          </div>

          <!-- Gradient -->
          <div class="field-group">
            <div class="checkbox-row">
              <button class="bw checkbox-btn" class:active={gradient} onclick={() => gradient = !gradient}>
                {#if gradient}<svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 3L8 2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>{/if}
              </button>
              <span class="field-label" style="text-transform: none; font-size: 11px">Color Gradient</span>
            </div>
          </div>
          {#if gradient}
            <div class="color-row">
              <div class="field-group color-field">
                <span class="field-label">Gradient End</span>
                <div class="color-input-wrap">
                  <input type="color" class="color-swatch" bind:value={gradientColor} />
                  <input type="text" class="field-text color-hex" bind:value={gradientColor} maxlength="7" />
                </div>
              </div>
              <div class="field-group color-field">
                <span class="field-label">Type</span>
                <div class="btn-row">
                  <button class="bw btn-sm" class:active={gradientType === 'linear'} onclick={() => gradientType = 'linear'}>Linear</button>
                  <button class="bw btn-sm" class:active={gradientType === 'radial'} onclick={() => gradientType = 'radial'}>Radial</button>
                </div>
              </div>
            </div>
          {/if}

          <!-- Eye Colors -->
          <div class="field-group">
            <div class="checkbox-row">
              <button class="bw checkbox-btn" class:active={eyeColorEnabled} onclick={() => eyeColorEnabled = !eyeColorEnabled}>
                {#if eyeColorEnabled}<svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 3L8 2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>{/if}
              </button>
              <span class="field-label" style="text-transform: none; font-size: 11px">Custom Eye Colors</span>
            </div>
          </div>
          {#if eyeColorEnabled}
            <div class="color-row">
              <div class="field-group color-field">
                <span class="field-label">Eye Frame</span>
                <div class="color-input-wrap">
                  <input type="color" class="color-swatch" bind:value={eyeFrameColor} />
                  <input type="text" class="field-text color-hex" bind:value={eyeFrameColor} maxlength="7" />
                </div>
              </div>
              <div class="field-group color-field">
                <span class="field-label">Eye Ball</span>
                <div class="color-input-wrap">
                  <input type="color" class="color-swatch" bind:value={eyeBallColor} />
                  <input type="text" class="field-text color-hex" bind:value={eyeBallColor} maxlength="7" />
                </div>
              </div>
            </div>
          {/if}
        </div>
        {/if}
      </div>

      <!-- Size & Margin -->
      <div class="bp">
        <button class="bp-header" onclick={() => toggleSection('size')}>
          <svg class="bp-disc" class:open={panelSections.size} width="10" height="10" viewBox="0 0 10 10"><path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <svg class="bp-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 3H3v18h18V3zM9 3v18M3 9h18"/></svg>
          Size & Margin
        </button>
        {#if panelSections.size}
        <div class="bp-body">
          <div class="field-group">
            <span class="field-label">Size (px)</span>
            <div class="blender-slider-wrap">
              <div class="blender-slider-track">
                <div class="blender-slider-fill" style="width: {((size - 128) / (4096 - 128)) * 100}%"></div>
                <span class="blender-slider-text">{size}</span>
              </div>
              <input type="range" class="blender-slider-input" min="128" max="4096" step="64" bind:value={size} />
            </div>
          </div>
          <div class="field-group">
            <span class="field-label">Margin (modules)</span>
            <div class="blender-slider-wrap">
              <div class="blender-slider-track">
                <div class="blender-slider-fill" style="width: {(margin / 16) * 100}%"></div>
                <span class="blender-slider-text">{margin}</span>
              </div>
              <input type="range" class="blender-slider-input" min="0" max="16" step="1" bind:value={margin} />
            </div>
          </div>
        </div>
        {/if}
      </div>

      <!-- Shapes -->
      <div class="bp">
        <button class="bp-header" onclick={() => toggleSection('shapes')}>
          <svg class="bp-disc" class:open={panelSections.shapes} width="10" height="10" viewBox="0 0 10 10"><path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <svg class="bp-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><circle cx="17.5" cy="6.5" r="3.5"/><path d="M14 14l4 7h-8z"/></svg>
          Shapes
        </button>
        {#if panelSections.shapes}
        <div class="bp-body">
          <span class="field-label">Body</span>
          <div class="shape-grid">
            {#each bodyShapes as s}
              <button class="bw btn-shape" class:active={shape === s.value} onclick={() => shape = s.value}>
                <svg width="16" height="16" viewBox="0 0 16 16">
                  {#if s.value === 'dots'}
                    <circle cx="8" cy="8" r="5.5" fill="currentColor"/>
                  {:else if s.value === 'connected'}
                    <rect x="2" y="2" width="5" height="5" rx="1.5" fill="currentColor"/>
                    <rect x="7" y="2" width="7" height="5" rx="1.5" fill="currentColor"/>
                    <rect x="2" y="7" width="5" height="7" rx="1.5" fill="currentColor"/>
                    <rect x="9" y="9" width="5" height="5" rx="1.5" fill="currentColor"/>
                  {:else if s.value === 'hexagon'}
                    <polygon points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5" fill="currentColor"/>
                  {:else if s.value === 'star'}
                    <polygon points="8,1 9.8,5.8 15,6 11,9.5 12.5,15 8,11.5 3.5,15 5,9.5 1,6 6.2,5.8" fill="currentColor"/>
                  {:else if s.value === 'classy-rounded'}
                    <circle cx="5.5" cy="5.5" r="4" fill="currentColor"/>
                    <circle cx="10.5" cy="10.5" r="4" fill="currentColor"/>
                  {:else if shapeIcons[s.value]}
                    <path d={shapeIcons[s.value]} fill="currentColor" fill-rule="evenodd"/>
                  {:else}
                    <rect x="3" y="3" width="10" height="10" fill="currentColor"/>
                  {/if}
                </svg>
                {s.label}
              </button>
            {/each}
          </div>

          <span class="field-label" style="margin-top: 6px">Eye Frame</span>
          <div class="shape-grid">
            {#each eyeFrameShapes as s}
              <button class="bw btn-shape" class:active={eyeFrameShape === s.value} onclick={() => eyeFrameShape = s.value}>
                <svg width="14" height="14" viewBox="0 0 16 16">
                  {#if s.value === 'circle'}
                    <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="2.5"/>
                  {:else if s.value === 'leaf'}
                    <path d="M5,1H15V11Q15,15,11,15H1V5Q1,1,5,1Z" fill="none" stroke="currentColor" stroke-width="2"/>
                  {:else if s.value === 'hexagon'}
                    <polygon points="8,1 14.5,4.5 14.5,11.5 8,15 1.5,11.5 1.5,4.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
                  {:else if s.value === 'cushion'}
                    <rect x="1" y="1" width="14" height="14" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>
                  {:else if s.value === 'rounded'}
                    <rect x="1" y="1" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
                  {:else}
                    <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"/>
                  {/if}
                </svg>
                {s.label}
              </button>
            {/each}
          </div>

          <span class="field-label" style="margin-top: 6px">Eye Ball</span>
          <div class="shape-grid">
            {#each eyeBallShapes as s}
              <button class="bw btn-shape" class:active={eyeBallShape === s.value} onclick={() => eyeBallShape = s.value}>
                <svg width="14" height="14" viewBox="0 0 16 16">
                  {#if s.value === 'circle'}
                    <circle cx="8" cy="8" r="5.5" fill="currentColor"/>
                  {:else if s.value === 'star'}
                    <polygon points="8,2 9.5,6 14,6.5 10.5,9.5 11.5,14 8,11 4.5,14 5.5,9.5 2,6.5 6.5,6" fill="currentColor"/>
                  {:else if s.value === 'diamond'}
                    <polygon points="8,1 15,8 8,15 1,8" fill="currentColor"/>
                  {:else if s.value === 'leaf'}
                    <path d="M5,2H14V11Q14,14,11,14H2V5Q2,2,5,2Z" fill="currentColor"/>
                  {:else if s.value === 'hexagon'}
                    <polygon points="8,1 14.5,4.5 14.5,11.5 8,15 1.5,11.5 1.5,4.5" fill="currentColor"/>
                  {:else if shapeIcons[s.value]}
                    <path d={shapeIcons[s.value]} fill="currentColor"/>
                  {:else}
                    <rect x="2" y="2" width="12" height="12" fill="currentColor"/>
                  {/if}
                </svg>
                {s.label}
              </button>
            {/each}
          </div>
        </div>
        {/if}
      </div>

      <!-- Logo -->
      <div class="bp">
        <button class="bp-header" onclick={() => toggleSection('logo')}>
          <svg class="bp-disc" class:open={panelSections.logo} width="10" height="10" viewBox="0 0 10 10"><path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <svg class="bp-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          Logo
        </button>
        {#if panelSections.logo}
        <div class="bp-body">
          <div class="field-group">
            <div class="logo-upload-row">
              <label class="bw btn-upload">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                {logoFile ? logoFile.name : 'Upload Logo'}
                <input id="logo-input" type="file" accept="image/*" onchange={onLogoUpload} hidden />
              </label>
              {#if logoImg}
                <button class="bw icon-sq" onclick={removeLogo} title="Remove logo">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              {/if}
            </div>
          </div>
          {#if logoImg}
            <div class="field-group">
              <span class="field-label">Logo Size (%)</span>
              <div class="blender-slider-wrap">
                <div class="blender-slider-track">
                  <div class="blender-slider-fill" style="width: {((logoSize - 5) / 40) * 100}%"></div>
                  <span class="blender-slider-text">{logoSize}%</span>
                </div>
                <input type="range" class="blender-slider-input" min="5" max="45" step="1" bind:value={logoSize} />
              </div>
            </div>
            <div class="field-group">
              <span class="field-label">Logo Padding (px)</span>
              <div class="blender-slider-wrap">
                <div class="blender-slider-track">
                  <div class="blender-slider-fill" style="width: {(logoPadding / 20) * 100}%"></div>
                  <span class="blender-slider-text">{logoPadding}</span>
                </div>
                <input type="range" class="blender-slider-input" min="0" max="20" step="1" bind:value={logoPadding} />
              </div>
            </div>
            <div class="field-group">
              <div class="checkbox-row">
                <button class="bw checkbox-btn" class:active={logoColorEnabled} onclick={() => logoColorEnabled = !logoColorEnabled}>
                  {#if logoColorEnabled}<svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 3L8 2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>{/if}
                </button>
                <span class="field-label" style="text-transform: none; font-size: 11px">Mono-color</span>
                {#if logoColorEnabled}
                  <input type="color" class="color-swatch" bind:value={logoColor} />
                  <input type="text" class="field-text color-hex" bind:value={logoColor} maxlength="7" style="width: 60px" />
                {/if}
              </div>
            </div>
          {/if}
        </div>
        {/if}
      </div>

      <!-- Export -->
      <div class="bp">
        <button class="bp-header" onclick={() => toggleSection('export')}>
          <svg class="bp-disc" class:open={panelSections.export} width="10" height="10" viewBox="0 0 10 10"><path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <svg class="bp-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Export
        </button>
        {#if panelSections.export}
        <div class="bp-body">
          <div class="field-group">
            <span class="field-label">Format</span>
            <div class="btn-row">
              <button class="bw btn-sm" class:active={exportFormat === 'png'} onclick={() => exportFormat = 'png'}>PNG</button>
              <button class="bw btn-sm" class:active={exportFormat === 'jpeg'} onclick={() => exportFormat = 'jpeg'} disabled={transparentBg}>JPEG</button>
              <button class="bw btn-sm" class:active={exportFormat === 'svg'} onclick={() => exportFormat = 'svg'}>SVG</button>
            </div>
          </div>
          {#if exportFormat === 'jpeg'}
            <div class="field-group">
              <span class="field-label">Quality</span>
              <div class="blender-slider-wrap">
                <div class="blender-slider-track">
                  <div class="blender-slider-fill" style="width: {jpegQuality}%"></div>
                  <span class="blender-slider-text">{jpegQuality}%</span>
                </div>
                <input type="range" class="blender-slider-input" min="10" max="100" step="5" bind:value={jpegQuality} />
              </div>
            </div>
          {/if}
          <button class="bw btn-action" onclick={download}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download {exportFormat.toUpperCase()}
          </button>
          <div class="prop-grid" style="margin-top: 6px">
            <span class="prop-label">Output</span>
            <span class="prop-value num">{size} x {size} px</span>
            <span class="prop-label">EC Level</span>
            <span class="prop-value">{ecLevels.find(e => e.value === errorCorrection)?.label}</span>
            <span class="prop-label">Body</span>
            <span class="prop-value">{bodyShapes.find(s => s.value === shape)?.label}</span>
            <span class="prop-label">Eye</span>
            <span class="prop-value">{eyeFrameShapes.find(s => s.value === eyeFrameShape)?.label} / {eyeBallShapes.find(s => s.value === eyeBallShape)?.label}</span>
          </div>
        </div>
        {/if}
      </div>

    </div>

    <div class="region-handle"></div>

    <!-- Preview -->
    <div class="preview-area">
      <div class="checker-bg">
        <canvas bind:this={canvas} class="qr-canvas"></canvas>
      </div>
    </div>
  </div>

  <div class="status-bar">
    <div class="status-left">
      <span class="status-item">{content.length} chars</span>
      <span class="status-sep">|</span>
      <span class="status-item">{size}x{size}</span>
      <span class="status-sep">|</span>
      <span class="status-item">EC: {errorCorrection}</span>
      <span class="status-sep">|</span>
      <span class="status-item">{shape}</span>
      {#if gradient}<span class="status-sep">|</span><span class="status-item">Gradient</span>{/if}
      {#if logoImg}<span class="status-sep">|</span><span class="status-item">Logo: {logoSize}%</span>{/if}
      {#if ecWarning}<span class="status-sep">|</span><span class="status-item status-warn">{ecWarning}</span>{/if}
      {#if errorMsg}<span class="status-sep">|</span><span class="status-item status-err">{errorMsg}</span>{/if}
    </div>
    <div class="status-right">
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  :global(*) { margin: 0; padding: 0; box-sizing: border-box; }
  :global(body) {
    background: #232323; color: #e6e6e6;
    font-family: 'Inter', sans-serif; font-size: 11px; line-height: 1.35;
    overflow: hidden; height: 100vh;
    -webkit-font-smoothing: antialiased;
  }
  :global(#app) { height: 100vh; }
  :global(::selection) { background: #4772b3; color: #fff; }
  :global(::-webkit-scrollbar) { width: 6px; height: 6px; }
  :global(::-webkit-scrollbar-track) { background: transparent; }
  :global(::-webkit-scrollbar-thumb) { background: #555; border-radius: 3px; }
  :global(::-webkit-scrollbar-thumb:hover) { background: #666; }

  :global(.bw) {
    font-family: 'Inter', sans-serif; font-size: 11px;
    background: #545454; border: none; border-radius: 6px;
    color: #e6e6e6; cursor: pointer; outline: none;
    box-shadow: 0 1px 0 0 #2a2a2a, inset 0 1px 0 0 #666;
    transition: background 0.08s;
  }
  :global(.bw:hover) { background: #606060; }
  :global(.bw:active) { background: #4a4a4a; box-shadow: 0 1px 0 0 #2a2a2a, inset 0 1px 2px 0 #333; }
  :global(.bw:disabled) { opacity: 0.3; cursor: default; pointer-events: none; }
  :global(.bw.active) { background: #4b76c2; box-shadow: 0 1px 0 0 #2a2a2a, inset 0 1px 0 0 #6b96e2; color: #fff; }

  .blender-app { height: 100vh; display: flex; flex-direction: column; }

  .header-bar {
    height: 30px; background: #303030; border-bottom: 1px solid #1a1a1a;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 6px; flex-shrink: 0; gap: 6px;
  }
  .header-left, .header-right { display: flex; align-items: center; gap: 3px; }
  .header-left { flex: 1; min-width: 0; }
  .header-right { flex-shrink: 0; }
  .header-type-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 3px 8px 3px 6px; font-size: 11px; font-weight: 500;
    height: 22px; white-space: nowrap; text-decoration: none;
  }
  .header-sep { width: 1px; height: 14px; background: #444; margin: 0 3px; flex-shrink: 0; }
  .icon-sq {
    width: 22px; height: 22px; display: flex; align-items: center;
    justify-content: center; padding: 0; text-decoration: none;
  }

  .blender-main { flex: 1; display: flex; overflow: hidden; }
  .n-panel { width: 280px; background: #303030; overflow-y: auto; flex-shrink: 0; }
  .region-handle { width: 3px; background: #1a1a1a; cursor: col-resize; flex-shrink: 0; }
  .region-handle:hover { background: #4b76c2; }

  .bp { border-bottom: 1px solid #222; }
  .bp-header {
    display: flex; align-items: center; gap: 5px; width: 100%;
    padding: 5px 8px; background: #383838; border: none;
    color: #ccc; cursor: pointer; font-family: 'Inter', sans-serif;
    font-size: 11px; font-weight: 500; text-align: left;
    border-bottom: 1px solid #2a2a2a; border-top: 1px solid #444;
  }
  .bp-header:hover { background: #404040; }
  .bp-disc { color: #999; transition: transform 0.12s; flex-shrink: 0; }
  .bp-disc.open { transform: rotate(90deg); }
  .bp-icon { color: #999; flex-shrink: 0; }
  .bp-body { padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 8px; }

  .field-group { display: flex; flex-direction: column; gap: 3px; }
  .field-label { color: #888; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }

  .field-textarea {
    background: #1e1e1e; border: none; border-radius: 6px;
    color: #ddd; font-family: 'Inter', sans-serif; font-size: 11px;
    padding: 6px 8px; resize: vertical; outline: none;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.4); min-height: 50px;
  }
  .field-textarea:focus { box-shadow: inset 0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px #4b76c2; }

  .field-text {
    background: #1e1e1e; border: none; border-radius: 6px;
    color: #ddd; font-family: 'Inter', sans-serif; font-size: 11px;
    padding: 4px 8px; outline: none; height: 22px;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
  }
  .field-text:focus { box-shadow: inset 0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px #4b76c2; }

  .blender-slider-wrap { position: relative; height: 22px; }
  .blender-slider-track {
    position: absolute; inset: 0;
    background: #1e1e1e; border-radius: 6px;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
    overflow: hidden; pointer-events: none;
    display: flex; align-items: center;
  }
  .blender-slider-fill {
    position: absolute; left: 0; top: 0; bottom: 0;
    background: #4b6fa0; border-radius: 6px 0 0 6px;
    transition: width 0.05s;
  }
  .blender-slider-text {
    position: relative; z-index: 1; width: 100%; text-align: center;
    color: #e6e6e6; font-size: 11px; font-variant-numeric: tabular-nums;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  }
  .blender-slider-input {
    position: absolute; inset: 0; width: 100%; height: 100%;
    opacity: 0; cursor: ew-resize; margin: 0;
  }

  .btn-row { display: flex; gap: 2px; }
  .btn-sm { padding: 3px 10px; font-size: 11px; height: 22px; flex: 1; text-align: center; }

  .shape-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
  .btn-shape {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 8px; font-size: 11px; height: 26px;
  }

  .color-row { display: flex; gap: 8px; }
  .color-field { flex: 1; }
  .color-input-wrap { display: flex; align-items: center; gap: 4px; }
  .color-swatch {
    -webkit-appearance: none; appearance: none;
    width: 22px; height: 22px; border: none; border-radius: 4px;
    cursor: pointer; padding: 0; background: none;
    box-shadow: 0 1px 0 0 #2a2a2a, inset 0 1px 0 0 #666;
  }
  .color-swatch::-webkit-color-swatch-wrapper { padding: 1px; }
  .color-swatch::-webkit-color-swatch { border: none; border-radius: 3px; }
  .color-hex { width: 70px; font-size: 10px; font-family: 'Inter', monospace; }

  .preset-grid-full { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
  .preset-card {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 6px; background: #404040; border: none; border-radius: 5px;
    color: #bbb; cursor: pointer; font-family: 'Inter', sans-serif;
    font-size: 10px; text-align: left; transition: background 0.08s;
  }
  .preset-card:hover { background: #4a4a4a; color: #ddd; }
  .preset-swatch {
    width: 20px; height: 20px; border-radius: 4px; flex-shrink: 0;
    position: relative; overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
  }
  .preset-swatch-bg {
    position: absolute; inset: 0;
  }
  .preset-swatch-fg {
    position: absolute; inset: 3px;
    border-radius: 2px;
  }
  .preset-card-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .btn-action {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 6px 12px; font-size: 11px; font-weight: 500; height: 28px; width: 100%;
    background: #4b76c2; box-shadow: 0 1px 0 0 #2a2a2a, inset 0 1px 0 0 #6b96e2; color: #fff;
  }
  .btn-action:hover { background: #5a85d1; }
  .btn-action:active { background: #3d65a8; }

  .btn-upload {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px; font-size: 11px; height: 24px; flex: 1; cursor: pointer;
    justify-content: center;
  }
  .logo-upload-row { display: flex; gap: 4px; align-items: center; }

  .checkbox-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .checkbox-btn {
    width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;
    padding: 0; border-radius: 3px; flex-shrink: 0;
  }

  .prop-grid { display: grid; grid-template-columns: auto 1fr; gap: 3px 8px; align-items: baseline; }
  .prop-label { color: #888; font-size: 10px; white-space: nowrap; }
  .prop-value { color: #ccc; font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .prop-value.num { font-variant-numeric: tabular-nums; color: #7ab0e0; }

  .preview-area {
    flex: 1; display: flex; align-items: center; justify-content: center;
    overflow: hidden; min-width: 0;
    background-image:
      linear-gradient(45deg, #2a2a2a 25%, transparent 25%),
      linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #2a2a2a 75%),
      linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    background-color: #333;
  }
  .checker-bg {
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .qr-canvas {
    max-width: calc(100% - 40px);
    max-height: calc(100% - 40px);
    image-rendering: auto;
    border-radius: 2px;
  }

  .status-bar {
    height: 20px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 8px; background: #2b2b2b; border-top: 1px solid #1a1a1a;
    flex-shrink: 0; font-size: 10px; color: #777;
  }
  .status-left, .status-right { display: flex; align-items: center; gap: 4px; }
  .status-sep { color: #444; }
  .status-warn { color: #e8a33d; }
  .status-err { color: #e85050; }

  /* Mobile responsive */
  @media (max-width: 700px) {
    .blender-main { flex-direction: column; }
    .n-panel { width: 100%; max-height: 45vh; overflow-y: auto; flex-shrink: 0; }
    .region-handle { width: 100%; height: 3px; cursor: ns-resize; }
    .preview-area { min-height: 40vh; }
    .checker-bg { padding: 16px; }
    .qr-canvas {
      max-width: calc(100vw - 40px);
      max-height: calc(55vh - 80px);
    }
    .status-bar { flex-wrap: wrap; height: auto; min-height: 20px; padding: 2px 8px; }
    .status-left { flex-wrap: wrap; }
  }
</style>

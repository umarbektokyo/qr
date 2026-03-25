# QR Generator

A customizable QR code generator with a Blender-inspired dark UI. Built with Svelte 5 and Go.

QR codes are generated entirely client-side for instant preview with zero network latency. The Go backend serves only static files.

## Features

**Content**
- Encode any URL or text
- Error correction levels: L (7%), M (15%), Q (25%), H (30%)
- Auto-fallback to lower EC when content is too long

**Colors**
- Foreground and background color pickers
- Transparent background support
- Linear and radial color gradients
- Custom eye frame and eye ball colors
- 14 ready-to-use presets (Classic, Ocean Gradient, Blender, Cosmic, etc.)

**Shapes**
- 10 body shapes: Square, Rounded, Dots, Connected, Classy, Classy Rounded, Edge Cut, Diamond, Hexagon, Star
- 6 eye frame shapes: Square, Rounded, Circle, Cushion, Leaf, Hexagon
- 8 eye ball shapes: Square, Rounded, Circle, Diamond, Star, Cushion, Leaf, Hexagon

**Logo**
- Upload a logo image (PNG, JPG, SVG, etc.)
- Adjustable logo size and padding
- Mono-color tinting

**Export**
- PNG (with transparency support)
- JPEG (with quality slider)
- SVG (vector, fully scalable)
- Resolution up to 4096x4096px

## Quick Start

```bash
# Install dependencies and build
make build

# Run the server
./qr-server
# Open http://localhost:8080
```

## Development

```bash
# Install frontend dependencies
cd frontend && npm install

# Run backend and frontend dev server concurrently
make dev
# Backend: http://localhost:8080
# Frontend (hot reload): http://localhost:5173
```

## Run Tests

```bash
make test
```

## Project Structure

```
qr/
├── backend/
│   ├── main.go            # Go static file server
│   └── main_test.go       # Server tests
├── frontend/
│   ├── src/
│   │   ├── App.svelte     # Main UI (Blender-style)
│   │   ├── qr-render.js   # QR matrix generation & canvas/SVG rendering
│   │   └── main.js        # Svelte mount
│   ├── public/
│   │   └── qr-icon.svg    # Favicon
│   ├── index.html
│   ├── vite.config.js
│   └── svelte.config.js
├── Makefile
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Tech Stack

- **Frontend**: Svelte 5, Vite, [qrcode-generator](https://github.com/nickymarino/qrcode-generator) (15KB, zero deps)
- **Backend**: Go (standard library only, zero external deps)
- **UI**: Blender-inspired dark theme with Inter typeface, beveled widgets, disclosure panels

## Docker

```bash
# Using docker compose
docker compose up

# Or build and run manually
docker build -t qr-generator .
docker run -p 8080:8080 qr-generator
```

## License

MIT

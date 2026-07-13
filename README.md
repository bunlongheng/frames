# Frames - Device Mockup Generator

Generate device mockups by uploading a screenshot and wrapping it in a realistic device frame. iPhone, iPad, MacBook, and more.

Drop, paste, or pick a screenshot and Frames composites it into an Apple device frame right in the browser, then exports WEBP/PNG or copies to the clipboard. A matching `POST /api/frame` endpoint does the same server-side for programmatic use.

## Getting Started

Requires Node.js 20+.

```bash
git clone https://github.com/bunlongheng/frames.git
cd frames
npm install
npm run dev        # http://localhost:3000
```

Then drop a screenshot onto the page (or press Cmd/Ctrl+V to paste one), pick a device, and export.

Deploy anywhere that runs Next.js. On Vercel it works with zero configuration - no environment variables are required.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.10 |
| UI | React 19.2.4, TypeScript, Tailwind CSS 4 |
| Image Processing | Canvas 2D (client-side), Sharp (API route) |
| Database | None -- stateless image generation |
| Port | Assigned by local-apps |

## Architecture

```
Browser (app/page.tsx, client)
  |
  v
[Drop / paste / pick screenshot] ---> [Pick a device frame]
  |
  v
[Canvas 2D composites screenshot + frame PNG in the browser]
  |
  v
[Export WEBP / PNG / Copy to clipboard]

POST /api/frame (app/api/frame/route.ts, server)
  -> Sharp composites the same frames for programmatic/API callers
```

- Client-side compositing on an HTML canvas for instant, offline preview and export
- A matching server-side Sharp pipeline exposed as `POST /api/frame` for API callers
- Stateless design -- no database, no persistence
- Multiple device templates with accurate bezels and screen dimensions

## Features

- Generate device mockups (iPhone, iPad, MacBook, iMac, Studio Display)
- Drop, paste (Cmd/Ctrl+V), or pick a screenshot to frame it
- 1 image -> single device; 3-4 images -> advertisement layout
- Selectable backgrounds (solid, gradient, transparent)
- Export WEBP / PNG, or copy straight to the clipboard (Cmd/Ctrl+S saves WEBP)
- `POST /api/frame` HTTP endpoint for programmatic framing (see the in-app API panel)

## Project Structure

```
frames/
  app/
    page.tsx            # Client UI + canvas compositing + export
    layout.tsx          # Root layout / metadata
    globals.css         # Tailwind + base styles
    api/frame/route.ts  # Sharp-based framing API
  public/
    assets/frames/      # Device frame PNGs
    assets/icons/       # Device picker icons
  next.config.ts        # Next.js configuration
  vercel.json           # Deploy config (skips CI on chore/docs commits)
```

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |

## Environment Variables

None required. Frames is fully self-contained.

---

Built by [Bunlong Heng](https://www.bunlongheng.com) | [GitHub](https://github.com/bunlongheng/frames)

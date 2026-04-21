# Frames - Device Mockup Generator

Generate device mockups by uploading a screenshot and wrapping it in a realistic device frame. iPhone, iPad, MacBook, and more.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.4 |
| UI | React 19.2.4, TypeScript, Tailwind CSS |
| Image Processing | Sharp (server-side), html2canvas (client-side) |
| Database | None -- stateless image generation |
| Port | Assigned by local-apps |

## Architecture

```
Browser
  |
  v
[Upload Screenshot] ---> [Select Device Template]
  |                              |
  v                              v
[Sharp composites image     [html2canvas captures
 server-side]                client-side preview]
  |
  v
[Export PNG]
```

- Server-side image compositing via Sharp for high-quality output
- Client-side HTML-to-canvas capture for instant preview
- Stateless design -- no database, no persistence
- Multiple device templates with accurate bezels and dimensions

## Features

- Generate device mockups (iPhone, iPad, MacBook, etc.)
- Upload any screenshot and wrap it in a device frame
- Server-side image compositing with Sharp for production-quality output
- Client-side HTML-to-canvas capture for real-time preview
- Multiple device templates with accurate dimensions
- Export as PNG

## Project Structure

```
frames/
  src/
    app/             # Next.js App Router pages
    components/      # React components (device frames, upload UI)
    lib/             # Image processing utilities
  public/
    templates/       # Device frame templates
  next.config.ts     # Next.js configuration
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

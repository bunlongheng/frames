"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";


/* ── Types ──────────────────────────────────────────────────────────────────── */

type DeviceType = "iphone" | "ipad-portrait" | "ipad-landscape" | "macbook" | "imac" | "studio-display" | "studio-mini" | "tv-bamboo" | "tv-dark-panel" | "tv-gallery" | "tv-beige" | "tv-theater" | "tv-walnut" | "tv-colorful" | "tv-frame-art" | "tv-teal";

interface FrameImage {
    id: string;
    dataUrl: string;
    width: number;
    height: number;
    device: DeviceType;
    composited?: string;
}

/* ── Device frame metadata ──────────────────────────────────────────────────── */

interface FrameMeta {
    label: string;
    group: string;
    file: string;
    frameDimensions: { width: number; height: number };
    screenOffset: { x: number; y: number };
    screenWidth: number;
    screenHeight: number;
    displayHeight: number;
    isPhoto?: boolean; // TV setups — draw room photo first, then screenshot on top
    isCombo?: boolean; // Studio Display + Mac Mini combo
}

const FRAME_META: Record<DeviceType, FrameMeta> = {
    iphone: {
        label: "iPhone 17 Pro Max",
        group: "Apple",
        file: "/assets/frames/iphone.png",
        frameDimensions: { width: 1470, height: 3000 },
        screenOffset: { x: 75, y: 217 },
        screenWidth: 1320,
        screenHeight: 2717,
        displayHeight: 420,
    },
    "ipad-portrait": {
        label: "iPad Pro Portrait",
        group: "Apple",
        file: "/assets/frames/ipad-portrait.png",
        frameDimensions: { width: 2245, height: 2930 },
        screenOffset: { x: 96, y: 102 },
        screenWidth: 2048,
        screenHeight: 2732,
        displayHeight: 380,
    },
    "ipad-landscape": {
        label: "iPad Pro Landscape",
        group: "Apple",
        file: "/assets/frames/ipad-landscape.png",
        frameDimensions: { width: 2930, height: 2245 },
        screenOffset: { x: 102, y: 101 },
        screenWidth: 2732,
        screenHeight: 2048,
        displayHeight: 320,
    },
    macbook: {
        label: "MacBook Air",
        group: "Apple",
        file: "/assets/frames/macbook.png",
        frameDimensions: { width: 3306, height: 1897 },
        screenOffset: { x: 373, y: 123 },
        screenWidth: 2560,
        screenHeight: 1600,
        displayHeight: 320,
    },
    imac: {
        label: "iMac 24″",
        group: "Apple",
        file: "/assets/frames/imac.png",
        frameDimensions: { width: 4880, height: 5720 },
        screenOffset: { x: 200, y: 1600 },
        screenWidth: 4480,
        screenHeight: 2520,
        displayHeight: 380,
    },
    "studio-display": {
        label: "Studio Display",
        group: "Apple",
        file: "/assets/frames/apple-display.png",
        frameDimensions: { width: 5520, height: 4316 },
        screenOffset: { x: 200, y: 200 },
        screenWidth: 5120,
        screenHeight: 2880,
        displayHeight: 360,
    },
    "studio-mini": {
        label: "Studio Display + Mac Mini",
        group: "Apple",
        file: "/assets/frames/apple-display.png",
        frameDimensions: { width: 5520, height: 4316 },
        screenOffset: { x: 200, y: 200 },
        screenWidth: 5120,
        screenHeight: 2880,
        displayHeight: 360,
        isCombo: true,
    },
    "tv-bamboo": {
        label: "Bamboo",
        group: "TV",
        file: "/assets/frames/tv-bamboo.jpg",
        frameDimensions: { width: 225, height: 225 },
        screenOffset: { x: 40, y: 70 },
        screenWidth: 145,
        screenHeight: 80,
        displayHeight: 340,
        isPhoto: true,
    },
    "tv-dark-panel": {
        label: "Dark Panel",
        group: "TV",
        file: "/assets/frames/tv-dark-panel.jpg",
        frameDimensions: { width: 295, height: 171 },
        screenOffset: { x: 70, y: 35 },
        screenWidth: 160,
        screenHeight: 95,
        displayHeight: 340,
        isPhoto: true,
    },
    "tv-gallery": {
        label: "Gallery",
        group: "TV",
        file: "/assets/frames/tv-gallery.jpg",
        frameDimensions: { width: 192, height: 108 },
        screenOffset: { x: 50, y: 25 },
        screenWidth: 95,
        screenHeight: 55,
        displayHeight: 340,
        isPhoto: true,
    },
    "tv-beige": {
        label: "Beige",
        group: "TV",
        file: "/assets/frames/tv-beige.jpg",
        frameDimensions: { width: 225, height: 225 },
        screenOffset: { x: 45, y: 80 },
        screenWidth: 135,
        screenHeight: 85,
        displayHeight: 340,
        isPhoto: true,
    },
    "tv-theater": {
        label: "Theater",
        group: "TV",
        file: "/assets/frames/tv-theater.jpg",
        frameDimensions: { width: 311, height: 162 },
        screenOffset: { x: 75, y: 30 },
        screenWidth: 170,
        screenHeight: 90,
        displayHeight: 340,
        isPhoto: true,
    },
    "tv-walnut": {
        label: "Walnut",
        group: "TV",
        file: "/assets/frames/tv-walnut.jpg",
        frameDimensions: { width: 225, height: 225 },
        screenOffset: { x: 40, y: 85 },
        screenWidth: 140,
        screenHeight: 85,
        displayHeight: 340,
        isPhoto: true,
    },
    "tv-colorful": {
        label: "Colorful",
        group: "TV",
        file: "/assets/frames/tv-colorful.jpg",
        frameDimensions: { width: 318, height: 159 },
        screenOffset: { x: 70, y: 25 },
        screenWidth: 180,
        screenHeight: 95,
        displayHeight: 340,
        isPhoto: true,
    },
    "tv-frame-art": {
        label: "Frame Art",
        group: "TV",
        file: "/assets/frames/tv-frame-art.webp",
        frameDimensions: { width: 1000, height: 666 },
        screenOffset: { x: 280, y: 120 },
        screenWidth: 450,
        screenHeight: 260,
        displayHeight: 340,
        isPhoto: true,
    },
    "tv-teal": {
        label: "Teal",
        group: "TV",
        file: "/assets/frames/tv-teal.webp",
        frameDimensions: { width: 720, height: 405 },
        screenOffset: { x: 160, y: 110 },
        screenWidth: 400,
        screenHeight: 180,
        displayHeight: 340,
        isPhoto: true,
    },
};

const DEVICE_GROUPS = [
    { group: "Apple", devices: ["iphone", "ipad-portrait", "ipad-landscape", "macbook", "imac", "studio-display"] as DeviceType[] },
    // TV behind beta — uncomment when hi-res images available
    // { group: "TV (Beta)", devices: ["tv-bamboo", "tv-dark-panel", "tv-gallery", "tv-beige", "tv-theater", "tv-walnut", "tv-colorful", "tv-frame-art", "tv-teal"] as DeviceType[] },
];

function detectDevice(w: number, h: number): DeviceType {
    const ratio = h / w;
    if (ratio > 1.5) return "iphone";
    if (ratio > 1.0) return "ipad-portrait";
    return "macbook";
}

/* ── Canvas compositing ─────────────────────────────────────────────────────── */

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Average color of an image (1x1 downscale) - used to blend letterbox bars.
function averageColor(img: HTMLImageElement): string {
    try {
        const c = document.createElement("canvas");
        c.width = 1; c.height = 1;
        const cx = c.getContext("2d")!;
        cx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = cx.getImageData(0, 0, 1, 1).data;
        return `rgb(${r},${g},${b})`;
    } catch {
        return "#000";
    }
}

async function compositeFrame(screenshotDataUrl: string, device: DeviceType): Promise<string> {
    const meta = FRAME_META[device];
    const toLoad: Promise<HTMLImageElement>[] = [
        loadImage(screenshotDataUrl),
        loadImage(meta.file),
    ];
    if (meta.isCombo) toLoad.push(loadImage("/assets/frames/mac-mini.png"));
    const [screenshot, frame, macMini] = await Promise.all(toLoad);

    // For combo, extend canvas width to fit Mac Mini beside the display
    const extraW = meta.isCombo ? 1200 : 0;
    const canvas = document.createElement("canvas");
    canvas.width = meta.frameDimensions.width + extraW;
    canvas.height = meta.frameDimensions.height;
    const ctx = canvas.getContext("2d")!;

    // Contain-fit: show the whole screenshot (nothing cropped), centered on the
    // screen. Fill the leftover letterbox with the screenshot's average color so
    // the bars blend in instead of showing a hard edge.
    const screenAspect = meta.screenWidth / meta.screenHeight;
    const imgAspect = screenshot.naturalWidth / screenshot.naturalHeight;
    let dw = meta.screenWidth, dh = meta.screenHeight;
    let dx = meta.screenOffset.x, dy = meta.screenOffset.y;
    if (imgAspect > screenAspect) {
        // Wider than screen - full width, letterbox top/bottom
        dh = meta.screenWidth / imgAspect;
        dy = meta.screenOffset.y + (meta.screenHeight - dh) / 2;
    } else {
        // Taller than screen - full height, letterbox sides
        dw = meta.screenHeight * imgAspect;
        dx = meta.screenOffset.x + (meta.screenWidth - dw) / 2;
    }
    const fillScreen = () => {
        ctx.fillStyle = averageColor(screenshot);
        ctx.fillRect(meta.screenOffset.x, meta.screenOffset.y, meta.screenWidth, meta.screenHeight);
    };

    if (meta.isPhoto) {
        ctx.drawImage(frame, 0, 0);
        fillScreen();
        ctx.drawImage(screenshot, dx, dy, dw, dh);
    } else {
        fillScreen();
        ctx.drawImage(screenshot, dx, dy, dw, dh);
        ctx.drawImage(frame, 0, 0);
    }

    // Draw Mac Mini for combo
    if (meta.isCombo && macMini) {
        const miniSize = 900;
        const miniX = meta.frameDimensions.width + 100;
        const miniY = meta.frameDimensions.height - miniSize - 200;
        ctx.drawImage(macMini, miniX, miniY, miniSize, miniSize);
    }

    return canvas.toDataURL("image/png");
}

/* ── Full-resolution export ─────────────────────────────────────────────────── */

function fillBackground(ctx: CanvasRenderingContext2D, bg: string, w: number, h: number) {
    if (bg === "transparent") return;
    if (bg.startsWith("linear-gradient")) {
        const stops = bg.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) || [];
        const grad = ctx.createLinearGradient(0, 0, w, h); // ~135deg: top-left -> bottom-right
        const first = stops[0], last = stops[stops.length - 1];
        if (first && last) {
            grad.addColorStop(0, first);
            grad.addColorStop(1, last);
        }
        ctx.fillStyle = grad;
    } else {
        ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, w, h);
}

// Draw the composited frames onto a single canvas at native resolution (no DOM raster).
async function renderExportCanvas(images: FrameImage[], bg: string): Promise<HTMLCanvasElement> {
    const loaded = await Promise.all(images.map(i => loadImage(i.composited || i.dataUrl)));
    const n = images.length;
    const CSS_PAD = 48;
    const CSS_GAP = n === 1 ? 0 : 32;
    const CSS_LABEL = 20; // label row height under each frame (matches preview marginTop + text)

    // Per-frame CSS display size - height fixed to displayHeight, width from the
    // composited image's real aspect ratio (mirrors the preview layout).
    const frames = images.map((img, k) => {
        const el = loaded[k];
        const h = FRAME_META[img.device].displayHeight;
        const w = h * (el.naturalWidth / el.naturalHeight);
        return { el, w, h, device: img.device };
    });
    const maxH = Math.max(...frames.map(f => f.h));
    const contentW = frames.reduce((s, f) => s + f.w, 0) + CSS_GAP * (n - 1);
    const cssW = contentW + CSS_PAD * 2;
    const cssH = maxH + CSS_LABEL + CSS_PAD * 2;

    // Scale up so the primary frame renders at (up to) its native resolution - HD.
    // Capped so the canvas stays within browser limits.
    const MAX_DIM = 8000;
    const nativeScale = loaded[0].naturalHeight / frames[0].h;
    const scale = Math.max(1, Math.min(nativeScale, MAX_DIM / cssW, MAX_DIM / cssH));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(cssW * scale);
    canvas.height = Math.round(cssH * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    fillBackground(ctx, bg, canvas.width, canvas.height);

    const bottomY = (CSS_PAD + maxH) * scale; // frames are bottom-aligned (flex-end)
    let x = CSS_PAD * scale;
    for (const f of frames) {
        const fw = f.w * scale, fh = f.h * scale;
        ctx.drawImage(f.el, x, bottomY - fh, fw, fh);

        const meta = FRAME_META[f.device];
        ctx.font = `500 ${Math.round(11 * scale)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const label = meta.group === "TV" ? `TV - ${meta.label}` : `Apple ${meta.label}`;
        ctx.fillText(label, x + fw / 2, bottomY + 8 * scale);

        x += fw + CSS_GAP * scale;
    }
    return canvas;
}

/* ── Success feedback: shutter sound + confetti ─────────────────────────────── */

let _audioCtx: AudioContext | null = null;

// Crisp camera-shutter / copy click, synthesized (no asset, works offline)
function playShutter() {
    try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        _audioCtx = _audioCtx || new AC();
        const ctx = _audioCtx;
        if (ctx.state === "suspended") ctx.resume();
        const now = ctx.currentTime;

        // Short filtered noise burst - the mechanical "shck"
        const noise = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        noise.buffer = buf;
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = 0.8;
        const ng = ctx.createGain(); ng.gain.value = 0.35;
        noise.connect(bp).connect(ng).connect(ctx.destination);
        noise.start(now);

        // Two quick clicks for the shutter snap
        const click = (t: number, freq: number, dur: number, gain: number) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = "square"; o.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(gain, t + 0.002);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g).connect(ctx.destination);
            o.start(t); o.stop(t + dur);
        };
        click(now, 1900, 0.03, 0.12);
        click(now + 0.06, 1250, 0.04, 0.1);
    } catch { /* audio not available - ignore */ }
}

// Lightweight canvas confetti burst (~1.9s, self-cleaning, no deps)
function fireConfetti() {
    const W = window.innerWidth, H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999";
    canvas.width = W * dpr; canvas.height = H * dpr;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const colors = ["#007aff", "#4da3ff", "#34c759", "#ff2d55", "#ffcc00", "#af52de", "#ff9500"];
    const parts = Array.from({ length: 150 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 6 + Math.random() * 10;
        return {
            x: W / 2, y: H * 0.42,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 7,
            size: 5 + Math.random() * 7,
            color: colors[(Math.random() * colors.length) | 0],
            rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        };
    });

    let raf = 0, start = 0;
    const tick = (ts: number) => {
        if (!start) start = ts;
        const elapsed = ts - start;
        const life = Math.max(0, 1 - elapsed / 1800);
        ctx.clearRect(0, 0, W, H);
        for (const p of parts) {
            p.vy += 0.28; p.vx *= 0.99;
            p.x += p.vx; p.y += p.vy; p.rot += p.vr;
            ctx.save();
            ctx.globalAlpha = life;
            ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            ctx.restore();
        }
        if (elapsed < 1900) raf = requestAnimationFrame(tick);
        else { cancelAnimationFrame(raf); canvas.remove(); }
    };
    raf = requestAnimationFrame(tick);
}

/* ── Device Picker ──────────────────────────────────────────────────────────── */

const DEVICE_ICONS: Record<string, string> = {
    iphone: "/assets/icons/iphone.png",
    "ipad-portrait": "/assets/icons/ipad.png",
    "ipad-landscape": "/assets/icons/ipad.png",
    macbook: "/assets/icons/macbook.png",
    imac: "/assets/icons/imac.png",
    "studio-display": "/assets/icons/studio-display.png",
    "studio-mini": "/assets/icons/studio-display.png",
};

function DevicePicker({ current, onChange }: { current: DeviceType; onChange: (d: DeviceType) => void }) {
    const [hovered, setHovered] = useState<string | null>(null);
    return (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {DEVICE_GROUPS.flatMap(g => g.devices).map(d => (
                <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <button
                        onClick={() => onChange(d)}
                        onMouseEnter={() => setHovered(d)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                            width: 103, height: 103, borderRadius: "50%",
                            border: current === d ? "2px solid #007aff" : "2px solid transparent",
                            background: "#fff",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: current === d ? "0 0 0 3px rgba(0,122,255,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                    >
                        {DEVICE_ICONS[d] && <img src={DEVICE_ICONS[d]} alt={FRAME_META[d].label} style={{ width: 72, height: 72, objectFit: "contain" }} draggable={false} />}
                    </button>
                    <span style={{
                        fontSize: 11, fontWeight: 500, color: current === d ? "#4da3ff" : "#666",
                        opacity: hovered === d || current === d ? 1 : 0,
                        transition: "opacity 0.15s",
                    }}>
                        {FRAME_META[d].label}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ── Backgrounds ────────────────────────────────────────────────────────────── */

const BACKGROUNDS = [
    { label: "Transparent", value: "transparent" },
    { label: "White", value: "#ffffff" },
    { label: "Black", value: "#000000" },
    { label: "Dark", value: "#1a1a2e" },
    { label: "Gradient", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { label: "Blue", value: "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)" },
    { label: "Warm", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
];

/* ── Main Page ──────────────────────────────────────────────────────────────── */

function ApiHelpModal({ onClose }: { onClose: () => void }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 10000,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 20,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 16,
                    maxWidth: 620,
                    width: "100%",
                    maxHeight: "80vh",
                    overflow: "auto",
                    padding: "28px 32px",
                    color: "#e0e0e0",
                    fontSize: 13,
                    lineHeight: 1.7,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>Frames API</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer", padding: "0 4px" }}>x</button>
                </div>

                <p style={{ color: "#888", marginTop: 0 }}>Send a screenshot, get back a framed device mockup PNG.</p>

                {/* Endpoint */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Endpoint</div>
                    <code style={{ background: "rgba(255,255,255,0.06)", padding: "6px 12px", borderRadius: 8, display: "block", fontSize: 13, color: "#4da3ff" }}>
                        POST /api/frame
                    </code>
                </div>

                {/* Content Type */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Content Type</div>
                    <code style={{ background: "rgba(255,255,255,0.06)", padding: "6px 12px", borderRadius: 8, display: "block", fontSize: 13, color: "#ccc" }}>
                        multipart/form-data
                    </code>
                </div>

                {/* Fields */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Fields</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                <th style={{ textAlign: "left", padding: "6px 8px", color: "#666", fontWeight: 600 }}>Field</th>
                                <th style={{ textAlign: "left", padding: "6px 8px", color: "#666", fontWeight: 600 }}>Required</th>
                                <th style={{ textAlign: "left", padding: "6px 8px", color: "#666", fontWeight: 600 }}>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding: "6px 8px" }}><code style={{ color: "#4da3ff" }}>image</code></td>
                                <td style={{ padding: "6px 8px", color: "#e06c75" }}>Yes</td>
                                <td style={{ padding: "6px 8px", color: "#999" }}>Screenshot file (PNG/JPG, max 20 MB)</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "6px 8px" }}><code style={{ color: "#4da3ff" }}>device</code></td>
                                <td style={{ padding: "6px 8px", color: "#98c379" }}>No</td>
                                <td style={{ padding: "6px 8px", color: "#999" }}>Device type. Auto-detects from aspect ratio if omitted.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Devices */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Devices</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(["iphone", "ipad-portrait", "ipad-landscape", "macbook", "imac", "studio-display", "studio-mini"] as const).map(d => (
                            <span key={d} style={{ background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: 6, fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>{d}</span>
                        ))}
                    </div>
                </div>

                {/* Response */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Response</div>
                    <p style={{ margin: "0 0 4px", color: "#999" }}>Returns the framed image as <code style={{ color: "#e5c07b" }}>image/png</code> binary. The <code style={{ color: "#e5c07b" }}>X-Device</code> header shows which device was used.</p>
                </div>

                {/* Examples */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Examples</div>

                    <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>MacBook frame</div>
                        <pre style={{ background: "rgba(0,0,0,0.3)", padding: "10px 14px", borderRadius: 8, overflow: "auto", margin: 0, fontSize: 12, color: "#98c379" }}>
{`curl -X POST \\
  -F "image=@screenshot.png" \\
  -F "device=macbook" \\
  https://your-domain.com/api/frame \\
  -o framed.png`}
                        </pre>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>iPhone frame</div>
                        <pre style={{ background: "rgba(0,0,0,0.3)", padding: "10px 14px", borderRadius: 8, overflow: "auto", margin: 0, fontSize: 12, color: "#98c379" }}>
{`curl -X POST \\
  -F "image=@screenshot.png" \\
  -F "device=iphone" \\
  https://your-domain.com/api/frame \\
  -o framed.png`}
                        </pre>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Auto-detect device from image dimensions</div>
                        <pre style={{ background: "rgba(0,0,0,0.3)", padding: "10px 14px", borderRadius: 8, overflow: "auto", margin: 0, fontSize: 12, color: "#98c379" }}>
{`curl -X POST \\
  -F "image=@screenshot.png" \\
  https://your-domain.com/api/frame \\
  -o framed.png`}
                        </pre>
                    </div>

                    <div>
                        <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>JavaScript / Node.js</div>
                        <pre style={{ background: "rgba(0,0,0,0.3)", padding: "10px 14px", borderRadius: 8, overflow: "auto", margin: 0, fontSize: 12, color: "#e5c07b" }}>
{`const form = new FormData();
form.append("image", fileInput.files[0]);
form.append("device", "iphone");

const res = await fetch("/api/frame", {
  method: "POST",
  body: form,
});
const blob = await res.blob();`}
                        </pre>
                    </div>
                </div>

                {/* Auto-detect logic */}
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Auto-detect Logic</div>
                    <div style={{ fontSize: 12, color: "#888", lineHeight: 1.8 }}>
                        When <code style={{ color: "#e5c07b" }}>device</code> is omitted, the API picks based on image aspect ratio:<br />
                        <span style={{ color: "#aaa" }}>height/width &gt; 1.5</span> &rarr; <code style={{ color: "#4da3ff" }}>iphone</code><br />
                        <span style={{ color: "#aaa" }}>height/width &gt; 1.0</span> &rarr; <code style={{ color: "#4da3ff" }}>ipad-portrait</code><br />
                        <span style={{ color: "#aaa" }}>otherwise</span> &rarr; <code style={{ color: "#4da3ff" }}>macbook</code>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FramesInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialDevice = useMemo(() => {
        const param = searchParams.get("device");
        return param && param in FRAME_META ? param as DeviceType : "macbook";
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [images, setImages] = useState<FrameImage[]>([]);
    const [dragging, setDragging] = useState(false);
    const [bg] = useState(BACKGROUNDS[0].value);
    const [showApiHelp, setShowApiHelp] = useState(false);
    const dragCounter = useRef(0);
    const previewRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const autoDownload = useRef(false); // trigger download once after a user drop finishes compositing
    const bgRef = useRef(bg);
    useEffect(() => { bgRef.current = bg; }, [bg]);

    const [downloading, setDownloading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [exportSize, setExportSize] = useState<{ w: number; h: number } | null>(null);
    const exportCanvasRef = useRef<HTMLCanvasElement | null>(null); // pre-rendered export, reused for save/copy

    /* Core export - draw full-res composited frames to a canvas.
       Uses the pre-rendered canvas when saving the current state (instant);
       renders from explicit args for the auto-download-after-drop path. */
    const doDownload = useCallback(async (fmt: "webp" | "png", imgs?: FrameImage[], bgVal?: string) => {
        if (downloading) return;
        const targets = imgs ?? images;
        if (!targets.length) return;
        setDownloading(true);
        try {
            const canvas = (!imgs && exportCanvasRef.current) || await renderExportCanvas(targets, bgVal ?? bg);
            const link = document.createElement("a");
            link.download = `frames-${Date.now()}.${fmt}`;
            link.href = fmt === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/webp", 0.95);
            link.click();
            playShutter();
            fireConfetti();
        } finally {
            setTimeout(() => setDownloading(false), 300);
        }
    }, [downloading, images, bg]);

    /* Copy the framed image to the clipboard (PNG - the only format clipboards accept).
       Uses the ClipboardItem-with-Promise form so write() is called synchronously
       after the click (keeps user activation) while the blob resolves lazily. */
    const copyImage = useCallback(async () => {
        if (!images.length) return;
        try {
            const canvas = exportCanvasRef.current || await renderExportCanvas(images, bg);
            const blobPromise = new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error("no blob")), "image/png"));
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })]);
            playShutter();
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch { /* clipboard unavailable / blocked - ignore */ }
    }, [images, bg]);

    /* Screenshot source per device */
    const screenshotForDevice = useCallback((device: DeviceType) => {
        if (device === "iphone") return "/assets/screenshots/bunlongheng-mobile.png";
        if (device === "ipad-portrait") return "/assets/screenshots/bunlongheng-tablet.png";
        return "/assets/screenshots/bunlongheng.png";
    }, []);

    /* Load default screenshot on page load */
    useEffect(() => {
        const src = screenshotForDevice(initialDevice);
        const img = new Image();
        img.onload = () => {
            setImages([{
                id: "default",
                dataUrl: src,
                width: img.naturalWidth,
                height: img.naturalHeight,
                device: initialDevice,
            }]);
        };
        img.src = src;
    }, [initialDevice, screenshotForDevice]);

    /* Swap screenshot source when device changes to match viewport */
    const prevDeviceRef = useRef<string>(initialDevice);
    useEffect(() => {
        if (!images.length || images[0].id !== "default") return;
        const device = images[0].device;
        if (device === prevDeviceRef.current) return;
        prevDeviceRef.current = device;

        const src = screenshotForDevice(device);
        // Same screenshot as now (e.g. macbook/imac/studio-display all share the
        // desktop shot): don't setImages - it would clobber the composited result
        // with an un-composited copy and, since the key is unchanged, never recompute.
        if (src === images[0].dataUrl) return;
        const img = new Image();
        img.onload = () => {
            setImages([{
                id: "default",
                dataUrl: src,
                width: img.naturalWidth,
                height: img.naturalHeight,
                device,
            }]);
        };
        img.src = src;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images.map(i => `${i.id}:${i.device}`).join(","), screenshotForDevice]);

    /* Composite whenever images or their device/source changes */
    const compositeKey = images.map(i => `${i.id}:${i.device}:${i.dataUrl}`).join(",");
    useEffect(() => {
        if (!images.length) return;
        // Skip if all already composited
        if (images.every(i => i.composited)) return;
        let cancelled = false;

        Promise.all(
            images.map(async (img) => {
                const composited = await compositeFrame(img.dataUrl, img.device);
                return { ...img, composited };
            })
        ).then((results) => {
            if (!cancelled) {
                setImages(results);
                if (autoDownload.current) {
                    autoDownload.current = false;
                    doDownload("webp", results, bgRef.current);
                }
            }
        }).catch(() => {});

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [compositeKey]);

    /* Pre-render the export canvas once compositing settles, so WEBP / PNG / Copy
       are instant and we can show the live output dimensions. */
    const exportReadyKey = images.map(i => `${i.id}:${i.device}:${i.composited ? 1 : 0}`).join(",") + "|" + bg;
    useEffect(() => {
        // Not ready yet - drop the stale export canvas. exportSize is left as-is;
        // the export bar shows "Rendering..." while `compositing` is true anyway.
        if (!images.length || !images.every(i => i.composited)) { exportCanvasRef.current = null; return; }
        let cancelled = false;
        renderExportCanvas(images, bg).then(canvas => {
            if (cancelled) return;
            exportCanvasRef.current = canvas;
            setExportSize({ w: canvas.width, h: canvas.height });
        }).catch(() => {});
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exportReadyKey]);

    /* Cmd/Ctrl+S saves WEBP */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!images.length) return;
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); doDownload("webp"); }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [images.length, doDownload]);

    const processFiles = useCallback((files: File[]) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 4);
        if (!imageFiles.length) return;
        autoDownload.current = true; // auto-save once compositing finishes

        const promises = imageFiles.map(file => new Promise<FrameImage>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const img = new Image();
                img.onload = () => {
                    resolve({
                        id: Math.random().toString(36).slice(2, 10),
                        dataUrl,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        device: detectDevice(img.naturalWidth, img.naturalHeight),
                    });
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        }));

        Promise.all(promises).then(results => setImages(results));
    }, []);

    /* drag-and-drop on document */
    useEffect(() => {
        const onEnter = (e: DragEvent) => { e.preventDefault(); dragCounter.current++; setDragging(true); };
        const onLeave = (e: DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setDragging(false); } };
        const onOver = (e: DragEvent) => e.preventDefault();
        const onDrop = (e: DragEvent) => { e.preventDefault(); dragCounter.current = 0; setDragging(false); if (e.dataTransfer?.files.length) processFiles(Array.from(e.dataTransfer.files)); };
        document.addEventListener("dragenter", onEnter);
        document.addEventListener("dragleave", onLeave);
        document.addEventListener("dragover", onOver);
        document.addEventListener("drop", onDrop);
        return () => { document.removeEventListener("dragenter", onEnter); document.removeEventListener("dragleave", onLeave); document.removeEventListener("dragover", onOver); document.removeEventListener("drop", onDrop); };
    }, [processFiles]);

    /* Cmd/Ctrl + V paste image from clipboard */
    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const files = Array.from(items)
                .filter(it => it.kind === "file" && it.type.startsWith("image/"))
                .map(it => it.getAsFile())
                .filter((f): f is File => !!f);
            if (files.length) { e.preventDefault(); processFiles(files); }
        };
        document.addEventListener("paste", onPaste);
        return () => document.removeEventListener("paste", onPaste);
    }, [processFiles]);

    const updateDevice = useCallback((id: string, device: DeviceType) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, device, composited: undefined } : img));
        router.replace(`?device=${device}`, { scroll: false });
    }, [router]);

    const isEmpty = images.length === 0;

    /* Derived: we are compositing whenever an image has no composited result yet. */
    const compositing = !isEmpty && !images.every(i => i.composited);

    /* Export-bar building blocks */
    const busy = compositing || downloading;
    const btnBase: React.CSSProperties = {
        display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 17px",
        borderRadius: 12, fontSize: 13, fontWeight: 600, letterSpacing: "0.01em",
        border: "1px solid transparent", fontFamily: "inherit", whiteSpace: "nowrap",
        transition: "transform 0.12s ease, background 0.15s, border-color 0.15s, opacity 0.15s",
    };
    const iconDownload = (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
    const iconCopy = (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    );
    const iconCheck = (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    );

    return (
        <>
            <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0e0e10", color: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", paddingTop: 54 }}>

                {/* Hidden file input for drop zone click fallback */}
                <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files) processFiles(Array.from(e.target.files)); e.target.value = ""; }} />

                {/* ── Device picker ─────────────────────────────── */}
                {images.length > 0 && (
                    <DevicePicker current={images[0].device} onChange={d => { images.forEach(img => updateDevice(img.id, d)); }} />
                )}

                {/* ── Preview / Drop zone ──────────────────────────────────── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "24px 20px 80px" }}>
                    {isEmpty ? (
                        <div
                            onClick={() => inputRef.current?.click()}
                            style={{
                                width: "100%", maxWidth: 700, height: 400,
                                border: `2px dashed ${dragging ? "#007aff" : "rgba(255,255,255,0.15)"}`,
                                borderRadius: 16,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
                                background: dragging ? "rgba(0,122,255,0.05)" : "transparent",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                        >
                            <div style={{ fontSize: 48, opacity: 0.3 }}>📱</div>
                            <div style={{ fontSize: 15, color: "#888", fontWeight: 500 }}>Drop images here or click to browse</div>
                            <div style={{ fontSize: 12, color: "#555" }}>
                                1 image → pick a device &nbsp;·&nbsp; 3–4 images → advertisement layout
                            </div>
                            <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
                                iPhone · iPad · MacBook · iMac · Studio Display
                            </div>
                        </div>
                    ) : (
                        <div
                            ref={previewRef}
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "center",
                                gap: images.length === 1 ? 0 : 32,
                                padding: 48,
                                borderRadius: 16,
                                background: bg,
                                minWidth: 400,
                                minHeight: 300,
                            }}
                        >
                            {images.map(img => {
                                const meta = FRAME_META[img.device];
                                const aspect = meta.frameDimensions.width / meta.frameDimensions.height;
                                const h = meta.displayHeight;
                                const w = h * aspect;
                                return (
                                    <div key={img.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <img
                                            src={img.composited || img.dataUrl}
                                            alt={meta.label}
                                            style={{ height: h, width: w, objectFit: "contain", display: "block" }}
                                            draggable={false}
                                        />
                                        <span style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500, textAlign: "center", width: "100%" }}>
                                            {meta.group === "TV" ? `TV — ${meta.label}` : `Apple ${meta.label}`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Export bar - center bottom ─────────────────────────────────── */}
            {!isEmpty && (
                <div style={{
                    position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 50,
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "7px 8px 7px 15px", borderRadius: 17,
                    background: "rgba(20,20,24,0.72)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
                    border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 14px 44px rgba(0,0,0,0.55)",
                }}>
                    {/* Live output dimensions */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 7, paddingRight: 13, marginRight: 1,
                        borderRight: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "#8a8a92",
                        fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
                    }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.65 }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                        </svg>
                        {compositing
                            ? "Rendering..."
                            : exportSize
                                ? <span><span style={{ color: "#cdcdd4", fontWeight: 600 }}>{exportSize.w}</span> x <span style={{ color: "#cdcdd4", fontWeight: 600 }}>{exportSize.h}</span></span>
                                : ""}
                    </div>

                    {/* WEBP (primary) */}
                    <button
                        onClick={() => doDownload("webp")} disabled={busy} title="Download WEBP (Cmd/Ctrl+S)"
                        style={{ ...btnBase, color: "#fff", background: busy ? "rgba(0,122,255,0.4)" : "#007aff", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}
                        onMouseEnter={e => { if (!busy) { e.currentTarget.style.background = "#1a86ff"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#007aff"; e.currentTarget.style.transform = "none"; }}
                    >
                        {iconDownload} WEBP
                    </button>

                    {/* PNG */}
                    <button
                        onClick={() => doDownload("png")} disabled={busy} title="Download PNG"
                        style={{ ...btnBase, color: "#d3d3d9", background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.09)", cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1 }}
                        onMouseEnter={e => { if (!busy) { e.currentTarget.style.background = "rgba(255,255,255,0.13)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#d3d3d9"; e.currentTarget.style.transform = "none"; }}
                    >
                        {iconDownload} PNG
                    </button>

                    {/* Copy */}
                    <button
                        onClick={copyImage} disabled={compositing} title="Copy image to clipboard"
                        style={{ ...btnBase, color: copied ? "#34c759" : "#d3d3d9", background: copied ? "rgba(52,199,89,0.14)" : "rgba(255,255,255,0.07)", borderColor: copied ? "rgba(52,199,89,0.35)" : "rgba(255,255,255,0.09)", cursor: compositing ? "default" : "pointer", opacity: compositing ? 0.5 : 1 }}
                        onMouseEnter={e => { if (!compositing && !copied) { e.currentTarget.style.background = "rgba(255,255,255,0.13)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                        onMouseLeave={e => { if (!copied) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#d3d3d9"; } e.currentTarget.style.transform = "none"; }}
                    >
                        {copied ? iconCheck : iconCopy} {copied ? "Copied" : "Copy"}
                    </button>
                </div>
            )}

            {/* ── API Help ? button — top right ──────────────────────────── */}
            <button
                onClick={() => setShowApiHelp(true)}
                style={{
                    position: "fixed", top: 16, right: 16, zIndex: 100,
                    width: 32, height: 32, borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(8px)",
                    color: "#666",
                    fontSize: 15, fontWeight: 700,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#4da3ff"; e.currentTarget.style.color = "#4da3ff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#666"; }}
                title="API Documentation"
            >
                ?
            </button>

            {/* ── API Help Modal ──────────────────────────────────────────── */}
            {showApiHelp && <ApiHelpModal onClose={() => setShowApiHelp(false)} />}

            {/* ── Drag overlay ─────────────────────────────────────────────── */}
            {dragging && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    background: "rgba(0,122,255,0.08)",
                    backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    pointerEvents: "none",
                }}>
                    <div style={{ fontSize: 20, color: "#4da3ff", fontWeight: 600 }}>Drop images to frame</div>
                </div>
            )}
        </>
    );
}

export default function FramesPage() {
    return <Suspense><FramesInner /></Suspense>;
}

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

    // Cover-fit: crop screenshot to match screen aspect ratio (no stretching)
    const screenAspect = meta.screenWidth / meta.screenHeight;
    const imgAspect = screenshot.naturalWidth / screenshot.naturalHeight;
    let sx = 0, sy = 0, sw = screenshot.naturalWidth, sh = screenshot.naturalHeight;
    if (imgAspect > screenAspect) {
        // Image is wider — crop sides
        sw = screenshot.naturalHeight * screenAspect;
        sx = (screenshot.naturalWidth - sw) / 2;
    } else {
        // Image is taller — crop top from top
        sh = screenshot.naturalWidth / screenAspect;
    }

    if (meta.isPhoto) {
        ctx.drawImage(frame, 0, 0);
        ctx.drawImage(screenshot, sx, sy, sw, sh, meta.screenOffset.x, meta.screenOffset.y, meta.screenWidth, meta.screenHeight);
    } else {
        ctx.drawImage(screenshot, sx, sy, sw, sh, meta.screenOffset.x, meta.screenOffset.y, meta.screenWidth, meta.screenHeight);
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
    const [bg, setBg] = useState(BACKGROUNDS[0].value);
    const [compositing, setCompositing] = useState(false);
    const [showApiHelp, setShowApiHelp] = useState(false);
    const dragCounter = useRef(0);
    const previewRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const autoDownload = useRef(false); // trigger download once after a user drop finishes compositing
    const bgRef = useRef(bg);
    useEffect(() => { bgRef.current = bg; }, [bg]);

    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloading, setDownloading] = useState(false);

    /* Core export - draw full-res composited frames to a canvas, save as HD WebP */
    const doDownload = useCallback(async (imgs: FrameImage[], bgVal: string) => {
        if (!imgs.length) return;
        setDownloading(true);
        setDownloadProgress(15);
        const tick = setInterval(() => setDownloadProgress(p => (p < 85 ? p + 20 : p)), 80);
        try {
            const canvas = await renderExportCanvas(imgs, bgVal);
            setDownloadProgress(95);
            const link = document.createElement("a");
            link.download = `frames-${Date.now()}.webp`;
            link.href = canvas.toDataURL("image/webp", 0.95);
            setDownloadProgress(100);
            link.click();
        } finally {
            clearInterval(tick);
            setTimeout(() => { setDownloading(false); setDownloadProgress(0); }, 400);
        }
    }, []);

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
        setCompositing(true);

        Promise.all(
            images.map(async (img) => {
                const composited = await compositeFrame(img.dataUrl, img.device);
                return { ...img, composited };
            })
        ).then((results) => {
            if (!cancelled) {
                setImages(results);
                setCompositing(false);
                if (autoDownload.current) {
                    autoDownload.current = false;
                    doDownload(results, bgRef.current);
                }
            }
        });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [compositeKey]);

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

    const updateDevice = useCallback((id: string, device: DeviceType) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, device, composited: undefined } : img));
        router.replace(`?device=${device}`, { scroll: false });
    }, [router]);

    const removeImage = useCallback((id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    }, []);

    const handleExport = useCallback(() => {
        if (downloading) return;
        doDownload(images, bg);
    }, [downloading, images, bg, doDownload]);

    const isEmpty = images.length === 0;

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

            {/* ── Download circle button — center bottom ─────────────────────── */}
            {!isEmpty && (
                <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
                    <button
                        onClick={handleExport}
                        disabled={compositing || downloading}
                        style={{
                            position: "relative",
                            width: 72, height: 72, borderRadius: "50%",
                            border: "3px solid rgba(255,255,255,0.6)",
                            background: "rgba(255,255,255,0.08)",
                            backdropFilter: "blur(12px)",
                            color: "#fff",
                            cursor: (compositing || downloading) ? "wait" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "border-color 0.2s, background 0.2s, transform 0.15s",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "scale(1)"; }}
                    >
                        {/* Progress ring */}
                        {downloading && (
                            <svg style={{ position: "absolute", inset: -5, width: 82, height: 82, transform: "rotate(-90deg)" }}>
                                <circle cx="41" cy="41" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                <circle cx="41" cy="41" r="38" fill="none" stroke="#007aff" strokeWidth="3"
                                    strokeDasharray={`${2 * Math.PI * 38}`}
                                    strokeDashoffset={`${2 * Math.PI * 38 * (1 - downloadProgress / 100)}`}
                                    strokeLinecap="round"
                                    style={{ transition: "stroke-dashoffset 0.15s" }}
                                />
                            </svg>
                        )}
                        {/* Download arrow icon */}
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
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

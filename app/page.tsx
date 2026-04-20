"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";


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
    { group: "Apple", devices: ["iphone", "ipad-portrait", "ipad-landscape", "macbook", "imac", "studio-display", "studio-mini"] as DeviceType[] },
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

    if (meta.isPhoto) {
        // TV setup: draw room photo first, then screenshot on top
        ctx.drawImage(frame, 0, 0);
        ctx.drawImage(screenshot, meta.screenOffset.x, meta.screenOffset.y, meta.screenWidth, meta.screenHeight);
    } else {
        // Device frame: draw screenshot first, then frame on top (transparent screen)
        ctx.drawImage(screenshot, meta.screenOffset.x, meta.screenOffset.y, meta.screenWidth, meta.screenHeight);
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

/* ── Device Picker ──────────────────────────────────────────────────────────── */

function DevicePicker({ current, onChange }: { current: DeviceType; onChange: (d: DeviceType) => void }) {
    return (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DEVICE_GROUPS.map(g => (
                <div key={g.group} style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#555", marginRight: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{g.group}</span>
                    {g.devices.map(d => (
                        <button
                            key={d}
                            onClick={() => onChange(d)}
                            style={{
                                padding: "3px 8px",
                                fontSize: 10,
                                fontWeight: 500,
                                borderRadius: 5,
                                border: "1px solid",
                                borderColor: current === d ? "#007aff" : "rgba(255,255,255,0.12)",
                                background: current === d ? "rgba(0,122,255,0.15)" : "rgba(255,255,255,0.04)",
                                color: current === d ? "#4da3ff" : "#999",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {FRAME_META[d].label}
                        </button>
                    ))}
                    {g.group !== "TV" && <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 2px" }}>|</span>}
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

function FramesInner() {
    const [images, setImages] = useState<FrameImage[]>([]);
    const [dragging, setDragging] = useState(false);
    const [bg, setBg] = useState(BACKGROUNDS[0].value);
    const [compositing, setCompositing] = useState(false);
    const dragCounter = useRef(0);
    const previewRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Composite whenever images or their device selection changes */
    useEffect(() => {
        if (!images.length) return;
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
            }
        });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images.map(i => `${i.id}:${i.device}`).join(",")]);

    const processFiles = useCallback((files: File[]) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 4);
        if (!imageFiles.length) return;

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
    }, []);

    const removeImage = useCallback((id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    }, []);

    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloading, setDownloading] = useState(false);

    const handleExport = useCallback(async () => {
        if (!previewRef.current || downloading) return;
        setDownloading(true);
        setDownloadProgress(0);

        // Simulate progress during html2canvas rendering
        const progressInterval = setInterval(() => {
            setDownloadProgress(prev => prev < 85 ? prev + Math.random() * 15 : prev);
        }, 100);

        try {
            const { default: html2canvas } = await import("html2canvas");
            setDownloadProgress(40);
            const canvas = await html2canvas(previewRef.current, { backgroundColor: null, scale: 2, useCORS: true });
            setDownloadProgress(90);
            const link = document.createElement("a");
            link.download = `frames-${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            setDownloadProgress(100);
            link.click();
        } finally {
            clearInterval(progressInterval);
            setTimeout(() => { setDownloading(false); setDownloadProgress(0); }, 600);
        }
    }, [downloading]);

    const isEmpty = images.length === 0;

    return (
        <>
            <div style={{ minHeight: "100dvh", background: "#0e0e10", color: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", paddingTop: 54 }}>

                {/* Hidden file input for drop zone click fallback */}
                <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files) processFiles(Array.from(e.target.files)); e.target.value = ""; }} />

                {/* ── Device pickers per image ─────────────────────────────── */}
                {images.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "8px 20px" }}>
                        {images.map((img, i) => (
                            <div key={img.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 10px" }}>
                                <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>#{i + 1}</span>
                                <DevicePicker current={img.device} onChange={d => updateDevice(img.id, d)} />
                                <button onClick={() => removeImage(img.id)} style={{ fontSize: 14, color: "#666", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>×</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Preview / Drop zone ──────────────────────────────────── */}
                <div style={{ display: "flex", justifyContent: "center", padding: "24px 20px 80px" }}>
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
                                        <span style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
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

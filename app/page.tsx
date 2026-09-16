"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";


/* ── Types ──────────────────────────────────────────────────────────────────── */

type DeviceType = "iphone" | "iphone-landscape" | "iphone-duo" | "iphone-duo-open" | "iphone-duo-book" | "iphone-duo-desk" | "iphone-duo-laptop" | "ipad-portrait" | "ipad-landscape" | "macbook" | "imac" | "studio-display" | "studio-mini" | "tv-bamboo" | "tv-dark-panel" | "tv-gallery" | "tv-beige" | "tv-theater" | "tv-walnut" | "tv-colorful" | "tv-frame-art" | "tv-teal";

interface FrameImage {
    id: string;
    dataUrl: string;
    width: number;
    height: number;
    device: DeviceType;
    composited?: string;
}

/* ── Device frame metadata ──────────────────────────────────────────────────── */

// A folded pose: the flat open Duo bezel cut at the hinge, each half hinged in 3D.
// Geometry ported from the emulator's renderPose - one tuned set of angles per pose.
interface Pose {
    axis: "x" | "y";   // hinge line: y = vertical (halves left|right), x = horizontal (top|bottom)
    a: number;         // half 1's rotation about the hinge, degrees
    b: number;         // half 2's
    persp: number;     // perspective distance, in frame px
    yaw?: number;      // camera - where you stand relative to the rig
    pitch?: number;
    solo?: 1 | 2;      // only this half carries the screenshot; the other shows the device's back
}

interface FrameMeta {
    label: string;
    group: string;
    mode?: string;     // sub-mode label, shown in the picker's pill row
    file: string;
    frameDimensions: { width: number; height: number };
    screenOffset: { x: number; y: number };
    screenWidth: number;
    screenHeight: number;
    screenRadius?: number; // corner radius of the display opening in the frame art
    displayHeight: number;
    isPhoto?: boolean; // TV setups — draw room photo first, then screenshot on top
    isCombo?: boolean; // Studio Display + Mac Mini combo
    pose?: Pose;       // fold the flat composite into this pose before exporting
}

const FRAME_META: Record<DeviceType, FrameMeta> = {
    iphone: {
        label: "iPhone 17 Pro Max",
        group: "Apple",
        mode: "Portrait",
        file: "/assets/frames/iphone.png",
        frameDimensions: { width: 1470, height: 3000 },
        screenOffset: { x: 75, y: 217 },
        screenWidth: 1320,
        screenHeight: 2717,
        displayHeight: 420,
    },
    "iphone-landscape": {
        label: "iPhone 17 Pro Max",
        group: "Apple",
        mode: "Landscape",
        file: "/assets/frames/iphone-landscape.png",
        frameDimensions: { width: 3000, height: 1470 },
        screenOffset: { x: 66, y: 76 },
        screenWidth: 2868,
        screenHeight: 1320,
        screenRadius: 206,
        displayHeight: 230,
    },
    // iPhone Duo — Apple's book-style foldable. Closed (front) and open are the same
    // physical height; unfolding doubles the width. The three folded poses all render
    // from an open bezel, so the hinge geometry only has to be right in one place.
    "iphone-duo": {
        label: "iPhone Duo (Front)",
        group: "Apple",
        mode: "Front",
        file: "/assets/frames/iphone-duo-closed-portrait.png",
        frameDimensions: { width: 1574, height: 2194 },
        screenOffset: { x: 88, y: 80 },
        screenWidth: 1398,
        screenHeight: 2034,
        screenRadius: 190,
        displayHeight: 420,
    },
    "iphone-duo-open": {
        label: "iPhone Duo (Open)",
        group: "Apple",
        mode: "Open",
        file: "/assets/frames/iphone-duo-open-landscape.png",
        frameDimensions: { width: 3093, height: 2247 },
        screenOffset: { x: 120, y: 120 },
        screenWidth: 2853,
        screenHeight: 2007,
        screenRadius: 174,
        displayHeight: 330,
    },
    "iphone-duo-book": {
        label: "iPhone Duo (Book)",
        group: "Apple",
        mode: "Book",
        file: "/assets/frames/iphone-duo-open-landscape.png",
        frameDimensions: { width: 3093, height: 2247 },
        screenOffset: { x: 120, y: 120 },
        screenWidth: 2853,
        screenHeight: 2007,
        screenRadius: 174,
        displayHeight: 360,
        pose: { axis: "y", a: 40, b: -40, persp: 4600 },
    },
    // Desk clock is a tent: the hinge is the ridge at the top, the near half leans back
    // carrying the page, the far half folds down behind it so you see its back.
    "iphone-duo-desk": {
        label: "iPhone Duo (Desk clock)",
        group: "Apple",
        mode: "Desk",
        file: "/assets/frames/iphone-duo-open-portrait.png",
        frameDimensions: { width: 2247, height: 3093 },
        screenOffset: { x: 120, y: 120 },
        screenWidth: 2007,
        screenHeight: 2853,
        screenRadius: 174,
        displayHeight: 340,
        pose: { axis: "x", a: 138, b: 16, persp: 5200, solo: 2, yaw: -24, pitch: 7 },
    },
    "iphone-duo-laptop": {
        label: "iPhone Duo (Laptop)",
        group: "Apple",
        mode: "Laptop",
        file: "/assets/frames/iphone-duo-open-portrait.png",
        frameDimensions: { width: 2247, height: 3093 },
        screenOffset: { x: 120, y: 120 },
        screenWidth: 2007,
        screenHeight: 2853,
        screenRadius: 174,
        displayHeight: 340,
        pose: { axis: "x", a: 8, b: 72, persp: 5200 },
    },
    "ipad-portrait": {
        label: "iPad Pro Portrait",
        group: "Apple",
        mode: "Portrait",
        file: "/assets/frames/ipad-portrait.png",
        frameDimensions: { width: 2245, height: 2930 },
        screenOffset: { x: 96, y: 102 },
        screenWidth: 2048,
        screenHeight: 2732,
        screenRadius: 44,
        displayHeight: 380,
    },
    "ipad-landscape": {
        label: "iPad Pro Landscape",
        group: "Apple",
        mode: "Landscape",
        file: "/assets/frames/ipad-landscape.png",
        frameDimensions: { width: 2930, height: 2245 },
        screenOffset: { x: 102, y: 101 },
        screenWidth: 2732,
        screenHeight: 2048,
        screenRadius: 44,
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

/* A family is one circle in the picker. Families with more than one device get a
   sub-selection row underneath - orientation for the iPhone and iPad, the five
   fold poses for the Duo. */
interface Family {
    id: string;
    label: string;
    icon: string;
    devices: DeviceType[];
}

const FAMILIES: Family[] = [
    { id: "iphone", label: "iPhone 17 Pro Max", icon: "/assets/icons/iphone.png", devices: ["iphone", "iphone-landscape"] },
    { id: "iphone-duo", label: "iPhone Duo", icon: "/assets/icons/iphone-duo.png", devices: ["iphone-duo", "iphone-duo-open", "iphone-duo-book", "iphone-duo-desk", "iphone-duo-laptop"] },
    { id: "ipad-pro", label: "iPad Pro", icon: "/assets/icons/ipad.png", devices: ["ipad-portrait", "ipad-landscape"] },
    { id: "macbook", label: "MacBook Air", icon: "/assets/icons/macbook.png", devices: ["macbook"] },
    { id: "imac", label: "iMac 24″", icon: "/assets/icons/imac.png", devices: ["imac"] },
    { id: "studio-display", label: "Studio Display", icon: "/assets/icons/studio-display.png", devices: ["studio-display"] },
    // TV behind beta — uncomment when hi-res images available
    // { id: "tv", label: "TV", icon: "/assets/icons/tv.png", devices: ["tv-bamboo", "tv-dark-panel", "tv-gallery", "tv-beige", "tv-theater", "tv-walnut", "tv-colorful", "tv-frame-art", "tv-teal"] },
];

const familyOf = (d: DeviceType): Family => FAMILIES.find(f => f.devices.includes(d)) || FAMILIES[0];

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

/* ── Folding a pose ─────────────────────────────────────────────────────────── */

const rad = (deg: number) => (deg * Math.PI) / 180;

// px of art each half carries PAST the hinge. Two planes that meet exactly on the
// hinge leave a hairline the moment they rotate apart; overlapping them closes it.
const POSE_BLEED = 10;

// Project a point of one half - u runs out from the hinge, v across it - through the
// whole chain: the half's own hinge rotation, then the camera, then perspective.
// Returns [x, y, z]; z is the depth, used to decide which half is drawn first.
function projectPoint(pose: Pose, u: number, v: number, angle: number): [number, number, number] {
    const vert = pose.axis === "y";
    const t = rad(angle);
    const yaw = rad(pose.yaw || 0), pitch = rad(pose.pitch || 0);
    let x = vert ? u * Math.cos(t) : v;
    let y = vert ? v : u * Math.cos(t);
    let z = vert ? -u * Math.sin(t) : u * Math.sin(t);
    const xr = x * Math.cos(yaw) + z * Math.sin(yaw);
    z = -x * Math.sin(yaw) + z * Math.cos(yaw);
    x = xr;
    const yr = y * Math.cos(pitch) - z * Math.sin(pitch);
    z = y * Math.sin(pitch) + z * Math.cos(pitch);
    y = yr;
    const m = pose.persp / Math.max(pose.persp - z, pose.persp * 0.2); // magnification at that depth
    return [x * m, y * m, z];
}

// Output box of a pose: the PROJECTED bounds of both halves (perspective magnifies
// whatever leans forward), plus where the hinge lands inside that box. Sizing off the
// real bounds is what keeps the preview aspect honest and stops a near corner clipping.
const poseGeomCache = new Map<DeviceType, ReturnType<typeof computePoseGeometry>>();

function computePoseGeometry(meta: FrameMeta, pose: Pose = meta.pose!) {
    const { width: fw, height: fh } = meta.frameDimensions;
    const vert = pose.axis === "y";
    const half = (vert ? fw : fh) / 2;    // the hinge runs down the middle of the art
    const cross = (vert ? fh : fw) / 2;   // half the art ACROSS the hinge
    const pts: [number, number, number][] = [];
    ([[-half, pose.a], [half, pose.b]] as const).forEach(([u, angle]) => {
        [0, u].forEach(uu => [-cross, cross].forEach(vv => pts.push(projectPoint(pose, uu, vv, angle))));
    });
    const minX = Math.min(...pts.map(p => p[0])), maxX = Math.max(...pts.map(p => p[0]));
    const minY = Math.min(...pts.map(p => p[1])), maxY = Math.max(...pts.map(p => p[1]));
    return {
        width: Math.round(maxX - minX),
        height: Math.round(maxY - minY),
        hx: -minX, hy: -minY, half, cross,
    };
}

function poseGeometry(device: DeviceType, meta: FrameMeta) {
    let g = poseGeomCache.get(device);
    if (!g) { g = computePoseGeometry(meta); poseGeomCache.set(device, g); }
    return g;
}

// What the preview and export actually measure: a pose's projected box, everyone
// else's flat frame art.
function outputDimensions(device: DeviceType) {
    const meta = FRAME_META[device];
    return meta.pose ? poseGeometry(device, meta) : meta.frameDimensions;
}

// Push every edge of a triangle `pad` px outward. Neighbouring mesh cells then
// overlap by a full pixel, so each one's opaque interior paints over the other's
// antialiased clip edge - two half-covered edges meeting would leave a hairline of
// the background showing through, which reads as a grid across the fold.
function expandTriangle(p: number[][], pad: number): number[][] {
    const area = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[2][0] - p[0][0]) * (p[1][1] - p[0][1]);
    const s = area >= 0 ? 1 : -1; // winding, so the normals point out and not in
    const lines = p.map((a, i) => {
        const b = p[(i + 1) % 3];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = (s * dy) / len, ny = (-s * dx) / len;
        return [nx, ny, nx * a[0] + ny * a[1] + pad]; // nx*x + ny*y = c
    });
    return p.map((v, i) => {
        const [ax, ay, ac] = lines[(i + 2) % 3]; // the two edges that meet at this vertex
        const [bx, by, bc] = lines[i];
        const det = ax * by - bx * ay;
        if (Math.abs(det) < 1e-9) return v; // degenerate sliver - leave it be
        return [(ac * by - bc * ay) / det, (ax * bc - bx * ac) / det];
    });
}

// Affine-map one source triangle onto its projected destination.
function drawTexTriangle(
    ctx: CanvasRenderingContext2D,
    img: CanvasImageSource,
    s0: number[], s1: number[], s2: number[],
    d0: number[], d1: number[], d2: number[],
    imgW: number, imgH: number,
) {
    const x1 = s1[0] - s0[0], y1 = s1[1] - s0[1];
    const x2 = s2[0] - s0[0], y2 = s2[1] - s0[1];
    const det = x1 * y2 - x2 * y1;
    if (!det) return;
    const u1 = d1[0] - d0[0], v1 = d1[1] - d0[1];
    const u2 = d2[0] - d0[0], v2 = d2[1] - d0[1];
    const a = (u1 * y2 - u2 * y1) / det;
    const b = (v1 * y2 - v2 * y1) / det;
    const c = (u2 * x1 - u1 * x2) / det;
    const d = (v2 * x1 - v1 * x2) / det;
    const e = d0[0] - a * s0[0] - c * s0[1];
    const f = d0[1] - b * s0[0] - d * s0[1];

    const [e0, e1, e2] = expandTriangle([d0, d1, d2], 0.8);

    // Only rasterize the source cell, not the whole sheet, for every one of the
    // hundreds of triangles in the mesh.
    const bx0 = Math.max(0, Math.floor(Math.min(s0[0], s1[0], s2[0])) - 1);
    const by0 = Math.max(0, Math.floor(Math.min(s0[1], s1[1], s2[1])) - 1);
    const bx1 = Math.min(imgW, Math.ceil(Math.max(s0[0], s1[0], s2[0])) + 1);
    const by1 = Math.min(imgH, Math.ceil(Math.max(s0[1], s1[1], s2[1])) + 1);
    if (bx1 <= bx0 || by1 <= by0) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(e0[0], e0[1]); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]);
    ctx.closePath();
    ctx.clip();
    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(img, bx0, by0, bx1 - bx0, by1 - by0, bx0, by0, bx1 - bx0, by1 - by0);
    ctx.restore();
}

// The hinge edge of each half falls into shadow, and a half turned away from the
// viewer dims overall. Together that is what reads as a bend rather than two flat
// pictures. source-atop keeps the wash on the device instead of on the stage behind it.
// `slot` reuses one of two scratch canvases instead of allocating - the fold animation
// calls this twice a frame and fresh canvases at 60fps would thrash the collector.
const shadeScratch: HTMLCanvasElement[] = [];

function shadeHalf(flat: HTMLCanvasElement, pose: Pose, angle: number, first: boolean, slot?: number): HTMLCanvasElement {
    const dim = (1 - Math.cos(rad(angle))) * 0.62;
    if (dim < 0.002) return flat;
    const c = slot === undefined
        ? document.createElement("canvas")
        : (shadeScratch[slot] ||= document.createElement("canvas"));
    const cx = c.getContext("2d")!;
    if (c.width !== flat.width || c.height !== flat.height) { c.width = flat.width; c.height = flat.height; }
    else cx.clearRect(0, 0, c.width, c.height);
    cx.globalCompositeOperation = "source-over";
    cx.drawImage(flat, 0, 0);
    const vert = pose.axis === "y";
    // the gradient runs toward this half's hinge edge
    const [gx0, gy0, gx1, gy1] = vert
        ? (first ? [0, 0, flat.width, 0] : [flat.width, 0, 0, 0])
        : (first ? [0, 0, 0, flat.height] : [0, flat.height, 0, 0]);
    const grad = cx.createLinearGradient(gx0, gy0, gx1, gy1);
    grad.addColorStop(0, `rgba(0,0,0,${dim * 0.8})`);
    grad.addColorStop(0.35, `rgba(0,0,0,${dim * 0.8})`);
    grad.addColorStop(1, `rgba(0,0,0,${Math.min(0.88, dim + 0.2)})`);
    cx.globalCompositeOperation = "source-atop";
    cx.fillStyle = grad;
    cx.fillRect(0, 0, flat.width, flat.height);
    return c;
}

// Paint one folded frame: each half is a 3D plane pinned at the hinge, drawn as a mesh
// of affine-mapped triangles - canvas has no perspective transform, so subdividing is
// what buys one. The projected box is scaled by `k` and placed at (ox, oy); `srcScale`
// says how many src px there are per full-resolution frame px, so the same geometry can
// drive a downscaled sheet during the animation and the full-size one for the export.
function paintFold(
    ctx: CanvasRenderingContext2D,
    src: HTMLCanvasElement,
    meta: FrameMeta,
    pose: Pose,
    g: ReturnType<typeof computePoseGeometry>,
    k: number, ox: number, oy: number,
    srcScale: number,
    nu: number, nv: number,
    reuse = false,
) {
    const vert = pose.axis === "y";
    // Half 1 runs from the outer edge to BLEED past the hinge; half 2 mirrors it.
    // Draw the half that sits farther from the camera first so the near one overlaps it.
    const halves = [
        { angle: pose.a, u0: -g.half, u1: POSE_BLEED, first: true },
        { angle: pose.b, u0: -POSE_BLEED, u1: g.half, first: false },
    ].sort((p, q) =>
        projectPoint(pose, (p.u0 + p.u1) / 2, 0, p.angle)[2] -
        projectPoint(pose, (q.u0 + q.u1) / 2, 0, q.angle)[2]);

    const sx = (u: number, v: number) => (vert ? g.half + u : g.cross + v) * srcScale;
    const sy = (u: number, v: number) => (vert ? g.cross + v : g.half + u) * srcScale;

    halves.forEach((h, n) => {
        const sheet = shadeHalf(src, pose, h.angle, h.first, reuse ? n : undefined);
        for (let i = 0; i < nu; i++) {
            const ua = h.u0 + ((h.u1 - h.u0) * i) / nu;
            const ub = h.u0 + ((h.u1 - h.u0) * (i + 1)) / nu;
            for (let j = 0; j < nv; j++) {
                const va = -g.cross + ((2 * g.cross) * j) / nv;
                const vb = -g.cross + ((2 * g.cross) * (j + 1)) / nv;
                const corners: [number, number][] = [[ua, va], [ub, va], [ub, vb], [ua, vb]];
                const s = corners.map(([u, v]) => [sx(u, v), sy(u, v)]);
                const d = corners.map(([u, v]) => {
                    const [x, y] = projectPoint(pose, u, v, h.angle);
                    return [(x + g.hx) * k + ox, (y + g.hy) * k + oy];
                });
                drawTexTriangle(ctx, sheet, s[0], s[1], s[2], d[0], d[1], d[2], sheet.width, sheet.height);
                drawTexTriangle(ctx, sheet, s[0], s[2], s[3], d[0], d[2], d[3], sheet.width, sheet.height);
            }
        }
    });
}

// Cells across the hinge are only needed when the camera is off-axis - with no yaw or
// pitch, depth varies along u alone and one cell across is already exact.
const crossCells = (pose: Pose, full: boolean) =>
    pose.yaw || pose.pitch ? (full ? 16 : 9) : 1;

// The export-quality fold: full mesh, native resolution, tight to the projected box.
function foldPose(flat: HTMLCanvasElement, device: DeviceType): HTMLCanvasElement {
    const meta = FRAME_META[device];
    const g = poseGeometry(device, meta);
    const out = document.createElement("canvas");
    out.width = g.width; out.height = g.height;
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    paintFold(ctx, flat, meta, meta.pose!, g, 1, 0, 0, 1, 48, crossCells(meta.pose!, true));
    return out;
}

/* ── The fold animation ─────────────────────────────────────────────────────── */

// The flat composite behind the most recent pose, kept so the animation can re-warp it
// every frame instead of recompositing. One entry - the animation runs right after the
// composite that produced it.
let lastFlat: { device: DeviceType; source: string; canvas: HTMLCanvasElement } | null = null;

function takeFlat(device: DeviceType, source: string) {
    return lastFlat && lastFlat.device === device && lastFlat.source === source ? lastFlat.canvas : null;
}

// A cheap sheet for the animation - full-resolution art is far more than a 400px-tall
// preview needs, and warping it 60 times a second would drop frames.
function downscale(src: HTMLCanvasElement, maxSide: number): HTMLCanvasElement {
    const k = Math.min(1, maxSide / Math.max(src.width, src.height));
    if (k === 1) return src;
    const c = document.createElement("canvas");
    c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
    const cx = c.getContext("2d")!;
    cx.imageSmoothingQuality = "high";
    cx.drawImage(src, 0, 0, c.width, c.height);
    return c;
}

// Fold the device into place: it starts flat-open and closes to the pose's real angles.
// Every frame is fitted inside the canvas, so the last one - the pose at full angle -
// lands exactly on the still that replaces it. Returns a cancel function.
function playFold(canvas: HTMLCanvasElement, flat: HTMLCanvasElement, device: DeviceType, onDone: () => void) {
    const meta = FRAME_META[device];
    const pose = meta.pose!;
    const sheet = downscale(flat, 820);
    const srcScale = sheet.width / meta.frameDimensions.width;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    const nv = crossCells(pose, false);
    const nu = nv > 1 ? 20 : 30;

    const DURATION = 620;
    let raf = 0, start = 0, cancelled = false;
    const step = (now: number) => {
        if (cancelled) return;
        if (!start) start = now;
        const t = Math.min(1, (now - start) / DURATION);
        const e = 1 - Math.pow(1 - t, 3); // ease-out - it swings open fast and settles
        const frame: Pose = {
            ...pose,
            a: pose.a * e, b: pose.b * e,
            yaw: (pose.yaw || 0) * e, pitch: (pose.pitch || 0) * e,
        };
        const g = computePoseGeometry(meta, frame);
        const k = Math.min(canvas.width / g.width, canvas.height / g.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        paintFold(ctx, sheet, meta, frame, g, k,
            (canvas.width - g.width * k) / 2, (canvas.height - g.height * k) / 2,
            srcScale, nu, nv, true);
        if (t < 1) raf = requestAnimationFrame(step);
        else onDone();
    };
    raf = requestAnimationFrame(step);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
}

/* ── Compositing ────────────────────────────────────────────────────────────── */

// The rect of art the screenshot paints into. Normally the whole screen. A `solo` pose
// hands the page to the half that faces the viewer and leaves the other showing the
// device's back, so the shot is laid out to the panel you actually see.
function screenRect(meta: FrameMeta) {
    let x0 = meta.screenOffset.x, y0 = meta.screenOffset.y;
    let x1 = x0 + meta.screenWidth, y1 = y0 + meta.screenHeight;
    const pose = meta.pose;
    if (pose?.solo) {
        const vert = pose.axis === "y";
        const half = (vert ? meta.frameDimensions.width : meta.frameDimensions.height) / 2;
        if (vert) { if (pose.solo === 2) x0 = half; else x1 = half; }
        else { if (pose.solo === 2) y0 = half; else y1 = half; }
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
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
    const rect = screenRect(meta);
    const screenAspect = rect.w / rect.h;
    const imgAspect = screenshot.naturalWidth / screenshot.naturalHeight;
    let dw = rect.w, dh = rect.h;
    let dx = rect.x, dy = rect.y;
    if (imgAspect > screenAspect) {
        // Wider than screen - full width, letterbox top/bottom
        dh = rect.w / imgAspect;
        dy = rect.y + (rect.h - dh) / 2;
    } else {
        // Taller than screen - full height, letterbox sides
        dw = rect.h * imgAspect;
        dx = rect.x + (rect.w - dw) / 2;
    }
    // The panel behind the shot covers the WHOLE screen - on a solo pose the half that
    // carries no page still reads as a lit panel until the fold's shading darkens it.
    // Rounded where the display opening is: a square fill would poke out past the
    // bezel's corner radius, since the frame art is transparent out there.
    const paintScreen = () => {
        ctx.save();
        if (meta.screenRadius) {
            ctx.beginPath();
            ctx.roundRect(meta.screenOffset.x, meta.screenOffset.y, meta.screenWidth, meta.screenHeight, meta.screenRadius);
            ctx.clip();
        }
        ctx.fillStyle = averageColor(screenshot);
        ctx.fillRect(meta.screenOffset.x, meta.screenOffset.y, meta.screenWidth, meta.screenHeight);
        ctx.drawImage(screenshot, dx, dy, dw, dh);
        ctx.restore();
    };

    if (meta.isPhoto) {
        ctx.drawImage(frame, 0, 0);
        paintScreen();
    } else {
        paintScreen();
        ctx.drawImage(frame, 0, 0);
    }

    // Draw Mac Mini for combo
    if (meta.isCombo && macMini) {
        const miniSize = 900;
        const miniX = meta.frameDimensions.width + 100;
        const miniY = meta.frameDimensions.height - miniSize - 200;
        ctx.drawImage(macMini, miniX, miniY, miniSize, miniSize);
    }

    if (meta.pose) {
        lastFlat = { device, source: screenshotDataUrl, canvas }; // the animation re-warps this
        return foldPose(canvas, device).toDataURL("image/png");
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

function DevicePicker({ current, onChange }: { current: DeviceType; onChange: (d: DeviceType) => void }) {
    const [hovered, setHovered] = useState<string | null>(null);
    const family = familyOf(current);
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                {FAMILIES.map(f => {
                    const active = f.id === family.id;
                    return (
                        <div key={f.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <button
                                // Switching back to a family you were already in keeps the mode you left it on.
                                onClick={() => onChange(f.devices.includes(current) ? current : f.devices[0])}
                                onMouseEnter={() => setHovered(f.id)}
                                onMouseLeave={() => setHovered(null)}
                                style={{
                                    width: 103, height: 103, borderRadius: "50%",
                                    border: active ? "2px solid #007aff" : "2px solid transparent",
                                    background: "#fff",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: active ? "0 0 0 3px rgba(0,122,255,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
                                }}
                            >
                                <img src={f.icon} alt={f.label} style={{ width: 72, height: 72, objectFit: "contain" }} draggable={false} />
                            </button>
                            <span style={{
                                fontSize: 11, fontWeight: 500, color: active ? "#4da3ff" : "#666",
                                opacity: hovered === f.id || active ? 1 : 0,
                                transition: "opacity 0.15s",
                            }}>
                                {f.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Sub-selection - orientation, or the Duo's fold poses */}
            {family.devices.length > 1 && (
                <div style={{
                    display: "flex", gap: 4, padding: 4, borderRadius: 13,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.07)",
                }}>
                    {family.devices.map(d => {
                        const on = d === current;
                        return (
                            <button
                                key={d}
                                onClick={() => onChange(d)}
                                title={FRAME_META[d].label}
                                style={{
                                    height: 30, padding: "0 14px", borderRadius: 9, border: "none",
                                    fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", letterSpacing: "0.01em",
                                    cursor: "pointer", whiteSpace: "nowrap",
                                    color: on ? "#fff" : "#9a9aa2",
                                    background: on ? "#007aff" : "transparent",
                                    transition: "background 0.15s, color 0.15s",
                                }}
                                onMouseEnter={e => { if (!on) { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#e6e6ea"; } }}
                                onMouseLeave={e => { if (!on) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9a9aa2"; } }}
                            >
                                {FRAME_META[d].mode}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── Preview stage ──────────────────────────────────────────────────────────── */

/* Holds the frame on screen while the next one composites, so a device switch never
   flashes the bare screenshot, then crossfades the two. A pose arrives folding: the
   canvas plays the fold and hands over to the still on its last frame. */
function FramePreview({ image }: { image: FrameImage }) {
    const meta = FRAME_META[image.device];

    const [shown, setShown] = useState<{ src: string; device: DeviceType } | null>(null);
    const [prev, setPrev] = useState<string | null>(null);
    const [lit, setLit] = useState(true);     // drives the crossfade between the two layers
    const [folding, setFolding] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // The box follows what is actually on screen - the old frame keeps its own size
    // until the new one is ready, then the box eases to the new one as they crossfade.
    const pending = !image.composited; // compositing the next frame - dim, do not blank
    const box = folding || !shown ? image.device : shown.device;
    const boxDims = outputDimensions(box);
    const h = FRAME_META[box].displayHeight;
    const w = Math.round((h * boxDims.width) / boxDims.height);

    useEffect(() => {
        if (!image.composited) return; // still compositing - leave the last frame up
        const src = image.composited;
        const land = (folded: boolean) => {
            if (folded) {
                // the fold's last frame IS the still, so hand over without a crossfade
                setPrev(null);
                setLit(true);
            } else {
                setPrev(shown && shown.src !== src ? shown.src : null);
                setLit(false);
                requestAnimationFrame(() => requestAnimationFrame(() => setLit(true)));
            }
            setFolding(false);
            setShown({ src, device: image.device });
        };

        const flat = takeFlat(image.device, image.dataUrl);
        const canvas = canvasRef.current;
        if (!meta.pose || !flat || !canvas) { land(false); return; }

        // Size the canvas to the POSE's own box - the container is still the outgoing
        // frame's size at this point, and is about to ease across to this one.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const target = outputDimensions(image.device);
        const th = meta.displayHeight;
        const tw = Math.round((th * target.width) / target.height);
        canvas.width = Math.round(tw * dpr);
        canvas.height = Math.round(th * dpr);
        setFolding(true);
        return playFold(canvas, flat, image.device, () => land(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image.composited, image.device]);

    const layer: React.CSSProperties = {
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "contain", display: "block",
        transition: "opacity 0.26s ease",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
                position: "relative", width: w, height: h,
                opacity: pending ? 0.45 : 1,
                transform: pending ? "scale(0.97)" : "scale(1)",
                transition: "width 0.34s cubic-bezier(0.22,1,0.36,1), height 0.34s cubic-bezier(0.22,1,0.36,1),"
                    + " opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)",
            }}>
                {prev && <img src={prev} alt="" style={{ ...layer, opacity: lit ? 0 : 1 }} draggable={false} />}
                {shown && <img src={shown.src} alt={meta.label} style={{ ...layer, opacity: folding ? 0 : lit ? 1 : 0 }} draggable={false} />}
                <canvas ref={canvasRef} style={{ ...layer, opacity: folding ? 1 : 0 }} />
            </div>
            <span style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500, textAlign: "center", width: "100%" }}>
                {meta.group === "TV" ? `TV - ${meta.label}` : `Apple ${meta.label}`}
            </span>
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
                        {(["iphone", "iphone-landscape", "iphone-duo", "iphone-duo-open", "ipad-portrait", "ipad-landscape", "macbook", "imac", "studio-display", "studio-mini"] as const).map(d => (
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
        if (device === "iphone" || device === "iphone-duo") return "/assets/screenshots/bunlongheng-mobile.png";
        if (device === "ipad-portrait" || device === "iphone-duo-laptop") return "/assets/screenshots/bunlongheng-tablet.png";
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

        // Let the stage paint its working state first. Compositing - and, for a pose,
        // the full-resolution fold and PNG encode - blocks the main thread for a few
        // hundred ms, so the dim/scale has to be on screen and running on the
        // compositor before we start, or the transition never gets shown at all.
        const painted = new Promise<void>(r =>
            requestAnimationFrame(() => requestAnimationFrame(() => r())));

        painted.then(() => Promise.all(
            images.map(async (img) => {
                const composited = await compositeFrame(img.dataUrl, img.device);
                return { ...img, composited };
            })
        )).then((results) => {
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
                                iPhone · iPhone Duo · iPad · MacBook · iMac · Studio Display
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
                            {images.map(img => <FramePreview key={img.id} image={img} />)}
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

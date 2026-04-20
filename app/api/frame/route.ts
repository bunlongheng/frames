import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";

/* ── Device types & metadata (mirrors client-side FRAME_META) ────────────── */

type DeviceType =
    | "iphone"
    | "ipad-portrait"
    | "ipad-landscape"
    | "macbook"
    | "imac"
    | "studio-display"
    | "studio-mini";

interface FrameMeta {
    label: string;
    file: string;
    frameDimensions: { width: number; height: number };
    screenOffset: { x: number; y: number };
    screenWidth: number;
    screenHeight: number;
    isCombo?: boolean;
}

const FRAME_META: Record<DeviceType, FrameMeta> = {
    iphone: {
        label: "iPhone 17 Pro Max",
        file: "iphone.png",
        frameDimensions: { width: 1470, height: 3000 },
        screenOffset: { x: 75, y: 217 },
        screenWidth: 1320,
        screenHeight: 2717,
    },
    "ipad-portrait": {
        label: "iPad Pro Portrait",
        file: "ipad-portrait.png",
        frameDimensions: { width: 2245, height: 2930 },
        screenOffset: { x: 96, y: 102 },
        screenWidth: 2048,
        screenHeight: 2732,
    },
    "ipad-landscape": {
        label: "iPad Pro Landscape",
        file: "ipad-landscape.png",
        frameDimensions: { width: 2930, height: 2245 },
        screenOffset: { x: 102, y: 101 },
        screenWidth: 2732,
        screenHeight: 2048,
    },
    macbook: {
        label: "MacBook Air",
        file: "macbook.png",
        frameDimensions: { width: 3306, height: 1897 },
        screenOffset: { x: 373, y: 123 },
        screenWidth: 2560,
        screenHeight: 1600,
    },
    imac: {
        label: "iMac 24″",
        file: "imac.png",
        frameDimensions: { width: 4880, height: 5720 },
        screenOffset: { x: 200, y: 1600 },
        screenWidth: 4480,
        screenHeight: 2520,
    },
    "studio-display": {
        label: "Studio Display",
        file: "apple-display.png",
        frameDimensions: { width: 5520, height: 4316 },
        screenOffset: { x: 200, y: 200 },
        screenWidth: 5120,
        screenHeight: 2880,
    },
    "studio-mini": {
        label: "Studio Display + Mac Mini",
        file: "apple-display.png",
        frameDimensions: { width: 5520, height: 4316 },
        screenOffset: { x: 200, y: 200 },
        screenWidth: 5120,
        screenHeight: 2880,
        isCombo: true,
    },
};

const VALID_DEVICES = new Set(Object.keys(FRAME_META));

/* ── Auto-detect device from aspect ratio ────────────────────────────────── */

function detectDevice(w: number, h: number): DeviceType {
    const ratio = h / w;
    if (ratio > 1.5) return "iphone";
    if (ratio > 1.0) return "ipad-portrait";
    return "macbook";
}

/* ── Composite: screenshot + device frame ────────────────────────────────── */

async function compositeFrame(
    screenshotBuffer: Buffer,
    device: DeviceType,
): Promise<Buffer> {
    const meta = FRAME_META[device];
    const framesDir = path.join(process.cwd(), "public", "assets", "frames");

    // Resize screenshot to fit the screen area
    const resizedScreenshot = await sharp(screenshotBuffer)
        .resize(meta.screenWidth, meta.screenHeight, { fit: "fill" })
        .png()
        .toBuffer();

    // Load the device frame
    const framePath = path.join(framesDir, meta.file);

    // Canvas dimensions
    const extraW = meta.isCombo ? 1200 : 0;
    const canvasWidth = meta.frameDimensions.width + extraW;
    const canvasHeight = meta.frameDimensions.height;

    // Build composite layers: screenshot under frame (transparent screen)
    const layers: sharp.OverlayOptions[] = [
        {
            input: resizedScreenshot,
            left: meta.screenOffset.x,
            top: meta.screenOffset.y,
        },
        {
            input: framePath,
            left: 0,
            top: 0,
        },
    ];

    // Add Mac Mini for combo
    if (meta.isCombo) {
        const miniSize = 900;
        const miniX = meta.frameDimensions.width + 100;
        const miniY = meta.frameDimensions.height - miniSize - 200;
        const miniPath = path.join(framesDir, "mac-mini.png");
        const resizedMini = await sharp(miniPath)
            .resize(miniSize, miniSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        layers.push({
            input: resizedMini,
            left: miniX,
            top: miniY,
        });
    }

    // Create transparent canvas and composite all layers
    const result = await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite(layers)
        .png()
        .toBuffer();

    return result;
}

/* ── POST /api/frame ─────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Missing 'image' field. Send a multipart form with an image file." },
                { status: 400 },
            );
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: `Invalid file type: ${file.type}. Must be an image.` },
                { status: 400 },
            );
        }

        // Max 20 MB
        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Image too large. Max 20 MB." },
                { status: 400 },
            );
        }

        // Device param: explicit or auto-detect
        let device = (formData.get("device") as string | null) || "";
        const buffer = Buffer.from(await file.arrayBuffer());

        if (device && !VALID_DEVICES.has(device)) {
            return NextResponse.json(
                {
                    error: `Invalid device '${device}'. Valid: ${[...VALID_DEVICES].join(", ")}`,
                },
                { status: 400 },
            );
        }

        if (!device) {
            const meta = await sharp(buffer).metadata();
            device = detectDevice(meta.width ?? 1920, meta.height ?? 1080);
        }

        const framed = await compositeFrame(buffer, device as DeviceType);

        return new NextResponse(new Uint8Array(framed), {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `inline; filename="framed-${device}-${Date.now()}.png"`,
                "X-Device": device,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/* ── GET /api/frame — usage info ─────────────────────────────────────────── */

export async function GET() {
    return NextResponse.json({
        usage: "POST /api/frame with multipart form data",
        fields: {
            image: "(required) image file — screenshot to frame",
            device: `(optional) one of: ${[...VALID_DEVICES].join(", ")}. Auto-detects from aspect ratio if omitted.`,
        },
        devices: Object.entries(FRAME_META).map(([key, meta]) => ({
            id: key,
            label: meta.label,
            screenSize: `${meta.screenWidth}x${meta.screenHeight}`,
        })),
        limits: {
            maxFileSize: "20 MB",
            acceptedTypes: "image/*",
        },
        example: 'curl -X POST -F "image=@screenshot.png" -F "device=macbook" http://localhost:3000/api/frame -o framed.png',
    });
}

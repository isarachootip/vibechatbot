import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request, { params }: { params: { filename: string } }) {
    try {
        const filename = params.filename;
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        
        const fileBuffer = await readFile(filePath);
        
        // Determine content type based on extension
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'image/jpeg'; // default
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.gif') contentType = 'image/gif';
        if (ext === '.webp') contentType = 'image/webp';
        if (ext === '.svg') contentType = 'image/svg+xml';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('File serve error:', error);
        return new NextResponse('File not found', { status: 404 });
    }
}

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const form = await request.formData();
        const file = form.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size (max 5MB to be safe)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Prepare bytes
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Prepare upload directory (public/uploads)
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if directory already exists
        }

        // Generate unique filename to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.name) || '.' + file.type.split('/')[1];
        const filename = `${uniqueSuffix}${ext}`;
        const filePath = path.join(uploadDir, filename);

        // Write file directly to local server storage
        await writeFile(filePath, buffer);

        // Return local URL (starts with /uploads/ so Next.js serves it from public folder)
        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}

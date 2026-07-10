import { NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const filename = path.join('/');
    const filepath = join(process.cwd(), 'public', 'uploads', filename);
    
    const buffer = await readFile(filepath);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.pdf')) contentType = 'application/pdf';
    else if (filename.match(/\.(jpeg|jpg)$/i)) contentType = 'image/jpeg';
    else if (filename.endsWith('.png')) contentType = 'image/png';
    else if (filename.endsWith('.webp')) contentType = 'image/webp';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return new NextResponse('File not found', { status: 404 });
  }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'property-images';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

    // Use Supabase Storage if the API key is configured (i.e. not the dummy key)
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('dummy')) {
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return NextResponse.json({ error: 'Failed to upload to Supabase' }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filename);
      return NextResponse.json({ url: publicUrlData.publicUrl, success: true });
    } else {
      // Fallback: Save locally in public/uploads (useful for development without Supabase keys)
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      const filepath = join(uploadDir, filename);
      
      // Ensure the directory exists
      try {
        await writeFile(filepath, buffer);
      } catch (e: any) {
        // Simple fallback if directory doesn't exist (e.g. create it or just fail)
        const fs = await import('fs');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        await writeFile(filepath, buffer);
      }

      const url = `/api/uploads/${filename}`;
      return NextResponse.json({ url, success: true, local: true });
    }
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

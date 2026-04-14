import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const BUCKET = 'player-images';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Build a safe unique filename. Strip path separators and unsafe chars.
    const originalName = file.name || 'upload';
    const safeName = originalName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .slice(0, 80) || 'upload';
    const filename = `${Date.now()}-${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '31536000',
        upsert: false
      });

    if (uploadErr) {
      console.error('Supabase storage upload failed:', uploadErr);
      return NextResponse.json(
        { error: `Upload failed: ${uploadErr.message}` },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename);

    if (!publicData?.publicUrl) {
      return NextResponse.json(
        { error: 'Upload succeeded but public URL generation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicData.publicUrl
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

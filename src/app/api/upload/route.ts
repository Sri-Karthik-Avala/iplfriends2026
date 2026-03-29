import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Replace spaces with underscores and create unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filepath = join(process.cwd(), 'public/uploads', filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({ 
      success: true, 
      imageUrl: `/uploads/${filename}` 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

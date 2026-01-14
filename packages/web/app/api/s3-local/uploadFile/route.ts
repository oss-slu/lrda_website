import { NextRequest, NextResponse } from 'next/server';

// LocalStack S3 endpoint for local development
const LOCALSTACK_URL = process.env.LOCALSTACK_URL || 'http://localhost:4566';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'livedreligion-local';
const USE_LOCAL_S3 = process.env.NEXT_PUBLIC_USE_LOCAL_S3 === 'true';

export async function POST(request: NextRequest) {
  if (!USE_LOCAL_S3) {
    return NextResponse.json(
      { error: 'Local S3 not enabled. Set NEXT_PUBLIC_USE_LOCAL_S3=true' },
      { status: 400 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name || `media-${Date.now()}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to LocalStack S3
    const s3Url = `${LOCALSTACK_URL}/${BUCKET_NAME}/${fileName}`;

    const uploadResponse = await fetch(s3Url, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('S3 upload failed:', errorText);
      return NextResponse.json({ error: 'Upload failed', details: errorText }, { status: 500 });
    }

    // Return the public URL for the uploaded file
    const publicUrl = `${LOCALSTACK_URL}/${BUCKET_NAME}/${fileName}`;

    return new NextResponse(null, {
      status: 201,
      headers: {
        Location: publicUrl,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed', details: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    enabled: USE_LOCAL_S3,
    endpoint: LOCALSTACK_URL,
    bucket: BUCKET_NAME,
    uploadUrl: '/api/s3-local/uploadFile',
  });
}

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/utils/auth/auth'
import { prisma } from '@/utils/prisma'
import { S3 } from '@/utils/s3'
import { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    // Check if S3 is properly configured
    if (!process.env.S3_BUCKET || !process.env.S3_ENDPOINT) {
      console.error('S3 configuration missing. Required: S3_BUCKET, S3_ENDPOINT');
      return NextResponse.json(
        { success: false, message: 'Bestandsupload is momenteel niet beschikbaar. Contacteer de beheerder.' },
        { status: 500 }
      )
    }

    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Je moet ingelogd zijn om je profielfoto te wijzigen.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('profilePicture') as File

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Geen bestand geüpload.' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Alleen JPEG, PNG en WebP bestanden zijn toegestaan.' },
        { status: 400 }
      )
    }

    // Convert file to buffer to check size and maybe compress
    const fileBuffer = await file.arrayBuffer()
    let buffer: Buffer = Buffer.from(fileBuffer)
    let fileType = file.type
    let fileExtension = file.name.split('.').pop()

    // Compress image ONLY if it's over the size limit
    if (buffer.length > MAX_FILE_SIZE) {
      try {
        buffer = await sharp(buffer)
          .resize({ width: 1024, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        fileType = 'image/webp';
        fileExtension = 'webp';
      } catch (compressionError) {
        console.error('Error compressing image:', compressionError);
        return NextResponse.json(
          { success: false, message: 'Er is een fout opgetreden bij het comprimeren van de afbeelding.' },
          { status: 500 }
        );
      }
    }

    // Delete old profile pictures first by listing them
    const listResponse = await S3.send(new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      Prefix: `uploads/pfp/${user.id}`,
    }));

    if (listResponse.Contents) {
      const objectsToDelete = listResponse.Contents.filter(obj => {
        const key = obj.Key || '';
        const base = `uploads/pfp/${user.id}`;
        const remainder = key.substring(base.length);
        return remainder.startsWith('.') || remainder.startsWith('_');
      }).map(obj => ({ Key: obj.Key }));

      if (objectsToDelete.length > 0) {
        await S3.send(new DeleteObjectsCommand({
          Bucket: process.env.S3_BUCKET,
          Delete: { Objects: objectsToDelete },
        }));
      }
    }

    // Generate filename with timestamp for versioning
    const fileName = `uploads/pfp/${user.id}_${Date.now()}.${fileExtension}`

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: fileType,
      ContentDisposition: 'inline',
      CacheControl: 'public, max-age=31536000', // 1 year, since filename is versioned
    })

    await S3.send(uploadCommand)

    // Build public URL
    const publicUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${fileName}`

    await prisma.user.update({
      where: { id: user.id },
      data: { image: publicUrl },
    })

    return NextResponse.json({
      success: true,
      message: 'Profielfoto succesvol geüpload.',
      imageUrl: publicUrl
    })

  } catch (error) {
    console.error('Error uploading profile picture:', error)
    return NextResponse.json(
      { success: false, message: 'Er is een fout opgetreden bij het uploaden van je profielfoto.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if S3 is properly configured
    if (!process.env.S3_BUCKET || !process.env.S3_ENDPOINT) {
      console.error('S3 configuration missing. Required: S3_BUCKET, S3_ENDPOINT');
      return NextResponse.json(
        { success: false, message: 'Bestandsverwijdering is momenteel niet beschikbaar. Contacteer de beheerder.' },
        { status: 500 }
      )
    }

    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Je moet ingelogd zijn om je profielfoto te verwijderen.' },
        { status: 401 }
      )
    }

    // List all possible profile pictures for the user
    const listResponse = await S3.send(new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      Prefix: `uploads/pfp/${user.id}`,
    }));

    const objectsToDelete = (listResponse.Contents || [])
      .filter(obj => {
        const key = obj.Key || '';
        const base = `uploads/pfp/${user.id}`;
        const remainder = key.substring(base.length);
        return remainder.startsWith('.') || remainder.startsWith('_');
      })
      .map(obj => ({ Key: obj.Key }));

    if (objectsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Je hebt geen profielfoto om te verwijderen.' },
        { status: 400 }
      );
    }

    // Delete all found profile pictures from S3
    await S3.send(new DeleteObjectsCommand({
      Bucket: process.env.S3_BUCKET,
      Delete: { Objects: objectsToDelete },
    }));

    await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
    })


    return NextResponse.json({
      success: true,
      message: 'Profielfoto succesvol verwijderd.'
    })

  } catch (error) {
    console.error('Error deleting profile picture:', error)
    return NextResponse.json(
      { success: false, message: 'Er is een fout opgetreden bij het verwijderen van je profielfoto.' },
      { status: 500 }
    )
  }
}

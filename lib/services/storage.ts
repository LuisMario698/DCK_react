import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function uploadManifiestoImage(file: File, numeroManifiesto: string): Promise<string> {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const fileName = `${numeroManifiesto}_${timestamp}.${extension}`;
  const dir = path.join(UPLOAD_DIR, 'manifiestos_img');
  await ensureDir(dir);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, fileName), buffer);
  return `/api/files/manifiestos_img/${fileName}`;
}

export async function uploadManifiestoPDF(file: File | Blob, numeroManifiesto: string): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${numeroManifiesto}_${timestamp}.pdf`;
  const dir = path.join(UPLOAD_DIR, 'manifiestos_pdf');
  await ensureDir(dir);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, fileName), buffer);
  return `/api/files/manifiestos_pdf/${fileName}`;
}

export async function uploadBasuronPDF(file: File | Blob, numeroTicket: string): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${numeroTicket}_${timestamp}.pdf`;
  const dir = path.join(UPLOAD_DIR, 'basuron_pdf');
  await ensureDir(dir);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, fileName), buffer);
  return `/api/files/basuron_pdf/${fileName}`;
}

export async function uploadNoFirmadoPDF(file: File | Blob, nombre: string): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${nombre}_${timestamp}.pdf`;
  const dir = path.join(UPLOAD_DIR, 'no_firmados');
  await ensureDir(dir);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, fileName), buffer);
  return `/api/files/no_firmados/${fileName}`;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  // URL format: /api/files/<bucket>/<filename>
  const parts = fileUrl.split('/');
  const bucket = parts[parts.length - 2];
  const fileName = parts[parts.length - 1];
  if (!fileName || !bucket) return;
  const filePath = path.join(UPLOAD_DIR, bucket, fileName);
  await fs.unlink(filePath).catch(() => {});
}

export async function deleteManifiestoImage(imageUrl: string): Promise<void> {
  return deleteFile(imageUrl);
}

export async function getManifiestoImageUrl(fileName: string): Promise<string> {
  return `/api/files/manifiestos_img/${fileName}`;
}

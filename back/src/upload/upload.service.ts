import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';

export enum UploadCategorie {
  LOGO = 'logos',
  COUVERTURE = 'couvertures',
  PRODUIT = 'produits',
  DOCUMENT = 'documents',
  PUBLICATION = 'publications',
  AVATAR = 'avatars',
  SYSTEM = 'system',
}

@Injectable()
export class UploadService {
  private readonly rootDir = join(process.cwd(), 'uploads');

  private readonly allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  private readonly imageMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  private readonly maxSize = 10 * 1024 * 1024; // 10 MB
  private readonly maxImageSize = 5 * 1024 * 1024; // 5 MB

  /* ============================================
     SAUVEGARDER UN FICHIER
     ============================================ */
  async saveFile(
    file: Express.Multer.File,
    categorie: UploadCategorie,
  ): Promise<{ url: string; filename: string; size: number; mime: string }> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const isImageCat =
      categorie === UploadCategorie.AVATAR ||
      categorie === UploadCategorie.SYSTEM;

    const maxSize = isImageCat ? this.maxImageSize : this.maxSize;
    const allowed = isImageCat ? this.imageMimes : this.allowedMimes;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `Fichier trop volumineux (max ${maxSize / 1024 / 1024} Mo)`,
      );
    }

    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé : ${file.mimetype}`,
      );
    }

    const ext = extname(file.originalname);
    const uniqueName = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;

    const dir = join(this.rootDir, categorie);
    const filepath = join(dir, uniqueName);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filepath, file.buffer);

    const url = `/uploads/${categorie}/${uniqueName}`;

    return {
      url,
      filename: uniqueName,
      size: file.size,
      mime: file.mimetype,
    };
  }

  /* ============================================
     SAUVEGARDER LE LOGO CCI (nom fixe, écrasé)
     ============================================ */
  async saveCciLogo(
    file: Express.Multer.File,
  ): Promise<{ url: string; filename: string; size: number; mime: string }> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (file.size > this.maxImageSize) {
      throw new BadRequestException(
        `Fichier trop volumineux (max ${this.maxImageSize / 1024 / 1024} Mo)`,
      );
    }

    if (!this.imageMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Image requise (JPG, PNG, WEBP, GIF). Reçu : ${file.mimetype}`,
      );
    }

    const dir = join(this.rootDir, UploadCategorie.SYSTEM);
    const filename = 'cci-logo.png'; // toujours le même nom
    const filepath = join(dir, filename);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filepath, file.buffer);

    // Ajouter un timestamp pour casser le cache navigateur
    const url = `/uploads/system/${filename}?v=${Date.now()}`;

    return {
      url,
      filename,
      size: file.size,
      mime: file.mimetype,
    };
  }

  /* ============================================
     VÉRIFIER SI LE LOGO CCI EXISTE
     ============================================ */
  async getCciLogoUrl(): Promise<{ url: string | null }> {
    const filepath = join(
      this.rootDir,
      UploadCategorie.SYSTEM,
      'cci-logo.png',
    );
    try {
      await fs.access(filepath);
      const stat = await fs.stat(filepath);
      return { url: `/uploads/system/cci-logo.png?v=${stat.mtimeMs}` };
    } catch {
      return { url: null };
    }
  }

  /* ============================================
     SUPPRIMER UN FICHIER
     ============================================ */
  async deleteFile(url: string): Promise<{ deleted: boolean }> {
    try {
      const relativePath = url.replace(/^\/+/, '').split('?')[0];
      const filepath = join(process.cwd(), relativePath);
      await fs.unlink(filepath);
      return { deleted: true };
    } catch {
      return { deleted: false };
    }
  }
}
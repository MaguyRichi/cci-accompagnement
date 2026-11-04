import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  
  async uploadToCloudinary(file: Express.Multer.File, folder: string) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `cci-accompagnement/${folder}` },
        (error, result) => {
          // ✅ 1. On gère l'erreur renvoyée par Cloudinary
          if (error) {
            return reject(new InternalServerErrorException(error.message));
          }
          
          // ✅ 2. On vérifie que 'result' existe bien (corrige l'erreur TS)
          if (!result) {
            return reject(new InternalServerErrorException("Échec de l'upload sur Cloudinary"));
          }

          // 3. On renvoie les infos en toute sécurité
          resolve({
            url: result.secure_url,
            filename: result.public_id,
            size: file.size,
            mime: file.mimetype,
          });
        }
      );
      
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async uploadLogo(file: Express.Multer.File) {
    return this.uploadToCloudinary(file, 'logos');
  }

  async uploadCouverture(file: Express.Multer.File) {
    return this.uploadToCloudinary(file, 'couvertures');
  }

  async uploadProduit(file: Express.Multer.File) {
    return this.uploadToCloudinary(file, 'produits');
  }

  async uploadDocument(file: Express.Multer.File) {
    return this.uploadToCloudinary(file, 'documents');
  }

  async uploadPublication(file: Express.Multer.File) {
    return this.uploadToCloudinary(file, 'publications');
  }

  async uploadAvatar(file: Express.Multer.File) {
    return this.uploadToCloudinary(file, 'avatars');
  }

  async uploadCciLogo(file: Express.Multer.File) {
    return this.uploadToCloudinary(file, 'cci-logo');
  }
}
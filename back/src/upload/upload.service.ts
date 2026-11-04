import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

export type UploadCategorie =
  | 'logo'
  | 'couverture'
  | 'produit'
  | 'document'
  | 'publication'
  | 'avatar'
  | 'cci-logo';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  // ✅ La fonction qui remplace l'ancienne logique et envoie vers Cloudinary
  async saveFile(file: Express.Multer.File, folder: UploadCategorie = 'logo') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `cci-accompagnement/${folder}` },
        (error, result) => {
          if (error) {
            return reject(new InternalServerErrorException(error.message));
          }
          if (!result) {
            return reject(new InternalServerErrorException("Échec de l'upload"));
          }

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

  // ✅ Pour le logo CCI (utilisé par l'admin)
  async saveCciLogo(file: Express.Multer.File) {
    return this.saveFile(file, 'cci-logo');
  }

  // ✅ Récupérer l'URL du logo CCI (puisqu'on ne stocke plus en local)
  async getCciLogoUrl() {
    // On peut retourner l'URL statique hébergée sur Cloudinary ou une URL par défaut
    // Si tu avais un moyen de le stocker en base, adapte cette partie.
    return { url: null }; 
  }
}
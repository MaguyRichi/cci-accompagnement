import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {}

  async saveFile(file: Express.Multer.File, folder: string = 'logo') {
    if (!file) {
      throw new InternalServerErrorException('Aucun fichier fourni');
    }
    
    this.logger.log(`📤 Upload vers Cloudinary (sans dossier) - Taille: ${file.size} bytes`);

    // ✅ CORRECTION DÉFINITIVE : On force la configuration AVANT l'upload
    // pour s'assurer que SHA-256 est utilisé si ton compte l'exige [citation:1]
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
      signature_algorithm: 'sha256', // Force SHA-256 [citation:1]
    });

    return new Promise((resolve, reject) => {
      // ✅ On ne passe aucun paramètre (pas de folder) pour éviter tout décalage de signature
      const uploadStream = cloudinary.uploader.upload_stream(
        {},
        (error, result) => {
          if (error) {
            this.logger.error('❌ Erreur Cloudinary:', error);
            return reject(new InternalServerErrorException(error.message));
          }
          if (!result) {
            return reject(new InternalServerErrorException("Échec de l'upload"));
          }

          this.logger.log(`✅ Upload réussi: ${result.secure_url}`);
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

  async saveCciLogo(file: Express.Multer.File) {
    return this.saveFile(file, 'cci-logo');
  }

  async getCciLogoUrl() {
    return { url: null }; 
  }
}
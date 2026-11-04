import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {
    // ✅ Initialisation directe de Cloudinary ici
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async saveFile(file: Express.Multer.File, folder: string = 'logo') {
    if (!file) {
      this.logger.error('❌ Aucun fichier reçu');
      throw new InternalServerErrorException('Aucun fichier fourni');
    }
    
    this.logger.log(`📤 Upload vers Cloudinary - Dossier: ${folder}, Taille: ${file.size} bytes`);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `cci-accompagnement/${folder}` },
        (error, result) => {
          if (error) {
            this.logger.error('❌ Erreur Cloudinary:', error);
            return reject(new InternalServerErrorException(error.message));
          }
          if (!result) {
            this.logger.error('❌ Cloudinary pas de résultat');
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
      
      if (!file.buffer) {
        this.logger.error('❌ Le fichier n\'a pas de buffer');
        return reject(new InternalServerErrorException("Buffer manquant"));
      }
      
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
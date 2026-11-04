import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  async saveFile(file: Express.Multer.File, folder: string = 'logo') {
    // ✅ Vérification 1 : Le fichier est-il bien reçu ?
    if (!file) {
      this.logger.error('❌ Aucun fichier reçu par Multer');
      throw new InternalServerErrorException('Aucun fichier fourni');
    }
    
    this.logger.log(`📤 Upload vers Cloudinary - Dossier: ${folder}, Taille: ${file.size} bytes`);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `cci-accompagnement/${folder}` },
        (error, result) => {
          // ✅ Vérification 2 : Cloudinary a-t-il renvoyé une erreur ?
          if (error) {
            this.logger.error('❌ Erreur Cloudinary:', error);
            return reject(new InternalServerErrorException(error.message));
          }
          
          if (!result) {
            this.logger.error('❌ Cloudinary n\'a renvoyé aucun résultat');
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
      
      // ✅ Vérification 3 : Le buffer existe-t-il ?
      if (!file.buffer) {
        this.logger.error('❌ Le fichier n\'a pas de buffer (vérifie memoryStorage)');
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
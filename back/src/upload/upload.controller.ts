import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { UploadService, UploadCategorie } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /* ============================================
     UPLOAD GÉNÉRIQUE
     ============================================ */

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('categorie') categorie?: string,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const cat = this.parseCategorie(categorie);
    const result = await this.uploadService.saveFile(file, cat);
    return { message: 'Fichier uploadé avec succès', ...result };
  }

  /* ============================================
     AVATAR (photo de profil) — tous rôles
     ============================================ */

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const result = await this.uploadService.saveFile(
      file,
      UploadCategorie.AVATAR,
    );
    return { message: 'Photo de profil uploadée', ...result };
  }

  /* ============================================
     LOGO CCI (global, ADMIN uniquement)
     ============================================ */

  @Post('cci-logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadCciLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const result = await this.uploadService.saveCciLogo(file);
    return { message: 'Logo CCI mis à jour', ...result };
  }

  /* ============================================
     LIRE LE LOGO CCI ACTUEL (public)
     ============================================ */

  @Get('cci-logo-url')
  async getCciLogoUrl() {
    return this.uploadService.getCciLogoUrl();
  }

  /* ============================================
     UPLOADS SPÉCIALISÉS EXISTANTS
     ============================================ */

  @Post('logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const result = await this.uploadService.saveFile(
      file,
      UploadCategorie.LOGO,
    );
    return { message: 'Logo uploadé', ...result };
  }

  @Post('couverture')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadCouverture(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const result = await this.uploadService.saveFile(
      file,
      UploadCategorie.COUVERTURE,
    );
    return { message: 'Couverture uploadée', ...result };
  }

  @Post('produit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadProduit(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const result = await this.uploadService.saveFile(
      file,
      UploadCategorie.PRODUIT,
    );
    return { message: 'Image produit uploadée', ...result };
  }

  @Post('document')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const result = await this.uploadService.saveFile(
      file,
      UploadCategorie.DOCUMENT,
    );
    return { message: 'Document uploadé', ...result };
  }

  @Post('publication')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadPublication(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const result = await this.uploadService.saveFile(
      file,
      UploadCategorie.PUBLICATION,
    );
    return { message: 'Image de publication uploadée', ...result };
  }

  /* ============================================
     HELPERS
     ============================================ */

  private parseCategorie(cat?: string): UploadCategorie {
    switch (cat) {
      case 'logo':
        return UploadCategorie.LOGO;
      case 'couverture':
        return UploadCategorie.COUVERTURE;
      case 'produit':
        return UploadCategorie.PRODUIT;
      case 'publication':
        return UploadCategorie.PUBLICATION;
      case 'avatar':
        return UploadCategorie.AVATAR;
      default:
        return UploadCategorie.DOCUMENT;
    }
  }
}
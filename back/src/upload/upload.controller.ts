import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service'; // ✅ On a enlevé UploadCategorie

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.uploadService.saveFile(file, 'document');
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.uploadService.saveFile(file, 'avatar');
  }

  @Post('cci-logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCciLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.uploadService.saveCciLogo(file);
  }

  @Get('cci-logo-url')
  async getCciLogoUrl() {
    return this.uploadService.getCciLogoUrl();
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.uploadService.saveFile(file, 'logo');
  }

  @Post('couverture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCouverture(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.uploadService.saveFile(file, 'couverture');
  }

  @Post('produit')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProduit(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.uploadService.saveFile(file, 'produit');
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.uploadService.saveFile(file, 'document');
  }

  @Post('publication')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPublication(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.uploadService.saveFile(file, 'publication');
  }
}
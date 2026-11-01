declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}

declare module 'multer' {
  export function diskStorage(options: any): any;
  export function memoryStorage(): any;
}

declare module 'bcrypt' {
  export function hash(data: string, salt: number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function genSalt(rounds: number): Promise<string>;
}

declare module 'passport-jwt' {
  export const ExtractJwt: any;
  export const Strategy: any;
}
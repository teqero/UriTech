import { IsObject } from 'class-validator';

export class RegisterWebPushDto {
  @IsObject()
  subscription!: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    expirationTime?: number | null;
  };
}

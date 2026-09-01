import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: string;
  vendorSubtype?: string;
  kycTier?: string;
  jti?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUserPayload | 'sub' | undefined, ctx: ExecutionContext): JwtUserPayload | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUserPayload;
    if (!user) return undefined as any;

    // Mapear 'sub' (do JWT) para 'userId'
    const key = data === 'sub' ? 'userId' : data;
    if (key) {
      return (user as any)[key] as string;
    }
    return user;
  },
);

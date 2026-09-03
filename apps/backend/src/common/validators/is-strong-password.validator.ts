import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Passwords mais comuns (blocklist). Evita escolhas triviais
 * que passariam nas regras de complexidade.
 */
const COMMON_PASSWORDS = new Set([
  'password123!', 'Password123!', 'Qwerty123456!', 'Admin123456!',
  'Uritech12345!', '123456789012', 'Aa1234567890!', 'Welcome1234!',
]);

export interface StrongPasswordOptions {
  minLength?: number;
}

/**
 * Valida força da palavra-passe:
 * - mínimo 12 caracteres (configurável), máximo 128
 * - pelo menos 1 maiúscula, 1 minúscula, 1 dígito e 1 símbolo
 * - não pode estar na blocklist de passwords comuns
 */
export function IsStrongPassword(
  options?: StrongPasswordOptions,
  validationOptions?: ValidationOptions,
) {
  const minLength = options?.minLength ?? 12;

  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          if (value.length < minLength || value.length > 128) return false;
          if (!/[a-z]/.test(value)) return false;
          if (!/[A-Z]/.test(value)) return false;
          if (!/\d/.test(value)) return false;
          if (!/[^A-Za-z0-9]/.test(value)) return false;
          if (COMMON_PASSWORDS.has(value)) return false;
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return (
            `${args.property} deve ter no mínimo ${minLength} caracteres, ` +
            'incluindo pelo menos uma letra maiúscula, uma minúscula, um número e um símbolo, ' +
            'e não pode ser uma palavra-passe comum.'
          );
        },
      },
    });
  };
}

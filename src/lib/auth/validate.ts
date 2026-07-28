const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export const PASSWORD_REQUIREMENTS =
  "8 caractères minimum, avec au moins une majuscule, une minuscule, un chiffre et un caractère spécial.";

export type PasswordCheck = { label: string; passed: boolean };

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: "8 caractères minimum", passed: password.length >= 8 },
    { label: "Une majuscule", passed: /[A-Z]/.test(password) },
    { label: "Une minuscule", passed: /[a-z]/.test(password) },
    { label: "Un chiffre", passed: /[0-9]/.test(password) },
    { label: "Un caractère spécial", passed: /[^a-zA-Z0-9]/.test(password) },
  ];
}

export function isValidPassword(password: string): boolean {
  return getPasswordChecks(password).every((check) => check.passed);
}

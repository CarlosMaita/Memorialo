import { toast } from 'sonner@2.0.3';

/**
 * Handles the `onInvalid` event on email inputs, replacing the browser's
 * native validation tooltip with a toast notification.
 */
export function handleEmailInputInvalid(e: { preventDefault: () => void; currentTarget: HTMLInputElement }) {
  e.preventDefault();
  const input = e.currentTarget;
  if (input.validity.typeMismatch) {
    toast.error('El correo electrónico no es válido');
  } else if (input.validity.valueMissing) {
    toast.error('El correo electrónico es requerido');
  }
}

/**
 * Returns true when the error message indicates the email address is already
 * registered (covers Supabase Edge Functions and Laravel backends).
 */
export function isEmailAlreadyTakenError(message: string): boolean {
  return (
    message.includes('ya está registrado') ||
    message.includes('already been registered') ||
    message.includes('has already been taken')
  );
}

/**
 * Returns true when the error message indicates the email format is invalid
 * (server-side validation fallback for both backends).
 */
export function isInvalidEmailFormatError(message: string): boolean {
  return (
    message.includes('must be a valid email') ||
    message.includes('correo electrónico no es válido')
  );
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Błędne dane logowania',
  'Email not confirmed': 'Potwierdź adres email przed logowaniem',
  'User already registered': 'Użytkownik o tym adresie email już istnieje',
  'Password should be at least 6 characters': 'Hasło musi mieć co najmniej 6 znaków',
}

export function translateAuthError(message: string): string {
  return AUTH_ERROR_MESSAGES[message] ?? message
}

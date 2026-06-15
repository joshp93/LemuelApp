export const getPasswordError = (password: string): string | null => {
  if (password.length === 0) return null;
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[0-9]/.test(password)) return "Password must contain at least 1 number";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least 1 uppercase letter";
  if (!/[a-z]/.test(password))
    return "Password must contain at least 1 lowercase letter";
  return null;
};

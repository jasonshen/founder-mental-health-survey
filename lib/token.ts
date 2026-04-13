const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I, L, O, 0, 1 to avoid confusion

function randomChars(n: number): string {
  let result = "";
  const array = new Uint8Array(n);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += CHARS[byte % CHARS.length];
  }
  return result;
}

export function generateToken(): string {
  return `FMH-${randomChars(4)}`;
}

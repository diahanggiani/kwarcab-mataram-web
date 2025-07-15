// fungsi format nta
export function formatNta(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  const part1 = digits.slice(0, 4);
  const part2 = digits.slice(4, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9);
  return [part1, part2, part3, part4].filter(Boolean).join(".");
}
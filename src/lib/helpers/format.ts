import { Role } from "@prisma/client";

// fungsi format nta
export function formatNta(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  const part1 = digits.slice(0, 4);
  const part2 = digits.slice(4, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9);
  return [part1, part2, part3, part4].filter(Boolean).join(".");
}

// fungsi format kode berdasarkan role user
export function formatKode(role: Role, raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (role === "USER_KWARCAB") {
    if (!/^\d{4}$/.test(digits)) {
      throw new Error("The kwartir cabang code format is incorrect (ex: XX.XX)");
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}`;
  }

  if (role === "USER_KWARAN") {
    if (!/^\d{6}$/.test(digits)) {
      throw new Error("The kwartir ranting code format is incorrect (ex: XX.XX.XX)");
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}`;
  }

  if (role === "USER_GUSDEP") {
    if (!/^\d{10}$/.test(digits)) {
      throw new Error("The gugus depan code format is incorrect (ex: XX.XXX-XX.XXX)");
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}-${digits.slice(5, 7)}.${digits.slice(7, 10)}`;
  }

  throw new Error("User role not recognized");
}
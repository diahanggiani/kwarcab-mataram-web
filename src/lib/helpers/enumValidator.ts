// setiap properti adalah nama enum dan nilainya adalah array string yang merupakan pilihan validnya
const enumValues = {
    Gender: ["LAKI_LAKI", "PEREMPUAN"],
    Agama: ["HINDU", "KATOLIK", "KRISTEN", "ISLAM", "BUDDHA", "KONGHUCU"],
    StatusKeaktifan: ["AKTIF", "NON_AKTIF"],
    JenjangAnggota: [
      "SIAGA_MULA", "SIAGA_BANTU", "SIAGA_TATA",
      "PENGGALANG_RAMU", "PENGGALANG_RAKIT", "PENGGALANG_TERAP",
      "PENEGAK_BANTARA", "PENEGAK_LAKSANA", "PANDEGA"
    ],
    JenjangPembina: ["SIAGA", "PENGGALANG", "PENEGAK_PANDEGA"],
    Tingkat: ["SIAGA", "PENGGALANG", "PENEGAK", "PANDEGA"],
    Status: ["DITERIMA", "DITOLAK", "MENUNGGU"]
} as const; //membuat semua isi array di dalam `enumValues` dianggap literal yang tidak bisa diubah oleh typescript

type EnumValues = typeof enumValues;
type EnumKey = keyof EnumValues;
type EnumValue<K extends EnumKey> = EnumValues[K][number];

export function isValidEnum<K extends EnumKey>(
    enumName: K,
    value: string
): value is EnumValue<K> {
    return (enumValues[enumName] as readonly string[]).includes(value);
}

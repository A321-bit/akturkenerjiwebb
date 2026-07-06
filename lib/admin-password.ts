import bcrypt from "bcryptjs";

// Hash base64 olarak saklanıyor: bcrypt hash'i "$2b$10$..." şeklinde "$" karakterleri
// içerir ve Next.js'in ortam değişkeni yükleyicisi bunları "$DEĞİŞKEN_ADI" referansı
// sanıp genişletmeye (expand) çalışıp değeri bozuyor. Base64 bu sorunu tamamen ortadan kaldırır.
export function verifyAdminPassword(password: string): boolean {
  const encoded = process.env.ADMIN_PASSWORD_HASH_B64;
  if (!encoded) return false;
  const hash = Buffer.from(encoded, "base64").toString("utf-8");
  return bcrypt.compareSync(password, hash);
}

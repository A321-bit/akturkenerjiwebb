import bcrypt from "bcryptjs";

// bcryptjs Node-only bağımlılık gerektirmez ama yine de bu dosya sadece
// Node.js runtime'ında çalışan API route'larda import edilmeli (middleware'de değil).
export function verifyAdminPassword(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  return bcrypt.compareSync(password, hash);
}

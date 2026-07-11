import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable');
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح. يرجى تسجيل الدخول.' });
  }
  try {
    const token = header.split(' ')[1];
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'الجلسة منتهية. يرجى تسجيل الدخول مجددًا.' });
  }
}

export async function authenticateAdmin(username, password) {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set');
  }
  if (username !== adminUser) return null;
  const match = await bcrypt.compare(password, adminPass);
  return match ? jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' }) : null;
}

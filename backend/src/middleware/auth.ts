import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
declare global { namespace Express { interface Request { userId?: string } } }
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "local-only-change-me") as { sub: string };
    req.userId = payload.sub;
    next();
  } catch { return res.status(401).json({ error: "Invalid or expired token" }); }
}

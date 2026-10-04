import { Request, Response, NextFunction } from 'express';
import { store } from '../db/store.ts';

// In-memory rate limiting map
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(limit: number = 200, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = requestCounts.get(ip);
    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > limit) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please retry in a moment.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  };
}

export function auditLogger(req: any, res: Response, next: NextFunction) {
  const originalJson = res.json;
  const startTime = Date.now();

  res.json = function (body: any) {
    res.json = originalJson;

    // Only log write methods or significant endpoints
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) || req.path.includes('/auth/login')) {
      const userId = req.user?.id || null;
      const action = `${req.method}_${req.path.replace(/^\/api\//, '').replace(/\//g, '_').toUpperCase()}`;

      store.auditLogs.unshift({
        id: store.auditLogs.length + 1,
        org_id: req.user?.org_id || 1,
        user_id: userId,
        action,
        entity_type: req.path.split('/')[2] || 'system',
        entity_id: req.params?.id || null,
        details: {
          statusCode: res.statusCode,
          durationMs: Date.now() - startTime,
          query: req.query,
          userAgent: req.headers['user-agent']?.substring(0, 80),
        },
        ip_address: req.ip || req.socket.remoteAddress || '127.0.0.1',
        created_at: new Date().toISOString(),
      });
    }

    return res.json(body);
  };

  next();
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../storage.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = '24h';

export interface JWTUser {
  id: string;
  email: string;
  isAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    isAdmin: boolean;
  };
}

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Authentication required' 
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Authentication required' 
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        name?: string;
        isAdmin: boolean;
        exp?: number;
      };

      // Check token expiration
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({ 
          status: 'error',
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          status: 'error',
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ 
          status: 'error',
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
}

export const generateToken = (user: JWTUser): { token: string; expiresIn: number } => {
  const expiresIn = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours from now
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      isAdmin: user.isAdmin,
      exp: expiresIn
    },
    JWT_SECRET
  );

  return { token, expiresIn };
}; 
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../storage.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
import { auth, AuthRequest, generateToken } from '../middleware/auth.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { 
    status: 'error',
    message: 'Too many login attempts. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Validation schemas
const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { name, email, password, phone } = validation.data;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [newUser] = await db.insert(users).values({
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      is_verified: false,
      is_admin: false
    }).returning();

    // Generate token
    const { token, expiresIn } = generateToken({ 
      id: newUser.id, 
      email: newUser.email,
      isAdmin: false
    });

    res.status(201).json({
      status: 'success',
      data: {
        token,
        expiresIn,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          isAdmin: false,
          isVerified: false
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Registration failed',
      code: 'SERVER_ERROR'
    });
  }
});

// Login user
router.post('/login', authLimiter, async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { email, password } = validation.data;

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user || !user.password) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate token
    const { token, expiresIn } = generateToken({ 
      id: user.id, 
      email: user.email,
      isAdmin: user.is_admin || false
    });

    res.json({
      status: 'success',
      data: {
        token,
        expiresIn,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.is_admin || false,
          isVerified: user.is_verified || false,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Login failed',
      code: 'SERVER_ERROR'
    });
  }
});

// Get current user
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id));

    if (!user) {
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.is_admin || false,
          isVerified: user.is_verified || false,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to get user info',
      code: 'SERVER_ERROR'
    });
  }
});

// Verify password
router.post('/verify-password', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const validation = z.object({
      password: z.string().min(1, 'Password is required')
    }).safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { password } = validation.data;

    // Get user from database to get current password hash
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id));

    if (!user || !user.password) {
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid password',
        code: 'INVALID_PASSWORD'
      });
    }

    res.json({ 
      status: 'success',
      message: 'Password verified'
    });
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Password verification failed',
      code: 'SERVER_ERROR'
    });
  }
});

export default router; 
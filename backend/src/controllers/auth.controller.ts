import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { Candidate } from '../models/Candidate.js';
import { env } from '../config/env.js';
import { AuthRequest } from '../middlewares/auth.js';
import { loginSchema } from '../validations/schemas.js';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak valid.',
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message: 'Akun Anda sedang dinonaktifkan oleh administrator.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak valid.',
      });
      return;
    }

    user.lastLoginAt = new Date();
    await user.save();

    let candidateData = null;
    if (user.candidateId) {
      candidateData = await Candidate.findById(user.candidateId);
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      candidateId: user.candidateId ? user.candidateId.toString() : undefined,
      name: user.name,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    // Set secure HttpOnly cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        candidateId: user.candidateId,
        candidate: candidateData,
      },
    });
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('access_token');
    res.status(200).json({
      success: true,
      message: 'Logout berhasil.',
    });
  }

  static async getMe(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
      return;
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    let candidate = null;
    if (user.candidateId) {
      candidate = await Candidate.findById(user.candidateId).populate('presentationId');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        candidateId: user.candidateId,
        candidate,
        lastLoginAt: user.lastLoginAt,
      },
    });
  }

  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
      return;
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Kata sandi baru minimal harus 6 karakter.',
      });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Kata sandi lama tidak sesuai.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Kata sandi berhasil diperbarui.',
    });
  }
}

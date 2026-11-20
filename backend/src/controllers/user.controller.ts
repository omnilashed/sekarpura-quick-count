import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User.js';
import { AuthRequest } from '../middlewares/auth.js';
import { AuditService } from '../services/audit.service.js';

export class UserController {
  /**
   * List all users (Admin only)
   */
  static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    const { role, status, search } = req.query;
    const query: any = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .populate('candidateId', 'candidateNumber fullName position candidacyStatus')
      .sort({ createdAt: -1 });

    const mappedUsers = users.map((u) => {
      const obj = u.toObject ? u.toObject() : u;
      return {
        ...obj,
        id: u._id.toString(),
        _id: u._id.toString(),
      };
    });

    res.status(200).json({
      success: true,
      count: mappedUsers.length,
      data: mappedUsers,
    });
  }

  /**
   * Admin: Create another Admin user
   */
  static async createAdminUser(req: AuthRequest, res: Response): Promise<void> {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Nama, email, dan password minimal 6 karakter diperlukan.',
      });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: userRole,
      status: 'ACTIVE',
    });

    await user.save();

    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'ADMIN_USER_CREATED',
      entityType: 'User',
      entityId: user._id.toString(),
      after: { name: user.name, email: user.email, role: user.role },
      reason: 'Penambahan akun pengelola/admin baru',
    });

    res.status(201).json({
      success: true,
      message: 'Akun admin berhasil dibuat.',
      data: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  }

  /**
   * Admin: Toggle user active / inactive status
   */
  static async toggleStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'ID pengguna tidak valid.' });
        return;
      }

      // Prevent deactivating own account
      if (req.user?.id === id) {
        res.status(400).json({ success: false, message: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        return;
      }

      user.status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await user.save();

      await AuditService.record({
        actorId: req.user?.id,
        actorName: req.user?.name || 'Admin',
        actorRole: req.user?.role || 'ADMIN',
        action: 'USER_STATUS_TOGGLED',
        entityType: 'User',
        entityId: user._id.toString(),
        after: { status: user.status },
        reason: `Mengubah status akun pengguna menjadi ${user.status}`,
      });

      res.status(200).json({
        success: true,
        message: `Status akun ${user.name} berhasil diubah menjadi ${user.status}.`,
        data: { id: user._id.toString(), _id: user._id.toString(), status: user.status },
      });
    } catch (err: any) {
      console.error('[UserController] toggleStatus error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Gagal mengubah status akun pengguna.',
      });
    }
  }

  /**
   * Super Admin: Reset kata sandi pengguna ke nilai default
   * Default password: "SekarpuraIndonesiaHlp2026!"
   */
  static async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const DEFAULT_RESET_PASSWORD = 'SekarpuraIndonesiaHlp2026!';

      if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'ID pengguna tidak valid atau tidak ditemukan.' });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        return;
      }

      // Hash kata sandi baru
      const passwordHash = await bcrypt.hash(DEFAULT_RESET_PASSWORD, 10);
      user.passwordHash = passwordHash;
      user.mustChangePassword = true; // Wajibkan ubah password saat login pertama kali
      await user.save();

      // Catat log audit
      await AuditService.record({
        actorId: req.user?.id,
        actorName: req.user?.name || 'Super Admin',
        actorRole: req.user?.role || 'SUPER_ADMIN',
        action: 'USER_PASSWORD_RESET',
        entityType: 'User',
        entityId: user._id.toString(),
        after: {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: true,
        },
        reason: `Reset kata sandi akun oleh Super Admin ke default (${DEFAULT_RESET_PASSWORD})`,
      });

      res.status(200).json({
        success: true,
        message: `Kata sandi akun ${user.name} (${user.email}) berhasil di-reset menjadi "${DEFAULT_RESET_PASSWORD}".`,
        data: {
          id: user._id.toString(),
          _id: user._id.toString(),
          userId: user._id.toString(),
          name: user.name,
          email: user.email,
          defaultPassword: DEFAULT_RESET_PASSWORD,
          mustChangePassword: user.mustChangePassword,
        },
      });
    } catch (err: any) {
      console.error('[UserController] resetPassword error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Gagal me-reset kata sandi pengguna.',
      });
    }
  }
}

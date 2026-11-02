import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { UserRole } from '../models/User.js';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Akses ditolak. Silakan login terlebih dahulu.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.',
      });
      return;
    }

    next();
  };
};

export const requireCandidateSelfOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Silakan login.' });
    return;
  }

  // Admin and Super Admin can access any candidate
  if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  // Candidate can only access their own profile
  const targetCandidateId = req.params.id || req.params.candidateId || req.body.candidateId;
  if (req.user.candidateId && req.user.candidateId === targetCandidateId) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message: 'Akses ditolak. Anda hanya diizinkan mengelola data profil Anda sendiri.',
  });
};

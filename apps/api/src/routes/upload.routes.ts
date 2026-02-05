import { Router, Request, Response } from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config';
import { AppError } from '../middleware/error.middleware';
import { getParserByMimeType } from '@task-platform/parsers';
import { generateCorrelationId, sanitizeFilename } from '@task-platform/shared';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(config.uploadDir, { recursive: true });
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = generateCorrelationId();
    const sanitized = sanitizeFilename(file.originalname);
    cb(null, `${uniqueId}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeMB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const parser = getParserByMimeType(file.mimetype);
    if (!parser) {
      cb(new AppError(400, `Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

/**
 * POST /api/v1/uploads - Upload a file
 */
router.post('/', upload.single('file'), async (req: Request, res: Response, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    res.status(201).json({
      fileId: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export const uploadRoutes = router;

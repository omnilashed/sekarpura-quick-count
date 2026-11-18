import mongoose, { Schema, Document } from 'mongoose';

export interface ISlideData {
  slideNumber: number;
  title?: string;
  bullets?: string[];
  content?: string;
  imageKey?: string;
  note?: string;
}

export interface IPresentation extends Document {
  candidateId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  originalFileName: string;
  originalFileKey?: string; // legacy disk key support
  storageKey: string; // unique GridFS storage identifier
  fileType: 'pdf' | 'ppt' | 'pptx';
  mimeType: string;
  fileSize: number;
  sha256: string;
  gridFsFileId: mongoose.Types.ObjectId;
  previewGridFsFileId?: mongoose.Types.ObjectId;
  convertedFileKey?: string; // legacy disk key support
  thumbnailKeys: string[];
  slidesData: ISlideData[];
  slideCount: number;
  version: number;
  conversionStatus: 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  conversionError?: string;
  publicationStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PresentationSchema = new Schema<IPresentation>(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    originalFileName: { type: String, required: true },
    originalFileKey: { type: String }, // legacy disk support
    storageKey: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'ppt', 'pptx'], required: true },
    mimeType: { type: String, required: true, default: 'application/octet-stream' },
    fileSize: { type: Number, required: true },
    sha256: { type: String, required: true, index: true },
    gridFsFileId: { type: Schema.Types.ObjectId, required: true, index: true },
    previewGridFsFileId: { type: Schema.Types.ObjectId },
    convertedFileKey: { type: String }, // legacy disk support
    thumbnailKeys: [{ type: String }],
    slidesData: [
      {
        slideNumber: { type: Number, required: true },
        title: { type: String },
        bullets: [{ type: String }],
        content: { type: String },
        imageKey: { type: String },
        note: { type: String },
      },
    ],
    slideCount: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    conversionStatus: {
      type: String,
      enum: ['READY', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED'],
      default: 'READY',
      index: true,
    },
    conversionError: { type: String },
    publicationStatus: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true,
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index for compound lookup
PresentationSchema.index({ candidateId: 1, version: -1 });

export const Presentation = mongoose.model<IPresentation>('Presentation', PresentationSchema);

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
  originalFileKey: string;
  fileType: 'pdf' | 'ppt' | 'pptx';
  fileSize: number;
  convertedFileKey?: string;
  thumbnailKeys: string[];
  slidesData: ISlideData[];
  slideCount: number;
  version: number;
  conversionStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
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
    originalFileKey: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'ppt', 'pptx'], required: true },
    fileSize: { type: Number, required: true },
    convertedFileKey: { type: String },
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
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    conversionError: { type: String },
    publicationStatus: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const Presentation = mongoose.model<IPresentation>('Presentation', PresentationSchema);

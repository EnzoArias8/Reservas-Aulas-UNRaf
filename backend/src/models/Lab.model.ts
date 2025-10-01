
import mongoose, { Document, Schema } from 'mongoose';

export interface ILab extends Document {
  name: string;
  building: string;
  floor: string;
  capacity: number;
  equipment: string[];
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const labSchema = new Schema<ILab>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del laboratorio es requerido'],
      trim: true,
      unique: true
    },
    building: {
      type: String,
      required: [true, 'El edificio es requerido'],
      trim: true
    },
    floor: {
      type: String,
      required: [true, 'El piso es requerido'],
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'La capacidad es requerida'],
      min: [1, 'La capacidad debe ser al menos 1']
    },
    equipment: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices
labSchema.index({ name: 1 });
labSchema.index({ building: 1 });

export const Lab = mongoose.model<ILab>('Lab', labSchema);
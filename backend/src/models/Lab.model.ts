
import mongoose, { Document, Schema } from 'mongoose';

export interface ILab extends Document {
  name: string;
  building: string;
  floor: string;
  capacity: number;
  equipment: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const labSchema = new Schema<ILab>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del laboratorio es requerido'],
      trim: true
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
// Índice compuesto: el nombre debe ser único dentro de cada edificio
labSchema.index({ name: 1, building: 1 }, { unique: true });
labSchema.index({ building: 1 });

export const Lab = mongoose.model<ILab>('Lab', labSchema);
import mongoose, { Document, Schema } from 'mongoose';

export interface ISemester extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  year: number;
  isActive: boolean;
}

const semesterSchema = new Schema<ISemester>({
  name: {
    type: String,
    required: [true, 'El nombre del cuatrimestre es requerido'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida']
  },
  endDate: {
    type: Date,
    required: [true, 'La fecha de fin es requerida']
  },
  year: {
    type: Number,
    required: [true, 'El año es requerido'],
    min: [2020, 'El año debe ser mayor a 2020'],
    max: [2030, 'El año debe ser menor a 2030']
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índice para asegurar que solo haya un cuatrimestre activo
semesterSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export const Semester = mongoose.model<ISemester>('Semester', semesterSchema);





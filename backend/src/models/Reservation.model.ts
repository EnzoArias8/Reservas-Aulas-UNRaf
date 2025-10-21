import mongoose, { Document, Schema } from 'mongoose';

export interface IReservation extends Document {
  userId: mongoose.Types.ObjectId;
  labId: mongoose.Types.ObjectId;
  date: Date;
  timeSlot: string;
  purpose?: string;
  attendees: number;
  status: 'confirmed' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es requerido']
    },
    labId: {
      type: Schema.Types.ObjectId,
      ref: 'Lab',
      required: [true, 'El laboratorio es requerido']
    },
    date: {
      type: Date,
      required: [true, 'La fecha es requerida']
    },
    timeSlot: {
      type: String,
      required: [true, 'El horario es requerido'],
      trim: true
    },
    purpose: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, 'El propósito no puede exceder 500 caracteres']
    },
    attendees: {
      type: Number,
      required: [true, 'El número de asistentes es requerido'],
      min: [1, 'Debe haber al menos 1 asistente']
    },
    status: {
      type: String,
      enum: ['confirmed', 'completed'],
      default: 'confirmed'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices compuestos para búsquedas eficientes
reservationSchema.index({ userId: 1, date: -1 });
reservationSchema.index({ labId: 1, date: 1 });
reservationSchema.index({ date: 1, timeSlot: 1, labId: 1 }, { unique: true });

// Virtual para popular user y lab
reservationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

reservationSchema.virtual('lab', {
  ref: 'Lab',
  localField: 'labId',
  foreignField: '_id',
  justOne: true
});

export const Reservation = mongoose.model<IReservation>('Reservation', reservationSchema);
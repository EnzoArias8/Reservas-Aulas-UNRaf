import mongoose, { Document, Schema } from 'mongoose';

export interface IRecurringReservation extends Document {
  userId: mongoose.Types.ObjectId;
  labId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, etc.
  startTime: string;
  endTime: string;
  semester: mongoose.Types.ObjectId;
  purpose?: string;
  attendees: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recurringReservationSchema = new Schema<IRecurringReservation>(
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
    dayOfWeek: {
      type: Number,
      required: [true, 'El día de la semana es requerido'],
      min: [0, 'El día debe ser entre 0 (Domingo) y 6 (Sábado)'],
      max: [6, 'El día debe ser entre 0 (Domingo) y 6 (Sábado)']
    },
    startTime: {
      type: String,
      required: [true, 'La hora de inicio es requerida'],
      trim: true
    },
    endTime: {
      type: String,
      required: [true, 'La hora de fin es requerida'],
      trim: true
    },
    semester: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'El cuatrimestre es requerido']
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
recurringReservationSchema.index({ userId: 1, semester: 1 });
recurringReservationSchema.index({ labId: 1, dayOfWeek: 1, semester: 1 });

// Virtual para popular user, lab y semester
recurringReservationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

recurringReservationSchema.virtual('lab', {
  ref: 'Lab',
  localField: 'labId',
  foreignField: '_id',
  justOne: true
});

recurringReservationSchema.virtual('semesterData', {
  ref: 'Semester',
  localField: 'semester',
  foreignField: '_id',
  justOne: true
});

export const RecurringReservation = mongoose.model<IRecurringReservation>('RecurringReservation', recurringReservationSchema);





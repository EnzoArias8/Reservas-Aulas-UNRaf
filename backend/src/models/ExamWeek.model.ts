import mongoose, { Document, Schema } from 'mongoose';

export interface IExamWeek extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  semester: mongoose.Types.ObjectId;
}

const examWeekSchema = new Schema<IExamWeek>({
  name: {
    type: String,
    required: [true, 'El nombre de la semana de examen es requerido'],
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
  semester: {
    type: Schema.Types.ObjectId,
    ref: 'Semester',
    required: [true, 'El cuatrimestre es requerido']
  }
}, {
  timestamps: true
});

export const ExamWeek = mongoose.model<IExamWeek>('ExamWeek', examWeekSchema);





import mongoose, { Document, Schema } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  type: 'national' | 'academic' | 'university';
  description?: string;
}

const holidaySchema = new Schema<IHoliday>({
  name: {
    type: String,
    required: [true, 'El nombre del feriado es requerido'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'La fecha del feriado es requerida']
  },
  type: {
    type: String,
    enum: ['national', 'academic', 'university'],
    required: [true, 'El tipo de feriado es requerido']
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export const Holiday = mongoose.model<IHoliday>('Holiday', holidaySchema);





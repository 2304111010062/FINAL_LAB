import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion extends Document {
  modul: number; // 1 to 5
  number: number; // 1 to 25
  title?: string;
  htmlContent: string;
  fontFamily: "Arial" | "Courier New" | string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    modul: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      index: true,
    },
    number: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    title: {
      type: String,
      default: "",
    },
    htmlContent: {
      type: String,
      required: true,
      default: "<p>Belum ada soal untuk nomor ini.</p>",
    },
    fontFamily: {
      type: String,
      enum: ["Arial", "Courier New", "sans-serif", "monospace"],
      default: "Arial",
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: Each modul has questions 1 to 25
QuestionSchema.index({ modul: 1, number: 1 }, { unique: true });

export const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;

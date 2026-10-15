import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubmission extends Document {
  modul: number; // 1 to 5
  npm: string;
  kelompok: string;
  questionNumber: number;
  questionSnapshot?: string;
  score: number;
  notes?: string;
  evaluator?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    modul: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 5,
      index: true,
    },
    npm: {
      type: String,
      required: [true, "NPM wajib diisi"],
      trim: true,
      index: true,
    },
    kelompok: {
      type: String,
      required: [true, "Kelompok wajib dipilih"],
      trim: true,
      index: true,
    },
    questionNumber: {
      type: Number,
      required: [true, "Nomor soal hasil spin wajib ada"],
      min: 1,
      max: 25,
      index: true,
    },
    questionSnapshot: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      required: [true, "Nilai / Skor wajib diisi"],
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    evaluator: {
      type: String,
      default: "Dosen / Asisten",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

SubmissionSchema.index({ modul: 1, kelompok: 1, npm: 1 });
SubmissionSchema.index({ createdAt: -1 });

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;

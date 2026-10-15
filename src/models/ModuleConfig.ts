import mongoose, { Schema, Document, Model } from "mongoose";

export interface IModuleConfig extends Document {
  modul: number; // 1 to 5
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleConfigSchema = new Schema<IModuleConfig>(
  {
    modul: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ModuleConfig: Model<IModuleConfig> =
  mongoose.models.ModuleConfig ||
  mongoose.model<IModuleConfig>("ModuleConfig", ModuleConfigSchema);

export default ModuleConfig;

// ============================================
// User Model
// ============================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser, UserRole } from '../types/index.js';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  comparePin(candidatePin: string): boolean;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByPin(pin: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    pin: {
      type: String,
      minlength: [4, 'PIN must be 4 digits'],
      maxlength: [4, 'PIN must be 4 digits'],
      match: [/^\d{4}$/, 'PIN must be 4 digits'],
      select: false, // Don't include PIN in queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'waiter', 'bartender', 'pool_manager'],
      default: 'waiter',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).password;
        delete (ret as any).pin;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Index for faster lookups
userSchema.index({ email: 1 });
userSchema.index({ pin: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Compare PIN method
userSchema.methods.comparePin = function (candidatePin: string): boolean {
  return this.pin === candidatePin;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email, isActive: true }).select('+password');
};

// Static method to find user by PIN
userSchema.statics.findByPin = function (pin: string) {
  return this.findOne({ pin, isActive: true }).select('+pin');
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
export default User;

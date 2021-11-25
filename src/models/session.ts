import mongoose from 'mongoose';
import { getModelForClass, prop } from '@typegoose/typegoose'

class Session {
  _id!: mongoose.Types.ObjectId

  @prop({required: true})
  userId!: number

  @prop({required: true})
  refreshToken!: string

  @prop({ default: Date.now, expires: process.env.REFRESH_TOKEN_EXPIRY})
  createdAt: Date
}

export const SessionModel = getModelForClass(Session)
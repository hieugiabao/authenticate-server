import { ConnectionOptions } from "typeorm";
import mongoose from 'mongoose'
import User from "../entities/user";

export const configDB: ConnectionOptions = {
  type: 'mssql',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: "auth",
  logging: true,
  synchronize: true,
  entities: [User],
  options: {
    encrypt: false
  }
}

export const connectMongodb = async () => {
  try {
    await mongoose.connect(`mongodb+srv://${process.env.SESSION_DB_USERNAME}:${process.env.SESSION_DB_PASSWORD}@${process.env.SESSION_DB_HOST}/${process.env.SESSION_DB_NAME}?retryWrites=true&w=majority`)
    console.log('connectd to mongodb');
  } catch (error) {
    console.log('falied to connect mongodb');
  }
}
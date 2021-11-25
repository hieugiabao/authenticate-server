import 'reflect-metadata'
require('dotenv').config()
import express from "express";
import { createConnection } from "typeorm"
import bodyParser from "body-parser";
import cookieParser from 'cookie-parser';
import cors from "cors"
import passport from "passport"
// load passport configuration
import './strategies/LocalStrategy'
import './strategies/JwtStrategy'

import { configDB, connectMongodb } from './utils/configdb';
import userRouter from './routes/user'
import { __prop__ } from "./constants"; 


;(async () => {
  await createConnection(configDB)
    .then(async _connection => {
      console.log('connected db');
      // connect to mongo db
      await connectMongodb()
      
      const app = express()

      app.use(bodyParser.json())
      app.use(cookieParser(process.env.COOKIE_SECRET))
      
      const whitelist = process.env.WHITELISTED_DOMAINS
        ? process.env.WHITELISTED_DOMAINS.split(',')
        : []
      
      app.use(cors({
        origin: function (origin, callback) {
          if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true)
          } else {
            callback(new Error("Not allowed by CORS"))
          }
        },
      
        credentials: true,
      }))

      app.use(passport.initialize())

      app.use('/users', userRouter)

      const PORT = process.env.PORT || 8080
      app.listen(PORT, () => {
        console.log('app started at port ', PORT)
      })
    })
    .catch(err => console.log(err))
})()
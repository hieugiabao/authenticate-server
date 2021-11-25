import passport from "passport";
import * as jwt from 'jsonwebtoken'
import { __prop__ } from "../constants";
import { CookieOptions } from "express";

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: __prop__,
  signed: true,
  maxAge: eval(process.env.REFRESH_TOKEN_EXPIRY as string) * 1000,
  sameSite: 'lax'
}

export const getToken = (user: {id: number}) => {
  return jwt.sign(user, process.env.JWT_SECRET as string, {
  expiresIn: eval(process.env.SESSION_EXPIRY as string)
  })
}

export const getRefreshToken = (user: {id: number}) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: eval(process.env.REFRESH_TOKEN_EXPIRY as string),
  })
}

export const verifyUser = passport.authenticate('jwt', { session: false})
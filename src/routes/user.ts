import { getToken, getRefreshToken, COOKIE_OPTIONS, verifyUser } from './../utils/authentication';
import { Router } from "express";
import User from "../entities/user";
import { SessionModel } from '../models/session';
import passport from 'passport';
import jwt from 'jsonwebtoken'

interface JwtPayload {
  id: number
}

const router = Router()

router.post(
  '/signup',
  async (req, res, next) => {
    
    const username = <string>req.body.username
    const password = <string>req.body.password

    try {
      const exsitingUser = await User.findOne({username})
      
      if (exsitingUser) {
        res.statusCode = 401
        res.json({
          success: false,
          message: 'username already exsit'
        })
        return
      }
      
      const newUser = User.create({username, password})
      const token = getToken({ id: newUser.id })
      const refreshToken = getRefreshToken({ id: newUser.id })

      newUser.save()
        .then(async _user => {
          res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
          res.send({ success: true, token })
          return await new SessionModel({userId: newUser.id, refreshToken}).save()
        })
        .catch(next)
    } catch (error) {
      next(error)
    }  
})

router.post(
  '/login',
  passport.authenticate('local'),
  async (req, res, next) => {
    if (req.user?.id) {
      const token = getToken({id: req.user.id})
      const refreshToken = getRefreshToken({id: req.user.id})
      
      try {
        await new SessionModel({userId: req.user.id, refreshToken}).save()
          .then(_ => {
            res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
            res.json({ success: true, token })
          })
          .catch(next)
      } catch (error) {
        next(error)
      }
    }
  }
)

router.post(
  '/refreshToken',
  async (req, res, next) => {
    const { signedCookies = {} } = req
    const refreshToken = <string>signedCookies.refreshToken || undefined

    if (refreshToken) {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload
      console.log(payload);
      const userId = payload.id
      try { 
        const exsitingSession = await SessionModel.findOneAndDelete({refreshToken, userId})
        if (exsitingSession) {
          const newRefreshToken = getRefreshToken({id: userId})
          const token = getToken({id: userId})
          await new SessionModel({userId, refreshToken: newRefreshToken}).save()
          res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS)
          res.json({success: true, token})
          return
        } else {
          res.statusCode = 401
          res.send('Unauthorized')
          return
        }
      } catch (error) {
        next(error)
      }
    } else {
      res.statusCode = 401
      res.send('Unauthorized')
      return
    }
  }
)

router.get(
  '/me',
  verifyUser,
  (req, res, _next) => {
    res.send(req.user)
  }
)

router.post(
  '/logout',
  verifyUser,
  async (req, res, next) => {
    const { signedCookies = {} } = req
    const refreshToken = <string>signedCookies.refreshToken || undefined
    console.log(refreshToken)
    try {
      await SessionModel.findOneAndDelete({refreshToken})
        .then( _ => {
          res.clearCookie('refreshToken')
          res.json({success: true})
        })
    } catch (error) {
      next(error)
    }
  }
)

export default router
import passport from "passport";
import { Strategy as LocalStrategy } from 'passport-local'
import * as bcrypt from 'bcrypt'
import User from '../entities/user'

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const exsitingUser = await User.findOne({username})
      if (!exsitingUser) 
        return done(null, false, {
          message:'Username or password invalid'
        })
      
      const isMatchPassword = await bcrypt.compare(password, exsitingUser.password)
      if (!isMatchPassword)
        return done(null, false, {
          message:'Username or password invalid'
        })

      return done(null, exsitingUser)
    } catch (err) {
      console.log(err);
      return done(err)
    }
  }
))

declare global {
  namespace Express {
    interface User {
      id?: number | undefined;
    }
  }
}

passport.serializeUser<number>((user, done) => done(null, user.id))

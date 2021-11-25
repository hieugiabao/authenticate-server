
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from "passport-jwt";
import User from "../entities/user";

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}

passport.use(
  new JwtStrategy(
    opts, 
    async (jwt_payload: {id: number}, done) => {
      try {
        const user = await User.findOne({id: jwt_payload.id})
        if (!user) return done(null, false)

        return done(null, user)
      } catch (error) {
        return done(error);
      }
    })
)
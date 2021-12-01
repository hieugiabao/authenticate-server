const express = require('express');
const router = express.Router()
const passport = require('passport')
const User = require('../models/User')
const jwt = require("jsonwebtoken")

const { getToken, COOKIE_OPTIONS, getRefreshToken, verifyUser } = require('../authenticate')

router.post('/signup', (req, res, next) => {
  if (!req.body.firstName) {
    res.statusCode = 500
    res.send({
      name: 'FirstNameError',
      message: 'The first name is required'
    })
  } else {
    User.register(
      new User({ username: req.body.username }),
      req.body.password,
      (err, user) => {
        if (err) {
          res.statusCode = 501
          res.send(err)
        } else {
          user.firstName = req.body.firstName
          user.lastName = req.body.lastName || ''
          const token = getToken({ _id: user._id })
          const refreshToken = getRefreshToken({_id: user._id})
          user.refreshToken.push({refreshToken})
          user.save((err, user) => {
            if (err) {
              res.status(500).send(err)
            } else {
              res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
              res.json({
                success: true,
                token
              })
            }
          })
        }
      }
    )
  }
})

router.post(
  '/login', 
  passport.authenticate('local'), 
  (req, res, next) => {
    const token = getToken({_id: req.user._id})
    const refreshToken = getRefreshToken({_id: req.user._id})
    User.findById(req.user._id)
      .then(user => {
        user.refreshToken.push({refreshToken})
        user.save((err, user) => {
          if (err) return res.sendStatus(500).send(err)
          else {
            res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
            res.json({
              success: true,
              token
            })
          }
        })
      })
      .catch(next)
  }  
)

router.post('/refreshToken', (req, res, next) => {
  const {signedCookies = {}} = req
  const {refreshToken} = signedCookies

  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
      const userId = payload._id
      User.findOne({_id: userId})
        .then(user => {
          if (user) {
            const tokenIndex = user.refreshToken.findIndex(
              item => item.refreshToken === refreshToken
            )

            if (tokenIndex === -1) {
              res.sendStatus(401).send('Unauthorized')
            } else {
              const token = getToken({_id: userId})
              const newRefreshToken = getRefreshToken({_id: userId})
              user.refreshToken[tokenIndex] = {refreshToken: newRefreshToken}
              user.save((err, user) => {
                if (err) return res.status(500).send(err)
                else {
                  res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS)
                  res.json({
                    success: true,
                    token
                  })
                }
              })
            }
          } else {
            res.sendStatus(401).send('Unauthorized')
          }
        }, next)

    } catch (err) {
      res.sendStatus(401).send('Unauthorized')
    }
  } else 
    res.sendStatus(401).send('Unauthorized')
})

router.get('/me', verifyUser, (req, res, next) => {
  res.send(req.user)
})

router.get('/logout', verifyUser, (req, res, next) => {
  const { signedCookies = {} } = req
  const { refreshToken } = signedCookies
  console.log(signedCookies)
  User.findById(req.user._id).then(
    user => {
      const tokenIndex = user.refreshToken.findIndex(
        item => item.refreshToken === refreshToken
      )

      if (tokenIndex !== -1) {
        user.refreshToken.id(user.refreshToken[tokenIndex]._id).remove()
      }

      user.save((err, user) => {
        if (err) {
          res.statusCode = 500
          res.send(err)
        } else {
          res.clearCookie("refreshToken", COOKIE_OPTIONS)
          res.send({ success: true })
        }
      })
    },
    err => next(err)
  )
})

module.exports = router
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport')

const app = express();

require('dotenv').config()
require('./utils/connectdb')
require('./strategies/LocalStrategy')
require('./strategies/JWTStrategy')
require('./authenticate')

const userRouter = require('./routes/user')

app.use(bodyParser.json())
app.use(cookieParser(process.env.COOKIE_SECRET))

const whitelist = process.env.WHITELISTED_DOMAINS ?
	process.env.WHITELISTED_DOMAINS.split(',') : []

const corsOptions = {
	origin: function (origin, callback) {
		if (!origin || whitelist.indexOf(origin) !== -1) 
			return callback(null, true)
		else 
			callback(new Error('Not allowed by CORS'))
	},
	redentials: true
}

app.use(cors(corsOptions))
app.use(passport.initialize())

app.use('/users', userRouter)

app.get('/', function (req, res) {
	res.send({status: 'Success'})
})

const server = app.listen(process.env.PORT || 8081, function() {
	const port = server.address().port

	console.log('App started at port ' + port);
})
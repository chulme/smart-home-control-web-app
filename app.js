var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
const session = require('express-session');
const jwt = require('jsonwebtoken');
const db = require("./db");
const dbName = "EcoWatt";
const userCollection = "Users";
const ObjectId = require('mongodb').ObjectID;
const deviceCollection = "Devices";
const roomCollection = "Rooms";

var authenticationRouter = require('./routes/authentication');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var routinesRouter = require('./routes/routines');
var roomsRouter = require('./routes/rooms');
var reportsRouter = require('./routes/reports');
var deviceRouter = require('./routes/devices');
var energyApiRouter = require('./routes/api/energy');
var returnScoreApiRouter = require('./routes/api/returnScore');


var allRoomsTodayApiRouter = require('./routes/api/allRoomsToday');
var allRoomsWeekApiRouter = require('./routes/api/allRoomsWeek');
var allRoomsMonthApiRouter = require('./routes/api/allRoomsMonth');

var energyVsTimeApiRouter = require('./routes/api/energyVsTime');
var devicePerWeekApiRouter = require('./routes/api/devicePerWeek');
var devicePerMonthApiRouter = require('./routes/api/devicePerMonth');

var getHomeIDApiRouter = require('./routes/api/getHomeID');
var leaderBoardsApiRouter = require('./routes/leaderBoards');
var scoreBoardApiRouter = require('./routes/scoreBoard');



var userTodayApiRouter = require('./routes/api/userToday');
var userWeekApiRouter = require('./routes/api/userWeek');
var userMonthApiRouter = require('./routes/api/userMonth');

var roomDevicesTodayApiRouter = require('./routes/api/roomDevicesToday.js');
var roomDevicesWeekApiRouter = require('./routes/api/roomDevicesWeek');
var roomDevicesMonthApiRouter = require('./routes/api/roomDevicesMonth');

var roomTodayApiRouter = require('./routes/api/roomToday');
var roomWeekApiRouter = require('./routes/api/roomWeek');
var roomMonthApiRouter = require('./routes/api/roomMonth');

var allRoutinesTodayApiRouter = require('./routes/api/allRoutinesToday');
var allRoutinesWeekApiRouter = require('./routes/api/allRoutinesWeek');
var allRoutinesMonthApiRouter = require('./routes/api/allRoutinesMonth');

var deviceTodayApiRouter = require('./routes/api/deviceToday');
var deviceWeekApiRouter = require('./routes/api/deviceWeek');
var deviceMonthApiRouter = require('./routes/api/deviceMonth');

var generationTodayApiRouter = require('./routes/api/generationToday');
var generationWeekApiRouter = require('./routes/api/generationWeek');
var generationMonthApiRouter = require('./routes/api/generationMonth');

var app = express();
app.use(cors());

// Express session setup
app.use(session({
  secret: 'EcOwAtTtEcHnOlOgIeS',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 30*60*1000}
}));

/**
 *************************************************************************
 * Middleware
 *************************************************************************
 */

/**
 * isAuthenticated
 * Middleware to check if the user is authenticated
 */
function isAuthenticated (req, res, next) { 
  // Check if the user is logged in
  if (req.session.activeLogin) {
    return next();
  }

  // If not logged in redirect to login page
  return res.redirect('/auth/login');
}

/**
 * isActiveUser
 * Middleware to check if a user is active
 */
function isActiveUser (req, res, next) {
  // Check if the user is active
  if (req.session.activeUser) {
    return next();
  }

  // If not active redirect to users page
  return res.redirect('/users');
}

/**
 * isManager
 * Middleware to check if a user is a manager
 */
function isManager (req, res, next) {
  // Check if the user is active
  if (req.session.activeUser.accessGroup === "manager") {
    return next();
  }

  // If not manager redirect to home
  return res.redirect('/');
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

app.use('/auth', authenticationRouter);

// Middleware to check if the JWT token is valid
app.use(async (req, res, next) => {
  // TODO: Remove after debugging
  // console.log("============================");
  // console.log("COOKIES");
  // console.log("============================");
  // console.log(req.cookies);
  // console.log("============================");
  const user = req.cookies.loggedInUser;
  if (user) {
   const accessToken = user.accessToken;
   try {
    const { userId, exp } = await jwt.verify(accessToken, process.env.JWT_SECRET);

   // Check if token has expired
   if (exp < Date.now().valueOf() / 1000) {
    return res.status(401).json({
     error: "JWT token has expired, please login to obtain a new one"
    });
   }

    db.initialize(dbName, userCollection, function (dbCollection) {
    dbCollection.findOne({ _id: ObjectId(userId) }, function (err, user) {
      res.cookie('loggedInUser', user);
      
      // Get the activeUser from the cookies
      const activeUser =  req.cookies.activeUser;
      if (activeUser) res.locals.activeUser = activeUser;

      // Get the activeHome from the cookies
      const activeHome = req.cookies.home;
      if (activeHome) res.locals.activeHome = activeHome;

      db.initialize(dbName, roomCollection, function(dbCollection, dbO) {
      res.locals.roomDB = dbO;
      }, function(error) {
        throw error;
      });

      next();
    });
   });
  } catch (error) {
    res.clearCookie('loggedInUser');
    res.clearCookie('activeUser');
    res.clearCookie('home');
    res.redirect("/");
  }
  } else {
   next();
  }
});



app.use('/users', usersRouter);
app.use('/routines', routinesRouter);
app.use('/rooms',  roomsRouter);
app.use('/reports', reportsRouter);
app.use('/devices', deviceRouter);
app.use('/api/energy', energyApiRouter);
app.use('/api/returnScore', returnScoreApiRouter);

app.use('/api/allRoomsToday',  allRoomsTodayApiRouter);
app.use('/api/allRoomsWeek',  allRoomsWeekApiRouter);
app.use('/api/allRoomsMonth',  allRoomsMonthApiRouter);

app.use('/api/allRoutinesToday',  allRoutinesTodayApiRouter);
app.use('/api/allRoutinesWeek',  allRoutinesWeekApiRouter);
app.use('/api/allRoutinesMonth',  allRoutinesMonthApiRouter);

app.use('/api/getHomeID',  getHomeIDApiRouter);
app.use('/leaderBoards',  leaderBoardsApiRouter);
app.use('/scoreBoard',  scoreBoardApiRouter);



app.use('/api/roomDevicesToday',  roomDevicesTodayApiRouter);
app.use('/api/roomDevicesWeek',  roomDevicesWeekApiRouter);
app.use('/api/roomDevicesMonth',  roomDevicesMonthApiRouter);

app.use('/api/userToday',  userTodayApiRouter);
app.use('/api/userWeek',  userWeekApiRouter);
app.use('/api/userMonth',  userMonthApiRouter);

app.use('/api/deviceToday',  deviceTodayApiRouter);
app.use('/api/deviceWeek',  deviceWeekApiRouter);
app.use('/api/deviceMonth',  deviceMonthApiRouter);

app.use('/api/roomToday',  roomTodayApiRouter);
app.use('/api/roomWeek',  roomWeekApiRouter);
app.use('/api/roomMonth',  roomMonthApiRouter);

app.use('/api/generationToday',  generationTodayApiRouter);
app.use('/api/generationWeek',  generationWeekApiRouter);
app.use('/api/generationMonth', generationMonthApiRouter);

app.use('/api/energyVsTime',  energyVsTimeApiRouter);
app.use('/api/devicePerWeek',  devicePerWeekApiRouter);
app.use('/api/devicePerMonth',  devicePerMonthApiRouter);

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text());

app.use(express.static(path.join(__dirname,'../client')));

// app.listen(8000, function(){
// 	console.log("Listening on Port 8000... " + path.join(__dirname, '../client'))
// });

module.exports = app;

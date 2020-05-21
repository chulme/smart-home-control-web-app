var express = require('express');
var router = express.Router();

const Joi = require('joi');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const faker = require('faker');

const db = require("../db");
const dbName = "EcoWatt";
const ObjectId = require('mongodb').ObjectID;
const userCollection = "Users";
const homeCollection = "Homes";

const userMiddleware = require('../middleware/user');

const nodemailer = require("nodemailer");
const Mail = require('../mail');

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 *************************************************************************
 * Login
 *************************************************************************
 */

/**
 * Login
 * GET route to display the user login page
 */
router.get('/login', userMiddleware.allowIfNotLoggedin, function (req, res, next) {
  res.render('login', {
    title: 'Login',
  });
});

/**
 * Login
 * POST route to login user
 */
router.post('/login', userMiddleware.allowIfNotLoggedin, function (req, res, next) {
  // Form schema to be checked against
  const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(5).required(),
    password: Joi.string().min(5).required(),
  });

  // Validate form
  Joi.validate(req.body, schema, async function (err, joiResult) {
    if (err) {
      // If validation fails
      console.log("Form is not valid!");
      console.log(err);
    }
    else {
      db.initialize(dbName, userCollection, function (userDbCollection) {
        userDbCollection.findOne({ username: joiResult.username }, async function (err, user) {
          if (err) {
            // If DB error
            console.log("DB Error");
            console.log(err);
          } else {
            if (!user) {
              // If user does not exists 
              console.log("User not found!");
            } else {
              // If user is found
              // Compare the entered password with the stored hash
              let validPassword = await validatePassword(joiResult.password, user.password);

              if (!validPassword) return next(new Error('Password is not correct'));

              const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
                expiresIn: "1d"
              });

              userDbCollection
              .findOneAndUpdate({
                _id : new ObjectId(user._id)
              },{
                $set : {
                  accessToken : accessToken,
                }
              },{
                returnOriginal : false,
              },function(error, updatedUser) {
                if (error) throw error;

                // TODO: Remove after testing
                console.log("=============");
                console.log("Updated");
                console.log("=============");
                console.log(updatedUser.value);

                db.initialize(dbName, homeCollection, function (homeDbCollection) {
                  homeDbCollection.findOne({ _id: new ObjectId(updatedUser.value.homeId) }, async function (error, home) {
                    if (error) throw error;
                    // return res.status(200)
                    // .cookie('loggedInUser', updatedUser.value)
                    // .cookie('home', home)
                    // .json({
                    //   user: updatedUser.value,
                    //   home: home,
                    //   accessToken
                    // });

                    // Check for data collection frequency 
                    let dataCollectionFrequency = req.cookies.dataCollectionFrequency ? req.cookies.dataCollectionFrequency : 15;

                    return res.status(200)
                    .cookie('loggedInUser', updatedUser.value)
                    .cookie('home', home)
                    .cookie('dataCollectionFrequency', dataCollectionFrequency)
                    .redirect("/");
                  });
                });
              });
            }
          }
        });
      }, function (err) {
        throw (err);
      });
    }
  });
});

/**
 *************************************************************************
  * Sign-Up
  *************************************************************************
  */

/**
 * Sign-Up
 * GET route to display the user sign-up page
 */
router.get('/signup', userMiddleware.allowIfNotLoggedin, function (req, res, next) {
  res.render('signup', {
    title: 'Sign Up',
  });
});

/**
 * Sign-Up
 * POST route to create new user
 */
router.post('/signup', userMiddleware.allowIfNotLoggedin, function (req, res, next) {  
  // Form schema to be checked against
  const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(5).required(),
    email: Joi.string().trim().email().required(),
    dateofbirth: Joi.required(),
    password: Joi.string().min(5).required(),
    repassword: Joi.string().min(5).required().valid(Joi.ref('password')),
  });

  // Validate form
  Joi.validate(req.body, schema, async function (err, joiResult) {
    if (err) {
      // If validation fails
      console.log("Form is not valid!");
      console.log(err);
    }
    else {
      // Home object
      // TODO: Change home structure if required
      let home = {
        address: {
          streetAddress: faker.address.streetAddress(),
          secondaryAddress: faker.address.secondaryAddress(),
          country: faker.address.country(),
          latitude: faker.address.latitude(),
          longitude: faker.address.longitude()
        },
        users: 0,
        devices: 0,
        rooms: 0,
        routines: 0
      };

      // Insert the new home in database
      db.initialize(dbName, homeCollection, function(homeDbCollection) {
        homeDbCollection.insertOne(home, async function(error, result) {
          if (error) throw error;

          // Get the new home id
          let newHomeId = result.insertedId;

          // Get the hashedPassword
          const hashedPassword = await hashPassword(joiResult.password);

          // User object
          let user = {
            username: joiResult.username,
            email: joiResult.email,
            dateofbirth: joiResult.dateofbirth,
            password: hashedPassword,
            role: 'manager',
            avatarColor: '#BEEE00',
            homeId: new ObjectId(newHomeId),
            settings: {darkmode : false},
          };

          // Insert the new user in database
          db.initialize(dbName, userCollection, function(userDbCollection) {
            userDbCollection.insertOne(user, async function(error, result) {
                if (error) throw error;
    
                // Get the new user id
                let newUserId = result.insertedId;
    
                // Get the signed access token
                let accessToken = jwt.sign({ userId: newUserId }, process.env.JWT_SECRET, {
                  expiresIn: "8760h"
                });
    
                // Find and update the user's access token
                userDbCollection
                .findOneAndUpdate({
                  _id : new ObjectId(newUserId)
                },{
                  $set : {
                    accessToken : accessToken,
                  }
                },{
                  returnOriginal : false,
                },function(error, updatedUser) {
                  if (error) throw error;

                  // TODO: Remove after testing
                  console.log("=============");
                  console.log("Updated");
                  console.log("=============");
                  console.log(updatedUser.value);

                  // Find and update the home details
                  homeDbCollection
                  .findOneAndUpdate({
                    _id: new ObjectId(newHomeId)
                  },{
                    $set : {
                      createdBy : new ObjectId(newUserId),
                    }
                  },{
                    returnOriginal : false,
                  }, function(error, updatedHome) {
                    if (error) throw error;

                    // return res.status(200)
                    // .cookie('loggedInUser', updatedUser.value)
                    // .cookie('home', updatedHome.value)
                    // .json({
                    //   user: updatedUser.value,
                    //   home: updatedHome.value,
                    //   accessToken
                    // });

                    // Check for data collection frequency 
                    let dataCollectionFrequency = req.cookies.dataCollectionFrequency ? req.cookies.dataCollectionFrequency : 15;

                    var mail = new Mail("signup", updatedUser.value.email, "Welcome to Eco Watt", {name : updatedUser.value.username});
                    return res.status(200)
                    .cookie('loggedInUser', updatedUser.value)
                    .cookie('home', updatedHome.value)
                    .cookie('dataCollectionFrequency', dataCollectionFrequency)
                    .redirect("/");
                  });
                });
            });
            }, function(err) {
              throw (err);
            });
        });
      });
    }
  });
});
  
/**
 * Log-Out
 * POST route to log out user
 */
router.post('/logout', userMiddleware.allowIfLoggedin, function (req, res, next) {
  res.clearCookie('loggedInUser');
  res.clearCookie('activeUser');
  res.clearCookie('home');
  res.redirect("/");
});

module.exports = router;
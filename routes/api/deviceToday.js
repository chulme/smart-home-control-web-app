var express = require('express');
var router = express.Router();
var moment = require('moment');

const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongodb').ObjectID;
const dbConnectionUrl = "mongodb+srv://ak125:ecowatt2020@cluster0-cjt2c.mongodb.net/test?retryWrites=true&w=majority";

const db = require("../../db");


/* GET users listing. */
router.get('/', function(req, res, next) {

var d = new Date();
    var data = {};
    data.date = moment(d).format('ll');  
    data.deviceID = req.query.deviceID;
    data.deviceName = req.query.deviceName;

    MongoClient.connect(dbConnectionUrl, function(err, db) {
        
        if (err) throw err;
        var dbo = db.db("EcoWatt");
        dbo.collection('Consumption').aggregate([
          {$match: { $and: [ { date: data.date.toString() }, { deviceID: new ObjectId(data.deviceID) } , { homeID : res.locals.activeHome._id} ] } },
          { 
            $group :
             {
               _id : null,
               energySum: { $sum: "$energy" }
             }
          }
          ]).toArray(function(err, result) {
          if (err) throw err;
            data.sum = result;
          db.close();
           console.log(data);
               // Send response with status to 200 and the JSON data
            res
            .status(200)
            .json({
                'energy' : data,
            });
        });        
      });

});

module.exports = router;

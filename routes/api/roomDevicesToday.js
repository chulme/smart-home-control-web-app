var express = require('express');
var router = express.Router();
var moment = require('moment');

const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongodb').ObjectID;
const dbConnectionUrl = "mongodb+srv://ak125:ecowatt2020@cluster0-cjt2c.mongodb.net/test?retryWrites=true&w=majority";

/* GET users listing. */
router.get('/', function(req, res, next) {

    var d = new Date();
    var data = {};
    data.date = moment(d).format('ll'); 

    MongoClient.connect(dbConnectionUrl, function(err, db) {
   
        if (err) throw err;
        var dbo = db.db("EcoWatt");
        data.roomID = req.query.roomID;
        data.roomName = req.query.roomName;
        console.log(req.query)

        console.log(data.roomName)
        console.log(data.roomID)
        
      dbo.collection('Consumption').aggregate([
        {$project : {
          roomID: {$toString: "$roomID" },
          deviceName: "$deviceName",
         homeID : "$homeID",
         energy : "$energy",
         deviceID : "$deviceID",
         day : "$day",
         date : "$date"
           
         }},
        {$match:  { $and: [ { date: data.date.toString() }, { roomID: data.roomID }, { homeID : res.locals.activeHome._id}] } },
        { 
          $group :
            {
              _id : "$deviceName",
              energySum: { $sum: "$energy" },
            }
        }
        ]).toArray(function(error, result) {
  
          if (err) throw err;

          data.energy = result;
          console.log("Today");
          console.log(data)
         
          db.close();  
          
          res
          .status(200)
          .json({
                'roomData' : data,
          });

        });  
  

      
});

});

module.exports = router;


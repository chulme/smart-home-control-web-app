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
    data.day = moment(d).format('d');

    var today = moment(d).format("YYYY-MM-DD[T00:00:00.000+00:00]");
    var margin = (data.day % 7); 
    var startDate = moment(d).subtract(margin,'days').format("YYYY-MM-DD[T00:00:00.000+00:00]");

    console.log( new Date(startDate))

    MongoClient.connect(dbConnectionUrl, function(err, db) {
   
        if (err) throw err;
        var dbo = db.db("EcoWatt");
        
    let step1=  new Promise(function(resolve, reject){

      dbo.collection('Routines').find().toArray(function(error, result) {
        error ? reject(error) : resolve(result);  
         
    });
        
    });
        
    step1.then(function(result){

      data.routines = result;

      dbo.collection('Consumption').aggregate([
        {$project:
          {
              ISODate:
              {
                 $dateFromString:
                 {
                    dateString: "$date"
                 }
              },
              energy : "$energy",
              day : "$day",
              roomID : "$roomID",
              homeID :"$homeID",
              routineID : "$routineID", 
              fromRoutine : "$fromRoutine"
           }
      },  
      {$match:
        { $and: [ { ISODate:      
          {$gte: new Date(startDate),
           $lte: new Date(today)}}
           , { homeID : res.locals.activeHome._id} , { fromRoutine : true}
          ] } 
      },
        { 
          $group :
            {
                _id : "$routineID",
              energySum: { $sum: "$energy" },
            }
        }
        ]).toArray(function(err, result) {
  
          if (err) throw err;

          data.sum = result;
          db.close();
          console.log("WEEK")
         console.log(data.sum);
               // Send response with status to 200 and the JSON data
            res
            .status(200)
            .json({
                'energyWeek' : data,
            });

        });        
});

});

});

module.exports = router;


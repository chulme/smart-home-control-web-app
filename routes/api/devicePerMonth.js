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
    // console.log(d);
    var data = {};
    data.month = moment().endOf('month').format('D');

    var today = moment(d).format("YYYY-MM-DD[T00:00:00.000+00:00]");
    var startDate =moment().startOf('month').format("YYYY-MM-DD[T00:00:00.000+00:00]");
    console.log("PLEASEEEEEEEEEEEE");
    console.log(today);
    console.log(startDate);

    MongoClient.connect(dbConnectionUrl, function(err, db) {
        
        if (err) throw err;
        var dbo = db.db("EcoWatt");
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
                    day : "$date",
                    homeID  : "$homeID"
                 }
            },
          {$match:
            { $and: [ { ISODate:      
              {$gte: new Date(startDate),
               $lte: new Date(today)}}, { homeID : res.locals.activeHome._id} ] 
              } 
          },
          { 
            $group :
             {
               _id :  "$day",
               energySum: { $sum: "$energy" }
             }
          }
          ]).toArray(function(err, result) {
          if (err) throw err;
          console.log("@@@@@@@@@@@@LOLOLOLOLOL@@@@@@@@@@@@@@@@");
            data.sum = result;
          db.close();
         console.log(JSON.stringify(data.sum));
               // Send response with status to 200 and the JSON data
            res
            .status(200)
            .json({
                'energyMonth' : data,
            });
        });        
      });

});

module.exports = router;

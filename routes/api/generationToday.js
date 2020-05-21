var express = require('express');
var router = express.Router();
var moment = require('moment');

const db = require("../../db");
const dbName = "EcoWatt";
const scoresCollection = "Scores";
const MongoClient = require("mongodb").MongoClient;
const dbConnectionUrl = "mongodb+srv://ak125:ecowatt2020@cluster0-cjt2c.mongodb.net/test?retryWrites=true&w=majority";

/* GET users listing. */
router.get('/', function(req, res, next) {

var d = new Date();
    var data = {};
    data.date = moment(d).format('ll');  

    MongoClient.connect(dbConnectionUrl, function(err, db) {
        
        if (err) throw err;
        var dbo = db.db("EcoWatt");

        let step1=  new Promise(function(resolve, reject){

        dbo.collection('Consumption').aggregate([
          {$match: 
          { $and: [ { date: data.date.toString() }
             , { homeID : res.locals.activeHome._id} 
            ] } 
          },
          { 
            $group :
             {
               _id : "$time",
               energySum: { $sum: "$energy" }
             }
          } ,
           { $sort : { _id : 1 } }
          ]).toArray(function(error, result) {
            error ? reject(error) : resolve(result);  
        });
            
        });

        step1.then(function(result){

          data.consumption = result;
          console.log("QWERTYUJBVCDFRTGHN C")
          // console.log(data.consumption)

        dbo.collection('Generation').aggregate([
          {$match:  { $and: [ { date: data.date.toString() }
            , { homeID : res.locals.activeHome._id} 
           ] } },
          { 
            $group :
             {
              _id : "$time",
               eSum: { $sum: "$energy" }
             }
          }
          ]).toArray(function(err, result) {
          if (err) throw err;
          console.log("HEHEHEHE")
          // console.log(result)
            data.generation = result;
            data.genSum = 0;
            data.conSum = 0;

            db.close();

            data.generation.forEach(element => {
              if(!isNaN(element.eSum)) {
                // console.log(element.eSum);
                data.genSum += element.eSum;
              }
            });

            data.consumption.forEach(element => {
              
              data.conSum += element.energySum;

            });
  
            res
            .status(200)
            .json({
                'energy' : data,
            });
        });        
      });

    });

});

router.get('/scores', function(req, res, next) {

  console.log("Calculating score...");

  var scoresPromise = new Promise(function(resolve, reject) {
    db.initialize(dbName, scoresCollection, function(dbCollection) {
      dbCollection.find().toArray(function(error, result) {
        error ? reject(error) : resolve(result);
      });
    }, function(err) {
      throw (err);
    });
  });

  scoresPromise.catch(function(err) { throw err; });

  scoresPromise.then(function(scores) {

    res
    .status(200)
    .json({
        'scores' : scores,
    });
  });
});

module.exports = router;

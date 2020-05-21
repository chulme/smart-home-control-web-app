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
        
    let step1=  new Promise(function(resolve, reject){

      dbo.collection('Users').find({homeId : new ObjectId(res.locals.activeHome._id)}).toArray(function(error, result) {
        error ? reject(error) : resolve(result);  

        
         
    });

    // dbo.collection("Routines").updateMany(
    //     {},
    //     { $set: {"homeID": res.locals.activeHome._id} },
    //   )
        
    });
        
    step1.then(function(result){

      data.users = result;
      console.log(data.users)

      dbo.collection('Consumption').aggregate([
          
        {$match: { $and: [ { date: data.date.toString() }
             , { homeID : res.locals.activeHome._id} 
            ] }  },
        { 
          $group :
            {
              _id : "$user",
              energySum: { $sum: "$energy" },
            }
        }
        ]).toArray(function(err, result) {
  
          if (err) throw err;

          data.energy = result; 
          
          console.log("TODAY")
          console.log(data.energy)

          db.close();  
          
          res
          .status(200)
          .json({
                'roomData' : data,
          });

        });  
  

      
});

});

});

module.exports = router;


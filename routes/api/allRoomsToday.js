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

      dbo.collection('Rooms').find().toArray(function(error, result) {
        error ? reject(error) : resolve(result);  
         
    });
        
    });
        
    step1.then(function(result){

      data.rooms = result;

      dbo.collection('Consumption').aggregate([
          
        {$match: 
        { $and: [ { date: data.date.toString() }
           , { homeID : res.locals.activeHome._id} 
          ] } },
        { 
          $group :
            {
              _id : "$roomID",
              energySum: { $sum: "$energy" },
            }
        }
        ]).toArray(function(error, result) {
  
          if (err) throw err;

          data.energy = result;
          console.log(JSON.stringify(data));
         
          db.close();  
          // console.log("PEPEPEPPEE")
          console.log(result);
          // Send response with status to 200 and the JSON data
          
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


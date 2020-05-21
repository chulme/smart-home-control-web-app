var express = require('express');
var router = express.Router();
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongodb').ObjectID;
const dbConnectionUrl = "mongodb+srv://ak125:ecowatt2020@cluster0-cjt2c.mongodb.net/test?retryWrites=true&w=majority";

/* GET users listing. */
router.get('/', function(req, res, next) {


    MongoClient.connect(dbConnectionUrl, function(err, db) {
   
        if (err) throw err;
        var dbo = db.db("EcoWatt");
        var id = req.query.homeID
        console.log("pkwnjkjn")
        console.log(id);

        
      dbo.collection('Homes').find({ _id : new ObjectId(id)}).toArray(function(err, result) {
  
          if (err) throw err;

         let data = [];
       
          result.forEach(element => {
            var el = {};
            el.homeID = element._id;
           el.energyScore = element.score;
           el.energyStatus = el.energyScore >=67 ? "green" : el.energyScore >=33 && el.energyScore <=66 ? "amber" : "red";

           data.push(el);
          });
         

          res
    .status(200)
    .json({
        'energyArray' : data,
    });

        });  
  

      
});

});

module.exports = router;

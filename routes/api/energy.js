var express = require('express');
var router = express.Router();

var moment = require('moment');

const ObjectId = require('mongodb').ObjectID;
const db = require("../../db");
const dbName = "EcoWatt";
const scoresCollection = "Scores";
const consumptionCollection = "Consumption";
const solarPanelsCollection = "SolarPanels";
const homesCollection = "Homes";

const SolarPanel = require('../../public/javascripts/solarpanel');

/* GET users listing. */
router.get('/energyscore', function(req, res, next) {
    // Set the minimum score to 0
    let minimum = Math.ceil(0);

    // Set the maximum score to 1
    let maximum = Math.floor(100);

    // Generate random energy score value between minimum and maximum (inclusive)
    let energyScore = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

    // Set the energy status based on the energy score
    // Green - Score: 67 and above
    // Amber - Score: 33 - 66
    // Red - Score: below 33
    let energyStatus = energyScore >=67 ? "green" : energyScore >=33 && energyScore <=66 ? "amber" : "red";

    // Send response with status to 200 and the JSON data
    res
    .status(200)
    .json({
        'energyScore' : energyScore,
        'energyStatus' : energyStatus,
    });
});

/* function to calculate and return energy score of the house
*/
router.post('/score', function (req, res, next) {

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
  
      // console.log(scores);
  
      // ====== TUNABLE ========
      let curr_region = "UK"; 
      // ^^^^^^^^^^^^^^^^^^^^^^^
  
      // Calculating score depending on all scores in a certain region'
      calculateScore(scores,curr_region, function(score) {

        updateStoredScore(req.cookies.home, score);
  
        let score_desc;
        let score_state;
        let notification;
        
        console.log("Energy Score: " + score);
        
        if(parseInt(score) < 33) {
          score_desc = "You really need to do better!";
          score_state = 2;
          notification = 'error';
        } 
        else if(parseInt(score) < 67) {
          score_desc = "You could do better!";
          score_state = 1;
          notification = 'warning';
        }
        else {
          score_desc = "You are doing good!";
          score_state = 0;
          notification = 'success';
        }
  
        res.send({ 
          energy_score: score, 
          energy_score_desc: score_desc,
          energy_score_state: score_state ,
          notification: notification 
        });
  
      });
    });
});
  
/* calculateScore
* Calculating score depending on all scores in a certain region
*/
function calculateScore(scores, home_region, callback) {
let lowerScores = new Set();

getCurrentGeneration(function(generation) {
    getCurrentConsumption(function(consumption) {

    // energy score equal to current energy generated - current energy consumed 
    let home_score = generation - consumption;

    console.log("GEN: " + generation + " - CONS: " + consumption);
    console.log("Raw Score: " + home_score);

    for (let i = 0; i < scores.length; i++) {
        if(scores[i].score < home_score && scores[i].region.toUpperCase() === home_region.toUpperCase()) {
        lowerScores.add(scores[i]);
        }
    }
    // Returns the percentile value of the home score within all scores in the given region
    let energy_score = Math.floor(lowerScores.size / scores.length * 100);

    return callback(energy_score);
    });
});
}

router.post('/updateScore', function (req, res) {
  let data = req.body;
  // console.log(data.score);
  updateStoredScore(req.cookies.home,data.score);
});

function updateStoredScore(home,score) {
  db.initialize(dbName, homesCollection, function(dbCollection) {
    dbCollection.updateOne({ _id : new ObjectId(home._id) },{ $set: {score:parseInt(score)} }, function (error) {
        if (error) throw error;
        console.log(home._id + " new score: " + score);
      });
  });
}

/* getCurrentConsumption
* Retrieves from DB, the energy consumed for the current day
*/
function getCurrentConsumption(callback) {
db.initialize(dbName, consumptionCollection, function(dbCollection) {

  let currDate = moment(new Date()).format('ll');
  // console.log("date:" + currDate);
  dbCollection.find({ date: currDate }).toArray(function(error, result) {
  if (error) throw error;

  let totConsumption = 0;
  result.forEach(deviceConsumption => { totConsumption += deviceConsumption.energy; });
  
  return callback(totConsumption);
  });
});
}

/* getCurrentGeneration
* Retrieves energy generated for the current day
*/
function getCurrentGeneration(callback) { 
db.initialize(dbName, solarPanelsCollection, function(dbCollection) {
    retrieveSolarPanels(dbCollection, function(solarPanels) {
    let totalEnergyStored = 0;
    solarPanels.forEach(function(panel) { totalEnergyStored += panel.stored_energy; });
    return callback(totalEnergyStored);
    });
}, function(err) {
    throw (err);
});
}

/* retrieveSolarPanels
 * function to retrieve current solar panels and their info from DB
*/
function retrieveSolarPanels(dbCollection, callback) {
    dbCollection.find({}).toArray(function(error,result) {
      if(error) throw error;
      
      let solarPanelsData = result[0].solarPanels;
      let solarPanels = [];
  
      for (let i in solarPanelsData) {
        let capacity = solarPanelsData[i].capacity;
        let wattGeneration = solarPanelsData[i].wattGeneration;
        let stored_energy = solarPanelsData[i].stored_energy;
        let panelID = solarPanelsData[i]._id;
        solarPanels[i] = new SolarPanel(panelID, capacity, wattGeneration, stored_energy);
      }
  
      console.log(solarPanels);
      return callback(solarPanels);
    });
}

module.exports = router;

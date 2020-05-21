function say(text) {
    responsiveVoice.speak(text, "UK English Female")
  }
  
  function listen() {
    var recognition = new webkitSpeechRecognition();
    recognition.interimResults = true;
    recognition.onresult = function(event) {
      if (event.results.length > 0) {
        $("#search").val(event.results[0][0].transcript)
      }
    }
    recognition.onend = function(event) {
      postVoice($("#search").val())
    }
    recognition.start();
  }
  
  async function postVoice(message) {
    let homeID = $('#homeID').val();

    let response = await fetch(`/api/returnScore?homeID=${homeID}`);
  
    let scoreData = await response.json();

    console.log("ASDFGHJKL")
    console.log(homeID, message, scoreData);
    $.ajax({
      type: "POST",
      url: "/voice",
      data: { 
        message: message,
        homeID: homeID,
        score : scoreData.energyArray[0].energyScore,
        status : scoreData.energyArray[0].energyStatus
        
      },
      success: function(data) {
        console.log(data)
        $("#search").text(data.message)
        say($("#search").text())
      }
    });
  }
  
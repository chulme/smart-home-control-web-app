var col = $("#color").val();

if(col==null){
  col = "rgb(255,0,0)";
}

var colorPicker = new iro.ColorPicker(".colorPicker", {
  width: 200,
  color:col,
  borderWidth: 1,
  borderColor: "#fff",
});
  
var value = document.getElementById("colorValue");
  
// https://iro.js.org/guide.html#color-picker-events
colorPicker.on(["color:init", "color:change"], function(color){
  // Show the current color in different formats
  // Using the selected color: https://iro.js.org/guide.html#selected-color-api
  value.innerHTML = color.rgbString;
  $("#square").css("background-color", color.rgbString);

});

colorPicker.on(["color:init", "input:end"], function(color){
  let dev ={};
  dev._id = $("#devID").val();
  console.log("FFFFFFFFFFFFF");
  console.log(dev._id);
  dev.color = color.rgbString;

  $("#square").css("background-color", color.rgbString);
  
  $.ajax({
    url: `/devices/${dev._id}/changeColor`,
    type: "POST",
    data: JSON.stringify(dev),
    dataType: "json",
    contentType: "application/json",
    cache: false,
    success: function (answer) {
        console.log(answer);
    },
    error: function (xhr, resp, text) {
        console.log(xhr, resp, text);
    }
  })
});
  
export default () => {
/* Get current date */
var n = new Date();
var weekDay = n.getDay();
var d = n.getDate();
var m = n.getMonth();
var y = n.getFullYear();

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* needs new language formatting */

document.getElementById("date").innerHTML = days[weekDay] + ", " + months[m] + " " + d + " " + y;
};
const AccessControl = require("accesscontrol");
const ac = new AccessControl();
 
exports.roles = (function() {

ac.grant("restricted")
.readAny("home")
.readAny("report")
.readOwn("profile")
.readAny("room")
.readAny("devices")
.readAny("routine")
 
ac.grant("unrestricted")
.extend("restricted")
.readAny("profile")
.createAny("room")
.updateAny("room")
.deleteAny("room")
.createAny("devices")
.updateAny("devices")
.deleteAny("devices")
.createAny("routine")
.updateAny("routine")
.deleteAny("routine")
 
ac.grant("manager")
.extend("restricted")
.extend("unrestricted")
.createAny("profile")
.updateAny("profile")
.deleteAny("profile")
 
return ac;
})();


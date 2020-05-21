const { roles } = require('../roles')

// Grant action to the resource
exports.grantAccess = function(action, resource) {
  return async (req, res, next) => {
    try {
    console.log("GRANT ACCESS");
    console.log(req.user.role+"");
    const permission = roles.can(req.user.role)[action](resource);
    if (!permission.granted) {
      // return res.status(401).json({
      // error: "You don't have enough permission to perform this action"
      // });
      console.error("You don't have enough permission to perform this action");
      return res.status(401).redirect("/");
    }
    next()
  } catch (error) {
    next(error)
  }
  }
}

// Allow if logged in
exports.allowIfLoggedin = async (req, res, next) => {
  try {
    const loggedInUser = req.cookies.loggedInUser;
    if (!loggedInUser) {
    // return res.status(401).json({
    //   error: "You need to be logged in to access this route"
    // });
    console.error("You need to be logged in to access this route");
    return res.status(401).redirect("/auth/login");
    }
    next();
  } catch (error) {
    next(error);
  }
}

// Allow if not logged in
exports.allowIfNotLoggedin = async (req, res, next) => {
  try {
    const loggedInUser = req.cookies.loggedInUser;
    if (loggedInUser) {
    // return res.status(401).json({
    //   error: "You are already logged in"
    // });
    console.error("You are already logged in");
    return res.status(401).redirect("/");
    }
    next();
  } catch (error) {
    next(error);
  }
}

// Allow if active user
exports.allowIfActiveUser = async (req, res, next) => {
  try {
    const activeUser = req.cookies.activeUser;
    if (!activeUser) {
    // return res.status(401).json({
    //   error: "Please select a profile to continue"
    // });
    console.error("Please select a profile to continue");
    return res.status(401).redirect("/users/browse");
    }
    req.user = activeUser;
    next();
  } catch (error) {
    next(error);
  }
}

// Allow if no active user
exports.allowIfNotActiveUser = async (req, res, next) => {
  try {
    const activeUser = req.cookies.activeUser;
    if (activeUser) {
    // return res.status(401).json({
    //   error: "User already active"
    // });
    console.error("User already active");
    return res.status(401).redirect("/");
    }
    next();
  } catch (error) {
    next(error);
  }
}
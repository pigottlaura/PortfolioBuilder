// Requiring the mongoose module, which I will use to make the connection to the
// database (either locally - when in development mode, or remotely using MongoLab
// for the Azure server)
var mongoose = require('mongoose');

// Creating a variable to be either store the connection string to the MongoLab database
// (which will only be available when the app is running on Azure, as this environment
// variable has not been set locally) or the local database (which will be used for
// local testing)
var connectionString = process.env.CUSTOMCONNSTR_PortfolioBuilderMongo || "localhost:27017/PortfolioBuilder";

// Creating a connection to the database, using the connection string specified above
mongoose.connect(connectionString);

// Logging out to the console that the connection to the database is being made,
// so that I can monitor the console to ensure that this only happens once (even
// when I require this module in multiple routes)
console.log("Creating Database Connection - " + mongoose.connection.readyState);

// Creating a variable to store the connection to the database, so I can set up
// listeners on it, and then use it as the module exports object, so the connection
// can be shared between multiple routes.
var db = mongoose.connection;

// Creating a listener for error events on the database connection
db.on('error', function(err){
    console.log("There was an error connection to the database - " + err);
});

// Creating a listener for when the database connection is opened i.e
// when the db.readyState equals "1"
db.once('open', function() {
  console.log("Database Successfully connected");
});

// Setting the exports of this module to equal to the connection to the database
// which I have just set up. This connection may not be fully set up when the export occurs,
// but since the exports references this object, the readyState of the connection will be
// updated accordingly
module.exports = db;
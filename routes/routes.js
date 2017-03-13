// =======================
// routes ================
// =======================

var ladash = require('lodash');
var ladash = require('lodash');
var cheerio = require('cheerio');
var request = require('request');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var allUsers = require('../usersdata');  //Get list of users from file

var appRouter = function (app) {

  // =======================
  // basic route
  app.get('/', function (req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
  });

  // =======================
  // route for logging and creating access token
  app.post('/api1/authenticate', function (req, res) {

    var user = ladash.filter(allUsers, x => x.name === req.body.name)[0];   //find user object from all users

    //check user exist
    if (user == undefined || user == null) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {
      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          username: user.name,
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }

    }
  });


  // =======================
  // route middleware to verify a token
  app.use(function (req, res, next) {

    // check header or url parameters or post parameters for token
    var tokenInfo = req.body.token || req.query.token || req.headers['x-access-token'] || req.headers['authorization'];
    // decode token
    if (tokenInfo) {
      var token = tokenInfo.split(" ")
      if (token[0] == 'Bearer') {
        jwt.verify(token[1], app.get('superSecret'), function (err, decoded) {
          if (err) {
            return res.json({ success: false, message: 'Failed to authenticate token.' });
          } else {
            // if everything is good, save to request for use in other routes
            req.decoded = decoded;
            return next();
          }
        });
      } else {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      }
    } else {

      // if there is no token
      // return an error
      return res.status(403).send({
        success: false,
        message: 'No token provided.'
      });

    }
  });

  // =======================
  // basic route for api1
  app.get('/api1', function (req, res) {
    res.json({ message: 'Welcome to the API!' });
  });

  // =======================
  // get route for getiing videos
 var videoArray = []
   app.get('/api1/videos', function(req, res) {
     var startCount = req.query.startCount
     var itemCount = req.query.itemCount

     if ((startCount == 0 && itemCount == 0) || videoArray.length == 0){
       getVideoInfo(function(err,data){
          if(err){
              res.json(err);
          }else{
               videoArray = data
               res.json({"data":data.slice(0,itemCount),"totalCount":data.length});
          }
       });
     }else{
       res.json({"data":videoArray.slice(startCount,startCount+itemCount),"totalCount":videoArray.length});
     }
});

  // =======================
  //function for getting video data from diffrent websites
  // =======================
  var getVideoInfo = function(cb){
      var videoArray = []
      //Provide Different headers for prevent Blocking
      request({
          method: 'GET',
          url: 'https://www.buzzfeed.com/videos',
          headers: {
              'cookie': 'bpager_desktop_rollout=null; bf_visit=b%3D%26u%3D.sr0V9W2NX%26v%3D2.0%26c%3D; country=in; bf-browser-language=en-GB,en-US; bf-geo-country=IN; __gads=ID=82251603ba70b622:T=1489294274:S=ALNI_MbJWAAr35ymtyWhdf0k5PqCD14x0Q; __qca=P0-428865401-1489294275576; abeagle_feedpager_video_related_02=experiment3; abeagle_awareness=on; _ga=GA1.2.1429181353.1489294274; _gat=1; bf_visit=b%3D%26u%3D.sr0V9W2NX%26v%3D2.0%26c; GED_PLAYLIST_ACTIVITY=W3sidSI6IitWQjEiLCJ0c2wiOjE0ODkzMDM5NTksIm52IjowLCJ1cHQiOjE0ODkyOTUzOTgsImx0IjoxNDg5Mjk1OTQ0fV0.',
              'if-none-match':'33ed79efc1c783e89f69c9a7ba46cb2ba1a5f065',
              'upgrade-insecure-requests':1,
              'user-agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
            }
      }, function(err, response, body) {
          //In case if any error occured during fetching the url
          if (err) return cb(err);
          
          // Tell Cherrio to load the HTML
          try{
              $ = cheerio.load(body);
              $('.js-feed-item ').each(function() {
                      
                      var obj = {}

                      var img = $('.card-title img', this).attr('data-src')
                      var info = $('.native-video script', this).text()
                      var jsonInfo = JSON.parse(info)
                      
                      obj["title"] = jsonInfo["name"]
                      obj["channel"] = img
                      obj["poster"] = jsonInfo["thumbSrc"]
                      videoArray.push(obj)
              });
              cb(null,videoArray)
          }catch(e){
              cb(e)
          }
          
      });
}

}

module.exports = appRouter;
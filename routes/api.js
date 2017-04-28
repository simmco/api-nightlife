const express = require("express");
const passportService = require("../services/passport");
const passport = require("passport");
const Yelp = require("yelp");

var Bar = require("../models/bar");
var User = require("../models/user");

const router = new express.Router();

const requireAuth = passport.authenticate("jwt", { session: false });

router.get("/", requireAuth, function(req, res) {
  res.send({ secret: "YOU SUCCESSFULLY LOGGED IN!!" });
});

router
  .route("/:location/bars")
  .get(function(req, res, next) {
    var location = req.params.location.toLowerCase();
    Bar.find({ location: location }, function(err, docs) {
      if (!err) {
        if (docs.length === 0) {
          return next();
        }

        res.send(docs);
      } else {
        throw err;
      }
    });
  })
  .get(function(req, res, next) {
    var location = req.params.location.toLowerCase();

    var yelp = new Yelp({
      consumer_key: "Ot8Eg8l5T4Egm5fvcr5X8g",
      consumer_secret: "S0d8Br9KjAc9F8OMj_q6oodL0jk",
      token: "2vcagDoheBViIZXL-PjNkAWMEIkEg0AP",
      token_secret: "qZ9bI5BLaxUPmUt1E48xcYreUH4"
    });

    yelp.search({ term: "bar", location: location }).then(function(data) {
      var busLength = data.businesses.length - 1;

      data.businesses.map((business, i) => {
        var bar = new Bar({
          location: location,
          name: business.name,
          img: business.image_url,
          snippet: business.snippet_text,
          visitors: 0
        });
        Bar.findOne({ location: bar.location, name: bar.name }, function(
          err,
          obj
        ) {
          if (err) {
            res.send(err);
          }
          if (i === busLength) {
            bar.save(function(err) {
              if (err) res.send(err);
              return next();
            });
          } else if (obj === null) {
            bar.save(function(err) {
              if (err) res.send(err);
            });
          }
        });
      });
    });
  })
  .get(function(req, res) {
    var location = req.params.location.toLowerCase();
    Bar.find({ location: location }, function(err, docs) {
      if (!err) {
        res.send(docs);
      } else {
        throw err;
      }
    });
  });

router.route("/:location/bars/save").get(requireAuth, function(req, res) {
  var userId = req.user._id;
  var location = req.params.location;

  User.findById(userId, function(err, user) {
    if (err) res.send(err);

    user.lastSearch = location;

    user.save(function(err) {
      if (err) res.send(err);
    });

    res.send(user);
  });
});

router.route("/:location/bars/:bar_id").get(requireAuth, function(req, res) {
  var userId = req.user._id;
  var barId = req.params.bar_id;
  var exist = false;
  User.findById(userId, function(err, user) {
    if (err) res.send(err);

    var index = user.going.indexOf(barId);
    if (index > -1) {
      user.going.splice(index, 1);
      exist = true;
    } else {
      user.going.push(barId);
    }

    user.save(function(err) {
      if (err) res.send(err);

      Bar.findById(barId, function(err, bar) {
        if (err) res.send(err);

        if (exist) {
          bar.visitors = bar.visitors - 1;
        } else {
          bar.visitors = bar.visitors + 1;
        }

        bar.save(function(err) {
          if (err) res.send(err);

          res.send(bar);
        });
      });
    });
  });
});

module.exports = router;

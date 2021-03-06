const express = require('express');
const router = express.Router();
const connection = require('../lib/dbconn');
const Handlebars = require('hbs');
const fs = require('fs');



router.get('/', isAuthenticated, function (req, res, next) {

  getUsers(function (rows) {

    const template = fs.readFileSync('views/agents.hbs', 'utf8');

    Handlebars.registerPartial('agentsTable', template);

    res.render('management', { agents: rows });

  });

});


router.get('/newkey', isAuthenticated, function (req, res, next) {

  createKey(function (key1, key2, key3) {

    res.send({ key1: key1, key2: key2, key3: key3 });

  });

});


router.get('/changerank/:rank/:matricule', isAuthenticated, function (req, res, next) {

  const rank = req.params.rank;
  const matricule = req.params.matricule




  checkMatricule(matricule, function (valid) {

    if (valid) {

      res.send({ result: true });

      if (rank >= 1 && rank <= 10) {

        var sql = "UPDATE users SET rank = '" + rank + "' WHERE matricule = '" + matricule + "'";

        connection.query(sql, function (err, result) {

          if (err) throw err;

        });

      }

      else if (rank == 0) {

        var sql = "DELETE FROM users WHERE matricule = '"+matricule+"'";

        connection.query(sql, function (err, result) {

          if (err) throw err;

        });

      }

    }

    else {

      res.send({ result: false });

    }

  });

});


router.get('/removeKeys', isAuthenticated, function (req, res, next) {

  removeAllKeys(function (result) {

    res.send({ affectedRows: result });

  });

});


function isAuthenticated(req, res, next) {

  if (req.session.user)

    return next();

  res.redirect('/login');

}


function getUsers(cb) {

  const sql = "SELECT * FROM users INNER JOIN ranks ON users.rank=ranks.id ORDER BY rank DESC";

  connection.query(sql, function (err, result) {

    if (err) throw err;

    cb(result);

  });

}

// Function creating a random string

function randomString(len, an) {

  an = an && an.toLowerCase();

  var str = "", i = 0, min = an == "a" ? 10 : 0, max = an == "n" ? 10 : 62;

  for (; i++ < len;) {

    var r = Math.random() * (max - min) + min << 0;

    str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);

  }

  return str;

}


// Function creating and storing a random signup key to the database

function createKey(callback) {

  var key1 = randomString(4, 'N');

  var key2 = randomString(4, 'A');

  var key3 = randomString(4, 'N');


  const sql = "INSERT INTO signup_keys (key1, key2, key3) VALUES ('" + key1 + "','" + key2 + "','" + key3 + "')";

  connection.query(sql, function (err, result) {

    if (err) throw err;

    callback(key1, key2, key3);

  });

}



// Function checking if a matricule is already used

function checkMatricule(matricule, callback) {

  const sql = "SELECT count(*) AS number FROM users WHERE matricule = '" + matricule + "' ";

  connection.query(sql, function (err, result) {

    if (err) throw err;

    if (parseInt(result[0]['number']) > 0) {

      callback(true);
    }

    else {

      callback(false);
    }

  });

}




// Function removing all keys from the database

function removeAllKeys(callback) {

  const sql = "DELETE FROM signup_keys";

  connection.query(sql, function (err, result) {

    if (err) throw err;

    callback(result.affectedRows);

  });

}



module.exports = router;
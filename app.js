#!/usr/bin/node

/** */
/** Dependencies */
var express = require('express');
var http = require('http');
var bodyparser = require('body-parser');
var fs = require('fs');
var jsonfile = require('jsonfile');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const speakeasy = require('speakeasy');
const QRCODE = require('qrcode');

/** Stores users as JSON */
var userfile = "users.txt";
var testHase;

/** Initialize express.js and its templates */
var app = express();
app.use(bodyparser.urlencoded({ extended: true }));
app.set('views', './views');
app.set('view engine', 'pug');

/** Initialize the Web Server */
http.createServer(app).listen("8080", function () {
	console.log("Web Server is listening on port 8080");
});

/** Default Page
		Renders template from view/login.pug
 */
app.get('/', function(req, res) {
	res.render('login');
});

/** Checks credentials when POST to /login-check
		Parses JSON file for usernames
		Compares post data with stored data
 */
app.post('/login-check', function(req, res) {



	jsonfile.readFile(userfile, function(er, data) { // Load user "database"
		
/** Returns filtered object.
		Should return exactly one object when username and password match an entry.
 */
 		var found;
		// var found = data.filter(function(item) {
		// 	return item.name == req.body.name &&  bcrypt.compareSync(req.body.password, item.password);
		// });

		for(var tt =0; tt < data.length; tt++){
			testHase = bcrypt.compareSync(req.body.password, data[tt].password);


			if(data[tt].twofactor==true){
				var tokenValidates = speakeasy.totp.verify({
				  secret: data[tt].secret,
				  encoding: 'base32',
				  token: req.body.code,
				  window: 6
				});
				if(data[tt].name == req.body.name && testHase == true && tokenValidates == true){
					//res.send("Successful login");
					found = true;
				}
			} else {
				if(data[tt].name == req.body.name && testHase == true){
					//res.send("Successful login");
					found = true;
				}
			}
		}
	//	res.send("Invalid Login");
/** Checks if the filtered object is exactly one.
		Displays success if it is (because username and password matched)
		Displays failure if any value other than zero
 */
		if (found==true) {
			res.send("Successful login");
		}
		else {
			res.send("Login failed because of wrong password or non-existing account.");
		}
		// check for non-existing user

	});
});

/** New user page. Renders template from views/newuser.pug */
app.get('/add-users', function(req, res) {
	res.render('newuser');
});

/** Current users page.
 		Reads userfile "database".
		Renders template from views/users.pug by passing the users object
 */
app.get('/users', function(req, res) {
	jsonfile.readFile(userfile, function(err, obj){
		if (err) throw err;
		console.log(obj);
		res.render('users', { users: obj });
	});
});

/** Add users page.
 		Reads userfile "database".
		Appends JSON object with POST data to the old userfile object.
		Writes new object to the userfile.
 */

app.post('/adduser', function(req, res) {
// storing users in file

		
		
		bcrypt.genSalt(saltRounds, function(err, salt){
			bcrypt.hash(req.body.password, saltRounds, function(err, hash){
				var secret = speakeasy.generateSecret();
				QRCODE.toDataURL(secret.otpauth_url, function(err, data_url) {
				  console.log(data_url);
				  
				  var two_factor_temp_secret = secret.base32;

				  var userdata = { name: req.body.name, password: hash, twofactor: true, secret:two_factor_temp_secret};
					fs.readFile(userfile, function(er, data) {
						var json = JSON.parse(data);
						json.push(userdata);
						jsonfile.writeFile(userfile, json, (err) => {
				        res.send('successfully registered new user...<br>'
								+ '<a href="/users">Back to User List</a>'+'<img src="' + data_url + '">');
			    		});
					});
					  
				});

				


			});
		});

		

});

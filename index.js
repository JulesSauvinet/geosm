'use strict';

const express = require('express');
const app = module.exports = express();
const bodyparser = require('body-parser');
const session = require('cookie-session');
const basicauth = require('basicauth-middleware');
const mongoose = require('mongoose');

let server_port = 3000;

var server = app.listen(server_port, () => console.log(`Server listening on port ${server_port}`));

app.use(bodyparser.json());

var urlencodedParser = bodyparser.urlencoded({ extended: true });
app.use(urlencodedParser);

app.use('/', express.static(__dirname + '/public'));

var controller =  require('./src/controllers/MainController');
app.use('/', controller);

const spawn = require('child_process').spawn;

var database = require('./src/database/MainHandler');
database.initializeDb();
app.on('SIGINT', function() {
  mongoose.connection.close();
});


app.use(['/deploy', '/restart'], basicauth('gof','reek'));

// MAJ de l'app sur le serveur
app.get('/deploy', (req, res) => {
	const deploy = spawn('./update_to_last_release.sh');
	let out = '';

	deploy.stdout.on('data', (data) => out += data);
	deploy.stderr.on('data', (data) => out += data);

	deploy.on('close', (code) => {
		out += ` [ STATUS CODE ] ${code}`;
		res.end(out);
	});
});

// Reémarre node
app.get('/restart', (req, res) => {
	res.end('Restart serveur...');
	spawn('./start.sh', [], { detached: true }).unref();
});




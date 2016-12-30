var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var fs         = require('fs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.set('views',__dirname+"/app/views");
app.set('view engine','ejs');

var port = 8080;

var router = express.Router();

var databaseFile = "./database.json";
/*
{
	"userName":{
		"password":"supersecurepassword",
		"about":"i am sexy and I know it";
		"images":[{
			"imagePath":image path1",
			"caption" : "Awesome image",
			"comments":[{
				"name":"ved",
				"timestamp":14444437655,
				"comment":"awesome photo bro!"
			}]
		}]
	}
}
*/

require('./app/routes/userRoute.js')(router,databaseFile);

app.use('/api', router);

app.get('/',function(req,res){
	req.databaseData = JSON.parse(fs.readFileSync(databaseFile));
	var userAbouts = {};
	for(var key in req.databaseData){
		userAbouts[key]={
			"about":req.databaseData[key].about,
			// "images":req.databaseData[key].images,
		}
	}
	res.render('pages/login',{
		greeting:"Welcome to Gala app, these are our awesome users.",
		users:userAbouts
	})
})

app.get('/signup',function(req,res){
	res.render('pages/signup')
})

app.use(express.static("."))

app.get('/profile',function(req,res){
	var name = req.query.name;

	console.log("getting profile of->",name);
	req.databaseData = JSON.parse(fs.readFileSync(databaseFile));
	console.log("req.databaseData[name]->",req.databaseData[name])
	res.render('pages/profile',{
		name:name,
		about:req.databaseData[name].about,
		images:req.databaseData[name].images
	});
})

app.get('/uploadImage',function(req,res){
	res.render('pages/uploadImage');
})

app.listen(port);
console.log("code is running");
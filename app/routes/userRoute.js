var fs         = require('fs');
var multer     = require('multer');

module.exports = function(router,databaseFile){
	router.use(function(req,res,next){
		console.log("do something, tease the user,boo!");
		req.databaseData = JSON.parse(fs.readFileSync(databaseFile));
		next();
	})

	router.get('/',function(req,res){
		console.log("/ was called");
		res.json({message:"yohohoho, its running fine!"})
	})

	router.route('/users')
		.get(function(req,res){
			var userAbouts = {};
			for(var key in req.databaseData){
				userAbouts[key]={
					"about":req.databaseData[key].about,
					"images":req.databaseData[key].images,
				}
			}
			res.json({message:"fetched all users",users:userAbouts});
		})

	router.route('/user/:userName')
		.get(function(req,res){
			var userName = req.params.userName;
			console.log("getting details of username->",userName);
			if(req.databaseData.hasOwnProperty(userName)){
				res.json({message:"Details of "+userName,about:req.databaseData[userName].about,images:req.databaseData[userName].images});
			}
			else{
				res.json({message:"no user with userName "+userName+" exists"});
			}
		})

	router.route('/user')
		.post(function(req,res){
			var userName = req.body.name;
			var userPassword = req.body.password;
			var userAbout = req.body.about;
			if(req.databaseData.hasOwnProperty(userName)){
				res.json({message:"user with the username already exists, please specify new unique userName"});
			}
			else{
				req.databaseData[userName]={
					"password":userPassword,
					"about":userAbout
				}
				fs.writeFileSync(databaseFile, JSON.stringify(req.databaseData));
				res.json({message:"user stored!"});
			}
		})

	router.route('/editUser')
		.post(function(req,res){
			var userName = req.body.name;
			var userOldPassword = req.body.oldPassword;
			var userNewPassword = req.body.newPassword;
			var userAbout = req.body.about;
			if(req.databaseData.hasOwnProperty(userName)){
				if(req.databaseData[userName].password==userOldPassword){
					req.databaseData[userName] = {
						"password":userNewPassword,
						"about":userAbout
					}
					fs.writeFileSync(databaseFile,JSON.stringify(req.databaseData));
					res.json({message:"the details of user are successfully updated"});
				}
				res.json({message:"the password provided was not correct"});

			}
			else{
				res.json({message:"user with the userName does not exists in database"});
			}
		})


	// router.use(multer({dest:"./uploads/"}).single('fileToUpload'));
	router.route('/upload')
		.post(function(req,res){
			
			multer({dest:"./uploads/"}).single('fileToUpload')(req,res,function(err){
				if(err)console.error(err);
				else{
					console.log("uploading files->",req.file);
					var filePath = req.file.path;
					var userName = req.body.name;
					var password = req.body.password;
					var caption  = req.body.caption || "";
					console.log("user: "+userName+" has uploaded a file: "+filePath);
					if(req.databaseData.hasOwnProperty(userName)){
						if(req.databaseData[userName].password == password){
							if(req.databaseData[userName].hasOwnProperty("images")){
								req.databaseData[userName]["images"].push({
									"imagePath":filePath,
									"caption":caption
								});
							}
							else{
								req.databaseData[userName]["images"] = [{
									"imagePath":filePath,
									"caption":caption
								}];
							}
							fs.writeFileSync(databaseFile,JSON.stringify(req.databaseData));
							// res.json({message:"file uploaded"});
							res.redirect("/profile?name="+userName);
						}
						else{
							res.json({message:"wrong password provided"});
						}
					}
					else{
						res.json({message:"no user with username exists in database"});
					}
				}
			});

		})

	router.route('/getImage')
		.get(function(req,res){
			var imagePath=req.query.imagePath;
			console.log("imagePath->",imagePath,"__dirname:",__dirname);
			res.sendFile(imagePath,{root:__dirname+"/../.."},function(err){
				if(err){
					console.error("error faced in fetching the file",err);
					res.json({message:"the file is not found"});
				}
			});
		})

	router.route('/comment')
		.post(function(req,res){
			var userNameWhoCommented = req.body.userNameWhoCommented;
			var userNameWhoReceived  = req.body.userNameWhoReceived;
			var password             = req.body.password;
			var imagePath            = req.body.imagePath;
			var comment              = req.body.comment;

			console.log("req.databaseData->",req.databaseData);
			console.log("userNameWhoCommented->",userNameWhoCommented);
			console.log("userNameWhoReceived->",userNameWhoReceived);
			if(req.databaseData.hasOwnProperty(userNameWhoCommented) && req.databaseData.hasOwnProperty(userNameWhoReceived)){
				if(req.databaseData[userNameWhoCommented].password == password){
					for(var key in req.databaseData[userNameWhoReceived].images){
						if(req.databaseData[userNameWhoReceived].images[key].imagePath==imagePath){
							if(req.databaseData[userNameWhoReceived].images[key].hasOwnProperty("comments")){
								req.databaseData[userNameWhoReceived].images[key].comments.push({
									name:userNameWhoCommented,
									timestamp:Date.now(),
									comment:comment
								})
								fs.writeFileSync(databaseFile,JSON.stringify(req.databaseData));
							}
							else{
								req.databaseData[userNameWhoReceived].images[key].comments = [{
									name:userNameWhoCommented,
									timestamp:Date.now(),
									comment:comment
								}];
								fs.writeFileSync(databaseFile,JSON.stringify(req.databaseData));
							}

						}
					}
					res.json({message:"comment successfull"});

				}
				else{
					res.json({message:"wrong password provided"});
				}

			}
			else{
				res.json({message:"the user does not exist"});
			}
		})

	router.route('/verifyPassword')
		.post(function(req,res){
			var userName=req.body.name;
			var password=req.body.password;
			if(req.databaseData.hasOwnProperty(userName)){
				if(req.databaseData[userName].password==password){
					res.redirect("/profile?name="+userName);
				}
				else{
					res.json({message:"wrong password"});
				}

			}
			else{
				res.json({message:"no user exists with that userName"+userName});
			}
		})
}
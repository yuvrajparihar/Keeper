require("dotenv").config();
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const cors = require("cors")
const passport = require('passport')
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require('mongoose-findorcreate')
const jwt = require("jsonwebtoken")


const app = express();
const PORT = process.env.PORT || 5000
app.use(cors());
app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());

mongoose.connect("mongodb+srv://yuvrajparihar:Webdev292@cluster0.zyfyw.mongodb.net/keeperDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
// mongoose.connect("mongodb://localhost:27017/keeperDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false,
// });

const itemSchema={
    title:String,
    content:String
}

const userSchema = new mongoose.Schema({
    Email:String,
    Password:String,
    data:[itemSchema]
})

userSchema.plugin(findOrCreate);

const items = mongoose.model("item",itemSchema);
const users = mongoose.model("user",userSchema);
 
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://my-keeper-server.herokuapp.com/auth/google/keep",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    passReqToCallback   : true
  }, 
  function(request, accessToken, refreshToken, profile, done) {
      
    users.findOrCreate({ Email: profile.email }, function (err, user) {
      return done(err,user);
    });
   
  } 
));

function generateAccessToken(user){
    return jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"23h"});
}

function authenticateToken(req, res, next){
  
    const authHeader= req.headers["authorization"]
   
    const token = authHeader && authHeader.split(" ")[1]
    if (token===null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,function(err,user){
        if(err) return res.send({"response":403})

        req.user = user;
        next();

    })
}

app.get('/auth/google',
  passport.authenticate('google', { scope: [ 'email', 'profile' ] }
));



app.get('/auth/google/keep', 
  passport.authenticate('google', {
       session:false,
       failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
   const User = {
       Email:req.user.Email
   }
    // console.log(User)
    const token = generateAccessToken(User)
    res.redirect("https://keeper.netlify.app?token=" + token);
    
  });

app.post("/register",function(req, res){
 
users.findOne({Email:req.body.email},function(err,found){
    if(err){
        console.log(err)
    }
    else{
        if(found){
            res.send({"response":"Registererd"})
        }
        else{
            bcrypt.hash(req.body.password,8,function(err,hash){
                if(err){
                    console.log(err)
                }
                else{
                    const newUser = new users({
                        Email: req.body.email,
                        Password: hash,
                      });
        
                      newUser.save(function(err){
                        if(err){
                            console.log(err)
                        }
                        else{
                            const User = {
                                Email:req.body.email
                            }
                            const token = generateAccessToken(User)
                           res.send({"token":token});
                        }
                      })
                }
            })

        }
    }
})

   

})

app.post("/login",function(req, res){

    users.findOne({Email:req.body.email},function(err,found){
        if(err){
            console.log(err)
        }
        else{
            if(found){
               bcrypt.compare(req.body.password, found.Password, function(err,result){
                if(err){
                    console.log(err)
                }
                else{
                    if(result===true){
                        const User = {
                            Email:req.body.email
                        }
                         const token = generateAccessToken(User)
                        res.send({"token":token})
                    }
                    else{
                        res.send({"response":"wrong"});
                    }
                }
               })
            }
            else{
                res.send({"response":"notRegistered"})
            }
        }
    })
})


app.get("/",authenticateToken,function(req,res){
 
  users.findOne({Email:req.user.Email},function(err,found){
    if(err){
        console.log(err)
    }
    else{
        if(found){
            // console.log(found)
            res.send(found.data);
        }
    }
  })

 

   
});

app.post("/add",authenticateToken,function(req, res){
    const title = req.body.title;
    const content = req.body.content;
 
    const newItem = {
    title:title,
    content:content
} 
// console.log(newItem)
 
   users.findOne({Email:req.user.Email},function(err, found){
    if(err){
        console.log(err)
    }
    else{
        if(found){
            found.data.push(newItem);
            found.save(function(err,User){
                if(err){
                    console.log(err)
                }
               else{
                res.send(User.data)
               }
            });
            // console.log(found)
            
        }
    }
   })
  
})

app.post("/delete",authenticateToken,function(req, res){

   const deleteId = req.body.id;
   users.findOneAndUpdate({Email:req.user.Email},{$pull:{data:{_id:deleteId}}},function(err, foundList){
    if(err){
      console.log(err)
     
    }
    else{
        users.findOne({Email:req.user.Email},function(err,found){
            if(err){
                console.log(err)
            }
            else{
                if(found){
                    // console.log(found)
                    res.send(found.data);
                }
            }
          })
    }
  })

  
//    res.redirect("/");

    // console.log(req.body)
    // res.send({"hello":"world"})
})



app.listen(PORT,function(){
    console.log("server is listening on 5000")
})

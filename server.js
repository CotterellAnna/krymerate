require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const ejs = require("ejs");
const _ = require("lodash");
const encrypt = require("mongoose-encryption");
const session = require("express-session");
const { log } = require("console");
const http = require("http");
const port = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI;
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const secret = process.env.secret;
const app = express();


app.get("/api_key", function(req, res){
    res.send({key: apiKey})
})

const server = http.createServer(app);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs")

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(express.static("public"));

app.use(session({
    secret: 'my-secret-key',
    resave: false,
    saveUnintialized: false
}));



mongoose.connect(URI)
    .then(console.log("Connected to mongoDB"))
    .catch(err=>console.log("this "+ err));

const crimeSchema = {
    type: {
        type: String,
        required: [true, "Name of crime not specified"]
    },
    count:{
        type: Number,
        required: [true, "Crime count not specified"]
    }
}

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name of place not specified"],
        unique: true,
        collation: { locale: 'en', strength: 2 } 
    },
    type: {
        type: String,
        required: [true, "Location type not specified"]
    },
    population: {
        type: Number,
        required: [true, "Population not specified"]
    },
    crime_info:{
        crimes: [crimeSchema],
        total_crimes_committed: {
            type: Number,
            default: function(){
                return this.crime_info.crimes.reduce(function(acc, obj){
                    return acc + obj.count;
                }, 0)
            }
        }
    },
    last_modified: {
        type: Date,
        default: Date.now,
        get: function(date) {
          return moment(date).format('YYYY-MM-DD HH:mm:ss');
        }
    }
});

// Add virtual field to calculate crime rating
locationSchema.virtual('crime_rating').get(function() {
    const totalCrimes = this.crime_info.total_crimes_committed;
    const population = this.population;
    const crimeRating = Math.round((totalCrimes / population) * 100);
  
    if (crimeRating >= 0 && crimeRating <= 49) {
      return 'Low';
    } else if (crimeRating >= 50 && crimeRating <= 74) {
      return 'Medium';
    } else {
      return 'High';
    }
});

locationSchema.pre('save', function (next) {
    this.last_modified = new Date();
    next();
});
  
// Set virtual field to be included in JSON output
locationSchema.set('toJSON', { virtuals: true });

const Location = mongoose.model("Location", locationSchema);

const adminSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
});

adminSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']})

const Admin = mongoose.model('Admin', adminSchema);

// API endpoints
{
///////////////////////////////////////////////////////Request for all locations///////////////////////////////////////////////////////

app.route("/locations")
    .get(function(req,res){
        Location.find()
        .then(docs => res.json(docs))
        .catch(err => res.send(err))
    })
    .post(async(req,res)=>{
        try{
            const new_location = new Location(req.body);

            await new_location.save();

            res.status(201).json({message:"Location record created successfully", location: new_location})
        }catch(err){
            res.status(500).json({error: err.message});
        }
    })
///////////////////////////////////////////////////////Request for specific location///////////////////////////////////////////////////////

app.route("/location/:locationName")
    .get(function(req, res){
        const locationName = req.params.locationName;
        const regexPattern = new RegExp(locationName.replace(/\s/g, "-"), "i");
        Location.findOne({name:{ $regex: regexPattern }})
            .then((result)=>{
                if(result){
                    res.json(result)
                }else{
                    res.status(404).send({message:'Location not found'})
                }
            })
            .catch((err)=>{res.send(err)})
    })
}

app.route("/location_id/:location_id")
    .get(function(req, res){
        const id = req.params.location_id
        Location.findById(id)
            .then((result)=>{
                if(result){
                    res.json(result)
                }else{
                    res.status(404).send({message:'Location not found'})
                }
            })
            .catch((err)=>{res.send(err)})
    })
    .patch(async (req,res) =>{
        try{
            const id = req.params.location_id;
            const result = await Location.findByIdAndUpdate(
                id,
                { $set: req.body },
                { new: true }
            );
            res.send(result);
        } catch(err){
            console.log(err);
            res.status(500).send({message:'Update failed'});
        }
    })
    .delete(async(req,res)=>{
        try{
            const id = req.params.location_id;
            const result = await Location.findByIdAndDelete(id);
            res.status(200).json(result)
        }catch(err){
            console.log(err);
            res.status(500).send({message: "Unable to delete"})
        }
    })

// web app
app.get("/", function(req,res){
    res.render("home");
})

app.get("/empty", function(req, res){
    res.render("empty");
})

app.post("/empty", function(req, res){
    res.redirect("/empty");
})

// admin login
app.get("/admin", function(req, res){
    res.redirect("/admin/login");
})
app.get("/admin/login", function(req,res){
    res.render("admin_login", {message: ""})
})

app.post("/admin/login", function(req, res){
    const email = req.body.email;
    const password = req.body.password;

    Admin.findOne({email: email})
        .then((foundAdmin)=>{
            if(foundAdmin){
                if(foundAdmin.password  === password){
                    req.session.loggedIn = true;
                    res.redirect("/admin/home");
                }else{
                    res.render("admin_login", {message: "*Check your details and try again."});
                }
            }else{
                res.render("admin_login", {message: "*Check your details and try again."});
            }
        })
        .catch((err)=>{
            console.log(err);
            res.render("admin_login", {message: "*Check your details and try again."});
        })
})

app.get("/admin/home", function(req,res){
    if(req.session.loggedIn){
        res.render("admin");
    }else{
        res.redirect("/admin/login")
    }
})

app.get("/admin/logout", function(req,res){
    console.log("hey");
    req.session.loggedIn = false;
    res.redirect("/admin/login");
})
server.listen(port, function(){
    console.log(`Server started on port ${port}`)
})
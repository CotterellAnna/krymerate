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
const { hostname } = require("os");
const port = process.env.PORT || 5000;
const server = http.createServer(app);

const app = express();

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


// "mongodb://cotterellanna:theCrimeLocationApiDB@ac-fflzjbu-shard-00-00.gtjbxso.mongodb.net:27017,ac-fflzjbu-shard-00-01.gtjbxso.mongodb.net:27017,ac-fflzjbu-shard-00-02.gtjbxso.mongodb.net:27017/locationCrimeDB?ssl=true&replicaSet=atlas-pt8zrz-shard-0&authSource=admin&retryWrites=true&w=majority"
mongoose.connect("mongodb+srv://cotterellanna:theCrimeLocationApiDB@crime-location.gtjbxso.mongodb.net/locationCrimeDB?retryWrites=true&w=majority")
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

const secret ="ThisistheadminSecretysecret";
adminSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']})

const Admin = mongoose.model('Admin', adminSchema);

var new_location = [{
    name: "Ado-Ekiti",
    type: "city",
    population: 750000,
    crime_info:{
        crimes:[
            {
                type: "murder",
                count: 3000
            },
            {
                type: "kidnap",
                count: 500
            },
            {
                type: "armed robbery",
                count: 10000
            }
        ]
    }
}]

let lgaDocs = [
    {
        name: "Abua-dual",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap", "murder"]
    },
    {
        name: "Ahoada East",
        locationType: "LGA",
        crimePossiblity: 50,
        crimesCommitted: ["robbery", "kidnap", "cult-related violence", "murder", "rape"]
    },
    {
        name: "Ahoada West",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap", "murder"]
    },
    {
        name: "Akuku-Toru",
        locationType: "LGA",
        crimePossiblity: 50,
        crimesCommitted: ["robbery", "kidnap", "murder", "bunkery"]
    },
    {
        name: "Andoni",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap", "cult-related violence", "murder"]
    },
    {
        name: "Asari-Toru",
        locationType: "LGA",
        crimePossiblity: 75,
        crimesCommitted: ["robbery", "kidnap", "rape", "cult-related violence", "murder", "bunkery", "assasination", "pilfery"]
    },
    {
        name: "Bonny",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap", "maritime crimes", "murder"]
    },
    {
        name: "Degema",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap", "murder"]
    },
    {
        name: "Eleme",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap", "jungle justice", "pilfery"]
    },
    {
        name: "Emuoha",
        locationType: "LGA",
        crimePossiblity: 50,
        crimesCommitted: ["robbery", "kidnap"]
    },
    {
        name: "Etche",
        locationType: "LGA",
        crimePossiblity: 75,
        crimesCommitted: ["robbery", "kidnap", "rape", "cult-related violence"]
    },
    {
        name: "Gokana",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap", "cult-related violence"]
    },
    {
        name: "Ikwerre",
        locationType: "LGA",
        crimePossiblity: 75,
        crimesCommitted: ["robbery", "kidnap", "cult-related violence", "assassination", "murder"]
    },
    {
        name: "Khana",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap"]
    },
    {
        name: "Obio-Akpor",
        locationType: "LGA",
        crimePossiblity: 80,
        crimesCommitted: ["robbery", "kidnap", "cult-related violence", "murder", "rape", "assassination", "pilfery"]
    },
    {
        name: "Ogba-Egbema-Ndoni",
        locationType: "LGA",
        crimePossiblity: 75,
        crimesCommitted: ["robbery", "kidnap", "cult-related violence", "assassination", "murder"]
    },
    {
        name: "Ogu-Bolo",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap"]
    },
    {
        name: "Okrika",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap"]
    },
    {
        name: "Omuma",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap"]
    },
    {
        name: "Opobo-Nkoro",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap"]
    },
    {
        name: "Oyigbo",
        locationType: "LGA",
        crimePossiblity: 25,
        crimesCommitted: ["robbery", "kidnap"]
    },
    {
        name: "Port Harcourt",
        locationType: "LGA",
        crimePossiblity: 75,
        crimesCommitted: ["robbery", "kidnap", "rape", "cult-related violence", "assassination", "murder", "pilfery", "bunkery"]
    },
    {
        name: "Tai",
        locationType: "LGA",
        crimePossiblity: 50,
        crimesCommitted: ["robbery", "kidnap", "bunkery", "murder", "cult-related violence"]
    }
]

let phTowns = [
    {
        name: "Azuabie",
        type: "town",
        population: 35001,
        crime_info: {
            crimes: [
                {
                    type: "kidnap",
                    count: 159
                },
                {
                    type: "murder",
                    count: 500
                },
                {
                    type: "pilfery",
                    count: 100000
                }
            ]
        }
    },
    {
        name: "Abuloma",
        type: "town",
        population: 103567,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1003
                },
                {
                    type: "murder",
                    count: 521
                },
                {
                    type: "pilfery",
                    count: 20138
                }
            ]
        }
    },
    {
        name: "Agip",
        type: "town",
        population: 30456,
        crime_info: {
            crimes: [
                {
                    type: "kidnap",
                    count: 121
                },
                {
                    type: "murder",
                    count: 50
                },
                {
                    type: "pilfery",
                    count: 30054
                }
            ]
        }
    },
    {
        name: "Akpajo",
        type: "town",
        population: 50398,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 39
                },
                {
                    type: "murder",
                    count: 103
                },
                {
                    type:"pilfery",
                    count: 350
                }
            ]
        }
    },
    {
        name: "Amadi Ama",
        type: "town",
        population: 9500,
        crime_info: {
            crimes: [
                {
                    type: "kidnap",
                    count: 90
                },
                {
                    type: "murder",
                    count: 50
                },
                {
                    type: "pilfery",
                    count: 1200
                }
            ]
        }
    },
    {
        name: "Borkiri",
        type: "town",
        population: 30000,
        crime_info: {
            crimes: [
                {
                    type:"murder",
                    count: 1023
                },
                {
                    type: "pilfery",
                    count: 2321
                },
                {
                    type: "cult related violence",
                    count: 1093
                },
                {
                    type: "rape",
                    count: 598
                },
                {
                    type: " bunkery",
                    count: 352
                },
                {
                    type: "armed robbery",
                    count: 20543
                }
            ]
        }
    },
    {
        name: "Bundu Ama",
        type: "town",
        population: 3000,
        crime_info: {
            crimes: [
                {
                    type: "kidnap",
                    count: 15
                },
                {
                    type: "murder",
                    count: 193
                },
                {
                    type: "pilfery",
                    count: 250
                }
            ]
        }
    },
    {
        name: "D-line",
        type: "town",
        population: 55432,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1409
                },
                {
                    type: "murder",
                    count: 2032
                },
                {
                    type: "cult related violence",
                    count: 3002
                },
                {
                    type: "rape",
                    count: 254
                },
                {
                    type: "bunkery",
                    count: 123
                },
                {
                    type: "armed robbery",
                    count: 1021
                },
                {
                    type: "pilfery",
                    count: 3029
                }
            ]
        }
    },
    {
        name: "Diobu",
        type: "town",
        population: 109321,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 2409
                },
                {
                    type: "murder",
                    count: 2432
                },
                {
                    type: "cult related violence",
                    count: 3022
                },
                {
                    type: "rape",
                    count: 254
                },
                {
                    type: "bunkery",
                    count: 123
                },
                {
                    type: "armed robbery",
                    count: 1021
                },
                {
                    type: "pilfery",
                    count: 3029
                }
            ]
        }
    },
    {
        name: "Eagle Island",
        type: "town",
        population: 8032,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 90
                },
                {
                    type: "murder",
                    count: 76
                },
                {
                    type: "pilfery",
                    count: 132
                }
            ]
        }
    },
    {
        name: "Elekahia",
        type: "town",
        population: 59091,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1009
                },
                {
                    type: "murder",
                    count: 2032
                },
                {
                    type: "cult related violence",
                    count: 1022
                },
                {
                    type: "rape",
                    count: 312
                },
                {
                    type: "bunkery",
                    count: 109
                },
                {
                    type: "armed robbery",
                    count: 1221
                },
                {
                    type: "pilfery",
                    count: 1029
                }
            ]
        }
    },
    {
        name: "Fimie Ama",
        type: "town",
        population: 10092,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 78
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1302
                }
            ]
        }
    },
    {
        name: "Marine base",
        type: "town",
        population: 90382,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1009
                },
                {
                    type: "murder",
                    count: 2032
                },
                {
                    type: "cult related violence",
                    count: 1022
                },
                {
                    type: "rape",
                    count: 312
                },
                {
                    type: "bunkery",
                    count: 1032
                },
                {
                    type: "armed robbery",
                    count: 1221
                },
                {
                    type: "pilfery",
                    count: 12229
                }
            ]
        }
    },
    {
        name: "Mgbuosimini",
        type: "town",
        population: 5063,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 102
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1502
                }
            ]
        }
    },
    {
        name: "New GRA",
        type: "town",
        population: 20987,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 192
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1582
                }
            ]
        }
    },
    {
        name: "Nkpogu",
        type: "town",
        population: 10930,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 192
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1582
                }
            ]
        }
    },
    {
        name: "Nkpolu Oroworukwo",
        type: "town",
        population: 12876,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1092
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1582
                }
            ]
        }
    },
    {
        name: "Ogbunabali",
        type: "town",
        population: 23094,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1009
                },
                {
                    type: "murder",
                    count: 2032
                },
                {
                    type: "cult related violence",
                    count: 1022
                },
                {
                    type: "rape",
                    count: 312
                },
                {
                    type: "bunkery",
                    count: 1032
                },
                {
                    type: "armed robbery",
                    count: 1221
                },
                {
                    type: "pilfery",
                    count: 12229
                }
            ]
        }
    },
    {
        name: "Old GRA",
        type: "town",
        population: 15653,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 192
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1582
                }
            ]
        }
    },
    {
        name: "Old Port Harcourt Township",
        type: "town",
        population: 38547,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1009
                },
                {
                    type: "murder",
                    count: 2032
                },
                {
                    type: "cult related violence",
                    count: 1022
                },
                {
                    type: "rape",
                    count: 312
                },
                {
                    type: "armed robbery",
                    count: 1221
                },
                {
                    type: "pilfery",
                    count: 12229
                }
            ]
        }
    },
    {
        name: "Oroabali",
        type: "town",
        population: 21094,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1092
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 15582
                }
            ]
        }
    },
    {
        name: "Oroada",
        type: "town",
        population: 19097,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 192
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1582
                }
            ]
        }
    },
    {
        name: "Orochiri",
        type: "town",
        population: 6754,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 122
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1582
                }
            ]
        }
    },
    {
        name: "Orogbum",
        type: "town",
        population: 10987,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1022
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1982
                }
            ]
        }
    },
    {
        name: "Orolozu",
        type: "town",
        population: 3456,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 102
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1982
                }
            ]
        }
    },
    {
        name: "Oromeruezimgbu",
        type: "town",
        population: 3298,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 12
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 1022
                }
            ]
        }
    },
    {
        name: "Oroworukwo",
        type: "town",
        population: 2398,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 16
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 122
                }
            ]
        }
    },
    {
        name: "Oromineke",
        type: "town",
        population: 9874,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 16
                },
                {
                    type: "murder",
                    count: 98
                },
                {
                    type: "pilfery",
                    count: 122
                }
            ]
        }
    },
    {
        name: "Ozuboko Ama",
        type: "town",
        population: 7635,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 102
                },
                {
                    type: "murder",
                    count: 198
                },
                {
                    type: "pilfery",
                    count: 1022
                }
            ]
        }
    },
    {
        name: "Rebisi",
        type: "town",
        population: 3642,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 109
                },
                {
                    type: "murder",
                    count: 65
                },
                {
                    type: "pilfery",
                    count: 154
                }
            ]
        }
    },
    {
        name: "Rumukalagbor",
        type: "town",
        population: 6773,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1009
                },
                {
                    type: "murder",
                    count: 2032
                },
                {
                    type: "cult related violence",
                    count: 1022
                },
                {
                    type: "rape",
                    count: 312
                },
                {
                    type: "armed robbery",
                    count: 1221
                },
                {
                    type: "pilfery",
                    count: 1029
                }
            ]
        }
    },
    {
        name: "Rumuigbo",
        type: "town",
        population: 9847,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 129
                },
                {
                    type: "murder",
                    count: 115
                },
                {
                    type: "pilfery",
                    count: 2304
                }
            ]
        }
    },
    {
        name: "Rumuobiakani",
        type: "town",
        population: 39048,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1009
                },
                {
                    type: "murder",
                    count: 2032
                },
                {
                    type: "cult related violence",
                    count: 1022
                },
                {
                    type: "rape",
                    count: 312
                },
                {
                    type: "armed robbery",
                    count: 1221
                },
                {
                    type: "pilfery",
                    count: 2229
                }
            ]
        }
    },
    {
        name: "Rumuokwuta",
        type: "town",
        population: 13483,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 829
                },
                {
                    type: "murder",
                    count: 1150
                },
                {
                    type: "pilfery",
                    count: 1504
                }
            ]
        }
    },
    {
        name: "Rumuokoro",
        type: "town",
        population: 15000,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 829
                },
                {
                    type: "murder",
                    count: 1150
                },
                {
                    type: "pilfery",
                    count: 5504
                }
            ]
        }
    },
    {
        name: "Rumubiekwe",
        type: "town",
        population: 6754,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 829
                },
                {
                    type: "murder",
                    count: 100
                },
                {
                    type: "pilfery",
                    count: 1504
                }
            ]
        }
    },
    {
        name: "Rumuwoji",
        type: "town",
        population: 13098,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 1009
                },
                {
                    type: "murder",
                    count: 2032
                },
                {
                    type: "cult related violence",
                    count: 1022
                },
                {
                    type: "rape",
                    count: 312
                },
                {
                    type: "armed robbery",
                    count: 1221
                },
                {
                    type: "pilfery",
                    count: 2229
                }
            ]
        }
    },
    {
        name: "Rumuodara",
        type: "town",
        population: 7856,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 829
                },
                {
                    type: "murder",
                    count: 100
                },
                {
                    type: "pilfery",
                    count: 1804
                }
            ]
        }
    },
    {
        name: "Tere-Ama",
        type: "town",
        population: 8976,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 829
                },
                {
                    type: "murder",
                    count: 100
                },
                {
                    type: "pilfery",
                    count: 2004
                }
            ]
        }
    },
    {
        name: "Okuru-Ama",
        type: "town",
        population: 20875,
        crime_info: {
            crimes: [
                {
                    type:"kidnap",
                    count: 829
                },
                {
                    type: "murder",
                    count: 100
                },
                {
                    type: "pilfery",
                    count: 2004
                }
            ]
        }
    }
]

// Location.insertMany(phTowns)
//     .then(()=>{console.log("saved docs successfully")})
//     .catch((err)=>{console.log(err)})


let new_admin = new Admin({
    email: "cotterellanna@icloud.com",
    password: "adminTestPassword#1"
})

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
        const locationName = req.params.locationName
        Location.findOne({name: locationName})
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
server.listen(port, hostname:()=>{
    console.log(`Server started on port ${port}`)
})
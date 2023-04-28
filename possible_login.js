const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      trim: true
    }
});
  
const User = mongoose.model('User', userSchema);

// Configure passport to use the local strategy
passport.use(new LocalStrategy(
    (email, password, done)=>{

        User.findOne({email: email})
            .then((user)=>{
                if(!user){
                    return done(null, false, { message: 'Incorrect username.' });
                }
            })
            .catch((err)=>{
                return done(err)
            })

        bcrypt.compare(password, user.password, (err, res) => {
            if (err) { return done(err); }
            if (res === false) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    }
))

// Serialize and deserialize the user object
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
User.findById(id, (err, user) => {
    done(err, user);
});
});
  
// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Define routes for the login page and dashboard
app.get('/login', (req, res) => {
    res.render('login');
});


app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));


// api things
// {
//     .post(function(req,res){
//         const location = new Location({
//             name: req.body.name,
//             type: req.body.type,
//             crime_rating: req.body.crime_rating,
//             crime_info:{
//                 crimes: req.body.crimes
//             }
//         })

//         location.save()
//             .then(()=>res.send({message: "New location and crime info saved successfully"}))
//             .catch(err => res.send(err))
//     })
//     .delete(function(req,res){
//         Location.deleteMany()
//             .then(res.send({message: "All location and crime info deleted successfully"}))
//             .catch(err => res.send(err))
//     });

//     // specific
//     .put(function(req,res){
//         Location.replaceOne(
//             {name: req.params.locationName},
//             {name: req.body.name, type: req.body.type, crime_rating: req.body.crime_rating,
//                 crime_info:{
//                     crimes: req.body.crimes
//                 }})
//             .then((report)=>{
//                 if(report.modifiedCount === 0)res.send({message: "No matching location found to update."})
//                 res.send({message: "Successfully updated location and crime info."})
//             })
//             .catch(err => res.send(err))
//     })
//     .patch(function(req,res){
//         Location.updateOne(
//             {name: req.params.locationName},
//             {$set: req.body}
//         )
//         .then(()=>res.send({message: "Successfully updated location and crime info."}))
//         .catch(err => res.send(err))
//     })
//     .delete(function(req,res){
//         Location.deleteOne({name:req.params.locationName})
//             .then(res.send({message: "Location and crime info deleted successfully"}))
//     })
// }
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../Models/userModel.js");
const ErrorHandler = require("../utils/errorhandler.js");

try {
    
    passport.serializeUser((user, next) => {
      console.log("Serialize user index.js")

        next(null, user._id);
      });
    
      passport.deserializeUser(async (id, next) => {
        console.log("Deserilize user index.js")
        try {
          const user = await User.findById(id);
          if (user) next(null, user); // return user of exist
          else next(new ErrorHandler( "User does not exist"),404); // throw an error if user does not exist
        } catch (error) {
          next(
            new ErrorHandler(
              
              "Something went wrong while deserializing the user. Error: " + error
            ,500),
            null
          );
        }
      });
    
    
    
    passport.use(new GoogleStrategy( {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      
      },
      async (_, __, profile, next) => {
        // Check if the user with email already exist
        const user = await User.findOne({ email: profile._json.email });
        if (user) {
         
          next(null, user);
        

        } else {
          // If user with email does not exists, means the user is coming for the first time
          const createdUser = await User.create({
            email: profile._json.email, 
            // There is a check for traditional logic so the password does not matter in this login method
            password: profile._json.sub, // Set user's password as sub (coming from the google)
            name: profile.displayName?.split("@")[0], // as email is unique, this username will be unique
          
            role: "user",
           
            loginType: "google",
          });

          if (createdUser) {
            next(null, createdUser);
          } else {
            next(new ErrorHandler("Error while registering the user",500), null);
          }


        }



      }
      ))
} catch (error) {
    console.log("Passport Error : ", error)
}
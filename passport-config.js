const PassportJWT = require('passport-jwt');
const JwtStrategy = PassportJWT.Strategy; // Generates the JWT
const ExtractJwt = PassportJWT.ExtractJwt; // Extract the payload

require('dotenv').config();
const secret = process.env.JWT_SECRET;

const UserModel = require('./models/UserModel');

// Options for passport-jwt
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret
};

// Create a function for authentication each express request
const initPassportStrategy = (passport) => {

    // Instantiate JwtStrategy
    const theJwtStrategy = new JwtStrategy(opts, (jwtPayload, done)=>{

        // See if a user with the id exists (in the payload)
        UserModel
        .findById(jwtPayload.id)
        .then((theUser)=>{

            // If user exists, return the user object
            if(theUser) {
                return done(null, theUser);
            }

            // Otherwise, return false
            else {
                return done(null, false);
            }
        })

        // If user doesn't exist
        .catch((err)=>{
            console.log('error', err);
            return done(null, null);
        })
    });

    passport.use(theJwtStrategy)
}

module.exports = initPassportStrategy;

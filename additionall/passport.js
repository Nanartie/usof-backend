const jwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const config = require('./../config');
const db = require('../db/db');
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwt
}

const strategy = new jwtStrategy(options, (payload, done) => {
    try {
        db.query("SELECT id, login FROM users WHERE id = ?", [payload.userId], (error, rows, fields) =>{
            if (error) console.log(error);
            else{
                const user = rows;
                if(user){
                    done(null, user)
                }
                else{
                    done(null, false);
                }
            }
        })
    } catch (e) {
        console.log(e);
    }
});

module.exports = function(passport) {
    passport.use(strategy);
}
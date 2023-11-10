const jwt = require('jsonwebtoken');
const User = require('./../models/user');
const response = require('./../response');
const config = require('./../config');

exports.isAuth = async (req, res, next) => {
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    try{
        const userData = jwt.verify(token, config.jwt);
        const user = await User.findById(userData.usId);
        if(!user || token !== user.token_sh){
            return response.status(401, {message: "unauthorized user"}, res);
        }
        next();
    }
    catch (e) {
        response.status(401, {message: "unauthorized user"}, res);
    }

}
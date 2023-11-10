const express = require('express');
const bodyParser = require('body-parser');
const User = require('../models/user');
const path = require('path');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const checkPass = require('check-password-strength');
const EmailValidator = require('email-deep-validator');
const response = require('../response');
const config = require('../config.json');
const sendEmail = require('../additionall/sendMail');

router.post('/register', async (req, res) => {
    const { login, password, confirm_password, fullName, email } = req.body;
    if(!login || !password || !confirm_password || !fullName || !email) {
        return response.status(400, {message: `Fill in all fields`}, res);
    }
    let errorMess = '';
    const usernameError = await User.isUsernameTaken(login);
    if (usernameError) {
        
        errorMess = usernameError;
        return res.status(400).json({ error: errorMess });
    }
        const emailVal = new EmailValidator();
        const { wellFormed, validDomain, validMailbox } = await emailVal.verify(email);
        console.log(wellFormed);
        console.log(validDomain);
        console.log(validMailbox);
        if(wellFormed && validMailbox && validDomain){
            const emailError = await User.isEmailTaken(email);
                if (emailError) {
                    errorMess = emailError;
                }
        
                if (!errorMess) {
                    if (password !== confirm_password) return res.status(400).json({ error: 'Passwords do not match' });
                    if (checkPass.passwordStrength(password).value === 'Too weak' || checkPass.passwordStrength(password).value === 'Weak') {
                        return response.status(400, {message: 'The password is too weak'}, res);
                    }
                    const salt = bcrypt.genSaltSync(15);
                    const hashPass = bcrypt.hashSync(password, salt);

                    try {
                        const token = jwt.sign({
                            login, password: hashPass, fullName, email
                        }, config.jwt, {expiresIn: '15m'});
                        sendEmail.send(email, token, 'activate');
                        response.status(200, {message:`Confirmation for ${login} send on email`}, res);
                    }
                    catch (e){
                        response.status(500, {message: `${e}`}, res);
                    }
                } else {
                    return res.status(400).json({ error: errorMess });
                }
        } else {
            response.status(400, {message: `Email - ${email} invalid`}, res)
        }
    });

  router.get('/active/:token', async (req, res) => {
    const {token} = req.params;
    try{
        const userData = jwt.verify(token, config.jwt);
        const newUser = new User(userData);
        newUser.save(userData);
        response.status(201, {message:`User ${userData.login} registered`}, res);
     }
     catch (e){
         response.status(500, {message: `${e}`}, res);
     }
  });

 router.post('/login', async (req, res) => {
    const { login, password } = req.body;
    
    try {
        const user = await User.findByLogin(login);
        if (user[0]) {
            const corrPass = await bcrypt.compare(password, user[0].password);
            
            if (corrPass) {
                const token = jwt.sign({
                    usId: user[0].id,
                    login: user[0].login,
                    role: user[0].role
                }, config.jwt, {expiresIn: '7d'});
                await User.keyUpd('token_sh', token, user[0].id);
                response.status(200, {token: token, role: user[0].role, usId: user[0].id}, res);
            } else {
                response.status(422, {message: 'Passwords do not match'}, res);
            }
        } else {
            response.status(409, {message: `User with login - ${login} does not exist`}, res);
        }
    } catch (error) {
        response.status(500, {error: 'Internal Server Error'}, res);
    }
});

router.post('/logout', async (req, res) => {
    try {
        const head = req.headers['authorization'];
        const token = head.split(' ')[1];
        const userData = jwt.verify(token, config.jwt);
        await User.keyUpd('token_sh', null, userData.usId);
        response.status(200, {message: `User with login ${userData.login} logged out`}, res);
    }catch (error) {
        response.status(500, {error: 'Internal Server Error'}, res);
    }
});


router.post('/password-reset', async (req, res) => {
    const {email} = req.body;
    const exist = await User.findByEmail(email);
    if (exist[0]) {
        try {
            const [{id, login}] = await User.findByEmail(email);
            const token = jwt.sign({
                id, login
            }, config.jwt, {expiresIn: '15m'});
            sendEmail.send(email, token);
            response.status(200, {message: `Reset link send to ${email}`}, res);
        } catch (e) {
            response.status(500, {message: `${e}`}, res);
        }
    } else {
        response.status(409, {message: `User with email ${email} does nor exist`}, res);
    }
});

router.post('/password-reset/:token', async (req, res) => {
    const { password, confirm_password } = req.body;
    const { token } = req.params;

    if (password !== confirm_password) {
        return response.status(422, {message: "Passwords do not match"}, res);
    }

    const passwordStrength = checkPass.passwordStrength(password).value;
    if (passwordStrength === 'Too weak' || passwordStrength === 'Weak') {
        return response.status(400, {message: 'The password is too weak'}, res);
    }

    try {
        const userData = jwt.verify(token, config.jwt);
        const salt = bcrypt.genSaltSync(15);
        const hashPass = bcrypt.hashSync(password, salt);

        await User.keyUpd('password', hashPass, userData.id);
        response.status(200, {message: "Password updated"}, res);
    } catch(e) {
        response.status(500, {message: `${e}`}, res);
    }
});

module.exports = router;
const express = require('express');
const bodyParser = require('body-parser');
const User = require('../models/user');
const path = require('path');
const router = express.Router();
const response = require('../response');
const config = require('../config.json');
const jwt = require('jsonwebtoken');
const EmailValidator = require('email-deep-validator');
const checkPass = require('check-password-strength');
const bcrypt = require('bcryptjs');
const loaderAvatar = require('../additionall/file-upld');
const isAuth = require('../additionall/isAuth');

router.get('/', async (req, res) => {
    const users = await User.usersFull();
    users.sort((a, b) => a.rating < b.rating ? -1 : 1);
    const page = parseInt(req.query.page) || 1;
    const usersPerPage = 20;
    const startIndex = (page - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;

    const usersForPage = users.slice(startIndex, endIndex);
    response.status(200, {data: usersForPage}, res);
});

router.get('/:user_id', async (req, res) => {
    try {
        const usr = await User.findById(req.params.user_id);
        if (!usr) {
            response.status(404, { message: 'User not found' }, res);
        } else {
            response.status(200, usr, res);
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const isAdm = await User.isAdm(userData.login);
    if(!isAdm){
        return response.status(403, {message:"Access denied"}, res)
    }

    const { login, password, confirm_password, fullName, email, role } = req.body;
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
                    const userDt = {login, password: hashPass, fullName, email, role};
                        const token = jwt.sign({
                            login, password: hashPass, fullName, email, role
                        }, config.jwt, {expiresIn: '15m'});
                        const fromDta = jwt.verify(token, config.jwt);
                    const newUser = new User(fromDta);
                    newUser.saveAsAdm(fromDta);
                    response.status(201, {message:`User ${fromDta.login} registered`}, res);
                } else {
                    return res.status(400).json({ error: errorMess });
                }
        } else {
            response.status(400, {message: `Email - ${email} invalid`}, res)
        }
});

router.patch('/avatar', loaderAvatar.single('file'), async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const pathFile = req.file.filename;
    const userData = jwt.verify(token, config.jwt);
    
    try{
        await User.avatarLoader(pathFile, userData.userId);
        response.status(200, {message:`Avatar changed`}, res);
    }
    catch (e){
        response.status(500, {message: `${e}`}, res);
    }
});

router.patch('/:user_id', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const user_id = req.params.user_id;
    const { login: newLogin, email: newEmail, newFullName: fullName } = req.body;


    if (Number(user_id) !== userData.usId) return response.status(403, {message:"Access denied"}, res);

    try {
        const user = await User.findById(userData.usId);
        const [{ login, email, fullName }] = user;

        if (await User.isUsernameTaken(newLogin) && login !== newLogin) {
            return response.status(409, {message: `User with login - ${newLogin} already exists` }, res);
        }

        if (await User.isEmailTaken(newEmail) && email !== newEmail) {
            return response.status(409, {message: `User with email - ${newEmail} already exists` }, res);
        }

        await User.update(req.body, Number(user_id));
        response.status(200, {message:"Values changed"}, res);
    } catch (e) {
        response.status(500, {message: `${e}`}, res);
    }
});

router.delete('/:user_id', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const id = req.params.user_id;
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);

    if(id === userData.usId || userData.role === 'admin'){
        const user = await User.findById(id);

        if(!user){
            return response.status(404, {message: `User with id ${id} not found`}, res);
        }
        await User.deleteAllPosts(id);
        await User.delete(id);
        response.status(200, {message: `User with id ${id} deleted`}, res);
        
    } else {
        return response.status(403, {message:"Access denied"}, res);
    }
    
});

module.exports = router;
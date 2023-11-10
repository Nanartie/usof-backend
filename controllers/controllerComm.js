const express = require('express');
const bodyParser = require('body-parser');
const Like = require('../models/like');
const Comment = require('../models/comment');
const Post = require('../models/post');
const Category = require('../models/category');
const User = require('../models/user');
const response = require('../response');
const config = require('../config.json');
const jwt = require('jsonwebtoken');
const isAuth = require('../additionall/isAuth');
const router = express.Router();

router.get('/:comment_id', async (req, res) => {
    let id = req.params.comment_id;
    const comment = await Comment.findById(id);
    if(!comment){
        return response.status(404, {message: `Comment ${id} not found`}, res);
    }
    const date = new Date(comment[0].pubDate);
    comment[0].pubDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const us = await User.findById(comment[0].author);
    const [{login}] = us[0].login;
    comment[0].authorLog = login;
    const head = req.headers['authorization'];
    
    if ((!head || !User.isAdm(jwt.verify(head.split(' ')[1], config.jwt.login))) && comment[0].edit === 0) {
        return response.status(404, {message: `Comment ${id} is inactive`}, res);
    }
    response.status(200, {comment}, res);
});

router.get('/:comment_id/like', async (req, res) => {
    const id = req.params.comment_id;
    const comment = await Comment.findById(id)
    if (!comment) {
        return response.status(404, { message: `Comment ${id} not found` }, res);
    }
    try {
        const likes = await Like.underComm(id);
        response.status(200, {  likes: likes[0], id  }, res);
    } catch (e) {
        response.status(500, { message: `${ e }` }, res);
    }

});

router.post('/:comment_id/like', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const id = req.params.comment_id;
    const comment = await Comment.findById(id)
    if (!comment) {
        return response.status(404, { message: `Comment ${id} not found` }, res);
    }
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    try {
        const already = await Like.findCommUs(id, userData.usId);
        if (already) {
            return response.status(400, { message: `Like on comment ${id} already exist` }, res);
        }

        await Like.createLikeComment(id, userData.usId);
        const [ author_id ] = await Comment.findById(id);
        await User.moreRating(author_id.author);
        response.status(200, { message: "Like Added" }, res);
    }
    catch (e) {
        response.status(500, { message: `${ e }` }, res);
    }

});

router.post('/:comment_id/dislike', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const id = req.params.comment_id;
    const comment = await Comment.findById(id)
    if (!comment) {
        return response.status(404, { message: `Comment ${id} not found` }, res);
    }
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    try {
        const already = await Like.findCommUs(id, userData.usId);
        if (already) {
            return response.status(400, { message: `Like on comment ${id} already exist` }, res);
        }

        await Like.createDislikeComment(id, userData.usId);
        const [ author_id ] = await Comment.findById(id);
        await User.lessRating(author_id.author);
        response.status(200, { message: "Dislike Added" }, res);
    }
    catch (e) {
        response.status(500, { message: `${ e }` }, res);
    }

});

router.patch('/:comment_id', async (req, res) => {
    try {
        if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
        const head = req.headers['authorization'];
        const token = head.split(' ')[1];
        const userData = jwt.verify(token, config.jwt);
        const isAdm = await User.isAdm(userData.login);

        const commId = req.params.comment_id;
        const isExist = await Comment.findById(commId);
        if(!isExist){
            return response.status(404, {message: `Comment ${commId} not found`}, res)
        }
        if(!isAdm && userData.usId === isExist[0].author){
            const newComm = new Comment(req.body);
            await newComm.update(req.body, commId);
            return response.status(200, {message:`Values changed`}, res);
        } else if (isAdm && userData.usId !== isExist[0].author) {
            const {stat} = req.body;
            await Comment.updateAdmStat(stat, commId);
            return response.status(200, {message:`Values changed`}, res);
        } else if (isAdm && userData.usId === isExist[0].author) {
            const newComm = new Comment(req.body);
            await newComm.update(req.body, commId);
            return response.status(200, {message:`Values changed`}, res);
        }
        else {
            response.status(400, {message:`Access denied`}, res);
        }        
     }
     catch (e){
         response.status(500, {message: `${e}`}, res);
     }
});


router.delete('/:comment_id', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const id = req.params.comment_id;
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const isAdm = await User.isAdm(userData.login);

    const comment = await Comment.findById(id);

    if(!comment){
        return response.status(404, {message: `Comment ${id} not found`}, res);
    }
    if(!isAdm && userData.usId !== comment.author){
        return response.status(403, {message:"Access denied"}, res)
    }
    const newComm = new Comment(comment);
    await newComm.delete(id);
    response.status(200, {message: `Comment ${id} deleted`}, res);    
});

router.delete('/:comment_id/like', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const id = req.params.comment_id;
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const like = await Like.findByCommUs(id, userData.usId);

    if(!like){
        return response.status(404, {message: `Like ${id} not found`}, res);
    }
    if(userData.usId !== like[0].user_id){
        return response.status(403, {message:"Access denied"}, res)
    }
    const newLike = new Like(like);
    await newLike.delete(id,  userData.usId);
    const [usId] = await Comment.findById(id);
    if (like[0].dislike === 1) {
        await User.moreRating(usId.author);
        response.status(200, {message: `Dislike ${id} deleted`}, res); 
    } else {
        await User.lessRating(usId.author);
        response.status(200, {message: `Like ${id} deleted`}, res); 
    }
      
});

router.delete('/:comment_id/dislike', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const id = req.params.comment_id;
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const like = await Like.findByCommUs(id, userData.usId);

    if(!like){
        return response.status(404, {message: `Like ${id} not found`}, res);
    }
    if(userData.usId !== like.user_id){
        return response.status(403, {message:"Access denied"}, res)
    }
    const newLike = new Like(like);
    await newLike.delete(id,  userData.usId);
    const [{ usId}] = await Comment.findById(id);
    await User.moreRating(usId);
    response.status(200, {message: `Like ${id} deleted`}, res);    
});

module.exports = router;
const express = require('express');
const bodyParser = require('body-parser');
const User = require('../models/user');
const Post = require('../models/post');
const Category = require('../models/category');
const Like = require('../models/like');
const Comment = require('../models/comment');
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
    const head = req.headers['authorization'];
    let token;
    let isAdm = false;
    if (head) {
        token = head.split(' ')[1];
        const userData = jwt.verify(token, config.jwt);
        isAdm = await User.isAdm(userData.login);
    }
    
        try{
            const page = parseInt(req.query.page) || 1;
            const pPage = 20;
            const startIndex = (page - 1) * pPage;
            const endIndex = startIndex + pPage;
            let allPosts;
            let revPosts;
            allPosts = await Post.postsFull(isAdm);
            revPosts = allPosts.sort((a, b) => a.title.localeCompare(b.title));
           
            let data = [];
            for (let item of revPosts) {
                const date = new Date(item.pubDate);
                const pubDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                const [{login}] = await User.getLogin(item.author);
                data.push({
                    id: item.id,
                    author: login,
                    title: item.title,
                    content: item.content,
                    image: item.image,
                    status: item.status,
                    updated: item.updated,
                    updated_at: item.updated_at,
                    pubDate: pubDate
                });
            }
            const allPgs = Math.ceil(data.length / pPage);
            let pstsForPage;
            if (data.length === 1) {
                pstsForPage = data;
            } else {
                pstsForPage = data.slice(startIndex, endIndex);
            }
            response.status(200, {meta: { page: Number(page), pPage: Number(pPage), allPgs },
                data: pstsForPage}, res);
        }
        catch (e){
            response.status(400, {message: `${e}`}, res);
        }
});

router.get('/:post_id', async (req, res) => {
    let id = req.params.post_id;
    const post = await Post.findById(id);
    if(!post){
        return response.status(404, {message: `Post ${id} not found`}, res);
    }
    const date = new Date(post[0].pubDate);
    post[0].pubDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const us = await User.findById(post[0].author);
    const [{login}] = us[0].login;
    post[0].authorLog = login;
    const head = req.headers['authorization'];
    
    if ((!head || !User.isAdm(jwt.verify(head.split(' ')[1], config.jwt.login))) && post[0].status === 0) {
            return response.status(404, {message: `Post ${id} is inactive`}, res);
    }
    
    response.status(200, {post}, res);
});

router.get('/:post_id/comments', async (req, res) => {
    let id = req.params.post_id;
    const post = await Post.findById(id);
    if(!post){
        return response.status(404, {message: `Post ${id} not found`}, res);
    }
    const comments = await Comment.findByPostId(id);
    if(!comments){
        return response.status(404, {message: `Comment for post ${id} not found`}, res);
    }
    let data = [];
            for (let item of comments) {
                const comment = await Comment.findById(item.id);
                const date = new Date(comment[0].pubDate);
                const pubDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                const us = await User.findById(comment[0].author);
                const [{login}] = us[0].login;
                data.push({
                    authorLog: login,
                    content: comment[0].content,
                    post: comment[0].post,
                    status: comment[0].status,
                    edit: comment[0].edit,
                    updated: comment[0].updated,
                    published_at: pubDate,
                    updated_at: comment[0].updated_at
                });
            }
            response.status(200, data, res);
});

router.post('/:post_id/comments', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    let id = req.params.post_id;
    const post = await Post.findById(id);
    if(!post){
        return response.status(404, {message: `Post ${id} not found`}, res);
    }
    const {content} = req.body;
     if(!content){
         return response.status(400, {message:`Fill in all fields`}, res);
     }
     try{
        await Comment.save(content, userData.usId, id);
        response.status(200, {message: `New Comment for post "${id}" added`}, res);
     }
     catch (e){
         response.status(500, {message: `${e}`}, res);
     }
});

router.get('/:post_id/categories', async (req, res) => {
    const id = req.params.post_id;
    const post = await Post.findById(id);
    if(!post){
        return response.status(404, {message: `Post ${id} not found`}, res);
    }
    try{
        const newPost = new Post(post);
        const allCtgs = await newPost.categoriesForPost(id);
        let resl = [];
        for (let item of allCtgs) {
            const category = await Category.findById(item.category_id);
            resl.push(category);
        }
        response.status(200, {categories: resl, postId: post[0].id}, res);
    }
    catch (e)
    {
        response.status(500, {message: `${e}`}, res);
    }
});

router.get('/:post_id/like', async (req, res) => {
    const id = req.params.post_id;
    const post = await Post.findById(id);
    if(!post){
        return response.status(404, {message: `Post ${id} not found`}, res);
    }
    try {
        const likes = await Like.underPost(id);
        response.status(200, { likes: likes[0], id }, res);
    }
    catch (e) {
        response.status(500, { message: `${e}` }, res);
    }
});

router.post('/', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);

    const {title, content, categories, image } = req.body;
     if(!title || !content || !categories){
         return response.status(400, {message:`Fill in all fields`}, res);
     }

     try{
        const newPost = new Post({title, content, categories, image });
        await newPost.save({title, content, categories, image }, userData.usId);
        if (image) return response.status(200, {message: `New Post with image added`}, res);
        return response.status(200, {message: `New Post without image added`}, res);
     }
     catch (e){
         response.status(500, {message: `${e}`}, res);
     }
});


router.post('/:post_id/like', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    let id = req.params.post_id;
    const post = await Post.findById(id);
    if(!post){
        return response.status(404, {message: `Post ${id} not found`}, res);
    }
     try{
        const already = await Like.findPostUs(id, userData.usId);
        if (already) {
            return response.status(400, { message: `Like on post ${id} already exist` }, res);
        }
        Like.createLikePost(id, userData.usId);
        const [ author_id ] = await Post.findById(id);
        await User.moreRating(author_id.author);
        response.status(200, { message: "Like Added" }, res);
     }
     catch (e){
         response.status(500, {message: `${e}`}, res);
     }
});

router.post('/:post_id/dislike', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    let id = req.params.post_id;
    const post = await Post.findById(id);
    if(!post){
        return response.status(404, {message: `Post ${id} not found`}, res);
    }
     try{
        const already = await Like.findPostUs(id, userData.usId);
        if (already) {
            return response.status(400, { message: `Like on post ${id} already exist` }, res);
        }
        Like.createDislikePost(id, userData.usId);
        const [ author_id ] = await Post.findById(id);
        await User.lessRating(author_id.author);
        response.status(200, { message: "Dislike Added" }, res);
     }
     catch (e){
         response.status(500, {message: `${e}`}, res);
     }
});

router.patch('/:post_id', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const isAdm = await User.isAdm(userData.login);

    const postId = req.params.post_id;
     const isExist = await Post.findById(postId);
     if(!isExist){
         return response.status(404, {message: `Post ${postId} not found`}, res)
     }
     try{
        if(!isAdm && userData.usId === isExist[0].author){
            await Post.update(req.body, postId);
            return response.status(200, {message:`Values changed`}, res);
        } else if (isAdm && userData.usId !== isExist[0].author) {
            const stat = req.body;
            await Post.updateAdmStat(stat, postId);
            return response.status(200, {message:`Values changed`}, res);
        } else if (isAdm && userData.usId == isExist[0].author) {
            await Post.update(req.body, postId);
            return response.status(200, {message:`Values changed`}, res);
        } else {
            response.status(400, {message:`Access denied`}, res);
        }        
     }
     catch (e){
         response.status(500, {message: `${e}`}, res);
     }
});

router.delete('/:post_id', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const id = req.params.post_id;
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const isAdm = await User.isAdm(userData.login);

    const post = await Post.findById(id);

    if(!post){
        return response.status(404, {message: `Post${id} not found`}, res);
    }
    if(!isAdm && userData.usId !== post.author){
        return response.status(403, {message:"Access denied"}, res)
    }
    const newPost = new Post(post);
    await newPost.delete(id);
    response.status(200, {message: `Post ${id} deleted`}, res);    
});

router.delete('/:post_id/like', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const id = req.params.post_id;
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const like = await Like.findByPostUs(id, userData.usId);

    if(!like){
        return response.status(404, {message: `Like for post ${id} not found`}, res);
    }
    if(userData.id !== like.user_id){
        return response.status(403, {message:"Access denied"}, res)
    }
    const newLike = new Like(like);
    await newLike.deletePost(id,  userData.usId);
    const [usId] = await Post.findById(id);
    if (like[0].dislike === 1) {
        await User.moreRating(usId.author);
        response.status(200, {message: `Dislike ${id} deleted`}, res); 
    } else {
        await User.lessRating(usId.author);
        response.status(200, {message: `Like ${id} deleted`}, res); 
    }   
});

router.delete('/:post_id/dislike', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const id = req.params.post_id;
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const like = await Like.findByPostUs(id, userData.usId);

    if(!like){
        return response.status(404, {message: `Like for post ${id} not found`}, res);
    }
    if(userData.id !== like.user_id){
        return response.status(403, {message:"Access denied"}, res)
    }
    const newLike = new Like(like);
    await newLike.deletePost(id,  userData.usId);
    const [{ usId}] = await Post.findById(id);
    await User.moreRating(usId);
    response.status(200, {message: `Like ${id} deleted`}, res);    
});


module.exports = router;
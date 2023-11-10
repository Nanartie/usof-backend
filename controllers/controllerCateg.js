const express = require('express');
const bodyParser = require('body-parser');
const Post = require('../models/post');
const Category = require('../models/category');
const User = require('../models/user');
const response = require('../response');
const config = require('../config.json');
const jwt = require('jsonwebtoken');
const isAuth = require('../additionall/isAuth');
const router = express.Router();

router.get('/', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const categors = await Category.categorsFull();
    categors.sort((a, b) => a < b ? -1 : 1);
    const page = parseInt(req.query.page) || 1;
    const catPerPage = 20;
    const startIndex = (page - 1) * catPerPage;
    const endIndex = startIndex + catPerPage;

    const catsForPage = categors.slice(startIndex, endIndex);
    //console.log(categors);
    response.status(200, {data: catsForPage}, res);
});

router.get('/sorted', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unauthorised user" });

    const categors = await Category.categorsFull();
    const categorsWithPostCount = await Promise.all(categors.map(async (category) => {
        const posts = await Category.postsFromCateg(category.id);
        return {
            title: category.title,
            description: category.description,
            postCount: posts.length,
        };
    }));
    categorsWithPostCount.sort((a, b) => b.postCount - a.postCount);

    const page = parseInt(req.query.page) || 1;
    const catPerPage = 20;
    const startIndex = (page - 1) * catPerPage;
    const endIndex = startIndex + catPerPage;

    const catsForPage = categorsWithPostCount.slice(startIndex, endIndex);

    response.status(200, {data: catsForPage}, res);
});

router.get('/:category_id/posts/:user_id', async (req, res) => {
    try {
        const id = req.params.category_id;
        const userCh = req.params.user_id;
        const ctg = await Category.findById(id);
        const forPage = 20;
        const page = parseInt(req.query.page) || 1;
        if (!ctg) {
            response.status(404, { message: 'Category not found' }, res);
        } else {
            if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
            const psId = await Category.postsFromCateg(id);
            const posts = await Promise.all(psId.map(({ post_id }) => Post.findById(post_id)));

            const resPs = await Promise.all(posts.map(async (item) => {
                const date = new Date(item[0].pubDate);
                const user = await User.findById(item[0].author);
                const authId = await User.findByLogin(user[0].login);
                if (user && user.length > 0 && authId[0].id === Number(userCh)) {
                    const { login, profPic: photo } = user[0];
                    return {
                        title: item[0].title,
                        content: item[0].content,
                        status: item[0].status,
                        pubDate: date,
                        id: item[0].id,
                        autId: item[0].author,
                        author: login,
                        profPic: photo,
                        edit: item[0].edit,
                        image: item[0].image
                    };
                }
            }));

            const totalPages = Math.ceil(resPs.length / forPage);
            const usersFilter = resPs.slice((page - 1) * forPage, page * forPage);

            response.status(200, {meta: { page: Number(page), forPage: Number(forPage), totalPages },
            data: usersFilter}, res);
        }
    } catch (e) {
        response.status(500, {message: `${e}`}, res);
    }
});

router.get('/:category_id', async (req, res) => {
    try {
        if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
        const ctg = await Category.findById(req.params.category_id);
        if (!ctg) {
            response.status(404, { message: 'Category not found' }, res);
        } else {
            response.status(200, ctg, res);
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.get('/:category_id/posts', async (req, res) => {
    try {
        const id = req.params.category_id;
        const ctg = await Category.findById(id);
        const forPage = 20;
        const page = parseInt(req.query.page) || 1;
        if (!ctg) {
            response.status(404, { message: 'Category not found' }, res);
        } else {
            if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
            const psId = await Category.postsFromCateg(id);
            const posts = await Promise.all(psId.map(({ post_id }) => Post.findById(post_id)));

            const resPs = await Promise.all(posts.map(async (item) => {
                const date = new Date(item.pubDate);
                const user = await User.findById(item[0].author);

                if (user && user.length > 0) {
                    const { login, profPic: photo } = user[0];
                    return {
                        title: item[0].title,
                        content: item[0].content,
                        status: item[0].status,
                        pubDate: date,
                        id: item[0].id,
                        autId: item[0].author,
                        author: login,
                        profPic: photo,
                        edit: item[0].edit,
                        image: item[0].image
                    };
                }
            }));

            const totalPages = Math.ceil(resPs.length / forPage);
            const usersFilter = resPs.slice((page - 1) * forPage, page * forPage);

            response.status(200, {meta: { page: Number(page), forPage: Number(forPage), totalPages },
            data: usersFilter}, res);
        }
    } catch (e) {
        response.status(500, {message: `${e}`}, res);
    }
});

router.post('/', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const { title, description } = req.body;


    if (!await User.isAdm(userData.login)) return response.status(403, {message:"Access denied"}, res);

    if (!title || !description) return response.status(400, {message:"Fill in all fields"}, res);

    if (await Category.isExist(title)) return response.status(409, {message: `Category with title "${title}" already exists` }, res);

    try {
        const newCateg = new Category(req.body);
        await newCateg.save(req.body);
        response.status(200, {message: `New Category with title "${title}" added`}, res);
    } catch (e) {
        response.status(500, {message: `${e}`}, res);
    }
});

router.patch('/:category_id', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const isAdm = await User.isAdm(userData.login);
    if(!isAdm){
        return response.status(403, {message:"Access denied"}, res)
    }
    const ctgId = req.params.category_id;
     const isExist = await Category.findById(ctgId);
     if(!isExist){
         return response.status(404, {message: `Category ${ctgId} not found`}, res)
     }
     try{
        const newCtgr = new Category(req.body);
         await newCtgr.update(req.body, ctgId);
         response.status(200, {message:`Values changed`}, res);
     }
     catch (e){
         response.status(500, {message: `${e}`}, res);
     }
});

router.delete('/:category_id', async (req, res) => {
    if (!isAuth.isAuth) return res.status(400).json({ error: "Unautorised uther" });
    const id = req.params.category_id;
    const head = req.headers['authorization'];
    const token = head.split(' ')[1];
    const userData = jwt.verify(token, config.jwt);
    const isAdm = await User.isAdm(userData.login);
    if(!isAdm){
        return response.status(403, {message:"Access denied"}, res)
    }

        const category = await Category.findById(id);

        if(!category){
            return response.status(404, {message: `Category with id ${id} not found`}, res);
        }
        const newCtgr = new Category(category);
        await newCtgr.delete(id);
        response.status(200, {message: `Category with id ${id} deleted`}, res);    
});

module.exports = router;
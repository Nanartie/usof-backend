const db = require('../db/db.js');
const Category = require('./category');

class Post {
    constructor(post) {
        this.data = {
            authorLog: post.authorLog,
            author: post.author,
            title: post.title,
            pubDate: post.pubDate,
            content: post.content,
            image: post.image,
            status: post.status,
            edit: post.edit
        };
    }
    static async postsFull(isAdm){
        let psts;
        if (isAdm) {
           psts = await db.query('SELECT * FROM posts');
        } else {
            psts = await db.query('SELECT * FROM posts WHERE status = 1');
        }
        
        return psts[0];
    }
    
    static async findById(id) {
        const result = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
        const postData = result[0];
        return postData.length === 0 ? false : postData;
    }
    
    async categoriesForPost(id) {
        const psts = await db.query("SELECT category_id FROM post_category WHERE post_id = ?", [id]);
        return psts[0];
    }
    
    static async getCategoryByName(categoryName) {
        const psts = await db.query("SELECT * FROM categories WHERE title = ?", [categoryName]);
        return psts[0];
    }
    
    async save (data, usId){
        const sql = await db.query("INSERT INTO posts(author, title, content, image, pubDate) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())", [usId, data.title, data.content, data.image]);
        const getId = await db.query("SELECT id FROM posts WHERE title = ?", [data.title]);
        let categories = data.categories.split(',').map(category => category.trim());
        for (let categoryName of categories) {
            let category = await Post.getCategoryByName(categoryName);
            if (category) {
                await db.query("INSERT INTO post_category(post_id, category_id) VALUES(?, ?)", [getId[0][0].id, category[0].id]);
            }
        }
        return;
    }
    
    static async update(body, id) {
        try {
            Object.entries(body)
                .filter(([key, value]) => value)
                .map(async ([key, value]) => {
                    if (key === "categories") {
                        const categoryTitles = value.split(',').map(category => category.trim());
                        const currentCategoriesRes = await db.query("SELECT category_id FROM post_category WHERE post_id = ?", [id]);
                        const currentCategories = currentCategoriesRes.map(res => res.category_id);
                        const newCategories = [];
                        for (let title of categoryTitles) {
                            const res = await db.query("SELECT id FROM categories WHERE title = ?", [title]);
                            newCategories.push(res[0].id);
                        }
                        const categoriesToAdd = newCategories.filter(x => !currentCategories.includes(x));
                        const categoriesToRemove = currentCategories.filter(x => !newCategories.includes(x));
                        for (let categoryId of categoriesToAdd) {
                            await db.query("INSERT INTO post_category (post_id, category_id) VALUES (?, ?)", [id, categoryId]);
                        }
                        for (let categoryId of categoriesToRemove) {
                            await db.query("DELETE FROM post_category WHERE post_id = ? AND category_id = ?", [id, categoryId]);
                        }
                    } else {
                        await db.query("UPDATE posts SET "+key+" = ? WHERE id = ?", [value, id]);
                    }
                    
                    await db.query("UPDATE posts SET updated =1 WHERE id = ?", [id]);
                    await db.query("UPDATE posts SET updated_at = CURRENT_TIMESTAMP() WHERE id = ?", [id]);
                });
        }
        catch(e){
            throw e;
        }
    }
    
    static async updateAdmStat(stat, commId) {
        await db.query("UPDATE posts SET status = ? WHERE id = ?", [stat, commId]);
    }

    async delete(id) {
        await db.query("DELETE FROM post_category WHERE post_id = ?", [id]);
        await db.query("DELETE FROM likes WHERE post_id = ?", [id]);
        await db.query("DELETE FROM comments WHERE post = ?", [id]);
        await db.query("DELETE FROM posts WHERE id = ?", [id]);
    }
}

module.exports = Post;
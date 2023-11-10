const db = require('../db/db.js');
const Post = require('./post');



class Category {
    constructor(category) {
        this.data = {
            title: category.title,
            description: category.description
        };
    }

    static async categorsFull(){
        const catrs = await db.query('SELECT id, title, description FROM categories');
        return catrs[0];
    }
    
    static async findById(id) {
        const result = await db.query("SELECT title, description FROM categories WHERE id = ?", [id]);
        const categData = result[0];
        return categData.length === 0 ? false : categData;
    }
    
    static async isExist(title){
        const ctg = await db.query("SELECT * FROM categories WHERE title = ?", [title]);
        return ctg[0].length !== 0;
    }
    
    async save(body){
        await db.query("INSERT INTO categories(title, description) VALUES (?, ?)", [body.title, body.description]);
    }
    
    async update(body, id) {
        try {
            Object.entries(body)
                .filter(([key, value]) => value)
                .map(async ([key, value]) => {
                    await db.query("UPDATE categories SET "+key+" = ? WHERE id = ?", [value, id]);
                })
        }
        catch(e){
            throw e;
        }
    }
    
    async delete(id) {
        await db.query("DELETE FROM categories WHERE id = ?", [id]);
    }
    
    static async postsFromCateg(id) {
        const psts = await db.query("SELECT post_id FROM post_category WHERE category_id = ?", [id]);
        return psts[0];
    }
}

module.exports = Category;
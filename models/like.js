const db = require('../db/db.js');
const Post = require('./post');



class Like {
    constructor(like) {
        this.data = {
            user_id: like.user_id,
            post_id: like.post_id,
            comment_id: like.comment_id,
            dislike: like.dislike
        };
    }

    static async underComm(id) {
        const lks = db.query("SELECT * FROM likes WHERE comment_id = ?", [id]);
        return lks;
    }
    
    static async underPost(id) {
        const lks = db.query("SELECT * FROM likes WHERE post_id = ?", [id]);
        return lks;
    }
    
    static async createLikeComment(id, usId) {
        await db.query("INSERT INTO likes(user_id, comment_id) VALUES(?, ?)", [usId, id]);
    }
    
    static async createDislikeComment(id, usId) {
        await db.query("INSERT INTO likes(user_id, comment_id, dislike) VALUES(?, ?, 1)", [usId, id]);
    }
    
    static async createLikePost(id, usId) {
        await db.query("INSERT INTO likes(user_id, post_id) VALUES(?, ?)", [usId, id]);
    }
    
    static async createDislikePost(id, usId) {
        await db.query("INSERT INTO likes(user_id, post_id, dislike) VALUES(?, ?, 1)", [usId, id]);
    }
    
    static async findCommUs(id, usId) {
        const sql = await db.query("SELECT * FROM likes WHERE comment_id = ? AND user_id = ?", [id, usId]);
        return sql[0].length !== 0;
    }
    
    static async findPostUs(id, usId) {
        const sql = await db.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [id, usId]);
        return sql[0].length !== 0;
    }
    
    static async findByCommUs(id, usId) {
        const res = await db.query("SELECT * FROM likes WHERE comment_id = ? AND user_id = ?", [id, usId]);
        return res[0].length === 0 ? false : res[0];
    }

    static async findByPostUs(id, usId) {
        const res = await db.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [id, usId]);
        return res[0].length === 0 ? false : res[0];
    }
    
    async delete(id, usId) {
        await db.query("DELETE FROM likes WHERE comment_id = ? AND user_id = ?", [id, usId]);
    }

    async deletePost(id, usId) {
        await db.query("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [id, usId]);
    }

}

module.exports = Like;
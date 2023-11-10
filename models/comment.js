const db = require('../db/db.js');
const Post = require('./post');



class Comment {
    constructor(comment) {
        this.data = {
            authorLog: comment.authorLog,
            post: comment.post,
            pubDate: comment.pubDate,
            content: comment.content,
            edit: comment.edit,
            created_at: comment.created_at
        };
    }

    static async findById(id) {
        const result = await db.query("SELECT * FROM comments WHERE id = ?", [id]);
        const commData = result[0];
        return commData.length === 0 ? false : commData;
    }
    
    static async findByPostId(id) {
        const result = await db.query("SELECT * FROM comments WHERE post = ?", [id]);
        const commData = result[0];
        return commData.length === 0 ? false : commData;
    }
    
    static async save(data, usid, id){
        await db.query("INSERT INTO comments(content, author, post, pubDate) VALUES(?, ?, ?, CURRENT_TIMESTAMP())", [data, usid, id]);
    }
    
    async update(body, id) {
        try {
            Object.entries(body)
                .filter(([key, value]) => value)
                .map(async ([key, value]) => {
                    await db.query("UPDATE comments SET "+key+" = ? WHERE id = ?", [value, id]);
                    await db.query("UPDATE comments SET updated = 1 WHERE id = ?", [id]);
                    await db.query("UPDATE comments SET updated_at = CURRENT_TIMESTAMP() WHERE id = ?", [id]);
                })
        }
        catch(e){
            throw e;
        }
    }
    
    static async updateAdmStat(stat, commId) {
        await db.query("UPDATE comments SET edit = ? WHERE id = ?", [stat, commId]);
    }
    
    async delete(id) {
        await db.query("DELETE FROM likes WHERE comment_id = ?", [id]);
        await db.query("DELETE FROM comments WHERE id = ?", [id]);
    }
}

module.exports = Comment;
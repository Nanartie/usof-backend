const db = require('../db/db.js');

class User {
    constructor(user) {
        this.data = {
            login: user.login,
            password: user.password,
            full_name: user.fullName,
            email: user.email,
            role: user.role,
            rating: user.rating,
            profPic: user.profPic
        };
    }

    async save(data) {
        try{
            await db.query("INSERT INTO users(login, password,fullName,email) VALUES(?, ?, ?, ?)", [data.login, data.password, data.fullName, data.email]);
        }
        catch (e){
            throw e;
        }
    }

    async saveAsAdm(data) {
        try{
            await db.query("INSERT INTO users(login, password,fullName,email,role) VALUES(?, ?, ?, ?, ?)", [data.login, data.password, data.fullName, data.email, data.role]);
        }
        catch (e){
            throw e;
        }
    }

    async login(data){
        const result = await db.query("SELECT id, login, password, role FROM users WHERE login = ?", [data]);
        return result[0];
    }

    static async keyUpd(field, val, param) {
        await db.query("UPDATE users SET "+field+" = ? WHERE id = ?", [val, param]);
    }

    static async findByLogin(login) {
        const query = 'SELECT id, login, password, role, fullName, email FROM users WHERE login = ?';
        const result = await db.query(query, login);

        const userData = result[0];
        return userData;
    }
    

    static async findByEmail(email) {
        const query = 'SELECT id, login FROM users WHERE email = ?';
        const result = await db.query(query, email);

        const userData = result[0];
        return userData;
    }

    static async findById(id) {
        const result = await db.query("SELECT login, fullName, profPic, email, role, rating FROM users WHERE id = ?", [id]);
        const userData = result[0];
        return userData.length === 0 ? false : userData;
    }

    static async update(body, id) {
        try{
            if(Object.entries(body).length === 0){
                throw 'Incorrect values';
            }
            Object.entries(body)
                .filter(([key, value]) => value)
                .map(([key, value]) =>  db.query("UPDATE users SET "+key+" = ? WHERE id = ?", [value, id]))
        }
        catch(e){
           throw e;
        }
    }

    static async deleteAllPosts(id) {
        const posts = await db.query("SELECT * FROM posts WHERE author = ?", [id]);
        for (let post of posts[0]) {
            await db.query("DELETE FROM post_category WHERE post_id = ?", [post.id]);
            await db.query("DELETE FROM likes WHERE post_id = ?", [post.id]);
            await db.query("DELETE FROM comments WHERE post = ?", [post.id]);
        }
        await db.query("DELETE FROM posts WHERE author = ?", [id]);
        
    }

    static async delete(id) {
        return await db.query("DELETE FROM users WHERE id = ?", [id]);
    }

    static async isUsernameTaken(username, callback) {
        const query = 'SELECT COUNT(*) as count FROM users WHERE login = ?';
        db.query(query, [username], (error, results) => {
          if (error) {
            return callback('An error occurred during registration.');
          }
          const isTaken = results[0].count > 0;
          if (isTaken) {
            callback('Login is already taken.', null);
          } else {
            callback(null, null);
          }
        });
    }
    
    static async isEmailTaken(email, callback) {
        const query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
        db.query(query, [email], (error, results) => {
          if (error) {
            return callback('An error occurred during registration.');
          }
          const isTaken = results[0].count > 0;
          if (isTaken) {
            callback('Email is already taken.', null);
          } else {
            callback(null, null);
          }
        });
    }

    static async usersFull(){
        const users = await db.query('SELECT id, login, fullName, profPic, email, role, rating FROM users');
        return users[0];
    }
    
    static async isAdm(login) {
        const res = await db.query("SELECT role FROM users WHERE login = ?", [login]);
        const ress = res[0];
        return ress[0].role === 'admin';
    }
    
    static async avatarLoader(path, id){
        await db.query("UPDATE users SET profPic = ? WHERE id = ?", [path, id]);
    }
    
    async deletePosts(id){
        await db.query("DELETE from posts WHERE author = ?", [id]);
    }
    
    static async moreRating(id) {
        const [old] = await db.query("SELECT rating FROM users WHERE id = ?", [id])
        let newR = old[0].rating + 1;
        await db.query("UPDATE users SET rating = ? WHERE id = ?", [newR, id]);
    }
    
    static async lessRating(id) {
        const [old] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        let newR = old[0].rating - 1;
        await db.query("UPDATE users SET rating = ? WHERE id = ?", [newR, id]);
    }
    
    static async getLogin(id) {
        const res = await db.query("SELECT login FROM users WHERE id = ?", [id])
        return res[0];
    }
}

module.exports = User;
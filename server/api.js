const { initializeDatabase, queryDB, insertDB } = require("./database");
const jwt = require("jsonwebtoken");
require("dotenv").config();

let db;
const secretKey = process.env.SECRETKEY;

const initializeAPI = async (app) => {
    db = await initializeDatabase();
    app.get("/api/feed", getFeed);
    app.post("/api/feed", postTweet);
    app.post("/api/login", login);
};

const getFeed = async (req, res) => {
    const query = req.query.q;
    const tweets = await queryDB(db, query);
    res.json(tweets);
};

const postTweet = (req, res) => {
    insertDB(db, req.body.query);
    res.json({ status: "ok" });
};

const login = async (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT password FROM users WHERE username = "${username}";`;
    const user = await queryDB(db, query);
    if (user.length === 1) {
        if (user[0].password === password) {
            const token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) + 60 * 60,
                    data: { username },
                },
                secretKey
            );
            res.status(200).send(token);
        }
    } else {
        res.status(401).send("Username or password wrong");
    }
};

module.exports = { initializeAPI };

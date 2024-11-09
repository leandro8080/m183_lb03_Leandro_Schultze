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
    app.get("/api/verify-token", verifyToken);
};

const getFeed = async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.sendStatus(401);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }
    jwt.verify(token, secretKey, async (err) => {
        if (err) {
            return res.sendStatus(401);
        }
        const query = "SELECT * FROM tweets ORDER BY id DESC";
        const tweets = await queryDB(db, query);
        res.json(tweets);
    });
};

const postTweet = (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.sendStatus(401);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }
    jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
            return res.sendStatus(401);
        }

        const { username } = decoded.data;
        const { timestamp, text } = req.body;
        const query = `INSERT INTO tweets (username, timestamp, text) VALUES ('${username}', '${timestamp}', '${text}')`;
        insertDB(db, query);
        res.json({ status: "ok" });
    });
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

const verifyToken = async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.sendStatus(401);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }
    jwt.verify(token, secretKey, async (err) => {
        if (err) {
            return res.sendStatus(401);
        }

        return res.status(200);
    });
};
module.exports = { initializeAPI };

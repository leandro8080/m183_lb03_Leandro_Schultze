const express = require("express");
const http = require("http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { initializeAPI } = require("./api");
const pino = require("pino-http")({
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true, // Aktiviert Farben
            translateTime: "SYS:standard", // Zeigt Zeitstempel in lesbarem Format
            ignore: "pid,hostname", // Entfernt `pid` und `hostname` Felder
        },
    },
});

const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 50,
    message: "Too many requests, please try again later.<br>",
});

// Create the express server
const app = express();
app.use(express.json());
app.use(limiter);
app.use(pino);
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                "script-src": ["'self'", "https://cdn.tailwindcss.com/"],
            },
        },
    })
);
const server = http.createServer(app);

// deliver static files from the client folder like css, js, images
app.use(express.static("client"));
// route for the homepage
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/client/index.html");
});

// Initialize the REST api
initializeAPI(app);

//start the web server
const serverPort = process.env.PORT || 3000;
server.listen(serverPort, () => {
    console.log(`Express Server started on port ${serverPort}`);
});

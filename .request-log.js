module.exports = {
    filter(data) {
        return !!data.req;
    },
    output: {
        path: "request.log",
        options: {
            path: "logs/",
            size: "1M",
            rotate: 5,
        },
    },
};

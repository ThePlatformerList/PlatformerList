const { ProxyAgent, fetch } = require("undici");
module.exports = {
    gjReq: async function (endpoint, data) {
        let r = await fetch(`https://www.boomlings.com/database/${endpoint.endsWith(".php") ? endpoint.split(".php")[0] : endpoint}.php`, {
            method: "POST",
            dispatcher: new ProxyAgent(process.env.PROXY),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": " "
            },
            body: new URLSearchParams(data)
        });
        let res = await r.text();
        return {
            data: res,
            status: r.status
        }
    }
};
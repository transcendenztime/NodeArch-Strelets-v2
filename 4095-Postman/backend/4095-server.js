const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fetch = require("node-fetch");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));
webserver.use(bodyParser.json());

const port = 4095;

const Methods = {
  GET: "GET",
  POST: "POST",
};
// мидлварь для CORS
/* webserver.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});*/

webserver.options("/test", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.get("/test", (req, res) => {
  console.log("/test service called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send("test service answer");
});

webserver.options("/execute", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.post("/execute", async (req, res) => {
  console.log("/execute service called");
  // console.log(req.body);

  const {URL, requestMethod, headers, getParameters, requestBody} = req.body;

  let reqURL = URL;
  // если пришли get-параметры, добавим их к урлу
  if (getParameters?.length) {
    let params = getParameters
      .map(item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
      .join("&");
    reqURL = reqURL + "?" + params;
  }

  // собираем хедеры
  let reqHeaders = {};
  headers.forEach(item => {
    reqHeaders[item.header] = item.value;
  });

  let fetchOptions = {
    method: requestMethod,
    headers: reqHeaders,
    ...(requestMethod === Methods.POST && {body: requestBody}),
  };

  // console.log(fetchOptions);

  try {
    let response = await fetch(reqURL, fetchOptions);

    const headersRow = response.headers.raw();
    let resHeaders = {};
    for (let key in headersRow) {
      resHeaders[key] = response.headers.get(key);
    }

    let result = {
      status: response.status,
      headers: resHeaders,
    };

    result.data = await response.text();

    res.send(JSON.stringify(result));
  } catch (e) {
    res.status(500).send(e.message);
  }

  // res.send(req.body);
});

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});

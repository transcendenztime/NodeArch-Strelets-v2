const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));
webserver.use(bodyParser.json());

const port = 4095;
const jsonFilesPath = "jsonFiles";
const requestsFilePath = path.join(jsonFilesPath, "_requests.json");

const Methods = {
  GET: "GET",
  POST: "POST",
};

// если файл с запросами существует, откроем его. Иначе создадим пустой файл
openOrCreateFileWithRequests = () => {
  let requests;
  // если файл с запросами существует, прочитаем его
  if (fs.existsSync(requestsFilePath)) {
    requests = fs.readFileSync(requestsFilePath);
  } else {
    // если файл с запросами не существует, создадим его базовый вариант (с пустым массивом)
    fs.writeFileSync(requestsFilePath, JSON.stringify([]));
    requests = fs.readFileSync(requestsFilePath);
  }

  return requests;
};

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

webserver.options("/get-requests", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.get("/get-requests", (req, res) => {
  const requests = openOrCreateFileWithRequests();
  res.send(requests);
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
});

webserver.options("/save", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.post("/save", async (req, res) => {
  const request = req.body;
  let requests = openOrCreateFileWithRequests();
  requests = JSON.parse(requests);
  /* console.log(requests);
  console.log(request);*/

  // если перезаписываем существующий запрос
  if (request.id !== null) {
    for (let i = 0; i < requests.length; i++) {
      if (requests[i].id === request.id) {
        requests[i] = request;
        break;
      }
    }
  } else requests.push({...request, id: requests.length + 1});

  console.log(requests);

  fs.writeFileSync(requestsFilePath, JSON.stringify(requests));

  const body = JSON.stringify({
    // id: request.id || requests.length + 1,
    id: request.id || requests.length,
    requests,
  });

  res.send(body);

  // res.send(request)
});

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});

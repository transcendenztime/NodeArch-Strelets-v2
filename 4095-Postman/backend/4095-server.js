const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");

//import {isURLValid} from "../../utils/utils";
const { isURLValid } = require('../../utils/utils');

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

// TODO async логирование

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

  if (requestMethod !== Methods.GET && requestMethod !== Methods.POST) {
  // if (requestMethod === Methods.GET || requestMethod === Methods.POST) {
    res.status(510).send("Неверный метод запроса");
  } else if(!isURLValid(URL)) {
    res.status(510).send("Неверный формат URL");
  } else {
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
  }
});

webserver.options("/save-request", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.post("/save-request", async (req, res) => {
  const request = req.body;
  try {
    let requests = openOrCreateFileWithRequests();
    requests = JSON.parse(requests);
    /* console.log(requests);
    console.log(request);*/

    // если перезаписываем существующий запрос
    if (request.requestId !== null) {
      for (let i = 0; i < requests.length; i++) {
        if (requests[i].requestId === request.requestId) {
          requests[i] = request;
          break;
        }
      }
    } else requests.push({...request, requestId: requests[requests.length - 1].requestId + 1});

    // console.log(requests);

    fs.writeFileSync(requestsFilePath, JSON.stringify(requests));

    const body = JSON.stringify({
      // requestId: request.requestId || requests.length,
      requestId: request.requestId || requests[requests.length - 1].requestId,
      requests,
    });

    res.send(body);
  } catch (e) {
    res.status(500).send(e.message);
  }
  // res.send(request)
});

webserver.options("/delete-request", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.post("/delete-request", (req, res) => {
  const request = req.body;
  try {
    let requests;
    // если файл с запросами существует, прочитаем его
    if (fs.existsSync(requestsFilePath)) {
      requests = fs.readFileSync(requestsFilePath);
      requests = JSON.parse(requests);

      const indexToDelete = requests.findIndex((item) => {
        return item.requestId === request.requestId;
      });

      if (indexToDelete !== -1) {
        // удаляем запрос
        requests.splice(indexToDelete, 1);
        fs.writeFileSync(requestsFilePath, JSON.stringify(requests));

        const body = JSON.stringify({
          // requestId: request.requestId || requests.length,
          requestId: request.requestId,
        });

        res.send(body);
      } else {
        res.status(510).send(`Не найден запрос с requestId=${request.requestId}`);
      }

    } else {
      // если файла нет, ответим ошибкой
      res.status(510).send("Отсутствует файл с запросами");
    }
  } catch (e) {
    res.status(500).send(e.message);
  }
});

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});

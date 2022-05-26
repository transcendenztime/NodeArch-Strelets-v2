import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
// import assert from "assert";
import {strict as assert} from "node:assert";
import express from "express";
import fetch from "node-fetch";

import handlebars from "handlebars";

import {fileURLToPath} from "url";
import {dirname} from "path";

import {logLineAsync, openOrCreateFile} from "./utils/utils.js";
import {jsonFilesPath, regExpForUrl, Methods} from "./constants/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));
webserver.use(bodyParser.json());

const port = 4595;
const logFN = path.join(__dirname, "_server.log");
const requestsFilePath = path.join(jsonFilesPath, "_requests.json");
const templateFilePath = path.join(__dirname, "views", "response.handlebars");

webserver.options("/get-requests", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.get("/get-requests", (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/get-request service called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const requests = openOrCreateFile(requestsFilePath, [], logFN, port);
  res.send(requests);
});

webserver.options("/execute", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.post("/execute", async (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/execute service called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const {URL, requestMethod, headers, getParameters, requestBody} = req.body;

  try {
    assert(requestMethod === Methods.GET || requestMethod === Methods.POST, "Неверный метод запроса");
    assert.match(URL, regExpForUrl, "Неверный формат URL");

    let reqURL = URL;
    // если пришли get-параметры, добавим их к урлу
    if (getParameters?.length) {
      let params = getParameters
        .map(item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
        .join("&");
      reqURL = reqURL + "?" + params;
    }

    // собираем хедеры запроса
    let reqHeaders = {};
    headers.forEach(item => {
      reqHeaders[item.header] = item.value;
    });

    let fetchOptions = {
      method: requestMethod,
      headers: reqHeaders,
      ...(requestMethod === Methods.POST && {body: requestBody}),
    };

    let response = await fetch(reqURL, fetchOptions);

    const headersRow = response.headers.raw();

    let resHeaders = [];
    let isImg = false;
    for (let key in headersRow) {
      resHeaders.push(`${key}: ${response.headers.get(key)}`);
    }

    // определяем, является ли response изображением
    if (response?.headers?.get("content-type")?.includes("image")) {
      isImg = true;
    }

    let result = {
      status: response.status,
      headers: resHeaders,
      isImg,
    };

    if (isImg) {
      result.data =
        "data:" +
        response.headers.get("content-type") +
        ";base64," +
        new Buffer.from(await response.arrayBuffer(), "binary").toString("base64");
    } else {
      result.data = await response.text();
    }

    logLineAsync(logFN, `[${port}] service executed [ method: ${requestMethod} | url: ${URL} ]`);

    // формируем ответ на фронт шаблонизатором
    const viewString = fs.readFileSync(templateFilePath, "utf8"); // шаблон для ответа сервера
    const viewTemplate = handlebars.compile(viewString); // получаем функцию, умеющую сформировать итоговый html на основе параметров
    const resultHTML = viewTemplate({
      // вызываем эту функцию, передавая уже конкретные параметры
      status: result.status,
      headers: result.headers,
      isImg,
      data: result.data,
    });

    res.send(resultHTML);
  } catch (e) {
    logLineAsync(logFN, `[${port}] /execute service error: ${e.message}`);
    res.status(500).send(e.message);
  }
});

webserver.options("/save-request", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.post("/save-request", async (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/save-request service called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const request = req.body;
  try {
    let requests = openOrCreateFile(requestsFilePath, [], logFN, port);
    requests = JSON.parse(requests);

    // если перезаписываем существующий запрос
    if (request.requestId !== null) {
      for (let i = 0; i < requests.length; i++) {
        if (requests[i].requestId === request.requestId) {
          requests[i] = request;
          break;
        }
      }
    } else requests.push({...request, requestId: requests.length ? requests[requests.length - 1].requestId + 1 : 1});

    fs.writeFileSync(requestsFilePath, JSON.stringify(requests));

    const body = JSON.stringify({
      requestId: request.requestId || requests[requests.length - 1].requestId,
      requests,
    });

    logLineAsync(logFN, `[${port}] service saved [ method: ${request.requestMethod} | url: ${request.URL} ]`);

    res.send(body);
  } catch (e) {
    logLineAsync(logFN, `[${port}] /save-request service error: ${e.message}`);
    res.status(500).send(e.message);
  }
});

webserver.options("/delete-request", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.post("/delete-request", (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/delete-request service called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const request = req.body;
  try {
    let requests;
    // если файл с запросами существует, прочитаем его
    if (fs.existsSync(requestsFilePath)) {
      requests = fs.readFileSync(requestsFilePath);
      requests = JSON.parse(requests);

      const indexToDelete = requests.findIndex(item => {
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
        logLineAsync(logFN, `[${port}] ` + "/delete-request service error: wrong requestId");
        res.status(510).send(`Не найден запрос с requestId=${request.requestId}`);
      }
    } else {
      logLineAsync(logFN, `[${port}] ` + "/delete-request service error: _requests.json file not found");
      // если файла нет, ответим ошибкой
      res.status(510).send("Отсутствует файл с запросами");
    }
  } catch (e) {
    logLineAsync(logFN, `[${port}] /delete-request service error: ${e.message}`);
    res.status(500).send(e.message);
  }
});

webserver.listen(port, () => {
  logLineAsync(logFN, "web server running on port " + port);
});

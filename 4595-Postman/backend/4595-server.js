import {isURLValid, logLineAsync} from "../../utils/back-utils.mjs";

/* import {createRequireFromPath as createRequire} from 'module';
import {fileURLToPath as fromPath} from 'url';
const require = createRequire(fromPath(import.meta.url));*/

// const express = require("express");
// const bodyParser = require("body-parser");
// const path = require("path");
// const fs = require("fs");
// const fetch = require("node-fetch");

import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
// import assert from "assert";
import { strict as assert } from 'node:assert';
import express from "express";
import fetch from "node-fetch";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));
webserver.use(bodyParser.json());

const port = 4595;
const logFN = path.join(__dirname, "_server.log");
const jsonFilesPath = "jsonFiles";
const requestsFilePath = path.join(jsonFilesPath, "_requests.json");

const Methods = {
  GET: "GET",
  POST: "POST",
};

// если файл с запросами существует, откроем его. Иначе создадим пустой файл
const openOrCreateFileWithRequests = () => {
  let requests;
  // если файл с запросами существует, прочитаем его
  if (fs.existsSync(requestsFilePath)) {
    requests = fs.readFileSync(requestsFilePath);
  } else {
    // если файл с запросами не существует, создадим его базовый вариант (с пустым массивом)
    fs.writeFileSync(requestsFilePath, JSON.stringify([]));
    requests = fs.readFileSync(requestsFilePath);
    logLineAsync(logFN, `[${port}] ` + "empty _requests.json file created");
  }

  return requests;
};

webserver.options("/get-requests", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.get("/get-requests", (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/get-request service called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const requests = openOrCreateFileWithRequests();
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

  if (requestMethod !== Methods.GET && requestMethod !== Methods.POST) {
  // if(assert.notEqual(requestMethod, Methods.GET) && assert.notEqual(requestMethod, Methods.POST)) {
    logLineAsync(logFN, `[${port}] ` + "/execute service error: wrong request method");
    res.status(510).send("Неверный метод запроса");
  } else if (!isURLValid(URL)) {
    logLineAsync(logFN, `[${port}] ` + "/execute service error: wrong url format");
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

    try {
      let fetchOptions = {
        method: requestMethod,
        headers: reqHeaders,
        ...(requestMethod === Methods.POST && {body: requestBody}),
      };

      let response = await fetch(reqURL, fetchOptions);

      const headersRow = response.headers.raw();
      let resHeaders = {};
      let isImg = false;
      for (let key in headersRow) {
        resHeaders[key] = response.headers.get(key);
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

      res.send(JSON.stringify(result));
    } catch (e) {
      logLineAsync(logFN, `[${port}] /execute service error: ${e.message}`);
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
  logLineAsync(logFN, `[${port}] ` + "/save-request service called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const request = req.body;
  try {
    let requests = openOrCreateFileWithRequests();
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

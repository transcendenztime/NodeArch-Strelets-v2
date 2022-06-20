const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise"); // промисифицированная версия

const {logLineAsync} = require("../../utils/back-utils");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));
webserver.use(bodyParser.json());

const port = 6195;
const logFN = path.join(__dirname, "_server.log");

const config = {
  host: "localhost", // на каком компьютере расположена база данных
  user: "nodeuser", // каким пользователем подключаемся
  password: "nodepass", // каким паролем подключаемся
};

// запрос на получение списка баз данных
webserver.get("/get-databases", async (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/get-databases service called");
  let connection = null;

  try {
    connection = await mysql.createConnection(config);

    const [databases, info] = await connection.execute("SHOW DATABASES;");
    const body = {};

    if (databases?.length) {
      body.databases = databases;
      body.errorInfo = {
        errorCode: "0",
        errorDescription: "",
      };
      logLineAsync(logFN, `[${port}] ` + "databases found");
    } else {
      body.databases = [];
      body.errorInfo = {
        errorCode: "1",
        errorDescription: "Отсутствуют базы данных. Дальнейшая работа невозможна",
      };
      logLineAsync(
        logFN,
        `[${port}] /get-databases service error: Отсутствуют базы данных. Дальнейшая работа невозможна`,
      );
    }

    res.send(body);
  } catch (e) {
    logLineAsync(logFN, `[${port}] /get-databases service error: ${e.message}`);
    res.status(500).end();
  }
});

webserver.post("/execute-query", async (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/execute-query service called");
  const {database, query} = req.body;
  config.database = database;
  let connection = null;

  try {
    connection = await mysql.createConnection(config);
    const [rows, fields] = await connection.execute(query);
    const body = {
      rows,
      fields,
      errorInfo: {
        errorCode: "0",
        errorDescription: "",
      },
    };
    logLineAsync(logFN, `[${port}] /execute-query service executed: [${query}]`);
    res.send(JSON.stringify(body));
  } catch (e) {
    const body = {
      errorInfo: {
        errorCode: "1",
        errorDescription: e.message,
      },
    };
    logLineAsync(logFN, `[${port}] /execute-query service error: ${e.message}`);
    res.send(JSON.stringify(body));
  } finally {
    config.database = undefined;
  }
});

webserver.listen(port, () => {
  logLineAsync(logFN, "web server running on port " + port);
});

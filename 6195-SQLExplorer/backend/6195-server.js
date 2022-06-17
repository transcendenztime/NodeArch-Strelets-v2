const express = require("express");
const path = require("path");
const mysql = require("mysql");

const {logLineAsync} = require("../../utils/back-utils");
const {newConnectionFactory, selectQueryFactory} = require("./db_utils");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));

const port = 6195;
const logFN = path.join(__dirname, "_server.log");
const poolConfig = {
  connectionLimit: 2, // полагаем что БД выдержит 5 соединений, т.е. в пуле будет максимум 5 соединений
  host: "localhost", // на каком компьютере расположена база данных
  user: "nodeuser", // каким пользователем подключаемся
  password: "nodepass", // каким паролем подключаемся
  // database : 'learning_db', // к какой базе данных подключаемся
};

let pool = mysql.createPool(poolConfig);

const reportServerError = (error, res) => {
  res.status(500).end();
  logLineAsync(logFN, `[${port}] ` + error);
};

const reportRequestError = (error, res) => {
  res.status(400).end();
  logLineAsync(logFN, `[${port}] ` + error);
};

webserver.get("/get-databases", async (req, res) => {
  let connection = null;

  try {
    connection = await newConnectionFactory(pool, res);
    const databases = await selectQueryFactory(connection, "SHOW DATABASES;");

    res.send(databases);
  } catch (e) {
    console.log("get-databases service error");
  } finally {
    if (connection) connection.release(); // соединение надо закрыть (вернуть в пул) независимо от успеха/ошибки
  }
});

webserver.listen(port, () => {
  logLineAsync(logFN, "web server running on port " + port);
});

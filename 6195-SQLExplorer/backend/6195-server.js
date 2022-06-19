const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
// const mysql = require("mysql");
const mysql2 = require("mysql2/promise");

const {logLineAsync} = require("../../utils/back-utils");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));
webserver.use(bodyParser.json());

const port = 6195;
const logFN = path.join(__dirname, "_server.log");
/* const poolConfig = {
  connectionLimit: 2, // полагаем что БД выдержит 5 соединений, т.е. в пуле будет максимум 5 соединений
  host: "localhost", // на каком компьютере расположена база данных
  user: "nodeuser", // каким пользователем подключаемся
  password: "nodepass", // каким паролем подключаемся
  // database : 'learning_db', // к какой базе данных подключаемся
};*/

const config = {
  // connectionLimit: 2, // полагаем что БД выдержит 5 соединений, т.е. в пуле будет максимум 5 соединений
  host: "localhost", // на каком компьютере расположена база данных
  user: "nodeuser", // каким пользователем подключаемся
  password: "nodepass", // каким паролем подключаемся
  // database : 'learning_db', // к какой базе данных подключаемся
};

/* let pool = mysql.createPool(poolConfig);

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
});*/

/* const getConnectionFromPool = async () => {
  let pool = await mysql2.createPool(poolConfig);
  return pool;
};*/

// let pool = getConnectionFromPool();

// let pool = mysql2.createPool(poolConfig);
// pool = pool.promise();

webserver.get("/get-databases", async (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/get-databases service called");
  let connection = null;

  try {
    // connection = await pool.getConnection();
    connection = await mysql2.createConnection(config);

    //connection = await newConnectionFactory(pool, res);
    // const databases = await selectQueryFactory(connection, "SHOW DATABASES;");
    const [databases, info] = await connection.execute("SHOW DATABASES;");

    const body = {};

    if (databases?.length) {
      body.databases = databases;
      body.errorInfo = {
        errorCode: "0",
        errorDescription: "",
      };
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
  } /* finally {
    if (connection) connection.release(); // соединение надо закрыть (вернуть в пул) независимо от успеха/ошибки
  }*/
});

webserver.post("/execute-query", async (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/execute-query service called");
  const {database, query} = req.body;

  // poolConfig.database = database;
  config.database = database;
  // let pool = mysql2.createPool(poolConfig);
  // pool = pool.promise();

  let connection = null;

  try {
    // connection = await pool.getConnection();
    connection = await mysql2.createConnection(config);
    // const [rows, fields] = await connection.query(query);
    const [rows, fields] = await connection.execute(query);
    // const [rows, fields] = await pool.query(query);
    const body = {
      rows,
      fields,
      errorInfo: {
        errorCode: "0",
        errorDescription: "",
      },
    };

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
    // if (connection) connection.release(); // соединение надо закрыть (вернуть в пул) независимо от успеха/ошибки
    // pool.releaseConnection(connection);
    config.database = undefined;
  }
});

webserver.listen(port, () => {
  logLineAsync(logFN, "web server running on port " + port);
});

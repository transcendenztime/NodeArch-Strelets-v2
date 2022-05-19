const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));
webserver.use(bodyParser.json());

const port = 4095;

// мидлварь для CORS
/* webserver.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});*/

webserver.options('/test', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.send("");
});

webserver.get("/test", (req, res) => {
  console.log("/test service called");
  res.setHeader("Access-Control-Allow-Origin","*");
  res.send("test service answer");
});

webserver.options('/execute', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.send("");
});

webserver.post("/execute", (req, res) => {
  console.log("/execute service called");
  console.log(req.body);
  res.send(req.body);
});

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});
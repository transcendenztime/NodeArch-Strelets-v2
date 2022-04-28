const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {check, validationResult} = require("express-validator");

const webserver = express();

const port = 3097;
const logFN = path.join(__dirname, "_server.log");

// пишет строку в файл лога и одновременно в консоль
const logLineSync = (logFilePath, logLine) => {
  const logDT = new Date();
  let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
  let fullLogLine = time + " " + logLine;

  console.log(fullLogLine); // выводим сообщение в консоль

  const logFd = fs.openSync(logFilePath, "a+"); // и это же сообщение добавляем в лог-файл
  fs.writeSync(logFd, fullLogLine + os.EOL); // os.EOL - это символ конца строки, он разный для разных ОС
  fs.closeSync(logFd);
};

const createPage = (errors, formFields) => {
  let pageBody = `
    <head>
      <title>Strelets Vadim(3097)</title>
    </head>
    <body>
      <h1>Strelets Vadim(3097)</h1><div>`;

  if (!errors) {
    pageBody += `
      <div style="font-weight: bold">Пожалуйста, представьтесь</div><br /><br />
    `;
  } else {
    pageBody += `
      <div style="color: red; font-weight: bold">Упс. Что-то пошло не так...</div><br /><br />
    `;
  }

  pageBody += `
        <form method="GET" action="/send">
            ваш логин: <input type="text" autocomplete="off"`;

  if (formFields && formFields.login) {
    pageBody += `value="${formFields.login}"`;
  }

  pageBody += `name="login">`;

  if (errors && errors.login && errors.login.msg) {
    pageBody += ` <span style="color: red">${errors.login.msg}</span>`;
  }

  pageBody += `<br /><br /> ваш пароль: <input type="text" autocomplete="off"`;

  if (formFields && formFields.password) {
    pageBody += `value="${formFields.password}"`;
  }

  pageBody += `name="password">`;

  if (errors && errors.password && errors.password.msg) {
    pageBody += ` <span style="color: red">${errors.password.msg}</span>`;
  }

  pageBody += `<br /><br /> ваш email: <input type="text" autocomplete="off"`;

  if (formFields && formFields.email) {
    pageBody += `value="${formFields.email}"`;
  }

  pageBody += `name="email">`;

  if (errors && errors.email && errors.email.msg) {
    pageBody += ` <span style="color: red">${errors.email.msg}</span>`;
  }

  pageBody += `<br /><br /> ваш возраст: <input type="number"`;

  if (formFields && formFields.age) {
    pageBody += `value="${formFields.age}"`;
  }

  pageBody += `name="age">`;

  if (errors && errors.age && errors.age.msg) {
    pageBody += ` <span style="color: red">${errors.age.msg}</span>`;
  }

  pageBody += `<br /><br />
        <input type="submit" value="Отправить форму">
        </form>
    </div>
    
    </body>`;

  return pageBody;
};

const createUserDataPage = formFields => {
  let body = `
    <head>
      <title>Strelets Vadim(3097)</title>
    </head>
    <body>
      <h1>Strelets Vadim(3097)</h1>
      <div>
        <h2>Мы вас узнали!</h2>
        <span style="font-weight: bold">логин: </span> <span>${formFields.login}</span>
        <br /><span style="font-weight: bold">пароль: </span> <span>${formFields.password}</span>
        <br /><span style="font-weight: bold">email: </span> <span>${formFields.email}</span>
        <br /><span style="font-weight: bold">возраст: </span> <span>${formFields.age}</span>
        <br /><br /><a href="/">Вернуться на форму авторизации</a>
      </div>
    </body>`;

  return body;
};

webserver.get("/", function (req, res) {
  logLineSync(logFN, `[${port}] ` + "index.html called");
  res.send(createPage());
});

webserver.get(
  "/send",
  [
    //валидация
    check("login")
      .not()
      .isEmpty()
      .withMessage("Поле обязательно для заполения")
      .isAlphanumeric()
      .withMessage("Допустимы латинские буквы и цифры")
      .isLength({min: 3, max: 12})
      .withMessage("От 3 до 12 символов")
      .escape(),

    check("password").isLength({min: 8, max: 16}).withMessage("От 8 до 16 символов").escape(),

    check("email")
      .not()
      .isEmpty()
      .withMessage("Поле обязательно для заполения")
      .isEmail()
      .withMessage("Некорректный email")
      .escape(),

    check("age")
      .not()
      .isEmpty()
      .withMessage("Поле обязательно для заполения")
      .isInt({min: 18, max: 70})
      .withMessage("От 18-ти до 70-ти лет")
      .escape(),
  ],
  (req, res) => {
    logLineSync(logFN, `[${port}] ` + "/send called, get pars: " + JSON.stringify(req.query));

    const errors = validationResult(req);
    let mappedErrors = errors.mapped();

    // если объект с ошибками не пустой, значит форма не прошла валидацию
    if (!errors.isEmpty()) {
      // вернем форму со всеми введенными значениями
      res.send(createPage(mappedErrors, req.query));
    } else {
      res.send(createUserDataPage(req.query));
    }
  },
);

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});

import React, {Fragment} from "react";
import {useEffect, useState} from "react";
import isoFetch from "isomorphic-fetch";

import {HeadersNames, Methods} from "../constants/constants";
import {isURLValid} from "../../../utils/front-utils";

import "./Main.scss";

const Main = () => {
  const [requests, setRequests] = useState([]); // список сохраненных запросов

  const [requestId, setRequestId] = useState(null); // id выбранного запроса
  const [URL, setURL] = useState("");
  const [requestMethod, setRequestMethod] = useState(Methods.GET);
  const [getParameters, setGetParameters] = useState([]);
  const [requestBody, setRequestBody] = useState("");
  const [headers, setHeaders] = useState([]);

  const [isResponseExecuted, setIsResponseExecuted] = useState(false);
  const [responseParams, setResponseParams] = useState(null);

  const [errors, setErrors] = useState({});

  // запрашиваем сохраненные запросы
  const getSavedRequests = async () => {
    let answer = await isoFetch("/get-requests", {
      method: "GET",
    });
    answer = await answer.json();
    setRequests(answer);
  };

  useEffect(() => {
    getSavedRequests();
  }, []);

  // валидация формы
  const isFormValid = () => {
    let errors = {};
    let isValid = true;

    if (!URL) {
      errors.URL = "Ввод url'a обязателен";
      isValid = false;
    } else if (!isURLValid(URL)) {
      errors.URL = "Неверный формат URL";
      isValid = false;
    }

    if (requestMethod === Methods.GET) {
      errors.getParameters = {};
      getParameters.forEach((item, id) => {
        errors.getParameters[id] = {};
        if (!item.key) {
          errors.getParameters[id].key = "Ввод обязателен";
          isValid = false;
        }
        if (!item.value) {
          errors.getParameters[id].value = "Ввод обязателен";
          isValid = false;
        }
      });
    }

    errors.headers = {};
    headers.forEach((item, id) => {
      errors.headers[id] = {};
      if (!item.header) {
        errors.headers[id].header = "Ввод обязателен";
        isValid = false;
      }
      if (!item.value) {
        errors.headers[id].value = "Ввод обязателен";
        isValid = false;
      }
    });

    setErrors(errors);

    return isValid;
  };

  // отправляем на бэк параметры запроса для выполнения
  const executeRequest = async () => {
    if (!isFormValid()) return;

    const body = {
      URL,
      requestMethod,
      headers,
      ...(requestMethod === Methods.GET && {getParameters}),
      ...(requestMethod === Methods.POST && {requestBody}),
    };

    let answer = await isoFetch("/execute", {
      method: Methods.POST,
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (answer.status === 500 || answer.status === 510) {
      const error = await answer.text();
      alert(`При выполнении запроса "/execute" на сервере произошла ошибка: ${error}`);
      return;
    }

    // answer = await answer.json();

    answer = await answer.text();

    setIsResponseExecuted(true);
    setResponseParams(answer);
    // setResponseParams(answer.body);
  };

  // отправляем на бэк параметры запроса для сохранения
  const saveRequest = async () => {
    if (!isFormValid()) return;

    const body = {
      requestId,
      URL,
      requestMethod,
      headers,
      ...(requestMethod === Methods.GET && {getParameters}),
      ...(requestMethod === Methods.POST && {requestBody}),
    };

    let answer = await isoFetch("/save-request", {
      method: Methods.POST,
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (answer.status === 500 || answer.status === 510) {
      const error = await answer.text();
      alert(`При выполнении запроса "/save-request" на сервере произошла ошибка: ${error}`);
      return;
    }

    answer = await answer.json();

    alert(`Запрос с id=${answer.requestId} сохранен`);

    setRequestId(answer.requestId);
    setRequests(answer.requests);
  };

  // удаляем запрос из сохраненных на бэке
  const deleteRequest = async () => {
    if (requestId) {
      if (confirm(`Подтверждаете удаление запроса с id=${requestId}?`)) {
        const body = {
          requestId,
        };

        let answer = await isoFetch("/delete-request", {
          method: Methods.POST,
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (answer.status === 500 || answer.status === 510) {
          const error = await answer.text();
          alert(`При выполнении запроса "/delete-request" на сервере произошла ошибка: ${error}`);
          return;
        }

        answer = await answer.json();
        clearForm();
        getSavedRequests();
        alert(`Запрос с id=${answer.requestId} удален`);
      }
    } else {
      alert("Не выбран запрос для удаления");
    }
  };

  // очистка формы
  const clearForm = () => {
    setRequestId(null);
    setURL("");
    setRequestMethod(Methods.GET);
    setGetParameters([]);
    setRequestBody("");
    setHeaders([]);
    setIsResponseExecuted(false);
    setResponseParams(null);
    setErrors({});
  };

  // очистка параметров ответа
  const clearResponseParams = () => {
    setResponseParams(null);
  };

  // собираем хэдеры
  const parseResponseHeaders = headers => {
    let result = [];
    for (let key in headers) {
      result.push(
        <li key={key}>
          {key}: {headers[key]}
        </li>,
      );
    }
    return result;
  };

  const setFieldValue = e => {
    const value = e.target.value;
    switch (e.target.name) {
      case "requestMethod":
        setRequestMethod(value);
        break;

      case "URL":
        setURL(value);
        break;

      case "requestBody":
        setRequestBody(value);
        break;

      default:
        break;
    }
  };

  const changeParameter = (e, id) => {
    let tmpParameters = [...getParameters];
    tmpParameters[id][e.target.name] = e.target.value;
    setGetParameters(tmpParameters);
  };

  const deleteParameter = id => {
    let tmpParameters = [...getParameters];
    tmpParameters.splice(id, 1);
    setGetParameters(tmpParameters);
  };

  const addParameter = () => {
    let tmpParameters = [...getParameters];
    tmpParameters.push({key: "", value: ""});
    setGetParameters(tmpParameters);
  };

  const changeHeaders = (e, id) => {
    let tmpHeaders = [...headers];
    tmpHeaders[id][e.target.name] = e.target.value;
    setHeaders(tmpHeaders);
  };

  const deleteHeader = id => {
    let tmpHeaders = [...headers];
    tmpHeaders.splice(id, 1);
    setHeaders(tmpHeaders);
  };

  const addHeader = () => {
    let tmpHeaders = [...headers];
    tmpHeaders.push({header: "", value: ""});
    setHeaders(tmpHeaders);
  };

  // клик по запросу из списка сохраненных
  const selectRequest = request => {
    clearResponseParams();
    setRequestId(request.requestId);
    setURL(request.URL);
    setRequestMethod(request.requestMethod);
    if (request.requestMethod === Methods.GET) {
      setGetParameters(request.getParameters);
      setRequestBody("");
    } else {
      setGetParameters([]);
      setRequestBody(request.requestBody);
    }
    setHeaders(request.headers);

    setErrors({});
  };

  const renderRequests = () => {
    return (
      <Fragment>
        <div className={"Main__head"}>Сохраненные запросы:</div>
        <div className={"Main__requests-list"}>
          {requests.length ? (
            requests.map((item, id) => (
              <div
                key={id}
                onClick={() => selectRequest(item)}
                className={`Main__requests-item ${
                  item.requestMethod === Methods.GET ? "Main__requests-item--get" : "Main__requests-item--post"
                } ${item.requestId === requestId ? "Main__requests-item--checked" : ""}`}
              >
                <span
                  className={`${
                    item.requestMethod === Methods.GET
                      ? "Main__method Main__method--get"
                      : "Main__method Main__method--post"
                  }`}
                >
                  {item.requestMethod}
                </span>
                <span className={"Main__request-url"}>{item.URL}</span>
              </div>
            ))
          ) : (
            <div className={"Main__empty-list"}>Нет сохраненных запросов</div>
          )}
        </div>
      </Fragment>
    );
  };

  const renderURL = () => {
    return (
      <div className={"Main__data-url"}>
        <div className={"Main__label"}>URL</div>
        <input autoComplete={"off"} type={"text"} onChange={setFieldValue} name={"URL"} value={URL} />
        <span className={"Main__error"}>{errors.URL}</span>
      </div>
    );
  };

  const renderRequestMethod = () => {
    return (
      <div className={"Main__data-requestMethod"}>
        <div className={"Main__label"}>Метод</div>
        <select onChange={setFieldValue} name={"requestMethod"} value={requestMethod}>
          <option value={Methods.GET}>GET</option>
          <option value={Methods.POST}>POST</option>
        </select>
      </div>
    );
  };

  const renderGetParameters = () => {
    return (
      <div className={"Main__get-parameters"}>
        <div className={"Main__label"}>GET-параметры</div>
        {getParameters.length ? (
          <div>
            {getParameters.map((item, id) => (
              <div key={id} className={"Main__block"}>
                <div className={"Main__column"}>
                  <input
                    type={"text"}
                    value={item.key}
                    placeholder={"Ключ"}
                    name={"key"}
                    onChange={e => changeParameter(e, id)}
                    autoComplete={"off"}
                  />
                  <span className={"Main__error"}>{errors?.getParameters?.[id]?.key}</span>
                </div>
                <div className={"Main__column"}>
                  <input
                    type={"text"}
                    value={item.value}
                    placeholder={"Значение"}
                    name={"value"}
                    onChange={e => changeParameter(e, id)}
                    autoComplete={"off"}
                  />
                  <span className={"Main__error"}>{errors?.getParameters?.[id]?.value}</span>
                </div>
                <div>
                  <button
                    className={"Main__button  Main__button--small Main__button--red"}
                    onClick={() => deleteParameter(id)}
                  >
                    Удалить
                  </button>{" "}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <button className={"Main__button Main__button--blue"} onClick={addParameter}>
          Добавить get-параметр
        </button>
      </div>
    );
  };

  const renderBody = () => {
    return (
      <div className={"Main__request-body"}>
        <div className={"Main__label"}>Тело запроса</div>
        <textarea value={requestBody} name={"requestBody"} onChange={setFieldValue} />
      </div>
    );
  };

  const renderHeaders = () => {
    return (
      <div className={"Main__headers"}>
        <div className={"Main__label"}>Заголовки</div>
        {headers.length ? (
          <div>
            {headers.map((item, id) => (
              <div key={id} className={"Main__block"}>
                <div className={"Main__column"}>
                  <select value={item.header} onChange={e => changeHeaders(e, id)} name={"header"}>
                    <option value={""} />
                    {HeadersNames.map((header, id) => (
                      <option key={id} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                  <span className={"Main__error"}>{errors?.headers?.[id]?.header}</span>
                </div>
                <div className={"Main__column"}>
                  <input
                    type={"text"}
                    placeholder={"Значение"}
                    value={item.value}
                    name={"value"}
                    autoComplete={"off"}
                    onChange={e => changeHeaders(e, id)}
                  />
                  <span className={"Main__error"}>{errors?.headers?.[id]?.value}</span>
                </div>
                <div>
                  <button
                    className={"Main__button  Main__button--small Main__button--red"}
                    onClick={() => deleteHeader(id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <button className={"Main__button Main__button--blue"} onClick={addHeader}>
          Добавить заголовок
        </button>
      </div>
    );
  };

  const renderButtons = () => {
    return (
      <div className={"Main__buttons"}>
        <div>
          <button className={"Main__button Main__button--orange"} onClick={executeRequest}>
            Выполнить запрос
          </button>
        </div>
        <div>
          <button className={"Main__button Main__button--blue"} onClick={saveRequest}>
            {requestId ? "Перезаписать выбранный запрос" : "Сохранить новый запрос"}
          </button>
        </div>
        <div>
          <button className={"Main__button Main__button--green"} onClick={clearForm}>
            Новый запрос
          </button>
        </div>
        {requestId && (
          <div>
            <button className={"Main__button Main__button--red"} onClick={deleteRequest}>
              Удалить выбранный запрос
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderResponseParams = () => {
    return (
      <Fragment>
        {isResponseExecuted && responseParams && (
          <Fragment>
            <div className={"Main__head"}>Параметры ответа:</div>
            {<div dangerouslySetInnerHTML={{__html: responseParams}} />}
            <div>
              <button className={"Main__button Main__button--red"} onClick={clearResponseParams}>
                Очистить параметры ответа
              </button>
            </div>
          </Fragment>
        )}
      </Fragment>
    );
  };

  return (
    <div>
      <div className={"title"}>Postman ver. 0.2.0 (Strelets Vadim)</div>
      <div className={"Main"}>
        <div className={"Main__left-column"}>
          {renderRequests()}
          {renderButtons()}
        </div>
        <div className={"Main__right-column"}>
          <div className={"Main__head"}>
            {requestId ? `Параметры сохраненного запроса с id=${requestId}:` : "Новый запрос:"}
          </div>
          <div className={"Main__request-parameters"}>
            <div className={"Main__data"}>
              {renderURL()}
              {renderRequestMethod()}
            </div>
            <div className={"Main__other-parameters"}>
              {requestMethod === Methods.GET ? renderGetParameters() : renderBody()}
              {renderHeaders()}
            </div>
          </div>
          {renderResponseParams()}
        </div>
      </div>
    </div>
  );
};

export default Main;

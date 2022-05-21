import React from "react";
import {useEffect, useState} from "react";
import isoFetch from "isomorphic-fetch";

import {HeadersNames, Methods} from "../Constants/constants";
import {isURLValid} from "../../../utils/utils";

// import "./Main.scss";
import "./MainFlex.scss";

// TODO удаление запросов (в этом случае с бэка нужно присылать не requests.length, а максимальный requestId + 1)
// TODO красивая верстка

const Main = () => {
  const [text, setText] = useState(null);

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

  const getSavedRequests = async () => {
    let answer = await isoFetch("/get-requests", {
      method: "GET",
    });
    answer = await answer.json();
    setRequests(answer);

    // return answer;
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

    if (answer.status === 500 && answer.status === 510) {
      const error = await answer.text();
      alert(`При выполнении запроса "/execute" на сервере произошла ошибка: ${error}`);
      return;
    }

    answer = await answer.json();
    setIsResponseExecuted(true);
    setResponseParams(answer);
  };

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

    if (answer.status === 500 && answer.status === 510) {
      const error = await answer.text();
      alert(`При выполнении запроса "/save-request" на сервере произошла ошибка: ${error}`);
      return;
    }

    answer = await answer.json();

    setRequestId(answer.requestId);
    setRequests(answer.requests);
  };

  // удаляем запрос из сохраненных на бэке
  const deleteRequest = async () => {
    if(requestId) {
      const body = {
        requestId
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

    } else {
      alert("Не выбран запрос для удаления");
    }
  };

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

  const selectRequest = request => {
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
      <div className={"Requests"}>
        {requests.length ? (
          requests.map((item, id) => (
            <div
              key={id}
              onClick={() => selectRequest(item)}
              className={`Requests__item ${item.requestId === requestId ? "Requests__item--checked" : ""}`}
            >
              <span className={`${item.requestMethod === Methods.GET ? "getItem" : "postItem"}`}>
                {item.requestMethod}
              </span>{" "}
              <span>{item.URL}</span>
            </div>
          ))
        ) : (
          <span>Сохраненных запросов нет</span>
        )}
      </div>
    );
  };

  const renderURL = () => {
    return (
      <div className={"Main__data__url"}>
        <div>URL</div>
        <input type={"text"} onChange={setFieldValue} name={"URL"} value={URL} />
        <span className={"Main__error"}>{errors.URL}</span>
      </div>
    );
  };

  const renderRequestMethod = () => {
    return (
      <div className={"Main__data__requestMethod"}>
        <div>Метод</div>
        <select onChange={setFieldValue} name={"requestMethod"} value={requestMethod}>
          <option value={Methods.GET}>GET</option>
          <option value={Methods.POST}>POST</option>
        </select>
      </div>
    );
  };

  const renderGETParameters = () => {
    return (
      <div className={"Main__getParameters"}>
        <div>GET-параметры</div>
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
                <span onClick={() => deleteParameter(id)}>Удалить</span>
              </div>
            ))}
          </div>
        ) : null}
        <div onClick={addParameter}>Добавить get-параметр</div>
      </div>
    );
  };

  const renderBody = () => {
    return (
      <div className={"Main_requestBody"}>
        <div>Тело запроса</div>
        <textarea value={requestBody} name={"requestBody"} onChange={setFieldValue} style={{width: "300px"}} />
      </div>
    );
  };

  const renderHeaders = () => {
    return (
      <div className={"Main__headers"}>
        {headers.length ? (
          <div>
            <div>Заголовки</div>
            {headers.map((item, id) => (
              <div key={id} className={"Main__Block"}>
                <div className={"Main__Column"}>
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
                <div className={"Main__Column"}>
                  <input
                    type={"text"}
                    placeholder={"Значение"}
                    value={item.value}
                    name={"value"}
                    onChange={e => changeHeaders(e, id)}
                  />
                  <span className={"Main__error"}>{errors?.headers?.[id]?.value}</span>
                </div>
                <span onClick={() => deleteHeader(id)}>Удалить</span>
              </div>
            ))}
          </div>
        ) : null}
        <div onClick={addHeader}>Добавить заголовок</div>
      </div>
    );
  };

  const renderButtons = () => {
    return (
      <div className={"Main__buttons"}>
        <span onClick={executeRequest}>Выполнить запрос</span>
        <span onClick={saveRequest}>{requestId ? "Перезаписать выбранный запрос" : "Сохранить новый запрос"}</span>
        <span onClick={clearForm}>Очистить форму</span>
        {requestId &&
          <span onClick={deleteRequest}>Удалить выбранный запрос</span>
        }
      </div>
    );
  };

  const renderResponseParams = () => {
    return (
      <div>
        {isResponseExecuted && responseParams && (
          <div className={"Main__response"}>
            <h2>Параметры ответа:</h2>
            <div className={"Main__label"}>
              Статус: <span>{responseParams.status}</span>
            </div>
            <div className={"Main__label"}>
              Заголовки: <br />
              {<ul>{parseResponseHeaders(responseParams.headers)}</ul>}
            </div>
            <div className={"Main__label"}>
              Тело:
              <br />
              <textarea defaultValue={responseParams.data} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div>Hello</div>
      {renderRequests()}
      <div className={"Main"}>
        <div className={"Main__data"}>
          {renderURL()}
          {renderRequestMethod()}
        </div>
        {requestMethod === Methods.GET ? renderGETParameters() : renderBody()}
        {renderHeaders()}
      </div>
      {renderButtons()}
      {renderResponseParams()}
    </div>
  );
};

export default Main;

import React from "react";
import {useEffect, useState} from "react";
import {HeadersNames, Methods} from "../Constants/constants";

// import "./Main.scss";
import "./MainFlex.scss";

const Main = () => {
  const [text, setText] = useState(null);

  const [requests, setRequests] = useState([]); // список сохраненных запросов

  const [id, setId] = useState(null); // id выбранного запроса
  const [URL, setURL] = useState("");
  const [requestMethod, setRequestMethod] = useState(Methods.GET);
  const [getParameters, setGetParameters] = useState([]);
  const [requestBody, setRequestBody] = useState("");
  const [headers, setHeaders] = useState([]);

  const [isResponseExecuted, setIsResponseExecuted] = useState(false);
  const [responseParams, setResponseParams] = useState(null);

  const getSavedRequests = async () => {
    let answer = await fetch("/get-requests", {
      method: "GET",
    });
    answer = await answer.json();
    setRequests(answer);

    // return answer;
  };

  useEffect(() => {
    getSavedRequests();
  }, []);

  const testService = async () => {
    let answer = await fetch("/test", {
      method: Methods.GET,
    });
    answer = await answer.text();

    setText(answer);
  };

  // console.log(process.env.NODE_ENV);

  const executeRequest = async () => {
    // TODO добавить валидацию
    const body = {
      URL,
      requestMethod,
      headers,
      ...(requestMethod === Methods.GET && {getParameters}),
      ...(requestMethod === Methods.POST && {requestBody}),
    };

    let answer = await fetch("/execute", {
      method: Methods.POST,
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (answer.status === 500) {
      const error = await answer.text();
      alert(`Ошибка сервера при выполнении запроса "/execute": ${error}`);
      return;
    }

    answer = await answer.json();
    setIsResponseExecuted(true);
    setResponseParams(answer);
  };

  const saveRequest = async () => {
    // TODO добавить валидацию

    const body = {
      id,
      URL,
      requestMethod,
      headers,
      ...(requestMethod === Methods.GET && {getParameters}),
      ...(requestMethod === Methods.POST && {requestBody}),
    };

    let answer = await fetch("/save", {
      method: Methods.POST,
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    answer = await answer.json();

    setId(answer.id);
    setRequests(answer.requests);
  };

  const clearForm = () => {
    setId(null);
    setURL("");
    setRequestMethod(Methods.GET);
    setGetParameters([]);
    setRequestBody("");
    setHeaders([]);
    setIsResponseExecuted(false);
    setResponseParams(null);
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
    console.log("request: ", request);
    // const {id, URL, requestMethod, getParameters, requestBody, headers} = request;
    setId(request.id);
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
  };

  const renderTest = () => {
    return (
      <div>
        <input type={"button"} value={"test"} onClick={testService} />
        <input
          type={"button"}
          value={"clear"}
          onClick={() => {
            setText(null);
          }}
        />
        <div>
          <span>Ответ от тестового сервиса: </span>
          {text}
        </div>
      </div>
    );
  };

  const renderRequests = () => {
    return (
      <div className={"Requests"}>
        {requests.length ? (
          requests.map((item, idd) => (
            <div
              key={idd}
              onClick={() => selectRequest(item)}
              className={`Requests__item ${item.id === id ? "Requests__item--checked" : ""}`}
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
                </div>
                <div className={"Main__Column"}>
                  <input
                    type={"text"}
                    placeholder={"Значение"}
                    value={item.value}
                    name={"value"}
                    onChange={e => changeHeaders(e, id)}
                  />
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
        <span onClick={saveRequest}>{id ? "Перезаписать выбранный запрос" : "Сохранить новый запрос"}</span>
        <span onClick={clearForm}>Очистить форму</span>
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
      {renderTest()}
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

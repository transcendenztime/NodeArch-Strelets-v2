import React from "react";
import {useEffect, useState} from "react";
import {HeadersNames, Methods} from "../Constants/constants";

// import "./Main.scss";
import "./MainFlex.scss";

const Main = () => {
  const [text, setText] = useState(null);

  const [URL, setURL] = useState("");
  const [requestMethod, setRequestMethod] = useState(Methods.GET);
  const [getParameters, setGetParameters] = useState([]);
  const [requestBody, setRequestBody] = useState("");
  const [headers, setHeaders] = useState([]);

  const [isResponseExecuted, setIsResponseExecuted] = useState(false);
  const [response, setResponse] = useState(null);

  const testService = async () => {
    const response = await fetch("/test", {
      method: Methods.GET,
    });
    const answer = await response.text();

    setText(answer);
  };

  // console.log(process.env.NODE_ENV);

  const executeRequest = async () => {
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
    setResponse(answer);
  };

  const clearForm = () => {
    setURL("");
    setRequestMethod(Methods.GET);
    setGetParameters([]);
    setRequestBody("");
    setHeaders([]);
    setIsResponseExecuted(false);
    setResponse(null);
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
        <span onClick={clearForm}>Очистить форму</span>
      </div>
    );
  };

  const renderResponseParams = () => {
    return (
      <div>
        {isResponseExecuted && response && (
          <div className={"Main__response"}>
            <h2>Параметры ответа:</h2>
            <div className={"Main__label"}>
              Статус: <span>{response.status}</span>
            </div>
            <div className={"Main__label"}>
              Заголовки: <br />
              {<ul>{parseResponseHeaders(response.headers)}</ul>}
            </div>
            <div className={"Main__label"}>
              Тело:
              <br />
              <textarea defaultValue={response.data} />
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
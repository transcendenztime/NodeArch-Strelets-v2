import React, {useEffect, useState} from "react";
import isoFetch from "isomorphic-fetch";

import {Methods} from "../../../5695-FileStorage/frontend/constants/constants";

import "./Main.scss";

const Main = () => {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState(null);
  const [fields, setFields] = useState(null);
  const [errorCode, setErrorCode] = useState("0");
  const [errorDescription, setErrorDescription] = useState("");

  const getDatabases = async () => {
    let answer = await isoFetch("/get-databases", {
      method: Methods.GET,
    });
    answer = await answer.json();

    if (answer.status === 500) {
      const error = await answer.text();
      alert(`При выполнении запроса "/get-databases" на сервере произошла ошибка: ${error}`);
      return;
    }

    if (answer.errorInfo.errorCode === "0") {
      setDatabases(answer.databases);
      if (answer.databases.length) {
        setSelectedDatabase(answer.databases[0].Database);
      }
      return;
    }

    alert(answer.errorInfo.errorDescription);
  };

  useEffect(() => {
    getDatabases();
  }, []);

  const setDatabase = e => {
    const value = e.target.value;
    setSelectedDatabase(value);
  };

  const changeQuery = e => {
    const value = e.target.value;
    setQuery(value);
  };

  const renderError = () => {
    return (
      <div>
        <div>Произошла ошибка:</div>
        <div>{errorDescription}</div>
      </div>
    );
  };

  const createRow = (row, id) => {
    return fields.map((field, idx) => {
      return <td key={`${id}_${idx}`}>{row[`${field.name}`]}</td>;
    });
  };

  const renderResult = () => {
    if (fields?.length) {
      // это был немодифицирующий запрос
      // запрос вернул названия полей, значит он вернул и массив строк (хоть этот массив может быть и пустым)
      return (
        <table>
          <thead>
            <tr>
              {fields.map((field, id) => {
                return <th key={id}>{field.name}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {rows &&
              rows.map((row, id) => {
                return <tr key={id}>{createRow(row, id)}</tr>;
              })}
          </tbody>
        </table>
      );
    } else if (rows) {
      // Это был модифицирующий запрос
      // В этом случае в "rows" лежит информация о количестве измененных записей и т.д.
      return (
        <>
          <div>Модифицирующий запрос</div>
          <div>{`Затронуто строк: ${rows?.affectedRows}`}</div>
        </>
      );
    }
  };

  const runQuery = async () => {
    setIsLoading(true);
    setFields(null);
    setRows(null);
    setErrorCode("0");
    setErrorDescription("");

    const body = {
      database: selectedDatabase,
      query,
    };

    let answer = await isoFetch("/execute-query", {
      method: Methods.POST,
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    /* if (answer.status === 500) {
      const error = await answer.text();
      alert(`При выполнении запроса "/execute-query" на сервере произошла ошибка: ${error}`);
      setIsLoading(false);
      return;
    }*/

    answer = await answer.json();

    if (answer.errorInfo.errorCode === "0") {
      setFields(answer.fields);
      setRows(answer.rows);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setErrorCode(answer.errorInfo.errorCode);
    setErrorDescription(answer.errorInfo.errorDescription);
  };

  const renderDatabases = () => {
    return (
      <div className={"Main__databases"}>
        <div className={"Main__head"}>Выберите базу данных</div>
        <select onChange={setDatabase} name={"selectedDatabase"} value={selectedDatabase}>
          {databases &&
            databases.map((item, index) => {
              return (
                <option key={index} value={item.Database}>
                  {item.Database}
                </option>
              );
            })}
        </select>
      </div>
    );
  };

  const renderQueryField = () => {
    return (
      <div className={"Main__query"}>
        <div className={"Main__head"}>Введите запрос</div>
        <textarea placeholder={"Введите запрос"} value={query} onChange={changeQuery} />
      </div>
    );
  };

  return (
    <div>
      <div className={"title"}>SQLExplorer (Strelets Vadim)</div>
      <div className={"Main"}>
        {renderDatabases()}
        {renderQueryField()}
        <div>
          <button
            className={`Main__button ${
              isLoading || !databases.length ? "Main__button--disabled" : "Main__button--green"
            }`}
            onClick={!isLoading ? runQuery : undefined}
          >
            Выполнить запрос
          </button>
        </div>
        <div className={"Main__result"}>{errorCode === "0" ? renderResult() : renderError()}</div>
      </div>
    </div>
  );
};

export default Main;

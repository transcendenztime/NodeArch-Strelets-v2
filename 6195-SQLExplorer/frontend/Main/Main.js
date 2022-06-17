import React, {useEffect, useState} from "react";
import isoFetch from "isomorphic-fetch";

import {Methods} from "../../../5695-FileStorage/frontend/constants/constants";

import "./Main.scss";

const Main = () => {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [query, setQuery] = useState("");

  const getDatabases = async () => {
    let answer = await isoFetch("/get-databases", {
      method: Methods.GET,
    });
    answer = await answer.json();
    setDatabases(answer);
    if (answer.length) {
      setSelectedDatabase(answer[0].Database);
    }
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

  const renderDatabases = () => {
    return (
      <div>
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
      </div>
    </div>
  );
};

export default Main;

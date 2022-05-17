import React from 'react';
import {useEffect, useState} from "react";

// для dev-сборки
const servicesPrefix = process.env.NODE_ENV === "development" ? "http://localhost:4095" : "";

const Main = () => {

  const [text, setText] = useState(null);

  const testService = async () => {
    const response = await fetch(`${servicesPrefix}/test`, {
      method: 'GET'
    });
    const answer = await response.text();

    setText(answer);
  };

  console.log(process.env.NODE_ENV);
  return(
    <div>
    <div>Hello</div>
      <input type={"button"} value={"test"} onClick={testService} />
      <input type={"button"} value={"clear"} onClick={() => {setText(null)}}/>
      <div><span>Ответ от тестового сервиса: </span>{text}</div>
    </div>
  )
};

export default Main;
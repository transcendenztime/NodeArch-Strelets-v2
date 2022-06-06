import React, {Fragment} from "react";
import {useEffect, useState} from "react";
import isoFetch from "isomorphic-fetch";

import {Methods, wsUrl} from "../constants/constants";

import "./Main.scss";

const Main = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]); // список сохраненных файлов
  const [fileForUpload, setFileForUpload] = useState(null);
  const [commentForFile, setCommentForFile] = useState("");
  const [isFormValid, setIsFormValid] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState(null); // id выбранного файла в списке загруженных файлов
  const [selectedFileComment, setSelectedFileComment] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // запрашиваем список загруженных на сервер файлов
  const getUploadedFiles = async () => {
    let answer = await isoFetch("/get-files", {
      method: Methods.GET,
    });
    answer = await answer.json();
    setUploadedFiles(answer);
  };

  let keepAliveTimer = null; // таймер для поддержания websocket соединения
  let connection = null; // websocket соединение
  let clientId = null; // id websocket соединения

  const openWSConnection = () => {
    connection = new WebSocket(wsUrl);

    keepAliveTimer = setInterval(() => {
      connection.send("KEEP_ME_ALIVE");
    }, 3000);

    connection.onmessage = event => {
      const data = JSON.parse(event.data);

      if (data.message === "NEW_CLIENT_CONNECTED") {
        clientId = data.clientId;
      } else if (data.message === "UPLOAD") {
        setUploadProgress(data.percentage);
      }
    };

    connection.onerror = error => {
      console.log("WebSocket error:", error);
    };

    connection.onclose = () => {
      console.log("websocket соединение с сервером закрыто");
      connection = null;
      // clientId = null;
      clearInterval(keepAliveTimer);
    };
  };

  const closeWSConnection = () => {
    connection.send("I_AM_DONE");
    connection = null;
    clientId = null;
    clearInterval(keepAliveTimer);
  };

  useEffect(() => {
    getUploadedFiles();
  }, []);

  const scrollToSelectedFile = () => {
    document.getElementById("checked-file").scrollIntoView();
  };

  const addFile = e => {
    setFileForUpload(e.target.files[0]);
  };

  const changeCommentForFile = e => {
    setCommentForFile(e.target.value);
  };

  const validateForm = () => {
    const isValid = !!(fileForUpload && commentForFile);
    setIsFormValid(isValid);
    return isValid;
  };

  // клик по запросу из списка сохраненных
  const selectFileFromList = file => {
    setSelectedFileId(file.id);
    setSelectedFileComment(file.comment);
    setIsFormValid(true);
  };

  // очищаем поля формы
  const clearUploadForm = () => {
    setFileForUpload(null);
    document.getElementById("file-input").value = "";
    setCommentForFile("");
  };

  const uploadFile = async () => {
    const isValid = validateForm();

    if (!isValid) return;

    setUploadProgress(0);

    // прямо перед началом отправки файла инициируем websocket соединение с сервером
    openWSConnection();

    setTimeout(async () => {
      let formData = new FormData();
      formData.append("commentForFile", commentForFile);
      formData.append("clientId", clientId);
      formData.append("fileForUpload", fileForUpload);

      let answer = await isoFetch("/upload-file", {
        method: Methods.POST,
        body: formData,
      });

      if (answer.status === 500) {
        const error = await answer.text();
        alert(`При выполнении запроса "/upload-file" на сервере произошла ошибка: ${error}`);
        // если ошибка - разрываем websocket соединение
        closeWSConnection();
        return;
      }

      answer = await answer.json();

      // как отправили файл, сразу разрываем websocket соединение
      closeWSConnection();

      alert(`Файл сохранен под id=${answer.id}`);

      setUploadedFiles(answer.files);
      setSelectedFileId(answer.id);
      const selectedFile = answer.files.find(it => {
        return it.id === answer.id;
      });
      setSelectedFileComment(selectedFile.comment);

      clearUploadForm();

      scrollToSelectedFile();
    }, 1000);
  };

  // скачиваем файл
  const downloadFile = async () => {
    if (selectedFileId) {
      const body = {
        id: selectedFileId,
      };

      let answer = await isoFetch("/download-file", {
        method: Methods.POST,
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const file = uploadedFiles.find(item => {
        return item.id === selectedFileId;
      });

      const fileBlob = await answer.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(fileBlob);
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Не выбран файл для скачивания");
    }
  };

  // удаляем сохраненный файл
  const deleteFile = async () => {
    if (selectedFileId) {
      if (confirm(`Подтверждаете удаление файла с id=${selectedFileId}?`)) {
        const body = {
          id: selectedFileId,
        };

        let answer = await isoFetch("/delete-file", {
          method: Methods.POST,
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (answer.status === 500 || answer.status === 510) {
          const error = await answer.text();
          alert(`При выполнении запроса "/delete-file" на сервере произошла ошибка: ${error}`);
          return;
        }

        answer = await answer.json();
        alert(`Файл с id=${answer.id} удален`);

        setSelectedFileComment("");
        setSelectedFileId(null);
        await getUploadedFiles();
      }
    } else {
      alert("Не выбран файл для удаления");
    }
  };

  const renderFilesList = () => {
    return (
      <Fragment>
        <div className={"Main__head"}>Загруженные файлы</div>
        <div className={"Main__files-list"}>
          {uploadedFiles.length ? (
            uploadedFiles.map((item, id) => (
              <div
                key={id}
                onClick={() => selectFileFromList(item)}
                className={`Main__files-item  ${item.id === selectedFileId ? "Main__files-item--checked" : ""}`}
                id={item.id === selectedFileId ? "checked-file" : item.id}
              >
                <span className={"Main__file-id"}>{item.id}</span>
                <span className={"Main__file-name"}>{item.originalName}</span>
              </div>
            ))
          ) : (
            <div className={"Main__empty-list"}>Нет загруженных файлов</div>
          )}
        </div>
      </Fragment>
    );
  };

  const renderButtons = () => {
    return (
      <div className={"Main__buttons"}>
        {selectedFileId && (
          <div>
            <button className={"Main__button Main__button--blue"} onClick={downloadFile}>
              Скачать выбранный файл
            </button>
          </div>
        )}
        {selectedFileId && (
          <div>
            <button className={"Main__button Main__button--red"} onClick={deleteFile}>
              Удалить выбранный файл
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderUploadForm = () => {
    return (
      <div className={"Main__file-upload-form"}>
        <div className={"Main__head"}>Тут можно загрузить файл</div>
        <div className={"Main__file-upload-form-content"}>
          <input type={"file"} id={"file-input"} onChange={addFile} />
          <textarea placeholder={"Введите комментарий"} value={commentForFile} onChange={changeCommentForFile} />
          <div>
            <button className={"Main__button Main__button--green"} onClick={uploadFile}>
              Загрузить файл
            </button>
          </div>
          <div className={"Main__progress-wrap"}>
            {!!uploadProgress && (
              <div
                className={"Main__progress-bar"}
                style={{
                  width: uploadProgress + "%",
                }}
              >
                {uploadProgress === 100 && "Файл загружен"}
              </div>
            )}
          </div>
          {!isFormValid && <div className={"Main__error"}>Заполните все поля</div>}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className={"title"}>FileStorage (Strelets Vadim)</div>
      <div className={"Main"}>
        <div className={"Main__left-column"}>
          {renderFilesList()}
          {renderButtons()}
        </div>
        <div className={"Main__right-column"}>
          <div className={"Main__info"}>
            <div className={"Main__chosen-file-parameters"}>
              <div className={"Main__head"}>Комментарий к загруженному файлу</div>
              <div className={"Main__chosen-file-parameters-content"}>
                <textarea value={selectedFileComment} readOnly />
              </div>
            </div>
            {renderUploadForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;

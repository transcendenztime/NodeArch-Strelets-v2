import React, {Fragment} from "react";
import {useEffect, useState} from "react";
import isoFetch from "isomorphic-fetch";

import {Methods} from "../constants/constants";

import "./Main.scss";

const Main = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]); // список сохраненных файлов

  const [fileForUpload, setFileForUpload] = useState(null);
  const [commentForFile, setCommentForFile] = useState("");
  const [isFormValid, setIsFormValid] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedFileComment, setSelectedFileComment] = useState("");

  // запрашиваем список загруженных на сервер файлов
  const getUploadedFiles = async () => {
    let answer = await isoFetch("/get-files", {
      method: Methods.GET,
    });
    answer = await answer.json();
    setUploadedFiles(answer);
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
    // clearResponseParams();
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

    let formData = new FormData();
    formData.append("fileForUpload", fileForUpload);
    formData.append("commentForFile", commentForFile);

    let answer = await isoFetch("/upload-file", {
      method: Methods.POST,
      body: formData,
    });

    if (answer.status === 500) {
      const error = await answer.text();
      alert(`При выполнении запроса "/upload-file" на сервере произошла ошибка: ${error}`);
      return;
    }

    answer = await answer.json();

    alert(`Файл сохранен под id=${answer.id}`);

    setUploadedFiles(answer.files);
    setSelectedFileId(answer.id);
    const selectedFile = answer.files.find(it => {
      return it.id === answer.id;
    });
    setSelectedFileComment(selectedFile.comment);

    clearUploadForm();

    scrollToSelectedFile();
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
            <div className={"Main__empty-list"}>Нет сохраненных файлов</div>
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
          {/* <textarea placeholder={'Комментарий к загружаемому файлу'} onChange={changeCommentForFile} />*/}

          <div>
            <button className={"Main__button Main__button--green"} onClick={uploadFile}>
              Загрузить файл
            </button>
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

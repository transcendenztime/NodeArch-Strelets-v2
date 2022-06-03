import React, {Fragment} from "react";

import "./Main.scss";

const Main = () => {

  const renderFilesList = () => {
    return (
      <Fragment>
        <div className={"Main__head"}>Сохраненные файлы:</div>
        <div className={"Main__files-list"}>
        </div>
      </Fragment>
    )
  };

  return(
    <div>
      <div className={"title"}>FileStorage (Strelets Vadim)</div>
      <div className={"Main"}>
        <div className={"Main__left-column"}>
          {renderFilesList()}
        </div>
        <div className={"Main__right-column"}>
          <div className={"Main__head"}>Тут можно загрузить файл</div>
          <div className={"Main__info"}>
            <div className={"Main__file-upload-form"}>
            </div>
            <div className={"Main__head"}>Комментарий к загруженному файлу</div>
            <div className={"Main__chosen-file-parameters"}>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

};

export default Main;
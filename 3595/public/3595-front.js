window.onload = () => {
  variantsService();
  statService();
};

variantsService = () => {
  fetch("/variants", {method: "GET"})
    .then(response => response.json())
    .then(data => {
      const variants = data
        .map(
          variant =>
            `<input type="button" id="${variant.id}_" value="${variant.value}" onclick=voteService("${variant.id}")><br />`,
        )
        .join(`<br />`);
      document.getElementById("variants").innerHTML = variants;
    })
    .catch(e => {
      console.error(e);
      alert(`Произошла ошибка при вызове сервиса /variants!`);
    });
};

updateStatistics = data => {
  let stats = data
    .map(stat => `<div><span>${stat.value}: </span><span style="font-weight: bold;">${stat.count}</span></div>`)
    .join(`<br>`);
  document.getElementById("statistics").innerHTML = stats;
};

statService = () => {
  fetch("/stat", {method: "GET"})
    .then(response => response.json())
    .then(data => {
      updateStatistics(data);
    })
    .catch(e => {
      console.error(e);
      alert(`Произошла ошибка при вызове сервиса /stat!`);
    });
};

voteService = id => {
  const body = JSON.stringify({id: id});
  fetch("/vote", {method: "POST", headers: {"Content-Type": "application/json"}, body: body})
    .then(response => {
      if (response.ok) {
        statService();
      } else if (response.status === 530) {
        alert(`Произошла ошибка ${response.status}, нет такого варианта для голосования!`);
      } else {
        alert(`Произошла ошибка ${response.status} при вызове сервиса /vote!`);
      }
    })
    .catch(e => {
      console.error(e);
      alert(`Произошла ошибка при вызове сервиса /vote!`);
    });
};

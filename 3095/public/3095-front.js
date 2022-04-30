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
    });
};

updateStatistics = data => {
  let stats = data
    .map(stat => `<div><span>${stat.value}: </span><span style="font-weight: bold;">${stat.count}</span></div>`)
    .join(`<br>`);
  document.getElementById("statistics").innerHTML = stats;
};

statService = () => {
  fetch("/stat", {method: "POST"})
    .then(response => response.json())
    .then(data => {
      updateStatistics(data);
    });
};

voteService = id => {
  const body = JSON.stringify({id: id});
  fetch("/vote", {method: "POST", headers: {"Content-Type": "application/json"}, body: body}).then(response => {
    if (response.ok) {
      statService();
    } else {
      alert(`Произола ошибка ${response.status}, нет такого варианта для голосования!`);
    }
  });
};

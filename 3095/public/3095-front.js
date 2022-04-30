window.onload = () => {
  getVariants();
};

getVariants = () => {
  fetch("/variants", {method: "GET"})
    .then(response => response.json())
    .then(data => {
      const variants = data.map( variant =>
        `<input type="button" id="${variant.id}_" value="${variant.value}"><br />`
      ).join(`<br />`);
      document.getElementById("variants").innerHTML = variants});
};
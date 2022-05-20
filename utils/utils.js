const regExpForUrl = /^((https?):\/\/)?([a-z0-9]{1})((\.[a-z0-9-])|([a-z0-9-]))*\.([a-z]{2,6})(\/?)$/;
const regExpForUrl2 = /^(https?|ftp):\/\/[\w.%@]+(:?[?].*)?/;

/* export const isURLValid = url => {
  return regExpForUrl2.test(url);
};*/

const isURLValid = url => {
  return regExpForUrl2.test(url);
};

module.exports={
  isURLValid
};
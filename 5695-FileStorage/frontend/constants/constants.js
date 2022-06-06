export const Methods = {
  GET: "GET",
  POST: "POST",
};

export const wsUrl = process.env.NODE_ENV === "development" ? "ws://localhost:5696" : "ws://128.199.37.165:5696";

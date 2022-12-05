export const Methods = {
  GET: "GET",
  POST: "POST",
};

export const wsUrl = process.env.NODE_ENV === "development" ? "ws://localhost:6596" : "ws://128.199.37.165:6596";
export const server = process.env.NODE_ENV === "development" ? "http://localhost:6595" : "";

import Config from "webpack-config";

export default new Config().extend("webpack.base.config.js").merge({
  output: {
    filename: "[name].bundle.[hash].js",
  },
  devtool: "cheap-module-source-map",
  devServer: {
    historyApiFallback: true,
    proxy: {
      "/get-databases": {
        target: "http://localhost:6195/",
        secure: false,
        changeOrigin: true,
      },
      "/execute-query": {
        target: "http://localhost:6195/",
        secure: false,
        changeOrigin: true,
      }
    }
  },
});

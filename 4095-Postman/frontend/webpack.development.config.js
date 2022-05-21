import Config from "webpack-config";

export default new Config().extend("webpack.base.config.js").merge({
  output: {
    filename: "[name].bundle.[hash].js",
  },
  devtool: "cheap-module-source-map",
  devServer: {
    historyApiFallback: true,
    proxy: {
      "/get-requests": {
        target: "http://localhost:4095/",
        secure: false,
        changeOrigin: true,
      },

      "/execute": {
        target: "http://localhost:4095/",
        secure: false,
        changeOrigin: true,
      },

      "/save-request": {
        target: "http://localhost:4095/",
        secure: false,
        changeOrigin: true,
      },

      "/delete-request": {
        target: "http://localhost:4095/",
        secure: false,
        changeOrigin: true,
      },
    },
  },
});

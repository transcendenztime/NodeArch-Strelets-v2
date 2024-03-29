import Config from "webpack-config";

export default new Config().extend("webpack.base.config.js").merge({
  output: {
    filename: "[name].bundle.[hash].js",
  },
  devtool: "cheap-module-source-map",
  devServer: {
    historyApiFallback: true,
    proxy: {
      "/get-files": {
        target: "http://localhost:6595/",
        secure: false,
        changeOrigin: true,
      },
      "/upload-file": {
        target: "http://localhost:6595/",
        secure: false,
        changeOrigin: true,
      },
      "/delete-file": {
        target: "http://localhost:6595/",
        secure: false,
        changeOrigin: true,
      },
    }
  },
});

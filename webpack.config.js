import path from 'path';

export default {
  entry: './src/ts/main_app.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve('static/ts'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',
  devtool: "source-map"
};

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
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.json',  // Correctly placed under 'options'
            },
          },
        ],
        exclude: [/node_modules/,/three_demo/, /scribble/],
        
      },
    ],
  },
  mode: 'development',
  devtool: "source-map"
};

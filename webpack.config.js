import path from 'path';

export default {
  entry: {
    main: './src/ts/main_app.ts',
    three_demo: './src/ts/three_demo.ts'
  },
  output: {
    filename: '[name].bundle.js',
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
        exclude: [/node_modules/, /scribble/],
        
      },
    ],
  },
  mode: 'development',
  devtool: "source-map"
}


;

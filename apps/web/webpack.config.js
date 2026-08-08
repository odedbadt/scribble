import path from 'path';

export default {
  entry: {
    main: './src/ts/main_app.ts',
    three_demo: './src/ts/three_demo.ts'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve('distro'),
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
        exclude: [/node_modules/],
        
      },
    ],
  },
  mode: 'development',
  devtool: "source-map"
}


;

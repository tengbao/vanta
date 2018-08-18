const webpack = require("webpack")
const webpackConfig = require("./webpack.config.js")
function timeStr(){
  return '[' + new Date().toLocaleTimeString() + ']';
}
const compiler = webpack(webpackConfig)

let fileList = [];
for (let i in webpackConfig.entry) fileList.push(i);
function compilerCallback (err, stats) {
  console.log(timeStr() + " Building " + fileList.join(', '))
  if (stats.compilation.errors && stats.compilation.errors.length) {
    console.log('COMPILATION ERROR')
    console.log(stats.compilation.errors)
  }
}

if (process.argv[2] == 'watch') {
  const watching = compiler.watch({
    // watchOptions
    aggregateTimeout: 300,
    poll: undefined
  }, compilerCallback);
  console.log(timeStr() + " Watching for changes... ");
  (function wait() {
    setTimeout(wait, 1000);
  })();
  // watching.close(() => {
  //   console.log("Watching Ended.");
  // });
} else {
  compiler.run(compilerCallback);
}
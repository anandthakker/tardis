
var fs = require('fs'),
    exec = require('child_process').exec,
    concat = require('concat-stream');
    
require('date-utils'); // don't love this approach, but whatever.


var legend = {
  ' ': 0,
  '$': 10,
  '#': 25,
  '@': 40,
}

function pad(n) {
  return (n > 0) ? new Array(n+1).join(' ') : '';
}    

process.stdin.pipe(concat(function(data) {
  var grid = data.toString('ascii')
  .split('\n')
  .map(function(s) {
    return (s + pad(50 - s.length)).slice(0,50)
    .split('')
    .map(function(c) { return legend[c] || 0; });
  });
  
  var dates = [];
  for(var i = 0; i < grid.length; i++) { // rows
    for(var j = 0; j < grid[i].length; j++) { // columns
      if(grid[i][j]) dates.push([plot(i,j), grid[i][j]]);
    }
  }
  
  var start = dates.reduce(function(prev, current) {
    return function() {
      commit(current[0], current[1], prev);
    }
  }, function() { console.log("Aaaaaaand the Tardis is back!"); })
  
  start();

}))






// return the date representing the given row,column in the Github
// contributions grid.
function plot(row, column) {
  return Date.today()
    .removeDays(Date.today().getDay() + 51 * 7)
    .addWeeks(column)
    .addDays(row);
}

function commit(date, n, cb) {
  if(!n || (n < 1)) return;
  // callback
  if(n > 1) {
    var done = cb;
    cb = function(err, stdout, stderr) {
      commit(date, n - 1, done);
    }
  }

  // dirty the repo
  fs.writeFileSync('date.txt', date.toString() + ' #' + n);
  
  // add and commit.
  var command = 'echo "Tardis commit ' + n + ' on ' + date.toUTCString() + '"';
  if(!(/test/.test(process.argv[2]))) {
    command += ' && git commit -am "'+date.toString()+'" --date="'+date.toUTCString()+'"';
  }
  
  exec(command,
  function(err, stdout, stderr) {
    if(err) {
      console.log("there was an error", err);
      throw err;
    }
    if(stdout) console.log(stdout);
    if(stderr) console.error(stderr);
    cb(err, stdout, stderr);
  });
}

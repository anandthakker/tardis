
var fs = require('fs'),
    exec = require('child_process').exec,
    concat = require('concat-stream');
    
require('date-utils'); // don't love this approach, but whatever.


var legend = {
  ' ': 0,
  '.': 1,
  '"': 2,
  '$': 10,
  '#': 25,
  '@': 40,
}

function pad(n) {
  return (n > 0) ? new Array(n+1).join(' ') : '';
}    

var width = 50;

process.stdin.pipe(concat(function(data) {
  if(/[^\s\n."$#@]/.test(data)) {
    throw new Error('Input must contain only the following characters: ', Object.keys(legend).toString());
  }
  var grid = data.toString('ascii')
  .split('\n')
  .map(function(s) {
    return (s + pad(width - s.length)).slice(0,width)
    .split('')
    .map(function(c) { return legend[c] || 0; });
  });
  
  var dates = [];
  for(var j = 0; j < width; j++) { // columns
    for(var i = 0; i < grid.length; i++) { // rows
      if(grid[i][j]) dates.push([plot(i,j), grid[i][j]]);
    }
  }
  
  var start = dates.reverse().reduce(function(prev, current) {
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
  var datestring = date.toUTCString();
  var command = [
    'GIT_AUTHOR_DATE="'+datestring+'"',
    'GIT_COMMITTER_DATE="'+datestring+'"',
    'git commit -am "[tardis] ',date.toString(),'"'
  ].join(' ');
  
  if(!(/test/.test(process.argv[2])))
    exec(command, next);
  else {
    //dry run
    console.log(command);
    next();
  }
  
  function next(err, stdout, stderr) {
    if(err) {
      console.log("there was an error", err);
      throw err;
    }
    if(stdout) console.log(stdout);
    if(stderr) console.error(stderr);
    cb(err, stdout, stderr);
  }
}

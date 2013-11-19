var util = require('util'),
	colors = require('colors'),
	spawn = require('child_process').spawn;

var levels = {
  "A": 'inverse', //assert ? I've never seen an assert log, so I'm not sure it's A. I'd have to write one to test...
  "D": 'cyan', //debug
  "E": 'red', //error
  "I": 'green', //info
  "V": 'bold', //verbose
  "W": 'yellow', //warning
  "F": ['white', 'bold','redBG'], //fatal
  "_": "grey" //for default...
};

colors.setTheme(levels);
var keys = Object.keys(levels);

//For testing
// keys.forEach(function(k){
//   console.log(("Level: "+k)[k]);
// });
// process.exit();

//these match the line to a class based on the "format"
//which is the -v flag on adb logcat
var charMatch = function(i){ return function(l){ return l[i]; }; };

var matchers = {
  "brief": charMatch(0),
  "process": charMatch(0),
  "tag": charMatch(0),
  "thread": charMatch(0),
  "raw": function(){ return "_"; },
  "time": charMatch(19), // "11-13 17:28:18.396 V/TAG( ...) ..."
  "threadtime": charMatch(31), // "11-13 17:29:48.398  3132  3150 V TAG: ... "
  "long": charMatch(33) // "[ 11-13 17:41:33.398  3132: 3150 V/"
}
var formats = Object.keys(matchers);

var logcat_args = process.argv.slice(2);
var logcat_in_args = false;
var FORMAT = "brief"; //the logcat default
var restart_on_exit = true;
var file_output_pos = -1;
var b_flag = false;
for(var i = 0; i < logcat_args.length; i++ ){
  var arg = logcat_args[i];

  //some sanity.
  if(arg == "-B"){
    console.error("the '-B' flag kinda defeats the purpose of this utility, no formatting will be applied".E);
    b_flag = true;
  }

  if(["-t", "-c", "-d"].indexOf(arg) > -1){
    restart_on_exit = false;
    continue;
  }

  if(arg === "logcat"){
    logcat_in_args = true;
    continue;
  }

  if(arg === "-f" && i +1 != logcat_args.length){
    //this means log to file on the device...

  }

  if(arg === "-v" && i +1 != logcat_args.length){
    FORMAT = logcat_args[i+1];
    continue;
  }else if(arg.indexOf("-v") === 0){
    FORMAT = arg.slice(2); //combined format
    continue;
  }
}

if(!logcat_in_args){
  logcat_args.unshift("logcat");
}

if(formats.indexOf(FORMAT) < 0){
  console.error("Sorry, I don't know how to process format '%s'".F, FORMAT);
  process.exit(1);
}

if(FORMAT == "raw"){
  console.log("logcat's raw output doesn't have Level identifiers, everything is going to be dull...".bold);
}

var colorLine = function(matcher){
  return function(line) {
    _color = matcher(line);
    if(keys.indexOf(_color) < 0){
      console.log(line._); //boo use default
    }else{
      console.log(line[_color]);
    }
  };
};

//cuts a stream into lines, if "count" > 1, we buffer count lines at a time.
function line_buffer(stream, fn, count){
  var buffer = "", double_buffer = [];
  var pos, tmpline;
  stream.setEncoding("utf8");
  stream.on("data", function(data){

    buffer += data;
    while( (pos = buffer.indexOf("\n")) > -1 ){
      if(pos === 0){
        buffer = buffer.slice(1);
      }else{
        tmpline = buffer.slice(0, pos).trim();
        if(tmpline.indexOf("--------- beginning of ") === 0){
          //if option T send lines beginning "--------" as one
          fn(tmpline);
        }else{
          if(count > 1){
            //"count" lines at a time.
            double_buffer.push(tmpline);
            if(double_buffer.length == count){
              fn(double_buffer.join("\n"));
              double_buffer.length = 0;
            }
          }else{
            fn(tmpline);
          }
        }
        buffer = buffer.slice(pos+1);
      }
    }
  });
}

function start(){
  console.log( (">>> Running: adb "+logcat_args.join(" ")+" <<<").green.bold )
  var logcat = spawn("adb", logcat_args);
  if(b_flag){
    process.stdout.pipe(logcat.stdout);
    process.stderr.pipe(logcat.stderr);
  }else{
    line_buffer(logcat.stdout, colorLine(matchers[FORMAT]), FORMAT === "long" ? 3 : 1);
    line_buffer(logcat.stderr, function(line){ console.log(line.E) });
  }
  if(restart_on_exit){
    logcat.on("exit", start);
  }
  logcat.on("error", function(err) {
    var msg;
    if(err.code === "ENOENT"){
      msg = ">>> Can not find the `adb` binary, Android SDK in your PATH? <<<";
    }else{
      msg = ">>> "+err.toString()+" <<<";
    }
    console.error(msg.F);
   });
}

//now start
start();

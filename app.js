
/**
 * Module dependencies.
 */

var express = require('express'),
              routes = require('./routes'),
              user = require('./routes/user'),
              http = require('http'),
              path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hjs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

server = http.createServer(app);
io = require("socket.io").listen(server);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


var connection_count = 0;
io.sockets.on('connection', function (socket) {
  // Manage connection join/count
  connection_count++;
  console.log('CONNECT. Connection count: ', connection_count);

  io.sockets.clients().forEach(function(s){
    s.get('mousedata', function(err, data) {
      // Bootstrap data with faux move events
      if(data) {
        socket.emit('mousemove', data);
      }
    });
  });


  // Get mouse data, emit to all with ID (including owner)
  socket.on('mousemove', function (data) {
    data.client_id = socket.id;
    socket.set('mousedata', data);
    io.sockets.emit('mousemove', data);
  });

  socket.on('disconnect', function() {
    connection_count--;
    console.log('DISCONNECT. Connection count: ', connection_count);

    part = {
      "client_id" : socket.id,
      "connection_count" : connection_count
    };
    socket.broadcast.emit('part', part);
  });
});

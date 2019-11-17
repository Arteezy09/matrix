let fs = require('fs');
let express = require('express');
let app = express();
let path = require('path');
let server = require('http').createServer(app);
let io = require('socket.io')(server);
let port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'client')));


io.on('connection', (socket) => {

  socket.on('read', (data) => {
    let file1 = fs.readFileSync(data.str1, 'utf8');
    if (data.action === 'C') {
      let file2 = fs.readFileSync(data.str2, 'utf8');
      socket.emit('action', { file1, file2, action: data.action });
    }
    else {
      socket.emit('action', { file1, action: data.action });
    }
  });


  socket.on('write', (data) => {
    fs.writeFileSync('text/output.txt', data.result);
  });


  socket.on('err', (data) => {
    console.log(data.err);
  });

});





const express = require("express");
const path = require("path");
const mysql = require('mysql');
const http = require('http');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});





const server = http.createServer(app);
const io = require("socket.io")(server);

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: "",
  database: 'file_sharing_app'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('เชื่อมต่อกับฐานข้อมูล MySQL สำเร็จ');
});

io.on("connection", function(socket){
  socket.on("sender-join",function(data){
    socket.join(data.uid);
  });
  socket.on("receiver-join",function(data){
    socket.join(data.uid);
    socket.in(data.sender_uid).emit("init", data.uid);

    // หาก client รับไฟล์เสร็จสิ้น, เคลียร์ข้อมูลของห้องนี้
    socket.on("fs-share-complete", function() {
        socket.leave(data.sender_uid);
    });
  });
  socket.on("file-meta",function(data){
    socket.in(data.uid).emit("fs-meta", data.metadata);
  });
  socket.on("fs-start",function(data){
    socket.in(data.uid).emit("fs-share", {});
  });
  socket.on("file-raw",function(data){
    socket.in(data.uid).emit("fs-share", data.buffer);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

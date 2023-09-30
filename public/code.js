//server
(function(){
    let receiverID;
    let roomID;
    const socket = io("http://localhost:3000");

    function generateID(){
        const roomID = `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
        console.log("Generated Room ID: ", roomID);
        return roomID;
    }

    document.querySelector("#sender-start-con-btn").addEventListener("click", function(){
        let joinID = generateID();
        document.querySelector("#join-id").innerHTML = `
            <b>Room ID</b>
            <span>${joinID}</span>
        `;
        socket.emit("sender-join", {
            uid: joinID
        });
    });

    socket.on("init", function(uid){
        receiverID = uid;
        document.querySelector(".join-screen").classList.remove("active");
        document.querySelector(".fs-screen").classList.add("active");
    });

    document.querySelector("#file-input").addEventListener("change", function(e){
        let files = e.target.files;
        if (!files || files.length === 0) {
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let reader = new FileReader();
            reader.onload = function(e){
                let buffer = new Uint8Array(reader.result);
                let el = document.createElement("div");
                el.classList.add("item");
                el.innerHTML = `
                    <div class="progress">0%</div>
                    <div class="filename">${file.name}</div>
                `;
                document.querySelector(".files-list").appendChild(el);
                shareFile({
                    filename: file.name,
                    total_buffer_size: buffer.length,
                    buffer_size: 1024
                }, buffer, el.querySelector(".progress"));
            };
            reader.readAsArrayBuffer(file);
        }
    });

    function shareFile(metadata, buffer, progress_node) {
        socket.emit("file-meta", {
            uid: receiverID,
            metadata: metadata
        });

        let chunkSize = metadata.buffer_size;
        let offset = 0;

        function sendChunk() {
            let chunk = buffer.slice(offset, offset + chunkSize);
            offset += chunkSize;
            progress_node.innerText = Math.min(100, Math.trunc((offset / metadata.total_buffer_size) * 100)) + "%";

            if (chunk.length !== 0) {
                socket.emit("file-raw", {
                    uid: receiverID,
                    buffer: chunk
                });
                requestAnimationFrame(sendChunk);
            } else {
                console.log("Sent file successfully");
            }
        }

        sendChunk();
    }
})();
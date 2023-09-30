//client
(function(){
    const socket = io("http://localhost:3000"); //เปลี่ยน http://localhost เป็น IP server eg. 192.168.2.1:3000
    let sender_uid;

    function generateID(){
        return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
    }

    document.querySelector("#receiver-start-con-btn").addEventListener("click",function(){
        sender_uid = document.querySelector("#join-id").value;
        if(sender_uid.length == 0){
            return;
        }
        let joinID = generateID();
        socket.emit("receiver-join", {
            sender_uid:sender_uid,
            uid:joinID
        });
        document.querySelector(".join-screen").classList.remove("active");
        document.querySelector(".fs-screen").classList.add("active");
    });

    socket.on("fs-meta",function(metadata){
        let el = document.createElement("div");
        el.classList.add("item");
        el.innerHTML = `
            <div class="progress">0%</div>
            <div class="filename">${metadata.filename}</div>
            <button class="download-btn">Download</button>
        `;
        document.querySelector(".files-list").appendChild(el);

        let fileShare = {
            metadata: metadata,
            buffer: [],
            transmitted: 0
        };

        let progressNode = el.querySelector(".progress");
        let downloadButton = el.querySelector(".download-btn");

        downloadButton.addEventListener("click", function() {
            if (fileShare.transmitted === fileShare.metadata.total_buffer_size) {
                const fileBlob = new Blob(fileShare.buffer);
                const downloadLink = document.createElement("a");
                downloadLink.href = URL.createObjectURL(fileBlob);
                downloadLink.download = fileShare.metadata.filename;
    
                document.body.appendChild(downloadLink);
                downloadLink.click();
    
                document.body.removeChild(downloadLink);
            }
        });

        socket.emit("fs-start",{
            uid: sender_uid
        });

        socket.on("fs-share", function(buffer) {
            fileShare.buffer.push(buffer);
            fileShare.transmitted += buffer.byteLength;
			const progressPercentage = Math.min(100, Math.trunc((fileShare.transmitted / fileShare.metadata.total_buffer_size) * 100));
            progressNode.innerText = `${progressPercentage}%`;

            if (fileShare.transmitted === fileShare.metadata.total_buffer_size) {
                downloadButton.disabled = false;
            }
        });
    });
})();

var CT = {
    init: function() {
        CT.socketInit();
        CT.uiInit();
    },
    socketInit: function() {
        CT.socket = io.connect();
        CT.socket.on('connected', function() {
            console.log("Connected to websockets");
        });
        CT.socket.on('task', function(data) {
            if (CT.worker !== undefined) {
                CT.worker.postMessage({"task": data});
            }
        });
    },
    uiInit: function() {
        $("div.participate").hide();
        $("a.cancel").click(function() {
            CT.stop();
            return false;
        });
        $("div.research a").click(function() {
            CT.stop();

            CT.researchId = $(this).parents("div.research").attr("id");
            //$("div.participate." + CT.researchId).show();

            // TODO check this

            CT.worker = new Worker("/researchjs/" + CT.researchId + "/client.js");
            CT.worker.addEventListener('message', function(event) {
                if ("progress" in event.data) {
                    $("div.participate." + CT.researchId + " .progress").text(event.data.progress);
                }
                if ("result" in event.data) {
                    $("div.participate." + CT.researchId + " .result").text(event.data.result);
                    //TODO fix this
                    event.data._id = "517cc9604a9fa8e624000001"
                    CT.socket.emit("result", event.data);
                    $("div.participate." + CT.researchId + " .result").text(event.data.result);
                }
            });

            CT.socket.emit('research', "517cc9604a9fa8e624000001");

            return false;
        });
    },
    stop: function() {
        $("div.participate").hide();
        if (CT.worker !== undefined) {
            CT.worker.postMessage({"cancel": true});
            delete CT.worker;
        }
    }
}
$(document).ready(function() {
    CT.init();
});





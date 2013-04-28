var CT = {
    init: function() {
        CT.socketInit();
        CT.uiInit();
    },
    socketInit: function() {
        CT.socket = io.connect('https://localhost:1234/');
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
        $("a.contribute").click(function() {
            CT.stop();

            var researchId = $(this).parents("div.research").attr("id");
            $("div.participate." + researchId).show();
            
            worker = new Worker("/researchjs/" + researchId + "/client.js");
            worker.addEventListener('message', function(event) {
                if ("progress" in event.data) {
                    $("div.participate." + researchId + " .progress").text(event.data.progress);
                }
                if ("results" in event.data) {
                    $("div.participate." + researchId + " .results").text(event.data.results);
                }
            });

            CT.socket.emit('research', researchId);

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





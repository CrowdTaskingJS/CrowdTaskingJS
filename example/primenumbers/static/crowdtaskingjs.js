var CT = {
    progresses: 0,
    segmentedProgresses: 0,
    results: 0,
    init: function() {
        CT.socketInit();
        CT.uiInit();
    },
    socketInit: function() {
        CT.socket = io.connect();
        CT.socket.on('connected', function() {
            console.log("Connected to websockets");
        });
        CT.socket.on('tested', function(data){
          console.log("tested", data);
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

            var researchDom = $(this).parents("div.research");
            CT.researchPath = researchDom.attr("id");
            CT.researchId = researchDom.data("id");
            //$("div.participate." + CT.researchPath).show();

            // TODO check this

            CT.worker = new Worker("/researchjs/" + CT.researchPath + "/client.js");
            CT.worker.addEventListener('message', function(event) {
                if ("progress" in event.data) {
                    $("#" + CT.researchPath + " .progress").text(event.data.progress);
                  $("#" + CT.researchPath + " .progresses").text((++CT.progresses).toString());
                }
                if ("result" in event.data) {
                    event.data._id = CT.researchId;
                    CT.results++;
                    $("#" + CT.researchPath + " .results").text((++CT.results).toString());

                    CT.socket.emit("result", event.data);
                    $("#" + CT.researchPath + " .result").text(event.data.result.nextPrime);
                }
            });

            CT.socket.emit('research', CT.researchId);

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
    setInterval(function(){
      $("#" + CT.researchPath + " .persecond").text(CT.progresses - CT.segmentedProgresses);
      CT.segmentedProgresses = CT.progresses;
    }, 1000)
});





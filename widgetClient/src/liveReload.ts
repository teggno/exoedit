///<reference path="../typings/fetch.d.ts" />
(function(){
    doLongPoll();

    function doLongPoll() {
        fetch("liveReload").then(response => {
            if (response.status === 200) {
                response.text().then(text => {
                    if (text !== "ServerStopped") window.location.reload();
                });
            }
            else {
                doLongPoll();
            }
        });
    }
})();

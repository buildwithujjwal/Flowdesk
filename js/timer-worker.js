let remainingSeconds = 0;
let intervalId = null;

onmessage = function (event) {
    if (event.data.type === "start") {
        remainingSeconds = event.data.seconds;

        intervalId = setInterval(() => {
            remainingSeconds--;
            this.postMessage({ type: "tick", remaining:
            remainingSeconds });

            if (remainingSeconds <= 0) {
                this.clearInterval(intervalId);
                this.postMessage({type: "done"});
            }
        }, 1000);
    }


    if (event.data.type === "stop") {
        clearInterval(intervalId);
    }
}
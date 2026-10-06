let remainingSeconds = 0;
let intervalId = null;

onmessage = function (event) {
    if (event.data.type === "start") {
        remainingSeconds = event.data.seconds;

        clearInterval(intervalId); // stop the old interval first, otherwise two intervals will count down together

        intervalId = setInterval(() => {
            remainingSeconds--;
            postMessage({ type: "tick", remaining: remainingSeconds });

            if (remainingSeconds <= 0) {
                clearInterval(intervalId);
                postMessage({type: "done"});
            }
        }, 1000);
    }


    if (event.data.type === "stop") {
        clearInterval(intervalId);
    }
}
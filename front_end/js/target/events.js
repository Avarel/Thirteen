"use strict";
var ThirteenAPI;
(function (ThirteenAPI) {
    class Client {
        constructor(address, handler) {
            this.handler = handler;
            console.log("Connecting to server...");
            this.ws = new WebSocket(address, "thirteen-game");
            this.ws.onopen = event => { if (this.handler.onConnect)
                this.handler.onConnect.call(this, event); };
            this.ws.onclose = event => { if (this.handler.onDisconnect)
                this.handler.onDisconnect.call(this, event); };
            this.ws.onmessage = event => this.onReceive(event);
        }
        send(data) {
            this.ws.send(JSON.stringify(data));
        }
        disconnect() {
            this.ws.close(1000);
        }
        onReceive(event) {
            let handler = this.handler;
            if (handler == undefined) {
                return;
            }
            let payload = JSON.parse(event.data);
            switch (payload.type) {
                case "IDENTIFY":
                    this.id = payload.id;
                    if (handler.onIdentify)
                        handler.onIdentify.call(this, payload);
                    break;
                case "QUEUE_UPDATE":
                    if (handler.onQueueUpdate)
                        handler.onQueueUpdate.call(this, payload);
                    break;
                case "READY":
                    if (handler.onReady)
                        handler.onReady.call(this, payload);
                    break;
                case "END":
                    if (handler.onEnd)
                        handler.onEnd.call(this, payload);
                    break;
                case "PLAY":
                    if (handler.onPlay)
                        handler.onPlay.call(this, payload);
                    break;
                case "TURN_CHANGE":
                    if (handler.onTurnChange)
                        handler.onTurnChange.call(this, payload);
                    break;
                case "SUCCESS":
                    if (handler.onSuccess)
                        handler.onSuccess.call(this, payload);
                    break;
                case "ERROR":
                    if (handler.onError)
                        handler.onError.call(this, payload);
                    break;
                case "STATUS":
                    if (handler.onStatus)
                        handler.onStatus.call(this, payload);
                    break;
            }
        }
    }
    ThirteenAPI.Client = Client;
})(ThirteenAPI || (ThirteenAPI = {}));

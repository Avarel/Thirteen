"use strict";
// //Tell the library which element to use for the table
// //Create a new deck of cards
// let deck = new Deck();
// //cards.all contains all cards, put them all in the deck
// deck.addCards(...cards.all);
// //No animation here, just get the deck onto the table.
// deck.render({ immediate: true });
// let displayOpts = [
//     { faceUp: true, position: new Anchor({ bottom: 25 }), angle: 0 },
//     { faceUp: false, position: new Anchor({ top: 0 }), angle: 180 },
//     { faceUp: false, position: new Anchor({ left: 0 }), angle: 90 },
//     { faceUp: false, position: new Anchor({ right: 0 }), angle: 270 }
// ];
// let handQueue = new Hand({ faceUp: true, position: new Anchor({ bottom: 125 }), angle: 0 });
// let playerCount = 4;
// let hands = displayOpts.slice(0, playerCount).map(opt => new Hand(opt));
// //Let's deal when the Deal button is pressed:
// $('#deal').click(() => {
//     //Deck has a built in method to deal to hands.
//     if ($('#deal').hasClass("disabled")) {
//         return;
//     }
//     $('#deal').addClass("disabled");
//     $('#play').show();
//     $('#pass').show();
//     deck.deal(12, hands, 50);
// });
// //Finally, when you click a card in your hand, if it's
// //the same suit or rank as the top card of the discard pile
// //then it's added to it
// hands[0].click(card => {
//     handQueue.addCards(card);
//     renderAll();
// });
// handQueue.click(card => {
//     hands[0].addCards(card);
//     renderAll();
// });
// function renderAll(options?: cards.RenderOptions) {
//     deck.render();
//     hands.forEach(x => x.render(options));
//     handQueue.render(options);
// }
// $(window).resize(debounce(() => renderAll({ immediate: true }), 500));
cards.init({ table: '.game' });
var Thirteen;
(function (Thirteen) {
    let Client;
    (function (Client) {
        let connection;
        function connect() {
            if (connection) {
                write_to_log("Already connected to server!");
                return;
            }
            write_to_log("Connecting to server...");
            connection = new WebSocket("ws://127.0.0.1:2794", "thirteen-game");
            connection.onmessage = event => process(event);
            connection.onclose = disconnect;
        }
        Client.connect = connect;
        function disconnect() {
            if (!connection) {
                write_to_log("You're not connected to the server!");
                return;
            }
            write_to_log("Disconnecting from server.");
            Game.status("Press Start Game to connect to the server!");
            connection.onclose = () => { };
            connection.close(1000, "im done");
            connection = undefined;
        }
        Client.disconnect = disconnect;
        function send(data) {
            if (!connection) {
                write_to_log("Tried to send something but not connected.");
                return;
            }
            connection.send(JSON.stringify(data));
        }
        Client.send = send;
        function write_to_log(msg) {
            let received = $("#received");
            let br = document.createElement("br");
            let text = document.createTextNode(msg);
            received.append(br, text);
        }
        Client.write_to_log = write_to_log;
        function process(event) {
            write_to_log(event.data);
            let payload = JSON.parse(event.data);
            switch (Object.keys(payload)[0]) {
                case "QueueUpdate":
                    Game.status(`${payload.QueueUpdate.size}/${payload.QueueUpdate.goal} connected players!`);
                    break;
                case "Start":
                    Game.start(payload.Start.cards.map(ids => utils.cardsFromID(...ids)));
                    break;
                case "Status":
                    Game.status(payload.Status.status);
                    break;
                case "Error":
                    Game.status(payload.Error.status);
                    break;
            }
        }
    })(Client = Thirteen.Client || (Thirteen.Client = {}));
    let Game;
    (function (Game) {
        var Deck = cards.Deck;
        var Hand = cards.Hand;
        var Anchor = cards.Anchor;
        let displayOpts = [
            { faceUp: true, position: new Anchor({ bottom: 25 }), angle: 0 },
            { faceUp: false, position: new Anchor({ top: 0 }), angle: 180 },
            { faceUp: false, position: new Anchor({ left: 0 }), angle: 90 },
            { faceUp: false, position: new Anchor({ right: 0 }), angle: 270 }
        ];
        Game.centerDeck = new Deck();
        Game.playDeck = new Deck();
        function reset() {
            $('#play').hide();
            $('#pass').hide();
            Game.playerDecks = [];
            Game.centerDeck.addCards(...cards.all);
            status("Press Start Game to connect to the server!");
            Game.centerDeck.render({ immediate: true });
        }
        Game.reset = reset;
        // Thirteen.Game.start([utils.cardRange(0, 13), utils.cardRange(13, 26), utils.cardRange(26, 39), utils.cardRange(39, 52)])
        function start(cards) {
            $('#play').show();
            $('#pass').show();
            Game.playerDecks = displayOpts.slice(0, cards.length).map(opt => new Hand(opt));
            for (let [i, d] of cards.entries()) {
                Game.playerDecks[i].addCards(...d);
                Game.playerDecks[i].render();
            }
        }
        Game.start = start;
        function play(cards) {
            Game.playDeck.addCards(...cards);
            Game.playDeck.render();
        }
        Game.play = play;
        // TODO imlement duration
        function status(msg, duration) {
            $(".status .text").text(msg);
        }
        Game.status = status;
    })(Game = Thirteen.Game || (Thirteen.Game = {}));
})(Thirteen || (Thirteen = {}));
Thirteen.Game.reset();
$("#connect").click(Thirteen.Client.connect);
$("#disconnect").click(Thirteen.Client.disconnect);
$("#empty").click(() => {
    $("#received").empty();
});
$("#submit").click(() => {
    let input = $("#message-box").val();
    Thirteen.Client.send(input);
});

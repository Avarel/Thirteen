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

namespace Thirteen {
    export namespace Client {
        let connection: WebSocket | undefined;

        export function connect() {
            if (connection) {
                write_to_log("Already connected to server!");
                return;
            }
        
            write_to_log("Connecting to server...");
            connection = new WebSocket("ws://127.0.0.1:2794", "thirteen-game");
            connection.onmessage = event => process(event);
            connection.onclose = disconnect;
        }

        export function disconnect() {
            if (!connection) {
                write_to_log("You're not connected to the server!");
                return;
            }
        
            write_to_log("Disconnecting from server.");
            Game.status("Press Start Game to connect to the server!");
            connection.onclose = () => {};
            connection.close(1000, "im done");
            connection = undefined;
        }

        export function send(data: any) {
            if (!connection) {
                write_to_log("Tried to send something but not connected.");
                return;
            }
            connection.send(JSON.stringify(data));
        }

        export function write_to_log(msg: string) {
            let received = $("#received");
            let br = document.createElement("br");
            let text = document.createTextNode(msg);
            received.append(br, text);
        }

        function process(event: MessageEvent) {
            write_to_log(event.data);
        
            let payload = JSON.parse(event.data);
        
            switch (Object.keys(payload)[0]) {
                case "QueueUpdate":
                    Game.status(`${payload.QueueUpdate.size}/${payload.QueueUpdate.goal} connected players!`);
                    break;
                case "Start":
                    Game.start((payload.Start.cards as number[][]).map(ids => utils.cardsFromID(...ids)));
                    break;
                case "Status":
                    Game.status(payload.Status.status);
                    break;
                case "Error":
                    Game.status(payload.Error.status);
                    break;
            }
        }
    }

    export namespace Game {
        import Card = cards.Card;
        import Deck = cards.Deck;
        import Hand = cards.Hand;
        import Anchor = cards.Anchor;

        let displayOpts: cards.ContainerOptions[] = [
            { faceUp: true, position: new Anchor({ bottom: 25 }), angle: 0 },
            { faceUp: false, position: new Anchor({ top: 0 }), angle: 180 },
            { faceUp: false, position: new Anchor({ left: 0 }), angle: 90 },
            { faceUp: false, position: new Anchor({ right: 0 }), angle: 270 }
        ];

        export let centerDeck = new Deck();
        export let playDeck = new Deck();
        export let playerDecks: Hand[];

        export function reset() {
            $('#play').hide();
            $('#pass').hide();

            playerDecks = [];

            centerDeck.addCards(...cards.all);
            status("Press Start Game to connect to the server!");
            centerDeck.render({ immediate: true });
        }

        // Thirteen.Game.start([utils.cardRange(0, 13), utils.cardRange(13, 26), utils.cardRange(26, 39), utils.cardRange(39, 52)])

        export function start(cards: Card[][]) {
            $('#play').show();
            $('#pass').show();

            playerDecks = displayOpts.slice(0, cards.length).map(opt => new Hand(opt));
            for (let [i, d] of cards.entries()) {
                playerDecks[i].addCards(...d);
                playerDecks[i].render();
            }
        }

        export function play(cards: Card[]) {
            playDeck.addCards(...cards);
            playDeck.render();
        }

        // TODO imlement duration
        export function status(msg: string, duration?: number) {
            $(".status .text").text(msg);
        }
    }
}

Thirteen.Game.reset();





$("#connect").click(Thirteen.Client.connect);

$("#disconnect").click(Thirteen.Client.disconnect);

$("#empty").click(() => {
    $("#received").empty();
});

$("#submit").click(() => {
    let input = $("#message-box").val()
    Thirteen.Client.send(input);
});
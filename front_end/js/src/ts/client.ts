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
                log("Already connected to server!");
                return;
            }

            log("Connecting to server...");
            connection = new WebSocket("ws://127.0.0.1:2794", "thirteen-game");
            connection.onmessage = event => process(event);
            connection.onclose = disconnect;
        }

        export function disconnect() {
            if (!connection) {
                log("You're not connected to the server!");
                return;
            }

            log("Disconnecting from server.");
            Game.status("Press Start Game to connect to the server!");
            Game.reset();
            connection.onclose = () => { };
            connection.close(1000, "im done");
            connection = undefined;
        }

        export function send(data: any) {
            if (!connection) {
                log("Tried to send something but not connected.");
                return;
            }
            connection.send(JSON.stringify(data));
        }

        export function log(msg: string) {
            console.log(msg);
            // let received = $("#received");

            // let text = document.createTextNode(msg);
            // let br = document.createElement("br");
            // received.append(text, br);

            // received.scrollTop(received.prop("scrollHeight"));
        }

        function process(event: MessageEvent) {
            let payload = JSON.parse(event.data);

            switch (Object.keys(payload)[0]) {
                case "QueueUpdate":
                    Game.status(`${payload.QueueUpdate.size}/${payload.QueueUpdate.goal} connected players!`);
                    break;
                case "Start":
                    Game.start((payload.Start.cards as number[][]).map(ids => utils.cardsFromID(...ids)));
                    Game.status("The game has started! Wait for your turn!");
                    break;
                case "Status":
                    Game.status(payload.Status.message);
                    break;
                case "Error":
                    Game.status(payload.Error.reason);
                    break;
                case "Discard":
                    Game.discard(utils.cardsFromID(...payload.Discard.ids));
                    break;
                case "YourTurn": {
                    let event: any = payload.YourTurn;
                    Game.startTurn(event.first_turn, event.must_play);
                    Game.status("It is your turn!");
                    break;
                }
                case "PlaySuccess":
                    Game.endTurn();
                    Game.status("Great play!");
                    break;
                case "PassSuccess":
                    Game.endTurn();
                    Game.status("You passed for this turn!");
                    break;
                case "GameEnd":
                    if (payload.GameEnd.victory) {
                        Game.status("You won!");
                    } else {
                        Game.status("You lost!");
                    }
                    setTimeout(Thirteen.Client.disconnect, 5000);
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

        export let dealDeck = new Deck();
        export let discardHand = new Hand({ faceUp: true });
        export let playerHands: Hand[];

        export let myQueue = new Hand({ faceUp: true, position: new Anchor({ bottom: 125 }), angle: 0 });
        export let myHand: Hand;

        export function reset() {
            $('#play').hide();
            $('#pass').hide();

            // Client.disconnect();

            playerHands = [];

            dealDeck.addCards(...cards.all);

            status("Press Start Game to connect to the server!");

            renderAll({ speed: 2000, callback: () => dealDeck.show() });
        }

        export function start(cards: Card[][]) {
            playerHands = displayOpts.slice(0, cards.length).map(opt => new Hand(opt));
            for (let [i, d] of cards.entries()) {
                playerHands[i].addCards(...d);
                playerHands[i].render({ speed: 2000 });
            }
            myHand = playerHands[0];

            dealDeck.hide();

            $('#pass').click(() => {
                Client.send({ Pass: {} });
            });

            $('#play').click(() => {
                Client.send({ Play: { ids: myQueue.array.map(c => c.id) } });
            });

            playerHands[0].click(card => {
                myQueue.addCards(card);
                myQueue.render();
                myHand.render();
            });

            myQueue.click(card => {
                myHand.addCards(card);
                myHand.render();
                myQueue.render();
            });
        }

        export function discard(cards: Card[]) {
            dealDeck.addCards(...discardHand.array);
            discardHand.addCards(...cards);
            renderAll();
        }

        export function startTurn(firstTurn: boolean, mustPlay: boolean) {
            $('#play').show();

            if (!mustPlay) {
                $('#pass').show();
            }
        }

        export function endTurn() {
            $('#play').hide();
            $('#pass').hide();
        }

        // TODO imlement duration
        export function status(msg: string, duration?: number) {
            $(".status .text").text(msg);
        }

        function renderAll(options?: cards.RenderOptions) {
            dealDeck.render(options);
            discardHand.render(options);
            playerHands.forEach(x => x.render(options));
            myQueue.render(options);
        }

        $(window).resize(utils.debounce(() => renderAll({ immediate: true }), 500));
    }
}

Thirteen.Game.reset();

$("#connect").click(() => {
    if ($("#connect").text() == "Connect") {
        Thirteen.Client.connect();
        $("#connect").text("Disconnect");
    } else {
        Thirteen.Client.disconnect();
        $("#connect").text("Connect");
    }
})


// $("#connect").click(Thirteen.Client.connect);

// $("#disconnect").click(Thirteen.Client.disconnect);

// $("#empty").click(() => {
//     $("#received").empty();
// });

// $("#submit").click(() => {
//     let input = $("#message-box").val()
//     Thirteen.Client.send(input);
// });
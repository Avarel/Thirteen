//Tell the library which element to use for the table
cards.init({ table: 'game.container' });

//Create a new deck of cards
let deck = new cards.Deck();

//cards.all contains all cards, put them all in the deck
deck.addCards(cards.all);
//No animation here, just get the deck onto the table.
deck.render({ immediate: true });

let displayOpts = [
    { faceUp: true,  position: new cards.Position({bottom: 25}), angle: 0 }, 
    { faceUp: false, position: new cards.Position({top: 0}), angle: 180 },
    { faceUp: false, position: new cards.Position({left: 0}), angle: 90 },
    { faceUp: false, position: new cards.Position({right: 0}), angle: 270 }
];

let handQueue = new cards.Hand({ faceUp: true, position: new cards.Position({bottom: 125}), angle: 0 });

let playerCount = 4;

let hands = displayOpts.slice(0, playerCount).map(opt => new cards.Hand(opt));

//Let's deal when the Deal button is pressed:
$('#deal').click(function () {
    //Deck has a built in method to deal to hands.
    $('#deal').hide();
    deck.deal(12, hands, 50);
});

//Finally, when you click a card in your hand, if it's
//the same suit or rank as the top card of the discard pile
//then it's added to it
hands[0].click(card => {
    handQueue.addCard(card);
    renderAll();
});

handQueue.click(card => {
    hands[0].addCard(card);
    renderAll();
});



function renderAll(options) {
    deck.render();
    hands.forEach(x => x.render(options));
    handQueue.render(options);
}

$(window).resize($.debounce(() => renderAll({ immediate: true }), 500));



let socket = undefined;

function connect() {
    if (socket) {
        write_to_log("Already connected to server!");
        return;
    }

    write_to_log("Connecting to server...");
    socket = new WebSocket("ws://127.0.0.1:2794", "thirteen-game");
    socket.onmessage = event => write_to_log(event.data);
    socket.onclose = disconnect;
}

function disconnect() {
    if (!socket) {
        write_to_log("You're not connected to the server!");
        return;
    }

    write_to_log("Disconnecting from server.");
    socket.onclose = undefined;
    socket.close();
    socket = undefined;
}

function write_to_log(msg) {
    let received = $("#received");
    let br = document.createElement("br");
    let text = document.createTextNode(msg);
    received.append(br, text);
}

$("#connect").click(connect);

$("#disconnect").click(disconnect);

$("#empty").click(() => {
    $("#received").empty();
});

$("#submit").click(() => {
    if (!socket) {
        write_to_log("You can't send anything, you're not connected!");
        return;
    }
    let input = $("#message-box").val()
    socket.send(input);
})
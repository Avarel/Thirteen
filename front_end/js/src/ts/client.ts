//Tell the library which element to use for the table
cards.init({ table: 'game' });

//Create a new deck of cards
let deck = new cards.Deck();

//cards.all contains all cards, put them all in the deck
deck.addCards(...cards.all);
//No animation here, just get the deck onto the table.
deck.render({ immediate: true });

let displayOpts = [
    { faceUp: true, position: new cards.Position({ bottom: 25 }), angle: 0 },
    { faceUp: false, position: new cards.Position({ top: 0 }), angle: 180 },
    { faceUp: false, position: new cards.Position({ left: 0 }), angle: 90 },
    { faceUp: false, position: new cards.Position({ right: 0 }), angle: 270 }
];

let handQueue = new cards.Hand({ faceUp: true, position: new cards.Position({ bottom: 125 }), angle: 0 });

let playerCount = 4;

let hands = displayOpts.slice(0, playerCount).map(opt => new cards.Hand(opt));

//Let's deal when the Deal button is pressed:
$('#deal').click(function () {
    //Deck has a built in method to deal to hands.
    if ($('#deal').hasClass("disabled")) {
        return;
    }
    $('#deal').addClass("disabled");
    $('#play').show();
    $('#pass').show();
    deck.deal(12, hands, 50);
});

//Finally, when you click a card in your hand, if it's
//the same suit or rank as the top card of the discard pile
//then it's added to it
hands[0].click(card => {
    handQueue.addCards(card);
    renderAll();
});

handQueue.click(card => {
    hands[0].addCards(card);
    renderAll();
});

function renderAll(options?) {
    deck.render();
    hands.forEach(x => x.render(options));
    handQueue.render(options);
}

$(window).resize(debounce(() => renderAll({ immediate: true }), 500));








let socket = undefined;

function write_to_log(msg) {
    let received = $("#received");
    let br = document.createElement("br");
    let text = document.createTextNode(msg);
    received.append(br, text);
}

function status_text(msg: string) {
    $(".status .text").text(msg);
}


function disconnect() {
    if (!socket) {
        write_to_log("You're not connected to the server!");
        return;
    }

    write_to_log("Disconnecting from server.");
    status_text("Press Start Game to connect to the server!");
    socket.onclose = undefined;
    socket.close();
    socket = undefined;
}

function process(event) {
    write_to_log(event.data);

    let payload = JSON.parse(event.data);

    switch (Object.keys(payload)[0]) {
        case "QueueUpdate":
            status_text(`${payload.QueueUpdate.size}/4 connected players!`);
            break;
    }
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
});

$("#play").click(() => {

});

function connect() {
    if (socket) {
        write_to_log("Already connected to server!");
        return;
    }

    write_to_log("Connecting to server...");
    socket = new WebSocket("ws://127.0.0.1:2794", "thirteen-game");
    socket.onmessage = event => process(event);
    socket.onclose = disconnect;
};
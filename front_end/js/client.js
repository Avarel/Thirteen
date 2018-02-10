//Tell the library which element to use for the table
cards.init({ table: '#game-container' });

//Create a new deck of cards
let deck = new cards.Deck();
//By default it's in the middle of the container, put it slightly to the side
deck.x -= 50;

//cards.all contains all cards, put them all in the deck
deck.addCards(cards.all);
//No animation here, just get the deck onto the table.
deck.render({ immediate: true });

let displayOpts = [
    { faceUp: true, position: new cards.Position({bottom: 50}), angle: 0 }, 
    { faceUp: false, position: new cards.Position({top: 50}), angle: 180 },
    { faceUp: false, position: new cards.Position({left: 50}), angle: 90 },
    { faceUp: false, position: new cards.Position({right: 50}), angle: 270 }
];

let playerCount = 4;

let hands = displayOpts.slice(0, playerCount).map(opt => new cards.Hand(opt));

let handQueue = new cards.Hand({ faceUp: true, position: new cards.Position({bottom: 150}), angle: 0 });

//Lets add a discard pile
let discardPile = new cards.Pile({ faceUp: true });
discardPile.x += 50;

//Let's deal when the Deal button is pressed:
$('#deal').click(function () {
    //Deck has a built in method to deal to hands.
    $('#deal').hide();
    deck.deal(10, hands, 50, function () {
        //This is a callback function, called when the dealing
        //is done.
        discardPile.addCard(deck.topCard());
        discardPile.render();
    });
});


//When you click on the top card of a deck, a card is added
//to your hand
deck.click(card => {
    if (card === deck.topCard()) {
        hands[0].addCard(deck.topCard());
        hands[0].render();
    }
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



function renderAll() {
    deck.render();
    hands.forEach(x => x.render());
    handQueue.render();
}

$(window).resize($.debounce(renderAll, 500));



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
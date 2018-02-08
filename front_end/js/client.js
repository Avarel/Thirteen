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

//Now lets create a couple of hands, one face down, one face up.
let upperhand = new cards.Hand({ faceUp: false, y: 60 });
let lowerhand = new cards.Hand({ faceUp: true, y: 500, angle: 90 });

//Lets add a discard pile
let discardPile = new cards.Deck({ faceUp: true });
discardPile.x += 50;


//Let's deal when the Deal button is pressed:
$('#deal').click(function () {
    //Deck has a built in method to deal to hands.
    $('#deal').hide();
    deck.deal(5, [upperhand, lowerhand], 50, function () {
        //This is a callback function, called when the dealing
        //is done.
        discardPile.addCard(deck.topCard());
        discardPile.render();
    });
});


//When you click on the top card of a deck, a card is added
//to your hand
deck.click(function (card) {
    if (card === deck.topCard()) {
        lowerhand.addCard(deck.topCard());
        lowerhand.render();
    }
});

//Finally, when you click a card in your hand, if it's
//the same suit or rank as the top card of the discard pile
//then it's added to it
lowerhand.click(function (card) {
    if (card.suit() == discardPile.topCard().suit()
        || card.rank() == discardPile.topCard().rank()) {
        discardPile.addCard(card);
        discardPile.render();
        lowerhand.render();
    }
});














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
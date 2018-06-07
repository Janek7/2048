'use strict';
let game: Game;

//prepare game
let gameBox: JQuery = $("#game-box");
let pos: number[] = [0, 1, 2, 3];
for (let rowNumber of pos) {
    let row = document.createElement("div");
    row.setAttribute("class", "row");
    row.setAttribute("id", "row" + rowNumber);
    for (let colNumber of pos) {
        let id: string = rowNumber + "" + colNumber;
        let field = document.createElement("div");
        field.setAttribute("class", "card empty");
        field.setAttribute("id", id);
        row.appendChild(field);
    }
    gameBox.append(row);
}

//key listener
$(document).keydown(function(event) {
    if (game != null) {
        if (!game.hasPossibleAction()) {
            //after lose quit actions -> force new start
            if (game.gameState == GameState.INGAME) game.end();
            return;
        } else if (game.gameState == GameState.GOAL_REACHED) {
            //after reach 2048 keep playing
            game.displayInfoText();
        }
        switch (event.keyCode) {
            case 37:
                game.action(Direction.LEFT);
                break;
            case 38:
                game.action(Direction.UP);
                break;
            case 39:
                game.action(Direction.RIGHT);
                break;
            case 40:
                game.action(Direction.DOWN);
                break;
        }
    }
});

//other events
$("#startButton").click(function () {

    $("#actualScore").html("0");
    let gameBox: JQuery = $("#game-box");
    gameBox.children().children().attr("class", "card empty");
    if (game != null) {
        if (game.gameState != GameState.INGAME) game.displayInfoText();
    }
    game = new Game();
});

gameBox.mousedown(function (e) {
    e.preventDefault();
});

//load stats from cookie


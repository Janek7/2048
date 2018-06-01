'use strict';

/**
 * the logic of 2048
 */
class Game {

    score: number = 0;
    fields: Field[] = [];
    cards: Card[] = [];
    gameState: GameState;
    won: boolean;

    /**
     * creates a new game and prepares the game board with fields and empty cards
     */
    constructor() {

        this.gameState = GameState.INGAME;
        this.won = false;
        let pos: number[] = [0, 1, 2, 3];
        for (let rowNumber of pos) {
            for (let colNumber of pos) {
                this.fields.push(new Field(new Pos(rowNumber, colNumber)));
            }
        }
        for (let field of this.fields) {
            if (field.card == null)
                field.setCard(new Card(Value.EMPTY, getNewDiv()));
        }
        this.createCards(2);

    }

    /**
     * creates random cards with the values of two and four
     * @param {number} number the number of new cards
     */
    createCards(number: number): void {

        let createdCards: number = 0;
        while (createdCards < number) {
            let pos: Pos = Pos.getRandomPos();
            let field: Field = this.getFieldFromPos(pos);
            if (field.card.value == Value.EMPTY) {
                //probability of 10% for a new card with the value 4
                let value: Value = Math.floor(Math.random() * 10) == 0 ? Value.N4 : Value.N2;
                field.setCard(new Card(value, getNewDiv()));
                field.animateCreation();
                createdCards++;
            }
        }

    }

    /**
     * modifies the gameboard depending on the direction which is given by the user
     * -> moves and merges the cards together and create a new one
     * @param {Direction} dir the direction for moving the cards
     */
    action(dir: Direction): void {

        let ascIndices: number[] = [0, 1, 2, 3];
        let descIndices: number[] = [3, 2, 1, 0];

        let rowIndices: number[];
        let colIndices: number[];

        switch (dir) {
            case Direction.LEFT:
                rowIndices = ascIndices;
                colIndices = ascIndices; //relevant
                break;
            case Direction.RIGHT:
                rowIndices = ascIndices;
                colIndices = descIndices; //relevant
                break;
            case Direction.DOWN:
                rowIndices = descIndices; //relevant
                colIndices = ascIndices;
                break;
            case Direction.UP:
                rowIndices = ascIndices; //relevant
                colIndices = ascIndices;
                break;
        }

        //TODO: Überspring Merge Fix
        //merge cards
        let merges: number = 0;
        let mergeValue: number = 0;
        for (let row of rowIndices) {
            for (let col of colIndices) {
                let field: Field = this.getFieldFromPos(new Pos(row, col));
                let i: number = (dir == Direction.LEFT || dir == Direction.RIGHT ? col : row)
                    + (dir == Direction.LEFT || dir == Direction.UP ? 1 : -1);
                let checkedCards: number = 0;
                while (dir == Direction.LEFT || dir == Direction.UP ? i < 4 : i >= 0) {
                    let b: boolean = false;
                    let field2: Field = this.getFieldFromPos(new Pos(dir == Direction.LEFT || dir == Direction.RIGHT ? row : i,
                        dir == Direction.UP || dir == Direction.DOWN ? col : i));
                    if (field2.card.value != Value.EMPTY) checkedCards++;
                    if (checkedCards > 1) break;
                    if (!field.card.combined && !field2.card.combined) {
                        if (field.card.value == field2.card.value && field.card.value != Value.EMPTY) {
                            let newValue: Value = Value[Value[values[field.card.value].nextValue]];
                            mergeValue += values[newValue].number;
                            if (newValue == Value.N2048 && !this.won) {
                                this.won = true;
                                this.gameState = GameState.GOAL_REACHED;
                                this.showInfoText(GameState.GOAL_REACHED);
                                let winDisplay: JQuery = $("#winNumber");
                                let newWinNumber: string = (parseInt(winDisplay.html()) + 1) + "";
                                winDisplay.html(newWinNumber);
                                updateStatsInCookie('wins', newWinNumber);
                            }
                            this.getFieldFromPos(field.pos).setCard(
                                new Card(newValue, getNewDiv())
                            );
                            this.getFieldFromPos(field2.pos).setCard(
                                new Card(Value.EMPTY, getNewDiv())
                            );
                            field.card.combined = true;
                            field2.card.combined = true;
                            merges++;
                            b = true;
                        }
                    }
                    if (b) break;
                    if (dir == Direction.LEFT || dir == Direction.UP) i++;
                    else i--;
                }
            }
        }
        if (mergeValue > 0) this.updateScore(mergeValue);

        //move cards
        let moves: number = 0;
        for (let row of rowIndices) {
            for (let col of colIndices) {
                let field: Field = this.getFieldFromPos(new Pos(row, col));
                if (field.card.value == Value.EMPTY) continue;
                let freeFields: number = 0;
                while (true) {
                    let neighbourField: Field;
                    neighbourField = this.getFieldFromPos(
                        new Pos(row + (dir == Direction.UP || dir == Direction.DOWN ? (freeFields + 1) * (dir == Direction.UP ? -1 : 1) : 0),
                            col + (dir == Direction.LEFT || dir == Direction.RIGHT ? (freeFields + 1) * (dir == Direction.LEFT ? -1 : 1) : 0))
                    );
                    if (neighbourField != null) {
                        if (neighbourField.card.value == Value.EMPTY) {
                            freeFields++;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                if (freeFields > 0) {
                    this.getFieldFromPos(
                        new Pos(row + (dir == Direction.UP || dir == Direction.DOWN ? freeFields * (dir == Direction.UP ? -1 : 1) : 0),
                            col + (dir == Direction.LEFT || dir == Direction.RIGHT ? freeFields * (dir == Direction.LEFT ? -1 : 1) : 0))
                    ).setCard(field.card);
                    field.setCard(new Card(Value.EMPTY, getNewDiv()));
                    moves++;
                }
            }
        }

        //reset used attributes
        for (let field: Field of this.fields) {
            field.card.combined = false;
        }

        if (!(moves == 0 && merges == 0)) this.createCards(1);

    }

    /**
     * updates the score elements in the game header
     * @param {number} mergeValue
     */
    updateScore(mergeValue: number): void {

        this.score += mergeValue;
        $("#actualScore").html(this.score + "");
        let bestScoreText: JQuery = $("#bestScore");
        if (parseInt(bestScoreText.html()) < this.score) {
            bestScoreText.html(this.score + "");
            updateStatsInCookie('bestScore', this.score + "");
        }
        let updateText: JQuery = $("#updateScore");
        updateText.html("+" + mergeValue);
        updateText.addClass("animated slideOutUp");
        setTimeout(function () {
            updateText.removeAttr("class");
            updateText.html("");
        }, 700);

    }

    /**
     * provides the field object which has the given position
     * @param {Pos} pos position
     * @returns {Field} field
     */
    getFieldFromPos(pos: Pos): Field {

        for (let field of this.fields) {
            if (field.pos.row == pos.row && field.pos.col == pos.col) {
                return field;
            }
        }
        return null;

    }

    /**
     * checks if there is a chance to spawn a new card or merge at least two cards
     * @returns {boolean}
     */
    hasPossibleAction(): boolean {

        let freeField: boolean = false;
        for (let field: Field of this.fields) {
            if (field.card.value == Value.EMPTY) {
                freeField = true;
                break;
            }
        }

        let possibleMerge: boolean = false;
        for (let field: Field of this.fields) {
            let surroundingFields: Field[] = [
                this.getFieldFromPos(new Pos(field.pos.row + 1, field.pos.col)),
                this.getFieldFromPos(new Pos(field.pos.row - 1, field.pos.col)),
                this.getFieldFromPos(new Pos(field.pos.row, field.pos.col + 1)),
                this.getFieldFromPos(new Pos(field.pos.row, field.pos.col - 1))
            ];
            for (let surroundingField: Field of surroundingFields) {
                if (surroundingField != null) {
                    if (surroundingField.card.value == field.card.value) {
                        possibleMerge = true;
                        break;
                    }
                }
            }
            if (possibleMerge) break;
        }

        return freeField || possibleMerge;

    }

    /**
     * finishes the game
     */
    end(): void {

        this.gameState = GameState.LOSE;
        this.showInfoText(GameState.LOSE);

    }

    /**
     * shows the modified info text
     * @param {GameState} gameState
     */
    showInfoText(gameState: GameState): void {

        let win: boolean = gameState == GameState.GOAL_REACHED;
        $("#game-box").css("opacity","0.5");
        $(".info-header").html(win ? "WIN" : "LOSE");
        $(".info-subtext").html(win ? "Congratulations! Keep playing or try again." : "Game over! Try again.");
        let infoBox: JQuery = $(".info-box");
        infoBox.css("background-color", win ? "#ECC850" : "#FF4141");
        infoBox.css("color", win ? "#6C655C" : "white");
        infoBox.css("display", "block");

    }

    /**
     * hides the info text
     */
    displayInfoText(): void {

        gameBox.css("opacity","1");
        $(".info-box").css("display", "none");

    }

}

class Field {

    pos: Pos;
    element: JQuery;
    card: Card;

    /**
     * craetes a new Field
     * @param {Pos} pos position of the field
     */
    constructor(pos: Pos) {

        this.pos = pos;
        this.element = $("#" + pos.row + "" + pos.col);

    }

    /**
     * changes the card of the field to a new one
     * @param {Card} card new cards
     */
    setCard(card: Card) {

        // not necessary while spawning
        if (this.card != null) this.element.attr("class", "card");
        this.card = card;
        this.element.addClass(values[card.value].cssClass);
        this.element.html(values[card.value].display);

    }

    /**
     * animates the spawning of a new card
     */
    animateCreation(): void {
        this.element.addClass("animated zoomIn");
    }

}

class Card {

    element: JQuery;
    value: Value;
    combined: boolean;

    /**
     * creates a new card
     * @param {Value} value value
     * @param {JQuery} element jquery element
     */
    constructor(value: Value, element: JQuery) {

        this.value = value;
        this.element = element;
        this.combined = false;

    }

    /**
     * sets the value of a card
     * @param {Value} value
     */
    setValue(value: Value) {
        this.value = value;
    }

}

/**
 * possible values of a card
 */
enum Value {
    EMPTY, N2, N4, N8, N16, N32, N64, N128, N256, N512, N1024, N2048, N4096, N8192
}

/**
 * properties of a value
 */
class ValueProperty {

    number: number;
    display: string;
    cssClass: string;
    nextValue: Value;

    /**
     * creates a new value property
     * @param {number} number value as number
     * @param {string} cssClass linked css class of a value
     * @param {Value} nextValue the next value value in order of the two potency
     */
    constructor(number: number, cssClass: string, nextValue: Value) {

        this.number = number;
        this.display = "" + (number == -1 ? "" : number);
        this.cssClass = cssClass;
        this.nextValue = nextValue;

    }

}

/**
 * dictionary of values and their properties
 * @type {{}}
 */
let values: { Value: ValueProperty } = {};
values[Value.EMPTY] = new ValueProperty(-1, "empty", null);
values[Value.N2] = new ValueProperty(2, "two", Value.N4);
values[Value.N4] = new ValueProperty(4, "four", Value.N8);
values[Value.N8] = new ValueProperty(8, "eight", Value.N16);
values[Value.N16] = new ValueProperty(16, "sixteen", Value.N32);
values[Value.N32] = new ValueProperty(32, "thirtyTwo", Value.N64);
values[Value.N64] = new ValueProperty(64, "sixtyFour", Value.N128);
values[Value.N128] = new ValueProperty(128, "oneHundredTwentyEight", Value.N256);
values[Value.N256] = new ValueProperty(256, "twoHundredFiftySix", Value.N512);
values[Value.N512] = new ValueProperty(512, "fiveHundredTwelf", Value.N1024);
values[Value.N1024] = new ValueProperty(1024, "oneThousandTwentyFour", Value.N2048);
values[Value.N2048] = new ValueProperty(2048, "twoThousandFourtyEight", Value.N4096);
values[Value.N4096] = new ValueProperty(4096, "fourThousandNintySix", Value.N8192);
values[Value.N8192] = new ValueProperty(8192, "eightThousandOneHundredNinetyTwo", null);

/**
 * describes the position of a field in the gameboard with a row and a column index
 */
class Pos {

    row: number;
    col: number;

    /**
     * creates a new Position
     * @param {number} row row index
     * @param {number} col col index
     */
    constructor(row: number, col: number) {

        this.row = row;
        this.col = col;

    }

    toString(): void {
        return this.row + " " + this.col;
    }

    /**
     * provides a random Position
     * @returns {Pos} random Position
     */
    static getRandomPos(): Pos {
        return new Pos(Math.floor(Math.random() * 4), Math.floor(Math.random() * 4));
    }

}

/**
 * possible moving directions
 */
enum Direction {
    LEFT, RIGHT, DOWN, UP
}

/**
 * possible game states
 */
enum GameState {
    INGAME, GOAL_REACHED, LOSE
}

/**
 * creates a new div element for a new card
 * @returns {JQuery}
 */
function getNewDiv(): JQuery {
    return $(document.createElement("div"));
}
'use strict';

//loads stats from cookie
let wins: string = Cookies.get('wins');
if (wins == null) {
    Cookies.set('wins', '0');
    wins = "0";
}
$("#winNumber").html(wins);

let bestScore: string = Cookies.get('bestScore');
if (bestScore == null) {
    Cookies.set('bestScore', '0');
    bestScore = "0";
}
$("#bestScore").html(bestScore);

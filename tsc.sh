#!/usr/bin/env bash

tsc ts/main.ts --outDir js
tsc ts/game.ts --outDir js
tsc ts/stats.ts --outDir js

date
echo 'finished compiling ts to js -'

let graph;
let puzzles;
let currPuzzle;
let currDifficulty;

function loadGraph() {
  return new Promise((resolve, reject) => {
    $.getJSON("resources/relation_graph_200K.json", function(json) {
        graph = json;
        console.log("The graph has been loaded in.");

        resolve();
    });
  });
}

function loadPuzzles() {
   return new Promise((resolve, reject) => {
    $.getJSON("resources/puzzles.json", function(json) {
        puzzles = json;
        console.log("The puzzles have been loaded in.");
        currPuzzle = puzzles.length;
        currDifficulty = "easy";

        displayPuzzle();
        activate_listeners();

        resolve();
    });
  }); 
}

loadGraph()
.then(function() {
    return loadPuzzles();  // Now the loadPuzzles promise will be chained correctly
})
.then(function() {
    document.body.style.display = "unset";
});

function displayPuzzle() {
    document.getElementById('submitted-left').innerHTML = "";
    document.getElementById('submitted-right').innerHTML = "";
    document.getElementById('answer-box').innerHTML = "<input type='text' id='answer'></input>";


    if (currPuzzle == puzzles.length) {
        document.getElementById('next-button').disabled = true;
    } else if (currPuzzle == 1) {
        document.getElementById('previous-button').disabled = true;
    } else if (currPuzzle == 2) {
        document.getElementById('previous-button').disabled = false;
    } 
    
    if (currPuzzle == puzzles.length - 1) {
        document.getElementById('next-button').disabled = false;
    }

    if (currDifficulty == 'easy') {
        document.getElementById('easy-button').disabled = true;
        document.getElementById('medium-button').disabled = false;
        document.getElementById('hard-button').disabled = false;
    } else if (currDifficulty == "medium") {
        document.getElementById('medium-button').disabled = true;
        document.getElementById('hard-button').disabled = false;
        document.getElementById('easy-button').disabled = false;
    } else if (currDifficulty == "hard") {
        document.getElementById('hard-button').disabled = true;
        document.getElementById('medium-button').disabled = false;
        document.getElementById('easy-button').disabled = false;
    }

    const pathLength = puzzles.at(currPuzzle - 1)[currDifficulty]["sample_chain"].length;
    const leftWord = puzzles.at(currPuzzle - 1)[currDifficulty]["left"];
    const rightWord = puzzles.at(currPuzzle  - 1)[currDifficulty]["right"];

    document.getElementById('left-word').innerText = leftWord;
    document.getElementById('right-word').innerText = rightWord;
    document.getElementById('puzzle-header').innerText = "Puzzle #" + puzzles.at(currPuzzle  - 1)["number"];

    document.getElementById('distance-header').innerHTML = pathLength > 1 ? "There are " + String(pathLength) + " words between <i>" + leftWord + "</i> and <i>" + rightWord + "</i>" : "There is " + String(pathLength) + " word between <i>" + leftWord + "</i> and <i>" + rightWord + "</i>";
} 

function activate_listeners() {
    const input = document.getElementById("answer");
    input.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            document.getElementById("submit-button").click();
            event.preventDefault();
        }
    });

    const distanceCheck = document.getElementById("distance-box");
    distanceCheck.addEventListener("change", function() {
        if (this.checked) {
            updateDistance();
        } else {
            document.getElementById('distance-header').innerText = "";
        }
    })
}

function submitWord(word=document.getElementById('answer').value) {
    const numRight = document.getElementById('submitted-right').childElementCount;
    const numLeft = document.getElementById('submitted-left').childElementCount;

    const leftWord = numLeft == 0 ? document.getElementById('left-word').innerText : document.getElementById('left-' + numLeft + '-word').innerText;
    const rightWord = numRight == 0 ? document.getElementById('right-word').innerText : document.getElementById('right-' + numRight + '-word').innerText;

    if (graph[leftWord].map(entry => entry[0]).includes(word) && graph[rightWord].map(entry => entry[0]).includes(word)) {
        const answerBox = document.getElementById('answer-box');
        answerBox.innerHTML = "<p id='connecting-word'>" + word + "</p>"

        Array.prototype.forEach.call(document.querySelectorAll('.remove-button'), button => button.remove());

        const firstLeft = document.getElementById('left-word').innerText;
        const firstRight = document.getElementById('right-word').innerText;
        const shortest = findPath(firstLeft, firstRight).length - 2;
        const length = numLeft + numRight + 1;

        if (shortest > 1) {
            if (length > 1) {
                document.getElementById('distance-header').innerHTML = "Congratulations! You connected <i>" + firstLeft + "</i> and <i>" + firstRight +  "</i> using " + String(length) + " words! The shortest possible connection is " + String(shortest) + " words."
            } else {
                document.getElementById('distance-header').innerHTML = "Congratulations! You connected <i>" + firstLeft + "</i> and <i>" + firstRight +  "</i> using " + String(length) + " word! The shortest possible connection is " + String(shortest) + " words."
            }
        } else {
            if (length > 1) {
                document.getElementById('distance-header').innerHTML = "Congratulations! You connected <i>" + firstLeft + "</i> and <i>" + firstRight +  "</i> using " + String(length) + " words! The shortest possible connection is " + String(shortest) + " word."
            } else {
                document.getElementById('distance-header').innerHTML = "Congratulations! You connected <i>" + firstLeft + "</i> and <i>" + firstRight +  "</i> using " + String(length) + " word! The shortest possible connection is " + String(shortest) + " word."
            }
        }
    } else if (graph[leftWord].map(entry => entry[0]).includes(word)) {
        if (document.getElementById("left-remove-button")) {
            document.getElementById("left-remove-button").remove();
        }

        const leftAnswers = document.getElementById('submitted-left');

        const newLeft = document.createElement('div');

        newLeft.setAttribute('id', 'left-' + String(numLeft + 1));
        newLeft.setAttribute('class', 'submitted-word  word-box');

        newLeft.innerHTML = "<button id='left-remove-button' class='remove-button' onclick='deleteWord(this.parentElement.id)'>X</button><p id='left-" + String(numLeft + 1) + "-word'>" + word + "</p>";
        leftAnswers.appendChild(newLeft);

        let shortestPath = findPath(word, rightWord);
        
        document.getElementById('answer').value = "";

        updateDistance();
    } else if (graph[rightWord].map(entry => entry[0]).includes(word)) {
        if (document.getElementById("right-remove-button")) {
            document.getElementById("right-remove-button").remove();
        }

        const rightAnswers = document.getElementById('submitted-right');

        const newRight = document.createElement('div');

        newRight.setAttribute('id', 'right-' + String(numRight + 1));
        newRight.setAttribute('class', 'submitted-word word-box');

        newRight.innerHTML = "<button id='right-remove-button' class='remove-button' onclick='deleteWord(this.parentElement.id)'>X</button><p id='right-" + String(numRight + 1) + "-word'>" + word + "</p>";
        rightAnswers.insertBefore(newRight, rightAnswers.firstChild);

        let shortestPath = findPath(leftWord, word);

        document.getElementById('answer').value = "";

        updateDistance();
    } else {
        document.getElementById('answer').value = "";

        document.getElementById('answer-box').style.animation="none";
        document.getElementById('answer-box').offsetHeight;
        document.getElementById('answer-box').style.animation="shake 0.5s linear 1";
    }
}

function createPath(word, threshold=0.5) {
    const queue = [[[word], 0, 1]];
    //const queue = graph[word].map(neighbour => [[word, neighbour[0]], calcLevenshtein(word, neighbour), neighbour[1]]);
    //queue.sort((a, b) => a[1] - b[1]);
    const explored = new Set([word]);

    while (queue.length > 0) {
        console.log(queue);
        curr = queue.shift();
        console.log(curr);

        if (curr[2] < threshold) {
            return curr;
        } else {
            graph[curr[0].at(-1)].map(neighbour => {
                if (!explored.has(neighbour[0])) {
                    explored.add(neighbour[0]);
                    console.log(neighbour[0]);
                    console.log([
                        curr[0].concat(neighbour[0]), 
                        curr[1] + calcLevenshtein(curr[0].at(-1), neighbour[0]), 
                        curr[2] * neighbour[1]
                    ]);
                    return [
                        curr[0].concat(neighbour[0]), 
                        curr[1] + calcLevenshtein(curr[0].at(-1), neighbour[0]), 
                        curr[2] * neighbour[1]
                    ];
                } else {
                    return;
                }
            }).forEach(next => queue.push(next));
            queue.sort((a, b) => b[1] - a[1]);
        }
    }
}

function findPath(start, end, exclusion=[]) {
    const queue = [[start]];
    //const queue = graph[word].map(neighbour => [[word, neighbour[0]], calcLevenshtein(word, neighbour), neighbour[1]]);
    //queue.sort((a, b) => a[1] - b[1]);
    const explored = new Set(exclusion.concat([start]));

    while (queue.length > 0) {
        curr = queue.shift();

        if (curr.at(-1) == end) {
            return curr;
        } else {
            graph[curr.at(-1)].map(neighbour => {
                if (!explored.has(neighbour[0])) {
                    explored.add(neighbour[0]);
                    return curr.concat(neighbour[0]);
                }
            }).filter(next => next !== undefined)
            .forEach(next => queue.push(next));
        }
    }

    console.log("No path exists, sorry.");
    return {};
}

function createPaths(word, length = 1, exclusion=[]) {
    const queue = [[word]];
    //const queue = graph[word].map(neighbour => [[word, neighbour[0]], calcLevenshtein(word, neighbour), neighbour[1]]);
    //queue.sort((a, b) => a[1] - b[1]);
    const explored = new Set(exclusion.concat([word]));
    const paths = new Set([]);

    while (queue.length > 0) {
        curr = queue.shift();

        if (curr.length == length) {
            paths.add(curr)
        } else {
            graph[curr.at(-1)].map(neighbour => {
                if (!explored.has(neighbour[0])) {
                    explored.add(neighbour[0]);
                    return curr.concat(neighbour[0]);
                }
            }).filter(next => next !== undefined)
            .forEach(next => queue.push(next));
        }
    }

    console.log("The following are all the " + length.toString() + " word long paths originating from " + word + ".");
    return paths;
}

function changePuzzle(direction) {
    currPuzzle = currPuzzle + direction;
    currDifficulty = "easy";
    
    displayPuzzle();
}

function changeDifficulty(difficulty) {
    currDifficulty = difficulty;
    
    displayPuzzle();
}

function calcLevenshtein(a, b) {
    if (a.length == 0) {
        return b.length;
    } else if (b.length == 0) {
        return a.length;
    } else if (a.slice(0, 1) == b.slice(0, 1)) {
        return calcLevenshtein(a.slice(1), b.slice(1));
    } else {
        return 1 + Math.min(calcLevenshtein(a.slice(1), b), calcLevenshtein(a, b.slice(1)), calcLevenshtein(a.slice(1), b.slice(1)));
    }
}

function deleteWord(wordBox) {
    let num = wordBox.slice(-1);
    let side = wordBox.slice(0, wordBox.indexOf('-'));

    document.getElementById(wordBox).remove();

    if (num > 1) {
        const removeButton = document.createElement('button');
        removeButton.setAttribute('id', side + '-remove-button');
        removeButton.setAttribute('class', 'remove-button');
        removeButton.setAttribute('onclick','deleteWord(this.parentElement.id)' );
        removeButton.innerText = 'X';

        document.getElementById(side + "-" + String(Number(num) - 1)).insertBefore(removeButton, document.getElementById(side + "-" + String(Number(num) - 1)).firstChild);
    }

    updateDistance();
}

function updateDistance() {
    if (document.getElementById('distance-box').checked) {
        const numRight = document.getElementById('submitted-right').childElementCount;
        const numLeft = document.getElementById('submitted-left').childElementCount;

        const leftWord = numLeft == 0 ? document.getElementById('left-word').innerText : document.getElementById('left-' + numLeft + '-word').innerText;
        const rightWord = numRight == 0 ? document.getElementById('right-word').innerText : document.getElementById('right-' + numRight + '-word').innerText;

        const pathLength = findPath(leftWord, rightWord).length - 2;
        document.getElementById('distance-header').innerHTML = pathLength > 1 ? "There are " + String(pathLength) + " words between <i>" + leftWord + "</i> and <i>" + rightWord + "</i>" : "There is " + String(pathLength) + " word between <i>" + leftWord + "</i> and <i>" + rightWord + "</i>";

        if (pathLength == 1) {
            document.getElementById('reveal-next-left-button').disabled = true;
            document.getElementById('reveal-next-right-button').disabled = true;
        } else {
            document.getElementById('reveal-next-left-button').disabled = false;
            document.getElementById('reveal-next-right-button').disabled = false;
        }
    }
}

function revealWord(side='right') {
    const numRight = document.getElementById('submitted-right').childElementCount;
    const numLeft = document.getElementById('submitted-left').childElementCount;

    const leftWord = numLeft == 0 ? document.getElementById('left-word').innerText : document.getElementById('left-' + numLeft + '-word').innerText;
    const rightWord = numRight == 0 ? document.getElementById('right-word').innerText : document.getElementById('right-' + numRight + '-word').innerText;

    const path = findPath(leftWord, rightWord);
    
    if (side == 'right') {
        submitWord(path.at(-2));
    } else {
        submitWord(path.at(1));
    }
}
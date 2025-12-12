let graph;

$.getJSON("relation_graph_testing.json", function(json) {
    graph = json;
});

function test() {
    let word = Object.keys(graph)[Math.floor(Math.random() * Object.keys(graph).length)];
    console.log(word);

    let similarity = 1;
    let prev_word = word;
    const visited = new Set([word]);
    const neighbours = new Set([]);

    while (similarity >= 0.5) {
        let index = Math.floor(Math.random() * graph[prev_word].length);
        let next = graph[prev_word][index];

        while (visited.has(next[0]) || neighbours.has(next[0])) {
            index = index + 1;
            next = graph[prev_word][index % graph[prev_word].length];
        }

        graph[prev_word].map(tuple => tuple[0]).slice(0, index).concat(graph[prev_word].map(tuple => tuple[0]).slice(index + 1)).forEach(new_neighbour => neighbours.add(new_neighbour));

        similarity = next[1] * similarity;
        prev_word = next[0];
        
        visited.add(prev_word);
    }

    console.log(visited);
    console.log(similarity);
}
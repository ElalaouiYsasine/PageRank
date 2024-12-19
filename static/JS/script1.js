let pageCount = 0; // Nombre total de pages ajoutées
let N = 0; // Déclaration d'une variable globale pour le nombre de pages
let isAddingEdge = false;
let selectedPage = null;
const edges = new Set(); // Pour garder une trace des arêtes ajoutées

const addEdgesButton = document.getElementById("addEdges_button");
const clearButton = document.getElementById("clear_button");
const runButton = document.getElementById("run_button");

// Ajout d'événement pour le bouton "Add edges"
addEdgesButton.addEventListener("click", () => {
    const circles = document.querySelectorAll(".circle");
    if (circles.length < 2) {
        alert("Veuillez ajouter au moins deux pages avant de tracer une arête.");
        return; // Sortir si moins de deux cercles
    }
    isAddingEdge = true;
    selectedPage = null; // Réinitialiser toute sélection précédente
    addEdgesButton.style.backgroundColor = "lightgreen"; // Indicateur visuel pour le mode ajout d'arête
});

function addPage(event) {
    const graphArea = document.getElementById("graphArea");
    const rect = graphArea.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    // Vérifiez si le clic est dans les limites de graphArea
    if (x >= 0 && x <= graphArea.clientWidth && y >= 0 && y <= graphArea.clientHeight) {
        const circles = document.querySelectorAll(".circle");
        for (const circle of circles) {
            const circleRect = circle.getBoundingClientRect();
            if (
                x >= circleRect.left - rect.left &&
                x <= circleRect.right - rect.left &&
                y >= circleRect.top - rect.top &&
                y <= circleRect.bottom - rect.top
            ) {
                circle.style.backgroundColor = "lightgreen"; // Change ici la couleur souhaitée

                if (!isAddingEdge) {
                    alert("Un cercle existe déjà à cet endroit.");
                    return; // Sortir si un cercle existe déjà et n'est pas en mode ajout d'arête
                } else {
                    // Si en mode ajout d'arête et on clique sur un cercle existant
                    if (!selectedPage) {
                        selectedPage = circle;
                        circle.style.backgroundColor = "lightblue"; // Change couleur pour signaler la sélection
                    } else if (selectedPage !== circle) {
                        const edgeKey = `${selectedPage.innerText}-${circle.innerText}`;
                        if (edges.has(edgeKey)) {
                            alert("Une arête existe déjà entre ces deux pages.");
                        } else {
                            // Créer une arête entre selectedPage et circle
                            drawArrow(selectedPage, circle);
                            edges.add(edgeKey); // Ajoute l'arête au Set
                        }
                        selectedPage.style.backgroundColor = "";  // Réinitialiser la couleur de sélection
                        selectedPage = null;  // Réinitialiser la sélection
                    }
                }
                return; // Sortir de la fonction
            }
        }

        // Ajouter un nouveau cercle s'il n'existe pas déjà
        const placeholder = document.getElementById("placeholder");
        if (placeholder) {
            placeholder.remove();
        }

        // Incrémentez N chaque fois qu'une nouvelle page est ajoutée
        N++; // Incrémente le nombre de pages
        pageCount++;
        if (pageCount > 26) {
            alert("Vous ne pouvez pas ajouter plus de 26 pages.");
            pageCount--;
            return;
        }

        const circle = document.createElement("div");
        circle.classList.add("circle");
        circle.innerText = String.fromCharCode(64 + pageCount);
        circle.style.position = 'absolute';
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
        circle.style.transform = 'translate(-50%, -50%)';

        graphArea.appendChild(circle);
    }
}

clearButton.addEventListener("click", () => {
    const url = clearButton.getAttribute("data-url");
    window.location.href = url;
});

runButton.addEventListener("click", async () => {
    // Créer un tableau pour la matrice
    const matrix = Array.from({ length: pageCount }, () => Array(pageCount).fill(0));

    // Remplir la matrice d'adjacence selon les arêtes
    edges.forEach(edge => {
        const [start, end] = edge.split("-");
        const startIndex = start.charCodeAt(0) - 65; // Convertir A=0, B=1, ...
        const endIndex = end.charCodeAt(0) - 65;
        matrix[startIndex][endIndex] = 1; // Mettre 1 pour représenter une arête
    });

    const numberOfPages = pageCount; // Utiliser le nombre de pages

    // Appeler le serveur pour calculer le PageRank
    const response = await fetch('/calculate_pagerank', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            numberOfPages: numberOfPages,
            matrix: matrix
        }),
    });

    const data = await response.json();

    // Afficher le score de PageRank au-dessus de chaque cercle
    const pagerankScores = data.pagerankVector; // Obtenez le vecteur PageRank
    const circles = document.querySelectorAll('.circle');

    circles.forEach((circle, index) => {
        const score = pagerankScores[index].toFixed(4); // Arrondir à 4 décimales
        const scoreElement = document.createElement('div');
        scoreElement.innerText = score;
        scoreElement.style.position = 'absolute';
        scoreElement.style.left = `${circle.offsetLeft}px`;
        scoreElement.style.top = `${circle.offsetTop - 20}px`; // Placer au-dessus du cercle
        scoreElement.style.transform = 'translate(-50%, -50%)'; // Centrer
        scoreElement.style.backgroundColor = 'white'; // Arrière-plan blanc pour visibilité
        scoreElement.style.border = '1px solid black'; // Bordure noire pour le contraste
        scoreElement.style.padding = '2px'; // Un peu de rembourrage
        scoreElement.style.zIndex = '10'; // S'assurer qu'il est au-dessus des cercles

        document.getElementById('graphArea').appendChild(scoreElement); // Ajouter l'élément au graphique
    });
});


// Fonction pour créer la matrice d'adjacence
function createAdjacencyMatrix() {
    const pageArray = Array.from(new Set(Array.from(edges).flatMap(edge => edge.split('-')))); // Crée un tableau de pages uniques
    const adjacencyMatrix = Array.from(Array(pageArray.length), () => Array(pageArray.length).fill(0));

    edges.forEach(edge => {
        const [from, to] = edge.split('-');
        const fromIndex = pageArray.indexOf(from);
        const toIndex = pageArray.indexOf(to);
        adjacencyMatrix[fromIndex][toIndex] = 1; // Mettre 1 pour le lien
    });

    return adjacencyMatrix;
}

function drawArrow(startElement, endElement) {
    const svg = document.getElementById("arrowLayer");

    const startRect = startElement.getBoundingClientRect();
    const endRect = endElement.getBoundingClientRect();

    // Calculer les positions relatives au conteneur
    const graphArea = document.getElementById("graphArea");
    const graphRect = graphArea.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2 - graphRect.left;
    const startY = startRect.top + startRect.height / 2 - graphRect.top;
    const endX = endRect.left + endRect.width / 2 - graphRect.left;
    const endY = endRect.top + endRect.height / 2 - graphRect.top;

    // Création de la ligne avec une flèche
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", startX);
    line.setAttribute("y1", startY);
    line.setAttribute("x2", endX);
    line.setAttribute("y2", endY);
    line.setAttribute("stroke", "black");
    line.setAttribute("marker-end", "url(#arrowhead)");

    svg.appendChild(line);
}

const canvas = document.querySelector("canvas"); // initialize canvas
const c = canvas.getContext("2d"); // initialize context
const score_element = document.getElementById('enter_score'); 
const lives_element = document.getElementById('lives');
const intro = document.getElementById('intro-message');
const canvas_container = document.getElementsByClassName('canvas-container');
const button = document.getElementById('button');
const top_info = document.getElementById('score');
const high_score_element = document.getElementById('high_score_value');
let paused = false;
let high_score = 0;
let first_game = true;

let lives = 3
let score = 0;
lives_element.innerHTML = lives;
score_element.innerHTML = score;

intro.style.display = 'none';
canvas.style.display = 'none';
top_info.hidden = true;
button.style.display = 'inline';


// canvas.width = innerWidth; // set canvas width to window width
// canvas.height = innerHeight; // set canvas height to window height

class Boundary {  // class for boundaries of game
    static width = 40;
    static height = 40;
    // creating these two variables allows us to call upon these values using the class and without creating an instance of the class
    // ex: Boundary.width will return 40
    constructor(position, image) {
        this.position = position;   
        this.width = 40;
        this.height = 40;
        this.image = image;
    }
    draw() {
        // selects the color that will fill the rectangle
        // c.fillStyle = 'blue';
        // c.fillRect(this.position.x, this.position.y, this.width, this.height);
        // fillRect(x-coordinate, y-coordinate, width, height)
        // takes in an x-coordinate to begin at and a y-coordinate.  From there it takes in a width and height to draw the rectangle.  
        // A positive width will move the rectangle to the right.  A positive height will move the rectangle down.
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        // takes in an image and draws it at the x and y coordinates.  It then takes in a width and height to draw the image.
      }
}

class Player {
    constructor(position, velocity) {
        this.position = position
        this.velocity = velocity
        this.radius = 15; // radius of pacman in pixels
        this.radians = 0.75;
        this.openRate = 0.12;
        this.rotation = 0;
    }
    draw() {
        c.save();
        c.translate(this.position.x, this.position.y)
        c.rotate(this.rotation)
        c.translate(-this.position.x, -this.position.y)
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, this.radians, Math.PI * 2 - this.radians);
        c.lineTo(this.position.x, this.position.y)
        c.fillStyle = 'yellow';
        c.fill();
        c.closePath();
        c.restore()
    }
    update() {
        this.draw() // calls draw()
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.radians < 0 || this.radians > 0.75) {
            this.openRate = -this.openRate;
        }
        this.radians += this.openRate;
    }
    explode() {

    }
}

class Pellet {
    constructor(position) {
        this.position = position
        this.radius = 3; // radius of pacman in pixels
    }
    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = 'white';
        c.fill();
        c.closePath();
    }
}

class PowerUp {
    constructor(position) {
        this.position = position
        this.radius = 8; // radius of pacman in pixels
    }
    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = 'white';
        c.fill();
        c.closePath();
    }
}

class Ghost {
    static speed = 2;
    constructor(position, velocity, spawnPoint, starting_velocity, color = 'red') {
        this.position = position
        this.velocity = velocity
        this.radius = 15; // radius of pacman in pixels
        this.color = color;
        this.prevCollisions = [];
        this.speed = 2;
        this.scared = false;
        this.spawnPoint = spawnPoint;
        this.start_velocity = starting_velocity;
    }
    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.scared ? 'blue' : this.color;
        // if this.scared == true then the color will be blue, otherwise it will be the normal color of the ghost
        c.fill();
        c.closePath();
    }
    update() {
        this.draw() // calls draw()
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

function gameOver(animationId) {
    cancelAnimationFrame(animationId);
    intro.style.display = 'inline';
    intro.style.color = 'red';
    intro.innerHTML = 'Game   Over';
    setTimeout(() => {
        intro.style.display = 'none';
        top_info.hidden = true;
        c.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
        button.style.display = 'inline';
        location.reload();
    }, 4000);

    
}

function roundOver(player, ghosts, animationId) {
    // function that is called when the player loses a life
    intro.style.color = 'yellow';
    intro.innerHTML = 'Ready!!';
    ghosts.forEach(ghost => {
        ghost.position.x = -100;
        ghost.position.y = -100;
        ghost.velocity.x = 0;
        ghost.velocity.y = 0;
        ghost.scared = false;
    })

    player.explode();

    cancelAnimationFrame(animationId);
    setTimeout(() => {
        animate();
        player.velocity.x = 0;
        player.velocity.y = 0;
        
    }, 5000)

    cancelAnimationFrame(animationId);
    player.position = {x: Boundary.width * 7 + (Boundary.width / 2), y: Boundary.height * 7 + (Boundary.height / 2)}
    player.draw();
    ghosts.forEach(ghost => {
        ghost.position.x = ghost.spawnPoint.x;
        ghost.position.y = ghost.spawnPoint.y;
        ghost.velocity.x = ghost.start_velocity.x;
        ghost.velocity.y = ghost.start_velocity.y;
       
    })
    intro.style.display = 'inline';

    setTimeout(() => { 
        intro.style.display = 'none';
    }, 5000);

}

function buildMap(map) {
    map.forEach((row, index /* Grabs current index within map*/ ) => {
        row.forEach((symbol, i /* Grabs current index within each row of array*/) => {
            switch(symbol) {
                case '-':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/pipeHorizontal.png')));
                    break;
                case '|':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/pipeVertical.png')));
                    break;
                case '1':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/pipeCorner1.png')));
                    break;
                case '2':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/pipeCorner2.png')));
                    break;
                case '3':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/pipeCorner3.png')));
                    break;
                case '4':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/pipeCorner4.png')));
                    break;
                case 'b':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/block.png')));
                    break;
                case '7':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/pipeConnectorDownwards.png')));
                    break;
                case '[':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/capLeft.png')));
                    break;
                case ']':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/capRight.png')));
                    break;
                case '_':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/capBottom.png')));
                    break;
                case '^':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/capTop.png')));
                    break;
                case '+':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/pipeCross.png')));
                    break;
                case '5':
                    boundaries.push(new Boundary({x: Boundary.width * i, y: Boundary.height * index}, createImage('./Assets/pipeConnectorTop.png')));
                    break;
                case '.':
                    pellets.push(new Pellet({x: Boundary.width * i + 20, y: Boundary.height * index + 20}));
                    break;
                case 'p':
                    powerUps.push(new PowerUp({x: Boundary.width * i + 20, y: Boundary.height * index + 20}));
                    break;
            }
        })
    }) 
}

const ghosts = [
    new Ghost({x: Boundary.width * 3 + Boundary.width / 2, y: Boundary.height * 3 + Boundary.height / 2}, {x: -Ghost.speed, y: 0}, {x: Boundary.width * 3 + Boundary.width / 2, y: Boundary.height * 3 + Boundary.height / 2}, {x: -Ghost.speed, y: 0}, 'green'), 
    new Ghost({x: Boundary.width * 11 + Boundary.width / 2, y: Boundary.height * 3 + Boundary.height / 2}, {x: Ghost.speed, y: 0}, {x: Boundary.width * 11 + Boundary.width / 2, y: Boundary.height * 3 + Boundary.height / 2}, {x: Ghost.speed, y: 0}, 'purple'),
    new Ghost({x: Boundary.width * 3 + Boundary.width / 2, y: Boundary.height * 11 + Boundary.height / 2}, {x: -Ghost.speed, y: 0}, {x: Boundary.width * 3 + Boundary.width / 2, y: Boundary.height * 11 + Boundary.height / 2}, {x: -Ghost.speed, y: 0}, 'orange'), 
    new Ghost({x: Boundary.width * 11 + Boundary.width / 2, y: Boundary.height * 11 + Boundary.height / 2}, {x: Ghost.speed, y: 0}, {x: Boundary.width * 11 + Boundary.width / 2, y: Boundary.height * 11 + Boundary.height / 2}, {x: Ghost.speed, y: 0}, 'pink')
    // arguments: position, velocity, spawnpoint, color
];

let powerUps = [];
let pellets = []
let boundaries = [];
const levels = [];
let ghost_deaths = 0;

const player = new Player({x: Boundary.width * 7 + (Boundary.width / 2), y: Boundary.height * 7 + (Boundary.height / 2)}, {x: 0, y: 0});

const keys = {
    w: {pressed: false}, a: {pressed: false}, s: {pressed: false}, d: {pressed: false}
};

let lastKey = '';

const map = [
    ['1', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '2'], 
    ['|', 'p', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'p', '|'],
    ['|', '.', 'b', '.', '^', '.', '[', '-', ']', '.', '^', '.', 'b', '.', '|'], 
    ['|', '.', '.', '.', '|', '.', '.', '.', '.', '.', '|', '.', '.', '.', '|'],
    ['4', '2', '.', '[', '3', '.', '[', '-', ']', '.', '4', ']', '.', '1', '3'], 
    [' ', '|', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '|', ' '], 
    ['-', '3', '.', '[', ']', '.', '^', '.', '^', '.', '[', ']', '.', '4', '-'],
    [' ', ' ', '.', '.', '.', '.', '|', '#', '|', '.', '.', '.', '.', '.', '.'],
    ['-', '2', '.', '[', ']', '.', '_', '.', '_', '.', '[', ']', '.', '1', '-'],
    [' ', '|', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '|', ' '],
    ['1', '3', '.', '[', '2', '.', '[', '-', ']', '.', '1', ']', '.', '4', '2'],
    ['|', '.', '.', '.', '|', '.', '.', '.', '.', '.', '|', '.', '.', '.', '|'],
    ['|', '.', 'b', '.', '_', '.', '[', '-', ']', '.', '_', '.', 'b', '.', '|'],
    ['|', 'p', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'p', '|'],
    ['4', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '3']
];
// # represent player spawn point

buildMap(map);
levels.push(map);

function createImage(src) {
    const image = new Image();
    image.src = src;
    return image;
}

function circleCollidesWithRectangle(circle, rectangle) {
    const padding = Boundary.width / 2 - circle.radius - 1;
    // returns a boolean based on if the player is toucing the boundary
    return (circle.position.y - circle.radius + circle.velocity.y <= rectangle.position.y + rectangle.height + padding
    && circle.position.x + circle.radius + circle.velocity.x >= rectangle.position.x - padding && 
    circle.position.y + circle.radius + circle.velocity.y >= rectangle.position.y - padding
    && circle.position.x - circle.radius + circle.velocity.x <= rectangle.position.x + rectangle.width + padding)
}

let animationId;

function animate() { // function that is called every frame
    animationId = requestAnimationFrame(animate); // calls animate() every frame
    c.clearRect(0, 0, canvas.width, canvas.height); // clears canvas every frame
    // win condition
    if (!pellets.length && !powerUps.length) {
        // you win
        intro.style.display = 'inline';
        intro.style.color = 'green';
        intro.innerHTML = 'You   Win!';
        setTimeout(() => {
            intro.style.display = 'none';
            top_info.hidden = true;
            c.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
            button.style.display = 'inline';
        }, 4000);
        cancelAnimationFrame(animationId);
        setTimeout(() => {
            location.reload();
    }, 2000)
    }

    if (player.position.x < 0) {
        player.position.x = canvas.width;
        player.velocity.x = -5;
    } else if (player.position.x > canvas.width) {
        player.position.x = 0;
        player.velocity.x = 5;
    }

    ghosts.forEach(ghost => { 
        if (ghost.position.x < 0) {
            ghost.position.x = canvas.width;
            ghost.velocity.x = -ghost.speed;
        } else if (ghost.position.x > canvas.width) {
            ghost.position.x = 0;
            ghost.velocity.x = ghost.speed;
        }
     
    });

    if (score > high_score) {
        high_score = score;
        high_score_element.innerHTML = high_score;
    }


    if (keys.w.pressed && lastKey === 'w') {
        // pushes up
        for (let i = 0; i < boundaries.length; i++) {
            if (circleCollidesWithRectangle({...player, velocity: {x: 0, y: -5}}, boundaries[i])) {
                // {...player, velocity: {x: 0, y: -5}} creates a copy of the player object and changes the velocity to {x: 0, y: -5}
                player.velocity.y = 0;
                break; 
            } else {
                player.velocity.y = -5;
            } }
    } else if (keys.a.pressed && lastKey === 'a') {
         // pushes left
        for (let i = 0; i < boundaries.length; i++) {
            if (circleCollidesWithRectangle({...player, velocity: {x: -5, y: 0}}, boundaries[i])) {
                // {...player, velocity: {x: 0, y: -5}} creates a copy of the player object and changes the velocity to {x: -5, y: 0}
                player.velocity.x = 0;
                break; 
            } else {
                player.velocity.x = -5;
            } }
    } else if (keys.s.pressed && lastKey === 's') {
        for (let i = 0; i < boundaries.length; i++) {
            if (circleCollidesWithRectangle({...player, velocity: {x: 0, y: 5}}, boundaries[i])) {
                // {...player, velocity: {x: 0, y: 5}} creates a copy of the player object and changes the velocity to {x: 0, y: 5}
                player.velocity.y = 0;
                break; 
            } else {
                player.velocity.y = 5;
            } }
        // pushes down
    } else if (keys.d.pressed && lastKey === 'd') {
        for (let i = 0; i < boundaries.length; i++) {
            if (circleCollidesWithRectangle({...player, velocity: {x: 5, y: 0}}, boundaries[i])) {
                // {...player, velocity: {x: 5, y: 0}} creates a copy of the player object and changes the velocity to {x: 5, y: 0}
                player.velocity.x = 0;
                break; 
            } else {
                player.velocity.x = 5;
            } }
        // pushes right
    }

    // detect collision between ghosts and players
    for (let i = ghosts.length - 1; i >= 0; i--) {
        const ghost = ghosts[i];
        if (Math.hypot(ghost.position.x - player.position.x, ghost.position.y - player.position.y) < ghost.radius + player.radius) {
            if (ghost.scared) {
                ghosts.splice(i, 1)
                setTimeout(() => {
                    ghost.scared = false;
                }, 250)
                ghost.position.x = ghost.spawnPoint.x;
                ghost.position.y = ghost.spawnPoint.y;
                ghost.velocity.x = ghost.start_velocity.x;
                ghost.velocity.y = ghost.start_velocity.y;
                if (ghost.position.x - 20 < player.position.x < ghost.position.x + 20 && ghost.position.y - 20 < player.position.y < ghost.position.y + 20) {
                    ghosts.push(ghost)
                } else {
                    setTimeout(() => {
                        ghosts.push(ghost)
                    }, 5000)
                }
                
                score += 200;
            } else {
                // round over
                if (lives > 1) {
                    roundOver(player, ghosts, animationId);
                } else {
                    gameOver(animationId);

                }
                lives--;
                lives_element.innerHTML = lives;
            }
    } }
    for (let i = pellets.length - 1; i >= 0; i--) {
        pellets[i].draw();
        if (Math.hypot(pellets[i].position.x - player.position.x, pellets[i].position.y - player.position.y) < pellets[i].radius + player.radius) {
            // checks if player is touching the pellet
            pellets.splice(i, 1);
            score += 10;
            // removes pellet from pellets array
        }
    };

    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].draw();
        if (Math.hypot(powerUps[i].position.x - player.position.x, powerUps[i].position.y - player.position.y) < powerUps[i].radius + player.radius) {
            // player collides with powerup
            powerUps.splice(i, 1);
            score += 50;
            ghosts.forEach(ghost => {
                ghost.scared = true;

                setTimeout(() => {
                    ghost.scared = false;
                }, 7000)   
            })    
        }
        score_element.innerHTML = score;
    };

    boundaries.forEach(boundary => {
        boundary.draw() // draws all boundaries of the game
        if (circleCollidesWithRectangle(player, boundary)) {
            // include the velocity so that players can move when they hit the boundary and so just before hitting the boundary it'll cause there movement to briefly stop
            // checks if player is touching the boundary
            player.velocity.x = 0;
            player.velocity.y = 0;
            // stops player from moving
        }}); 
    player.update(); // updates player position
    ghosts.forEach(ghost => { 
        ghost.update(); // updates ghost position
        const collisions = [];
        boundaries.forEach(boundary => { 
            if (!collisions.includes('right') && circleCollidesWithRectangle({...ghost, velocity: {x: ghost.speed, y: 0}}, boundary)) {
                collisions.push('right');
            } if (!collisions.includes('left') && circleCollidesWithRectangle({...ghost, velocity: {x: -ghost.speed, y: 0}}, boundary)) {
                collisions.push('left');
            } if (!collisions.includes('down') && circleCollidesWithRectangle({...ghost, velocity: {x: 0, y: ghost.speed}}, boundary)) {
                collisions.push('down');
            } if (!collisions.includes('up') && circleCollidesWithRectangle({...ghost, velocity: {x: 0, y: -ghost.speed}}, boundary)) {
                collisions.push('up');
            } 
        });

        if (collisions.length > ghost.prevCollisions.length) ghost.prevCollisions = collisions;
            
        if (JSON.stringify(collisions) !== JSON.stringify(ghost.prevCollisions)) {
            if (ghost.velocity.x > 0) ghost.prevCollisions.push('right');
            else if (ghost.velocity.x < 0) ghost.prevCollisions.push('left');
            else if (ghost.velocity.y > 0) ghost.prevCollisions.push('down');
            else if (ghost.velocity.y < 0) ghost.prevCollisions.push('up');

            const pathways = ghost.prevCollisions.filter(collision => { 
                return !collisions.includes(collision);
                    // filters out the collisions that are no longer happening to find the pathway that the ghost can move through
            });

            const direction = pathways[Math.floor(Math.random() * pathways.length)];
            switch(direction) {
                case 'down':
                    ghost.velocity.y = ghost.speed;
                    ghost.velocity.x = 0;
                    break;
                case 'up':
                    ghost.velocity.y = -ghost.speed;
                    ghost.velocity.x = 0;
                    break;
                case 'right':
                    ghost.velocity.x = ghost.speed;
                    ghost.velocity.y = 0;
                    break;
                case 'left':
                    ghost.velocity.x = -ghost.speed;
                    ghost.velocity.y = 0;
                    break;
                }
            ghost.prevCollisions = [];
            }
    });
    if (player.velocity.x > 0) player.rotation = 0;
    else if (player.velocity.y < 0) player.rotation = (Math.PI / 2) * 3;
    else if (player.velocity.x < 0) player.rotation = Math.PI;
    else if (player.velocity.y > 0) player.rotation = Math.PI / 2;

    score_element.innerHTML = score;

    }

window.addEventListener('keydown', ({key}) => { // event listener for key presses. Moves the player based on key presses
    switch (key) {
        case 'w':
            keys.w.pressed = true;
            lastKey = 'w';
            break;
        case 'a':
            keys.a.pressed = true;
            lastKey = 'a';
            break;
        case 's':
            keys.s.pressed = true;
            lastKey = 's';
            break;
        case 'd':
            keys.d.pressed = true;
            lastKey = 'd';
            break;
    }
})

window.addEventListener('keyup', ({key}) => { // event listener for releasing keys.  This is used to stop the player from moving when the key is released.
    switch (key) {
        case 'w':
            keys.w.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
        case 's':
            keys.s.pressed = false;
            break;
        case 'd':
            keys.d.pressed = false;
            break;
    }
})

button.onclick = function() {
    if (first_game) {
        console.log('beggining game');
        first_game = false;
        
    } else { 
        lives = 3;
        lives_element.innerHTML = lives;
        score = 0;
        score_element.innerHTML = score;
    }
   
    button.style.display = 'none';
    canvas.style.display = 'block';
    top_info.hidden = false;
    animate();
    cancelAnimationFrame(animationId);
    intro.style.display = 'inline';
    setTimeout(() => {
        intro.style.display = 'none'; 
        animate(); 
    }, 3000)   
}
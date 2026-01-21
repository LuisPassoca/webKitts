///////////////////////////////////////////////////////////////////////
////////////  webKitts v1.0 by SonicSpeedster/LuisPassoca  ////////////
///////////////////////////////////////////////////////////////////////

//Setup extension file path
const filePath = chrome.runtime.getURL("");

//Prevents script from running twice (E.g.: The user opens a website wich is already running webKitts)
const checkRunning = document.querySelector('.catElement');
if (checkRunning) {throw new Error('Script is already running!')};

//HTML element injection 
const catContainer = document.createElement('div');
catContainer.className = 'catElement';
catContainer.innerHTML = `<div class="sprite"></div> <div class="name">Kitto</div>`;

document.body.appendChild(catContainer);

///////////////////////////////////////////////////////////////////////
//General functions
function transformCat() {
    if (catData.facing == 0) {catData.facing = 1}

    if (catData.x < 0) {catData.x = 0}
    if (catData.y < 0) {catData.y = 0}
    
    if (catData.x > window.innerWidth - settingsData.scale) {catData.x = window.innerWidth - settingsData.scale}
    if (catData.y > window.innerHeight - settingsData.scale) {catData.y = window.innerHeight - settingsData.scale}
    
    catData.element.style.transform = `translate(${catData.x}px, ${catData.y}px)`;
    catData.sprite.style.transform = `scaleX(${catData.facing})`;
    catData.sprite.style.width = `${settingsData.scale}px`
}

function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clearTimers() {
    //console.log('Cleared timers!')
    clearTimeout(actionTimer);
    clearTimeout(stepTimer);
    clearTimeout(idleTimer);
    clearTimeout(holdTimer);
    clearInterval(animationTimer);
    clearInterval(movingTimer);
    clearInterval(sleepTimer);
    clearInterval(followTimer);
}

///////////////////////////////////////////////////////////////////////
//Function for preloading & caching animation files
let animationCache = [];

let animationList = [
    {name: "Walk", frames: 4},
    {name: "Grab", frames: 4},
    {name: "Sleep", frames: 4}
]

function preloadAnimations(skin) {
    let idleImage = new Image();
    idleImage.src = `${filePath}assets/sprites/${skin}/Idle.png`;
    animationCache.push(idleImage);  

    for (let i = 0; i < animationList.length; i++) {
        for (let j = 1; j <= animationList[i].frames; j++) {
            let image = new Image();
            image.src = `${filePath}assets/sprites/${skin}/${animationList[i].name}${j}.png`;

            animationCache.push(image);  
        }
    }
}

//For clearing the cache when changing skins
function clearAnimationCache() {
    animationCache.length = 0;
}

///////////////////////////////////////////////////////////////////////
//Animation function
let animationTimer;
function doAnimation(animationName, maxFrames, timer) {
    let frame = 1;
    catData.sprite.style.backgroundImage = `url('${filePath}assets/sprites/${settingsData.skin}/${animationName}${frame}.png')`;

    animationTimer = setInterval(() => {
        frame += 1;
        if (frame > maxFrames) {frame = 1};
        catData.sprite.style.backgroundImage = `url('${filePath}assets/sprites/${settingsData.skin}/${animationName}${frame}.png')`;
    }, timer)
}

///////////////////////////////////////////////////////////////////////
//Action picking function

let actionTimer;
function doAction() {
    clearTimers();
    catData.state = 0
    catData.sprite.style.backgroundImage = `url(${filePath}assets/sprites/${settingsData.skin}/Idle.png)`;
    if (catData.energy < 0) {catData.energy = 0}

    //console.log('Picking action!')
    //console.log('Remaining energy: '  + catData.energy)

    let action;
    if (catData.energy <= 50) {action = randomRange(1, 10)}
    else {action = randomRange(3, 10)};

    if (catData.energy <= 0) {action = 1};
    
    if (!settingsData.move) {
        do {
            action = randomRange(1, 10);
        } while ((action > 2) && (action < 9))
    }

    actionTimer = setTimeout (() => {
        if ((action > 0) && (action <= 2)) {doSleep()};
        if ((action > 2) && (action <= 5)) {doMove()};
        if ((action > 5) && (action <= 7)) {doFollow()};
        if ((action > 7) && (action <= 10)) {doIdle()};
        catData.state = action;
    }, randomRange(5000, 30000))
}

///////////////////////////////////////////////////////////////////////
//Random movement function

function doMove() {
    clearTimers();
    doAnimation('Walk', 4, 250);
    //console.log('Cat is walking!');
    
    let walkingDirections = [];
    let movements = randomRange(1, 3);

    for (let i = 0; i < movements; i++) {
        walkingDirections.push({xdir: randomRange(-5, 5), ydir: randomRange(-5, 5)});
    }

    let steps = movements- 1;

    moveTowards(walkingDirections, steps);
}

let stepTimer;
let movingTimer;
function moveTowards(walkingDirections, steps) {

    function doNextStep() {
        catData.energy -= 10;
        let nextStep = steps - 1;
        if (nextStep < 0) {doAction(); return};

        moveTowards(walkingDirections, nextStep);
    }

    let magnitude = Math.sqrt((walkingDirections[steps].xdir ** 2) + (walkingDirections[steps].ydir ** 2));

    if (magnitude == 0) {
        doNextStep();
        return;
    }

    let xdir = walkingDirections[steps].xdir / magnitude;
    let ydir = walkingDirections[steps].ydir / magnitude;
    let spd = 3;

    movingTimer = setInterval(() => {
        let checkX = catData.x + (xdir * spd);
        let checkY = catData.y + (ydir * spd);

        if ((checkX < 0) || (checkX > window.innerWidth - settingsData.scale)) {xdir = -xdir;}
        if ((checkY < 0) || (checkY > window.innerHeight - settingsData.scale)) {ydir = -ydir;}

        catData.x += xdir * spd;
        catData.y += ydir * spd;
        catData.facing = Math.sign(xdir);

        transformCat();
    }, 20)

    stepTimer = setTimeout(() => {
        clearInterval(movingTimer);
        doNextStep();
    }, randomRange(2000, 5000))
}

///////////////////////////////////////////////////////////////////////
//Following mouse function

let followTimer;
function doFollow() {
    catData.energy -= 50;
    doAnimation('Walk', 4, 250);
    //console.log('Cat is following the mouse!')

    followTimer = setInterval(() => {
        let pointX = mouseX
        let pointY = mouseY

        let moveVec = {
            x: pointX - catData.x - settingsData.scale/2,
            y: pointY - catData.y - settingsData.scale/2
        }

        let magnitude = Math.sqrt((moveVec.x ** 2) + (moveVec.y ** 2));
        if (magnitude == 0) {
            doAction();
            return;
        }
        
        let normalizedVec = {
            x: moveVec.x / magnitude,
            y: moveVec.y / magnitude
        }

        let spd = 3;
        
        if (magnitude < spd) {spd = magnitude}

        catData.x += normalizedVec.x * spd;
        catData.y += normalizedVec.y * spd;
        catData.facing = Math.sign(moveVec.x);

        transformCat();
    }, 20)
}

///////////////////////////////////////////////////////////////////////
//Sleeping function

let sleepTimer;
function doSleep() {
   // console.log('Cat is sleeping!')
    doAnimation('Sleep', 4, 750)

    sleepTimer = setInterval(() => {
        if (catData.energy >= 100) {doAction(); return}
        //console.log('Recovering energy... current energy: ' + catData.energy)
        catData.energy += 10;
    }, 10000)
}

///////////////////////////////////////////////////////////////////////
//Idling function

let idleTimer;
function doIdle() {
    //console.log('Cat is idling!');

    idleTimer = setTimeout(() => {
        doAction();
    }, randomRange(5000, 20000))
}

///////////////////////////////////////////////////////////////////////
//Setup cat 
let catData = {
    element: document.querySelector(".catElement"),
    sprite: document.querySelector(".catElement .sprite"),
    name: document.querySelector(".catElement .name"),
    x: 0,
    y: 0,
    facing: 1,
    energy: randomRange(5, 10) * 10,
    state: 0
}

//Debug reset
//chrome.storage.local.clear();

///////////////////////////////////////////////////////////////////////
//Cat grabbing and mouse coordinates functions

let canMeow = true;
let meowAudio = new Audio(`${filePath}assets/sounds/meow1.mp3`)
let holdTimer;
catData.element.addEventListener('mousedown', (event) => {
    if ((event.button === 1) || (event.button === 2)) {return}
    //console.log('Cat clicked!')
    event.preventDefault();
    clearTimers();

    if ((canMeow) && (settingsData.audio)) {
        canMeow = false;
        meowAudio.play();
        setTimeout(() => {canMeow = true}, 1000)
    }

    catData.sprite.addEventListener('mouseleave', releaseCat);
    document.addEventListener('mouseup', releaseCat);
    document.body.classList.add('disableHover');

    holdTimer = setTimeout(() => {
        //console.log('Cat held!');
        doGrab();
        doAnimation('Grab', 4, 250);
        document.addEventListener('mousemove', doGrab);
        catData.sprite.removeEventListener('mouseleave', releaseCat);
    }, 500)
})

function releaseCat() {
    clearTimeout(holdTimer)
    catData.sprite.removeEventListener('mouseleave', releaseCat);
    document.removeEventListener('mouseup', releaseCat);
    document.removeEventListener('mousemove', doGrab);
    document.body.classList.remove('disableHover');

    //if (settingsData.move) {doAction()};
    doAction();
}

function doGrab() {
    catData.x = mouseX - settingsData.scale/2;
    catData.y = mouseY - settingsData.scale/4;
    
    transformCat();
}

let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
function getMouseCoords(event) {
    mouseX = event.clientX
    mouseY = event.clientY
}

///////////////////////////////////////////////////////////////////////
//Starting script
let settingsData = {
    enable: true,
    audio: true,
    move: true,
    scale: 100,
    skin: 'Kitto'
}

///////////////////////////////////////////////////////////////////////
//Managing settings loading and updating with changes

function loadCat() {
    catData.sprite.style.backgroundImage = `url(${filePath}assets/sprites/${settingsData.skin}/Idle.png)`;
    catData.element.style.display = 'flex';
    preloadAnimations(settingsData.skin)
    transformCat();

    //if (settingsData.move) {doAction()};
    doAction()
}

function runExtension() {
    chrome.storage.local.get(['settings'], (result) => {
        if (result.settings) {settingsData = result.settings};
        
        if ((catData.x == 0) && (catData.y == 0)) {
            catData.x = randomRange(0, window.innerWidth - settingsData.scale)
            catData.y = randomRange(window.innerHeight/2, window.innerHeight - settingsData.scale)
        }

        if (!settingsData.enable) {return};
        loadCat();
    })
}

chrome.storage.onChanged.addListener((change, area) => {
    //Triggers when settings are changed
    if ((area != 'local') || (document.visibilityState !== 'visible') || (!change?.settings?.oldValue)) {return};
    
    settingsData = change.settings.newValue
    
    
    if (change.settings.oldValue.enable != change.settings.newValue.enable) {
        if (settingsData.enable) {loadCat()}
        else {catData.element.style.display = 'none'; clearTimers()};
    }
    
    if (!settingsData.enable) {return}
    if (change.settings.oldValue.scale != change.settings.newValue.scale) {
        transformCat();
    } 
    
    if (change.settings.oldValue.move != change.settings.newValue.move) {
        if (settingsData.move) {doAction()}
        else {clearTimers(); doAction()};
    } 
})

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
        runExtension();
    } else {
        clearTimers();
    }
})

/*
window.addEventListener('beforeunload', () => {
    //Triggers when user closes window
    })
    */

///////////////////////////////////////////////////////////////////////
//On 1st load
runExtension();
document.addEventListener('mousemove', getMouseCoords);
window.addEventListener('resize', transformCat)

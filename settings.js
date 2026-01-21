//File path setup
const filePath = chrome.runtime.getURL("");

//Animations preloader
const animationList = [
    {name: "logo", frames: 3},
    {name: "moveButtontrue", frames: 0},
    {name: "moveButtonfalse", frames: 0},
    {name: "audioButtontrue", frames: 0},
    {name: "audioButtonfalse", frames: 0}
]

let animationCache = []

for (let i = 0; i < animationList.length; i++) {
    for (let j = 1; j < animationList[i].frames + 1; j++) {
        let image = new Image();

        image.src = `${filePath}assets/images/${animationList[i].name}${j}.png`;

        animationCache.push(image);  
    }

    if (animationList[i].frames == 0) {
        let image = new Image();

        image.src = `${filePath}assets/images/${animationList[i].name}.png`;

        animationCache.push(image);  
    }
}

//Setup variables for the elements
const title = {
    element: document.querySelector('#title'),
    image: document.querySelector('#logo'),
    checkbox: document.querySelector('#enabled-checkbox')
}

const audioButton = {
    element: document.querySelector('#audio-button'),
    image: document.querySelector('#audio-button .button')
}

const moveButton = {
    element: document.querySelector('#move-button'),
    image: document.querySelector('#move-button .button')
}

const resizeButton = {
    element: document.querySelector('#resize-button'),
    image: document.querySelector('#resize-button .button'),
    menu: document.querySelector('#resize-container'),
    slider: document.querySelector('#slider-input'),
    sliderText: document.querySelector('#slider-value')
}

//Load images for each button
title.image.style.backgroundImage = `url('${filePath}assets/images/logo1.png')`

audioButton.image.style.backgroundImage = `url('${filePath}assets/images/audioButtontrue.png')`

moveButton.image.style.backgroundImage = `url('${filePath}assets/images/moveButtontrue.png')`

resizeButton.image.style.backgroundImage = `url('${filePath}assets/images/resizeButton.png')`

//Setup data
let settingsData = {
    enable: true,
    audio: true,
    move: true,
    scale: 100,
    skin: 'Kitto'
}

//Read data and change buttons accordingly
chrome.storage.local.get(['settings'], (result) => {
    if (result.settings) {
        settingsData = result.settings;
        
        title.checkbox.checked = settingsData.enable;

        moveButton.image.style.backgroundImage = `url('${filePath}assets/images/moveButton${settingsData.move}.png')`
        audioButton.image.style.backgroundImage = `url('${filePath}assets/images/audioButton${settingsData.audio}.png')`

        resizeButton.slider.value = settingsData.scale
        resizeButton.sliderText.value = settingsData.scale
    }
})

//Logo animation
function animateLogo(currentFrame) {
    currentFrame += 1;
    if (currentFrame > 3) {currentFrame = 1}

    title.image.style.backgroundImage = `url('${filePath}assets/images/logo${currentFrame}.png')`

    setTimeout(() => {
        animateLogo(currentFrame)
    }, 500)
}

animateLogo(1);


//Setup buttons
title.element.addEventListener('click', () => {
    title.checkbox.checked = !title.checkbox.checked
    settingsData.enable = !settingsData.enable

    saveData();
})

moveButton.element.addEventListener('click', () => {
    settingsData.move = !settingsData.move

    moveButton.image.style.backgroundImage = `url('${filePath}assets/images/moveButton${settingsData.move}.png')`
    saveData();
})

audioButton.element.addEventListener('click', () => {
    settingsData.audio = !settingsData.audio

    audioButton.image.style.backgroundImage = `url('${filePath}assets/images/audioButton${settingsData.audio}.png')`
    saveData();
})

let displayResize = false;
resizeButton.element.addEventListener('click', () => {
    displayResize = !displayResize

    if (displayResize) {resizeButton.menu.style.display = 'flex'}
    else {resizeButton.menu.style.display = 'none'}
})

function saveData() {
    chrome.storage.local.set({'settings': settingsData})
}

//TODO make user unable to write letters in the value input field
//Links resize sliders and input fields
resizeButton.slider.addEventListener('input', function() {
    resizeButton.sliderText.value = this.value
    settingsData.scale = this.value

    saveData();
})

resizeButton.sliderText.addEventListener('change', function() {
    if (this.value < 100) {this.value = 100}
    if (this.value > 500) {this.value = 500}

    resizeButton.slider.value = this.value
    settingsData.scale = this.value

    saveData();
})


//Button pop (add later)
/*
function buttonPop(buttonElement) {
    let saveWidth = buttonElement.clientWidth

    buttonElement.style.width = '80px'

    setTimeout(() => {
        buttonElement.style.width = `${saveWidth}px`
    }, 100)
}
*/
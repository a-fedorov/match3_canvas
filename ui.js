var screens = {
  menuPage: document.getElementById('menuPage'),
  gameModePage: document.getElementById('gameModePage'),
  gamePage: document.getElementById('gamePage'),
  gameOverPage: document.getElementById('gameOverPage'),
  nextLevelPage: document.getElementById('nextLevelPage'),
}

var buttons = {
  start: document.getElementById('start'),
  back: document.getElementById('backToGameMode'),
  backToMainMenu: document.getElementById('backToMainMenu'),
  normalMode: document.getElementById('normal'),
  timeMode: document.getElementById('time'),
  endlessMode: document.getElementById('endless')
}

var panels = {
  top: document.getElementById('topPanel'),
  bottom: document.getElementById('bottomPanel'),
}

var progress = {
  time: document.getElementById('timeProgress'),
  level: document.getElementById('levelProgress'),
}

var indicators = {
  time: document.getElementById('timeIndicator'),
  level: document.getElementById('levelIndicator'),
  score: document.getElementById('score'),
}

// Установка событий
buttons.start.addEventListener('click', function(){
  show(screens.gameModePage);
  hide(screens.menuPage);
}, false);

buttons.back.addEventListener('click', function(){
  show(screens.gameModePage);
  hide(screens.gamePage);
}, false);

buttons.backToMainMenu.addEventListener('click', function(){
  show(screens.menuPage);
  hide(screens.gameModePage);
}, false);

buttons.normalMode.addEventListener('click', function(){
  show(progress.level);
  hide(progress.time);
  startGame('normal');
}, false);

buttons.timeMode.addEventListener('click', function(){
  show(progress.time);
  hide(progress.level);
  startGame('time');
}, false);

buttons.endlessMode.addEventListener('click', function(){
  hide(panels.bottom);
  startGame('endless');
}, false);


function updateTimeIndicator(percent){
  indicators.time.style.width = percent + '%';
}

function updateLevelIndicator(percent){
  indicators.level.style.width = percent + '%';
}

function updateScoreLabel(points){
  indicators.score.innerHTML = 'Score: ' + points;
}


var canvas = document.getElementById('board');
var game = new Game(canvas);

function startGame(mode){
  show(screens.gamePage);
  hide(screens.gameModePage);

  game.start(mode);
}

function show(el){
  el.style.opacity = 1;
  el.style.visibility = 'visible';
}

function hide(el){
  el.style.opacity = 0;
  el.style.visibility = 'hidden';
}

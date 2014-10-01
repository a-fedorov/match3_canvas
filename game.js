
function Game(canvas) {
  this.board = new Board(canvas);
  console.log('create');
}

Game.prototype = {
  start: function (mode) {
    this.board.spawn();
    this.board.setGameMode(mode);

    if (mode == 'normal'){
      this.startNormalMode();
    } else if (mode == 'time'){
      this.startTimeMode();
    } else if (mode == 'endless'){
      this.startEndlessMode();
    }

    this.startAnimation();
  },


  startNormalMode: function(){
    var level = 1;
    updateLevelIndicator(0);
    this.board.setLevelPoints(level);
  },

  startTimeMode: function () {
    this.board.setLevelTimer(true);
  },

  startEndlessMode: function () {
    
  },

  update: function(time) {
    requestAnimationFrame(this.update.bind(this, time));

    TWEEN.update();
    this.board.draw();
  },

  startAnimation: function() {
    requestAnimationFrame(this.update.bind(this));
  }
}
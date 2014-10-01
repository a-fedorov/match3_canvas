
function Game(canvas) {
  this.board = new Board(canvas);
}

Game.prototype = {
  start: function (mode) {
    this.board.spawn();

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
    // this.board.setLevelPoints();
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
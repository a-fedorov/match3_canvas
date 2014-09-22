	var requestId = 0;

  // Constructor for Gem objects to hold data for all drawn objects.
	// For now they will just be defined as rectangles.
	function Gem(x, y, w, h, id, fill) {
	  this.x = x || 0;
	  this.y = y || 0;
	  this.w = w || 1;
	  this.h = h || 1;
    this.id = id || 0;
    this.row = 0;
    this.col = 0;
	  this.fill = fill || '#AAAAAA';
	}

	// Draws this shape to a given context
	Gem.prototype.draw = function(ctx) {
	  ctx.fillStyle = this.fill;
	  ctx.fillRect(this.x, this.y, this.w, this.h);
	}

	// Determine if a point is inside the shape's bounds
	Gem.prototype.contains = function(mx, my) {
	  // All we have to do is make sure the Mouse X,Y fall in the area between
	  // the shape's X and (X + Width) and its Y and (Y + Height)
	  return  (this.x <= mx) && (this.x + this.w >= mx) &&
	          (this.y <= my) && (this.y + this.h >= my);
	}


  function Board(canvas){
    this.BOARD_COLS = 8;
    this.BOARD_ROWS = 8;

    this.gems = [];

    this.offsetX = this.offsetY = 5;
    this.gemWidth = this.gemHeight = 90;
    
    this.gemsColor = [
      'rgba(241, 196, 15, .6)', /* yeloow */
      'rgba(46, 204, 113, .6)', /* green */
      'rgba(52, 152, 219, .6)', /* blue */
      'rgba(231, 76, 60, .6)',  /* red */
      'rgba(155, 89, 182, .6)', /* violet */
    ];

    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');
    
    // This complicates things a little but but fixes mouse co-ordinate problems
    // when there's a border or padding. See getMouse for more detail
    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
    if (document.defaultView && document.defaultView.getComputedStyle) {
      this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)     || 0;
      this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)      || 0;
      this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
      this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)  || 0;
    }
    // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
    // They will mess up mouse coordinates and this fixes that
    var html = document.body.parentNode;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;

    // **** Keep track of state! ****
    
    this.valid = false; // when set to false, the canvas will redraw everything
    this.gems = [];  // the collection of things to be drawn
    // the current selected object. In the future we could turn this into an array for multiple selection
    this.selection = [];
    
    // **** Then events! ****
    var self = this;
    
    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false); 
    canvas.addEventListener('click', function(e) { 
      self.selectGem(e);
      // self.findAndRemoveMatches();

      if (self.selection.length > 1) self.swapGems(self.selection[0], self.selection[1])
      // if (!requestId) game.startAnimation();
    }, true );


    this.selectionColor = 'rgba(0,0,0,.8)';
    this.selectionWidth = 3;
  }


  Board.prototype.selectGem = function(e) {
    var mouse = this.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    var gems = this.gems;

    var st = [];

    for (var i = 0; i < this.BOARD_ROWS; i++){
      for (var j = 0; j < this.BOARD_COLS; j++){
        if (gems[i][j].contains(mx, my)) {
          var mySel = gems[i][j];
          // Keep track of where in the object we clicked
          // so we can move it smoothly (see mousemove)
          this.selection.push(mySel);
          this.valid = false;

          st = this.selection;

          if (st.length == 2){

            if (st[0].id == st[1].id){
              console.log('same');
              this.countSameColorGems(st[0], 1, 0);

              this.selection = [];
            } else if (Math.abs(st[0].col - st[1].col) == 1 && st[0].row == st[1].row || 
                       Math.abs(st[0].row - st[1].row) == 1 && st[0].col == st[1].col){
              
              // console.log('neibour');
              
              this.swapGems(st[0], st[1]);
              this.selection = [];
            }

            st.shift();
          } 

          if (st.length > 2){ st.length = 2; };

          return;
        }
      }
    }



    // havent returned means we have failed to select anything.
    // If there was an object selected, we deselect it
    if (this.selection) {
      this.selection = [];
      this.valid = false; // Need to clear the old selection border
    }
  }

Board.prototype.getAllGems = function(){
  return this.gems;
}


  Board.prototype.swapGems = function(t1, t2){
    var tweenGemOneX = new TWEEN.Tween(t1).to({x: t2.x}, 500).easing(TWEEN.Easing.Quartic.Out).start();
    var tweenGemOneY = new TWEEN.Tween(t1).to({y: t2.y}, 500).easing(TWEEN.Easing.Quartic.Out).start();

    var tweenGemTwoX = new TWEEN.Tween(t2).to({x: t1.x}, 500).easing(TWEEN.Easing.Quartic.Out).start();
    var tweenGemTwoY = new TWEEN.Tween(t2).to({y: t1.y}, 500).easing(TWEEN.Easing.Quartic.Out).start();

    // tweenGemOneX.onComplete(function(){
      // game.stopAnimation();
    // })


    var gems = this.getAllGems();
    var props = ['x', 'y', 'row', 'col'];

    props.forEach(function(p){
      var tempProp = t1[p];
      t1[p] = t2[p];
      t2[p] = tempProp;
    })

    gems[t1.row][t1.col] = t1;
    gems[t2.row][t2.col] = t2;

    this.findAndRemoveMatches();


    // tweenGemOneX.repeat(1);
    // tweenGemTwoX.repeat(1);

  }



  Board.prototype.moveGem = function(){

  }

  Board.prototype.countSameColorGems = function() {

  },


  Board.prototype.findAndRemoveMatches = function() {
    var matches = this.lookForMatches();
    var gems = this.getAllGems();
    console.log(matches);
    for(var i = 0; i < matches.length; i++){
      var numPoints = (matches[i].length - 1);
      for(var j = 0; j < matches[i].length; j++){
        // console.log(matches[i][j].col);
        gems[matches[i][j].row][matches[i][j].col] = undefined;
        this.affectAbove(matches[i][j]);
      }
    }


  }

  Board.prototype.lookForMatches = function() {
    var matchList = [];

    for(var row = 0; row < this.BOARD_ROWS; row++){
      for(var col = 0; col < this.BOARD_COLS; col++){
        var match = this.getMatchHoriz(col, row);
        if(match.length > 2){
          matchList.push(match);
          col += match.length - 1;
        }
      }
    }

    for(var col = 0; col < this.BOARD_COLS; col++){
      for(var row = 0; row < this.BOARD_ROWS; row++){
        var match = this.getMatchVert(col, row);
        if(match.length > 2){
          matchList.push(match);
          row += match.length - 1;
        }
      }
    }

    return matchList;
  }

  Board.prototype.getMatchHoriz = function(col, row){
    var match = [];
    var gems = this.getAllGems();

    for(var i = 0; col + i < this.BOARD_COLS; i++){
      if(gems[col][row].fill == gems[col + i][row].fill){
        match.push(gems[col + i][row]);
      } else {
        return match;
      }
    }

    return match;
  }

  Board.prototype.getMatchVert = function(col, row){
    var match = [];
    var gems = this.getAllGems();

    for(var i = 0; row + i < this.BOARD_ROWS; i++){
      if(gems[col][row].fill == gems[col][row + i].fill){
        match.push(gems[col][row + i]);
      } else {
        return match;
      }
    }

    return match;
  }


Board.prototype.affectAbove = function(gem) {
  var gems = this.getAllGems();
  for (var row = gem.row - 1; row >= 0; row--){
    if (gems[row][gem.col] != undefined){
      // console.log(row, gem.col, gems[row][gem.col])
      gems[row][gem.col].y += this.gemHeight;
      // gems[row][gem.col].row += 1;
      // gems[row + 1][gem.col] = gems[row][gem.col];
      // gems[row][gem.col] = undefined;
    }
  }

  // this.draw();
}

  Board.prototype.spawn = function(){
    var tw = this.gemWidth;
    var th = this.gemHeight;
    var w = tw - this.offsetX;
    var h = th - this.offsetY;

    for (var i = 0; i < this.BOARD_ROWS; i++){
      this.gems[i] = [];

      for (var j = 0; j < this.BOARD_COLS; j++){
        var row = j * tw;
        var col = i * th;
        var id = i * this.BOARD_ROWS + j;
        var color = this.gemsColor[ Math.floor( Math.random() * this.gemsColor.length )];

        this.addGem(new Gem(row + this.offsetX, col + this.offsetY, w, h, id, color), i, j)
      }
    }

    this.render();
  }


  Board.prototype.render = function(){
    this.draw();
  }


  Board.prototype.addGem = function(shape, i, j) {
    shape.row = i;
    shape.col = j;
    this.gems[i][j] = shape;
    this.valid = false;
  }


  Board.prototype.clear = function() {

    this.ctx.clearRect(0, 0, this.width, this.height);
  }


  // While draw is called as often as the INTERVAL variable demands,
  // It only ever does something if the canvas gets invalidated by our code
  Board.prototype.draw = function() {

    // if our state is invalid, redraw and validate!
    // if (!this.valid) {

      var ctx = this.ctx;
      var gems = this.gems;
      this.clear();
      
      // ** Add stuff you want drawn in the background all the time here **
      
      // draw all gems
      for (var i = 0; i < this.BOARD_ROWS; i++){
        for (var j = 0; j < this.BOARD_COLS; j++){
          if (gems[i][j] == undefined) continue;
          gems[i][j].draw(ctx);
        }
      }
      
      // draw selection
      // right now this is just a stroke along the edge of the selected Gem
      var length = this.selection.length;
      // if (length > 2){ length = 2}
      if (length > 0) {
        for (var i = 0; i < length; i++){
          var mySel = this.selection[i];

          ctx.lineWidth = this.selectionWidth;
          ctx.strokeStyle = this.selectionColor;
          ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
        }
      }
      
      // ** Add stuff you want drawn on top all the time here **
      // this.valid = true;
    // }
  }


  // Creates an object with x and y defined, set to the mouse position relative to the state's canvas
  // If you wanna be super-correct this can be tricky, we have to worry about padding and borders
  Board.prototype.getMouse = function(e) {
    var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
    
    // Compute the total offset
    if (element.offsetParent !== undefined) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }

    // Add padding and border style widths to offset
    // Also add the <html> offsets in case there's a position:fixed bar
    offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;
    
    // We return a simple javascript object (a hash) with x and y defined
    return { x: mx, y: my };
  }


  // function init() {
  //   var board = new Board(document.getElementById('board'));
  //   board.spawn();

  //   board.update();
  // }


// Board.prototype.update = function() {
//   requestAnimationFrame(this.update.bind(this));
//   TWEEN.update();
//   this.draw();
// }


// var game = {
//   board: undefined,

//   init: function(){
//     this.board = new Board(document.getElementById('board'))
//     this.board.spawn();

//     console.log('init');
//     game.start();
//   },

//   start: function(){
//     console.log('start');    
//     requestAnimationFrame(game.update);
//   },

//   update: function(){
//     requestAnimationFrame(game.update);

//     TWEEN.update();
//     game.board.draw();    
//   },

// }


function Game(canvas) {
  this.board = new Board(canvas);
}

Game.prototype.start = function() {
  this.board.spawn();
  console.log('start');

  // requestId = requestAnimationFrame(this.update.bind(this));
  this.startAnimation();
}


Game.prototype.update = function() {
  requestId = requestAnimationFrame(this.update.bind(this));

  // console.log('update');

  TWEEN.update();
  this.board.draw();
}


Game.prototype.startAnimation = function() {
  // console.log('start animation');
  requestId = requestAnimationFrame(this.update.bind(this));
}

Game.prototype.stopAnimation = function() {
  // console.log('stop animation')
  if(requestId)
    cancelAnimationFrame(requestId);
  requestId = 0;
}
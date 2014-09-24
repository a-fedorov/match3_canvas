  var requestId = 0;

  // Constructor for Gem objects to hold data for all drawn objects.
  // For now they will just be defined as rectangles.
  function Gem(x, y, w, h, fill) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 1;
    this.h = h || 1;
    // this.id = id || 0;
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

  Gem.prototype.move = function(position){
    // console.log(position)
  }

  Gem.prototype.addTween = function(options){
    if (typeof(options) != 'object') return;

    var position = options.position;
    var duration = options.duration;
    var ease = options.ease;
    var delay = options.delay || 0;
    var run = options.run || false;

    var tween = new TWEEN.Tween(this).to(position, duration).delay(delay).easing(ease);
    if (run == true){
      tween.start();
    }
    return tween;
  }

  function Board(canvas){
    this.BOARD_COLS = 8;
    this.BOARD_ROWS = 8;

    this.gems = [];

    this.offsetX = this.offsetY = 5;
    this.gemWidth = this.gemHeight = 90;
    this.gemSizeSpaced = this.gemWidth + this.offsetX;

    this.deletedGem = [];

    
    this.gemsColor = [
      'rgba(52,  73,  94,  .5)',
      'rgba(241, 196, 15,  .6)', /* yeloow */
      'rgba(46,  204, 113, .6)', /* green */
      'rgba(52,  152, 219, .6)', /* blue */
      'rgba(231, 76,  60,  .6)',  /* red */
      'rgba(155, 89,  182, .6)', /* violet */
    ];

    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');
    
    // This complicates things a little but but fixes mouse co-ordinate problems
    // when there's a border or padding. See getMouse for more detail
    var stylePaddingLeft, tsylePaddingTop, styleBorderLeft, styleBorderTop;
    
    this.fixCanvasMouseCoord();


    // **** Keep track of state! ****
    
    // this.valid = false; // when set to false, the canvas will redraw everything
    this.gems = [];  // the collection of things to be drawn
    // the current selected object. In the future we could turn this into an array for multiple selection
    this.selection = [];
    
    // **** Then events! ****
    var self = this;
    
    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false); 
    canvas.addEventListener('click', function(e) { self.selectGem(e); }, true );

    this.selectionColor = 'rgba(0,0,0,.8)';
    this.selectionWidth = 3;
  }

  Board.prototype.fixCanvasMouseCoord = function(){
    var canvas =  this.canvas;
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


  Board.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
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

        this.addGem(new Gem(row + this.offsetX, col + this.offsetY, w, h, color), i, j)
      }
    }
  }


  Board.prototype.addGem = function(gem, i, j) {
    gem.row = i;
    gem.col = j;
    this.gems[i][j] = gem;
    this.valid = false;

    return this.gems[i][j];
  }


  Board.prototype.selectGem = function(e) {
    var mouse = this.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    var gems = this.gems;

    var st = [];

    for (var i = 0; i < this.BOARD_ROWS; i++){
      for (var j = 0; j < this.BOARD_COLS; j++){
        if (gems[i][j] !== undefined && gems[i][j].contains(mx, my)) {
          var mySel = gems[i][j];
          // Keep track of where in the object we clicked
          // so we can move it smoothly (see mousemove)
          this.selection.push(mySel);
          this.valid = false;

          st = this.selection;

          if (st.length == 2){
            if (st[0].row == st[1].row && st[0].col == st[1].col){
              // console.log('same');
              console.log(st[0].row, st[0].col, st[0].y)
              this.selection = [];

            } else if (Math.abs(st[0].col - st[1].col) == 1 && st[0].row == st[1].row || 
                       Math.abs(st[0].row - st[1].row) == 1 && st[0].col == st[1].col){
              
              // console.log('neibour');                      
              this.swapGems(st[0], st[1]);

              var matches = this.lookForMatches();
              if (matches.length == 0){
                this.swapGems(st[0], st[1], true)
              }
              

              this.selection = [];
            }
            st.shift();
          } 

          if (st.length > 2){ 
            st.length = 2; 
          };

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


  Board.prototype.swapGems = function(t1, t2, backFlag){
    var duration = 300;
    var ease = TWEEN.Easing.Linear.None;
    // var ease = TWEEN.Easing.Quintic.Out

    var tweenGemOne = t1.addTween({
      position: {
        x: t2.x,
        y: t2.y
      },

      duration: duration,
      ease: ease,
      run: true,
    });

    var tweenGemTwo = t2.addTween({
      position: {
        x: t1.x,
        y: t1.y
      },

      duration: duration,
      ease: ease,
      run: true,
    });

    tweenGemOne.onComplete(this.findAndRemoveMatches.bind(this));
    // var self = this;

    if (backFlag == true){
      tweenGemOne.repeat(1);
      tweenGemTwo.repeat(1);
    }

    var gems = this.getAllGems();
    var props = ['x', 'y', 'row', 'col'];

    props.forEach(function(p){
      var tempProp = t1[p];
      t1[p] = t2[p];
      t2[p] = tempProp;
    })

    gems[t1.row][t1.col] = t1;
    gems[t2.row][t2.col] = t2;


    tweenGemTwo.onComplete(function(){

    })

  }



  Board.prototype.findAndRemoveMatches = function() {
    var matches = this.lookForMatches();

    if (matches.length == 0){
      // console.log('empty');
      // console.log(this.selection)
      return false;
    }
    // console.log(matches.length)
    // console.log(matches)
    var gems = this.getAllGems();
    var tweenOut;

    for (var i = 0; i < matches.length; i++){
      var numPoints = (matches[i].length - 1);
      var deletedCount = 0;
      for (var j = 0; j < matches[i].length; j++){
        var m = matches[i][j];

        if (gems[m.row][m.col]){
          var xNew = this.gemHeight * this.BOARD_ROWS + 200;

          // tweenOut = new TWEEN.Tween(gems[m.row][m.col])
          //   .to({x: -100}, 500)
          //   .easing(TWEEN.Easing.Linear.None)
          //   // .delay(1000)
          //   .start();

            tweenOut = gems[m.row][m.col].addTween({
              position: {x: -200},
              duration: 200,
              ease: TWEEN.Easing.Linear.None,
              run: true
            })
          
              gems[m.row][m.col] = undefined;
            tweenOut.onStart(function(){
              console.log(this)
            })
            this.affectAbove(m) 

            tweenOut.onComplete(function(){
            });

          // tweenOut.onComplete(this.affectAbove.bind(this, m));

      }
      }
    }

    if (tweenOut){
      tweenOut.onComplete(this.refill.bind(this));
    }

    return true;
  }

  Board.prototype.deleteAndRefill = function(gem) {
    
    this.affectAbove(gem);
    this.refill();
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
      if(gems[col][row] !== undefined && 
         gems[col+i][row] !== undefined &&
         gems[col][row].fill == gems[col + i][row].fill){
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
      if(gems[col][row] !== undefined && 
         gems[col][row+i] !== undefined && 
         gems[col][row].fill == gems[col][row + i].fill){
        match.push(gems[col][row + i]);
      } else {
        return match;
      }
    }

    return match;
  }


  Board.prototype.affectAbove = function(gem) {
    for (var row = gem.row - 1; row >= 0; row--){
      if(this.gems[row][gem.col] !== undefined){
        var yNew = Math.floor(this.gems[row][gem.col].y + this.gemHeight);
        
        var tweenDown = this.gems[row][gem.col].addTween({
          position: {y: yNew},
          duration: 800,
          ease: TWEEN.Easing.Bounce.Out,
          run: true
        });



        this.gems[row][gem.col].y = yNew;
        this.gems[row][gem.col].row += 1;
        this.gems[row + 1][gem.col] = this.gems[row][gem.col];
        this.gems[row][gem.col] = undefined;

      } 
    }

    // console.log(this.getAllGems())

  }



  Board.prototype.refill = function(){
    var gems = this.getAllGems();

    // console.log(gems);

    var tw = this.gemWidth;
    var th = this.gemHeight;
    var w = tw - this.offsetX;
    var h = th - this.offsetY;
    var yNew = -Math.floor(this.gemHeight * this.BOARD_ROWS);

    var tweenDown;

    for(var row = 0; row < this.BOARD_ROWS; row++){
      yNew = row * this.gemHeight +this.offsetY;

      for(var col = 0; col < this.BOARD_COLS; col++){

          if(gems[row][col] == undefined){
            var r = col * tw;
            var c = row * th;
            var color = this.gemsColor[ Math.floor( Math.random() * this.gemsColor.length )];
            var gem = new Gem(r + this.offsetX, -h, w, h, color);
            this.addGem(gem, row, col);

            // console.log(gem)

            tweenDown = new TWEEN.Tween(gem)
              .to({y: yNew}, 800)
              .easing(TWEEN.Easing.Bounce.Out)
              .start();

            // tweenDown = gem.addTween({
            //   position: {x: yNew},
            //   duration: 800,
            //   ease: TWEEN.Easing.Bounce.Out,
            // })
          }
      }
    }

    if (tweenDown) tweenDown.onComplete(this.findAndRemoveMatches.bind(this));

  }

/*
  Board.prototype.lookForPossibles = function(){
    for(var col = 0; row < this.row; BOARD_ROWS++){
      for(var row = 0; col < this.col; BOARD_COLS++){

        // воможна горизонтальная, две подряд 
        if (this.matchPattern(col, row, [[1,0]], [[-2,0],[-1,-1],[-1,1],[2,-1],[2,1],[3,0]])) {
          return true;
        }
        
        // воможна горизонтальная, две по разным сторонам    
        if (this.matchPattern(col, row, [[2,0]], [[1,-1], [1,1]])) {
          return true;
        }

        // возможна вертикальная, две подряд 
        if (this.matchPattern(col, row, [[0,1]], [[0,-2],[-1,-1],[1,-1],[-1,2],[1,2]])) {
          return true;
        }
        
        // воможна вертикальная, две по разным сторонам  
        if (this.matchPattern(col, row, [[0,2]], [[-1,1],[1,1]])) {
          return true;
        }
      }
    }

    return false;
  }

  Board.prototype.matchPattern = function(col, row, mustHave, needOne) {
    var thisType = this.gems[col][row].fill;

    for (var i = 0; i < mustHave.length; i++){
      if (!matchType(col + mustHave[i][0], row + mustHave[i][1], thisType)) {
        return false;
      }
    }

    for (var i = 0; i < needOne.length; i++){
      if (matchType(col + needOne[i][0], row + needOne[i][1], thisType)) {
        return true;
      }
    }

    return false;
  }
Board.prototype.matchType = function(col,row,type) {    
   // убедимся, что фишка не выходит за пределы поля    
   if ((col < 0) || (col > 7) || (row < 0) || (row > 7)) return false;    
      return (this.gems[col][row].fill == type);   
}  

*/
  // Board.prototype.moveGem
 
  // Creates an object with x and y defined, set to the mouse position relative to the state's canvas
  // If you wanna be super-correct this can be tricky, we have to worry about padding and borders
  Board.prototype.getMouse = function(e) {
    var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
    
    // Compute the total offset
    if (element.offsetParent !== null) {
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
    // this.board.findAndRemoveMatches();

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
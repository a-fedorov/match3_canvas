	// Constructor for Shape objects to hold data for all drawn objects.
	// For now they will just be defined as rectangles.
	function Shape(x, y, w, h, id, fill) {
	  this.x = x || 0;
	  this.y = y || 0;
	  this.w = w || 1;
	  this.h = h || 1;
    this.id = id || 0;
    this.posX = 0;
    this.posY = 0;
	  this.fill = fill || '#AAAAAA';
	}

	// Draws this shape to a given context
	Shape.prototype.draw = function(ctx) {
	  ctx.fillStyle = this.fill;
	  ctx.fillRect(this.x, this.y, this.w, this.h);
	}

	// Determine if a point is inside the shape's bounds
	Shape.prototype.contains = function(mx, my) {
	  // All we have to do is make sure the Mouse X,Y fall in the area between
	  // the shape's X and (X + Width) and its Y and (Y + Height)
	  return  (this.x <= mx) && (this.x + this.w >= mx) &&
	          (this.y <= my) && (this.y + this.h >= my);
	}


  function Board(canvas){
    this.BOARD_COLS = 8;
    this.BOARD_ROWS = 8;

    this.tiles = [];
    this.selectedTiles = [];
    // this.prevSel = nul

    this.offsetX = this.offsetY = 4;
    this.tileWidth = this.tileHeight = 90;
    this.tilesColor = ['lightblue', 'lightgreen', 'yellow', 'violet'];


    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');
    
    // This complicates things a little but but fixes mouse co-ordinate problems
    // when there's a border or padding. See getMouse for more detail
    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

    if (document.defaultView && document.defaultView.getComputedStyle) {
      this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
      this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
      this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
      this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
    }
    // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
    // They will mess up mouse coordinates and this fixes that
    var html = document.body.parentNode;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;

    // **** Keep track of state! ****
    
    this.valid = false; // when set to false, the canvas will redraw everything
    this.shapes = [];  // the collection of things to be drawn
    // the current selected object. In the future we could turn this into an array for multiple selection
    this.selection = [];
    
    // **** Then events! ****
    var myState = this;
    
    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false); 
    canvas.addEventListener('click', function(e) { myState.selectTile(e); myState.draw();}, true);

    this.selectionColor = '#000000';
    this.selectionWidth = 2;
  }


  Board.prototype.selectTile = function(e) {
    var mouse = this.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    var shapes = this.shapes;

    // var st = this.selectedTiles;

    for (var i = 0; i < this.BOARD_ROWS; i++){
      for (var j = 0; j < this.BOARD_COLS; j++){
        if (shapes[i][j].contains(mx, my)) {
          var mySel = shapes[i][j];
          // Keep track of where in the object we clicked
          // so we can move it smoothly (see mousemove)
          this.selection.push(mySel);
          this.valid = false;

          // this.draw();
          // st.push(mySel);
          st = this.selection;

          if (st.length == 2){

            if (st[0].id == st[1].id){
              // console.log('same');
              this.selection = [];
            } else if (Math.abs(st[0].posY - st[1].posY) == 1 && st[0].posX == st[1].posX || 
                       Math.abs(st[0].posX - st[1].posX) == 1 && st[0].posY == st[1].posY){
              // console.log('neib');

              this.swapTiles(st[0], st[1]);
              this.selection = [];
            }

            // this.draw();
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

      function clone(destination, source) {
        for (var property in source) {
            if (typeof source[property] === "object" && source[property] !== null && destination[property]) { 
                clone(destination[property], source[property]);
            } else {
                destination[property] = source[property];
            }
        }
    };

  Board.prototype.swapTiles = function(t1, t2){
    var tempX = t1.x;
    t1.x = t2.x;
    t2.x = tempX;

    var tempY = t1.y;
    t1.y = t2.y;
    t2.y = tempY;

    var tempPosX = t1.posX;
    t1.posX = t2.posX;
    t2.posX = tempPosX;

    var tempPosY = t1.posY;
    t1.posY = t2.posY;
    t2.posY = tempPosY;
  }

  Board.prototype.spawn = function(){
    var tw = this.tileWidth;
    var th = this.tileHeight;
    var w = tw - this.offsetX;
    var h = th - this.offsetY;

    for (var i = 0; i < this.BOARD_ROWS; i++){
      this.shapes[i] = [];

      for (var j = 0; j < this.BOARD_COLS; j++){
        var posX = i * tw;
        var posY = j * th;
        var id = j * this.BOARD_ROWS + i;
        var color = this.tilesColor[ Math.floor( Math.random() * this.tilesColor.length )];

        this.addShape(new Shape(posX + this.offsetX, posY + this.offsetY, w, h, id, color), i, j)
      }
    }

    this.render();
  }


  Board.prototype.render = function(){
    this.draw();
  }


  Board.prototype.addShape = function(shape, i, j) {
    shape.posX = j;
    shape.posY = i;
    this.shapes[i][j] = shape;
    this.valid = false;
  }


  Board.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }


  // While draw is called as often as the INTERVAL variable demands,
  // It only ever does something if the canvas gets invalidated by our code
  Board.prototype.draw = function() {
    // if our state is invalid, redraw and validate!
    if (!this.valid) {
      var ctx = this.ctx;
      var shapes = this.shapes;
      this.clear();
      
      // ** Add stuff you want drawn in the background all the time here **
      
      // draw all shapes
      for (var i = 0; i < this.BOARD_ROWS; i++){
        for (var j = 0; j < this.BOARD_COLS; j++){
          shapes[i][j].draw(ctx);
        }
      }
      
      // draw selection
      // right now this is just a stroke along the edge of the selected Shape
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
      this.valid = true;
    }
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



  function init() {
    // var s = new CanvasState(document.getElementById('board'));
  	var board = new Board(document.getElementById('board'));

    board.spawn();
  }

  window.onload = init();
	// Constructor for Shape objects to hold data for all drawn objects.
	// For now they will just be defined as rectangles.
	function Shape(x, y, w, h, fill) {
	  // This is a very simple and unsafe constructor. All we're doing is checking if the values exist.
	  // "x || 0" just means "if there is a value for x, use that. Otherwise use 0."
	  // But we aren't checking anything else! We could put "Lalala" for the value of x 
	  this.x = x || 0;
	  this.y = y || 0;
	  this.w = w || 1;
	  this.h = h || 1;
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

  function CanvasState(canvas) {
    // **** First some setup! ****
    
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
    this.selection = null;
    
    // this.
    // **** Then events! ****
    
    // This is an example of a closure!
    // Right here "this" means the CanvasState. But we are making events on the Canvas itself,
    // and when the events are fired on the canvas the variable "this" is going to mean the canvas!
    // Since we still want to use this particular CanvasState in the events we have to save a reference to it.
    // This is our reference!
    var myState = this;
    
    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
   
    canvas.addEventListener('click', function(e) {
      var mouse = myState.getMouse(e);
      var mx = mouse.x;
      var my = mouse.y;
      var shapes = myState.shapes;
      var l = shapes.length;
      for (var i = l-1; i >= 0; i--) {
        if (shapes[i].contains(mx, my)) {
          var mySel = shapes[i];
          // Keep track of where in the object we clicked
          // so we can move it smoothly (see mousemove)
          myState.selection = mySel;
          myState.valid = false;
    
          // console.log(mySel);
          // swapTiles(mySel, shapes[i+1])

        // var nextIndex = i + 1;
        // console.log(nextIndex); 

        // var prevIndex = i - 1;
        // console.log(prevIndex)

          return;
        }
      }


      // havent returned means we have failed to select anything.
      // If there was an object selected, we deselect it
      if (myState.selection) {
        myState.selection = null;
        myState.valid = false; // Need to clear the old selection border
      }
    }, true);

    this.selectionColor = '#000000';
    this.selectionWidth = 3;  
    this.interval = 30;
    setInterval(function() { myState.draw(); }, myState.interval);
  }

  CanvasState.prototype.addShape = function(shape) {
    this.shapes.push(shape);
    this.valid = false;
  }

  CanvasState.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  // While draw is called as often as the INTERVAL variable demands,
  // It only ever does something if the canvas gets invalidated by our code
  CanvasState.prototype.draw = function() {
    // if our state is invalid, redraw and validate!
    if (!this.valid) {
      var ctx = this.ctx;
      var shapes = this.shapes;
      this.clear();
      
      // ** Add stuff you want drawn in the background all the time here **
      
      // draw all shapes
      var l = shapes.length;
      for (var i = 0; i < l; i++) { 
        shapes[i].draw(ctx);
      }
      
      // draw selection
      // right now this is just a stroke along the edge of the selected Shape
      if (this.selection != null) {
        ctx.strokeStyle = this.selectionColor;
        ctx.lineWidth = this.selectionWidth;
        var mySel = this.selection;
        ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
      }
      
      // ** Add stuff you want drawn on top all the time here **
      
      this.valid = true;
    }
  }


  // Creates an object with x and y defined, set to the mouse position relative to the state's canvas
  // If you wanna be super-correct this can be tricky, we have to worry about padding and borders
  CanvasState.prototype.getMouse = function(e) {
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
    var s = new CanvasState(document.getElementById('board'));
  	var board = new Board(s);

    board.spawn();
  }

function Board(s){
  this.BOARD_COLS = 8;
  this.BOARD_ROWS = 8;

  this.tiles = [];

  this.s = s;

  this.tileWidth = 90;
  this.tileHeight = 90;
  this.tilesColor = ['lightblue', 'lightgreen', 'yellow', 'violet'];

  this.offsetX = 4;
  this.offsetY = 4;
}

Board.prototype.spawn = function(){
    for (var i = 0; i < this.BOARD_ROWS; i++){
      this.tiles[i] = [];
      for (var j = 0; j < this.BOARD_COLS; j++){
        this.tiles[i][j] = this.createTile(i * this.tileWidth, j * this.tileHeight);
      }
    }

    this.render(this.s, this.tiles);
}

Board.prototype.render = function(){
  console.log(this.tiles)
  for (var i = 0; i < this.BOARD_ROWS; i++){
    for (var j = 0; j < this.BOARD_COLS; j++){
      var t = this.tiles[i][j];
      var posX = t.position.x;
      var posY = t.position.y;
      var w = t.width - this.offsetX;
      var h = t.height - this.offsetY;

      console.log(posX, posY)

      this.s.addShape(new Shape(posX + this.offsetX, posY + this.offsetY, w, h, t.color))
    }
  }
}

Board.prototype.createTile = function(posX, posY){
  var tile = {};

  tile.width = this.tileWidth;
  tile.height = this.tileHeight;

  tile.position = {};
  tile.position.x = posX;
  tile.position.y = posY;
  tile.color = this.tilesColor[ Math.floor( Math.random() * this.tilesColor.length )];

  return tile;
}


window.onload = init();
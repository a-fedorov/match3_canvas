
function Board(canvas){
  // Задание размеров поля
  this.cols = 8;
  this.rows = 8;

  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');
  
  // Отступ между камнями
  this.offsetX = this.offsetY = 5; 
  
  this.gems = []; // все камни на игровом поле
  this.gemSize = 85;
  this.gemSizeSpaced = this.gemSize + this.offsetX;

  this.gemColors = [
    'rgba(241, 196, 15,  .5)', /* yeloow */
    'rgba(155, 89,  182, .5)', /* violet */
    'rgba(46,  204, 113, .5)', /* green */
    'rgba(52,  152, 219, .5)', /* blue */
    'rgba(52,  73,  94,  .5)', /* gray */
    'rgba(231, 76,  60,  .5)', /* red */
  ];

  this.specialGemsType = ['bomb', 'bombVertical', 'bombHorizontal', 'bombColored'];

  // Расчёт координат для каждого элемента на поле
  this.gemPosX = this.gemPosY = [];
  for (var i = 0; i < this.cols; i++){
    this.gemPosX[i] = this.offsetX + this.gemSizeSpaced * i;
    this.gemPosY[i] = this.offsetY + this.gemSizeSpaced * i;
  }

  // Выделение текущего выбранного объекта
  this.selection = [];
  this.selectionColor = 'rgba(0,0,0,.8)';
  this.selectionWidth = 3;

  // Список режимов игры
  // this.gameMode;

  // Инидикация набранных очков
  this.score = 0;
  this.levelPointsBar = indicators.level;
  this.levelScore = [100, 150, 225, 337, 506];

  // Установки таймера для режима игры на время
  this.timeBar = indicators.time;
  this.baseLevelTimer = 10000;  // 1000 мс = 1с
  this.startTime = 0;
  this.endTime = 0;
  this.timeId = 0;

  this.animation = [];
  // Длительность анимаций 
  this.animDuration = {
    down: 700,
    fill: 600,
    out:  1100,
    swap: 300,
  };

  this.isRemoved = false;
  
  var self = this;    

  this.isDrag = false;
  this.startDragPos = {x: 0, y: 0};
  this.finishDragPos = {x: 0, y: 0}
  this.dragDistance = this.gemSize / 3;
  this.dragPrevSel;
  this.dragCurSel;

  // Убрать возможность выделять что либо на канвасе
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false); 
  // canvas.addEventListener('click', function(e) { self.selectGem(e); }, true );
  canvas.addEventListener('mousedown', function(e){ self.swapOnDragBegin(e) }, false);
  canvas.addEventListener('mousemove', function(e){ self.swapOnDragUpdate(e); }, false);
  canvas.addEventListener('mouseup', function(e){ self.swapOnDragComplete(e) }, false);


  this.testTable = [[0,1,2,3,1,5,3,4], 
                    [0,2,3,4,1,1,3,2], 
                    [0,0,0,2,3,3,2,4], 
                    [2,5,3,5,1,4,3,4],
                    [4,2,5,3,5,4,4,4],
                    [5,2,3,4,2,3,3,2],
                    [3,2,2,2,1,3,2,4],
                    [2,5,3,5,1,4,3,1]];
}


Board.prototype = {
  // Перерисовка поля 
  // Происходит в вызове requiestAnimationFrame
  draw: function() {
    var ctx = this.ctx;
    var gems = this.gems;
    this.clear();
    
    // Отрисовка всех камней
    for (var i = 0; i < this.rows; i++){
      for (var j = 0; j < this.cols; j++){
        if (gems[i][j] == undefined) continue;
        if (gems[i][j].type == 'bomb'){
          ctx.save();
          ctx.globalAlpha = .5;
          gems[i][j].draw(ctx);
          ctx.restore();
        } else {
          gems[i][j].draw(ctx);
        }
      }
    }
    
    // Отрисовка выделения вокруг выбранного камня
    var length = this.selection.length;
    if (length > 0) {
      ctx.lineWidth = this.selectionWidth;
      ctx.strokeStyle = this.selectionColor;

      for (var i = 0; i < length; i++){
        var mySel = this.selection[i];
        ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
      }
    }
  },

  swapOnDragBegin: function(e){
    this.isDrag = true;
    this.startDragPos = {x: e.layerX, y: e.layerY};
    var pos = {pageX: 0, pageY: 0};
    if (pos){
      this.selectGem(e);
    }

  },

  swapOnDragUpdate: function(e){
    if (this.isDrag){
      this.finishDragPos = {x: e.layerX, y: e.layerY};
      var distanceX = this.finishDragPos.x - this.startDragPos.x;
      var distanceY = this.finishDragPos.y - this.startDragPos.y;
      var prevSel = this.selection[0];
      var x = 0;
      var y = 0;

      if (prevSel){
        if (distanceX >= this.dragDistance && (prevSel.col + 1 < this.cols)){
          x = e.pageX + this.gemSize - this.dragDistance;
          y = e.pageY;
        } else if (distanceX <= -this.dragDistance && (prevSel.col - 1 >= 0)){
          x = e.pageX - this.gemSize + this.dragDistance;
          y = e.pageY;
        } else if (distanceY >= this.dragDistance && (prevSel.row + 1 < this.rows)){
          x = e.pageX;
          y = e.pageY + this.gemSize - this.dragDistance;
        } else if (distanceY <= -this.dragDistance && (prevSel.row - 1 >= 0)){
          x =  e.pageX;
          y =  e.pageY -this.gemSize + this.dragDistance;
        }
      }

      if (x && y) {
        this.selectGem({pageX: x, pageY: y});
      };

      var ans = this.checkNeibours(this.selection[0], this.selection[1]);
      if (ans == 'neibours'){
        this.swapGems(this.selection[0], this.selection[1]);

        // Если передвинутые камни не создают линию - поменять их местами обратно
        var matches = this.lookForMatches();
        if (matches.length == 0){ 
          this.swapGems(this.dragPrevSel, this.dragCurSel, true); 
        }
      }
    }
  },

  swapOnDragComplete: function(e){
    this.isDrag = false;
    this.startDragPos = {x: 0, y: 0};
    this.finishDragPos = {x: 0, y: 0};
  },


  // Очистка всего поля
  clear: function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  },

  // Заполнение поля камнями
  spawn: function(){
    console.log('spawn');
    var colorsLength = this.gemColors.length;

    for (var i = 0; i < this.rows; i++){
      this.gems[i] = [];
      for (var j = 0; j < this.cols; j++){
        // var color = this.gemColors[ Math.floor( Math.random() * colorsLength )];
        var color = this.gemColors[this.testTable[i][j]];
        var g = new Gem(this.gemPosX[j], this.gemPosY[i], this.gemSize, this.gemSize, color);
        // console.log(color)
        this.addGem(g, i, j);
      }
    }


    this.findAndRemoveMatches();
    // Заполнять поле пока на нём не будет ни одной линии из камней
    // var match = this.lookForMatches();
    // if (match.length != 0){
    //   this.spawn();
    // }
  },

  checkNeibours: function(g1, g2){
    if (g1 == undefined || g2 == undefined) return 'error';
    if (g1.row == g2.row && g1.col == g2.col){ 
      return 'same';
    } else if (Math.abs(g1.col - g2.col) == 1 && g1.row == g2.row ||
               Math.abs(g1.row - g2.row) == 1 && g1.col == g2.col){
      return 'neibours';
    }
  },


  addGem: function(gem, i, j) {
    gem.row = i;
    gem.col = j;
    this.gems[i][j] = gem;
  },


  selectGem: function(e) {
    var mouse = this.getMouse(e);
    var gems = this.gems;

    for (var i = 0; i < this.rows; i++){
      for (var j = 0; j < this.cols; j++){
        if (gems[i][j] !== undefined && gems[i][j].contains(mouse.x, mouse.y) && gems[i][j].isReady){

          this.selection.push(gems[i][j]);

          if (this.selection.length == 2){
          	var prevSel = this.selection[0];
          	var curSel = this.selection[1];
            
            // Если выбран тот же камень - снять выделение
            // Иначе проверить не являются ли выбранные камни соседними
            var isSwapped = false;
            var ans = this.checkNeibours(prevSel, curSel);

            if (ans == 'neibours'){
              this.swapGems(prevSel, curSel);
              this.selection = [];

              // Если передвинутые камни не создают линию - поменять их местами обратно
              var matches = this.lookForMatches();
              if (matches.length == 0){ 
                this.swapGems(prevSel, curSel, true); 
              }
            } else if (ans == 'same'){ 
              console.log(prevSel.x, prevSel.y, prevSel.fill, prevSel.type, prevSel.isReady, prevSel.row, prevSel.col)
              this.selection = [];
            }



            this.selection.shift();
          } 

          return;
        }
      }
    }
  },


  getAllGems: function(){
    return this.gems;
  },


  //  Обмен местами двух камней
  swapGems: function(t1, t2, backFlag){
    console.log('swap')
    var duration = this.animDuration.swap;
    var ease = TWEEN.Easing.Linear.None;
    var posX = this.gemPosX;
    var posY = this.gemPosY;

    var tweenGemOne = new TWEEN.Tween(t1)
      .to({x: posX[t2.col], y: posY[t2.row]}, this.animDuration.swap)
      .easing(TWEEN.Easing.Linear.None)
      .start();

    var tweenGemTwo = new TWEEN.Tween(t2)
      .to({x: posX[t1.col], y: posY[t1.row]}, this.animDuration.swap)
      .easing(TWEEN.Easing.Linear.None)
      .start();

    var gems = this.getAllGems();
    var props = ['x', 'y', 'row', 'col'];

    props.forEach(function(p){
      var tempProp = t1[p];
      t1[p] = t2[p];
      t2[p] = tempProp;
    })

    gems[t1.row][t1.col] = t1;
    gems[t2.row][t2.col] = t2;

        // Если линий не найдено вернуть фишки на их прежние места
    if (backFlag == true){
      tweenGemOne.repeat(1);
      tweenGemTwo.repeat(1);
    }

    tweenGemOne.onComplete(this.findAndRemoveMatches.bind(this));
  },


  setGameMode: function (mode){
    this.gameMode = mode;
  },


  // Обновление количества набранных очков
  updateScore: function (points){
  	this.score += points;
    updateScoreLabel(this.score);
    if (this.gameMode == 'normal'){
      this.updateLevelProgress();
    }
  },

  updateLevelProgress: function (){
    var delta = this.score || 0;
    var percent = (delta / this.levelScore[this.level]) * 100 || 0;

    if (delta >= this.levelScore[this.level]){
      updateLevelIndicator(100);
      console.log('level complete');
    } else {
      updateLevelIndicator(percent);
      console.log(percent);
    }
  },  

  setLevelTimer: function (reset){
    if (reset){
      console.log('reset')
      clearTimeout(this.timeId);
      // this.timer.update(100);
      this.startTime = Date.now();
      this.endTime = this.baseLevelTimer;
    }

    var delta = this.startTime + this.endTime - Date.now();
    var percent = (delta / this.endTime) * 100;

    if (delta < 0){
      // this.timeBar.update(0);
      updateTimeIndicator(0);
      // ui.gameOverPage.show();
      console.log('game over');
    } else {
      // this.timeBar.update(percent);
      updateTimeIndicator(percent);
      this.timeId = setTimeout(this.setLevelTimer.bind(this), 30);
    }
  },

  setLevelPoints: function(level){
    this.level = level;
  },



  removeGem: function(row, col){
    if (row == undefined || col == undefined) return false;
    console.log('remove')
      
    this.gems[row][col] = undefined;
    return true
  },


tweenFunction: function(gem, position, duration, easing){
  return new TWEEN.Tween(gem)
          .to(position, duration)
          .easing(TWEEN.Easing.Linear.None)
          .start();
},

  //  Поиск и удаление линий из одинаковых камней
  findAndRemoveMatches: function(){
    // console.log('findAndRemoveMatches')
    
    var self = this;
    var gems = this.getAllGems();
    var matches = this.lookForMatches();
    var tweenOut;
    var isRemove = false;
    var isCreated = false;
    var isBombExploded = false;
    var specialGem = this.findSpecialTiles(matches);


    for (var i = 0; i < matches.length; i++){
      var numPoints = matches[i].length;
      this.updateScore(numPoints);
      for (var j = 0; j < matches[i].length; j++){
        var m = matches[i][j];
        if (m.type == 'bomb'){
          isBombExploded = this.bombExplosion(m.row, m.col);
          if (isBombExploded){
            this.affectAbove(m);
            isRemove = true;
          }
        } else if (gems[m.row][m.col]){
          // tweenOut = new TWEEN.Tween(gems[m.row][m.col])
          // .to({y: -100}, self.animDuration.out)
          // .easing(TWEEN.Easing.Linear.None)
          // .start();

          gems[m.row][m.col] = undefined;
          this.affectAbove(m);
          isRemove = true;
        }


      }
    }

    // if (specialGem){
    //   this.createSpecialGem(specialGem)
    // }

    if (isRemove){
      this.refill();
      setTimeout(this.refill.bind(this, 700))
    }

    if(matches.length == 0){
      if (!this.lookForPossibles()){
        console.log('Game Over')
      }
    }
  },


  lookForMatches: function(){
    var matchList = [];

    for(var row = 0; row < this.rows; row++){
      for(var col = 0; col < this.cols; col++){
        var match = this.getMatchHoriz(col, row);
        if(match.length > 2){
          matchList.push(match);
          col += match.length - 1;
        }
      }
    }

    for(var col = 0; col < this.cols; col++){
      for(var row = 0; row < this.rows; row++){
        var match = this.getMatchVert(col, row);
        if(match.length > 2){
          matchList.push(match);
          row += match.length - 1;
        }
      }
    }

    return matchList;
  },


  getMatchHoriz: function(col, row){
    var match = [];
    var gems = this.getAllGems();

    for(var i = 0; col + i < this.cols; i++){
      if(gems[col][row] !== undefined && 
         gems[col+i][row] !== undefined &&
         gems[col][row].fill == gems[col + i][row].fill){
        match.push(gems[col + i][row]);
      } else {
        return match;
      }
    }

    return match;
  },


  getMatchVert: function(col, row){
    var match = [];
    var gems = this.getAllGems();

    for(var i = 0; row + i < this.rows; i++){
      if(gems[col][row] !== undefined && 
         gems[col][row+i] !== undefined && 
         gems[col][row].fill == gems[col][row + i].fill){
        match.push(gems[col][row + i]);
      } else {
        return match;
      }
    }

    return match;
  },


  affectAbove: function(gem) {
    // console.log('affectAbove');
    var tweenDown;
    var res = false;

    for (var row = gem.row - 1; row >= 0; row--){
      if(this.gems[row][gem.col] !== undefined ){
        var yNew = this.gemPosY[row] + this.gemSizeSpaced;
        var tweenDown = new TWEEN.Tween(this.gems[row][gem.col])
          .to({y: yNew}, 700)
          .easing(TWEEN.Easing.Quintic.Out)
          .start();

          // tweenDown.onComplete(function(){
          //   res = true;
          // })

        this.gems[row + 1][gem.col] = this.gems[row][gem.col];
        this.gems[row][gem.col].row += 1;
        this.gems[row][gem.col] = undefined;
      } 
    }


    // if (tweenDown){
    //   res = true
    // }

    return true;

  },

  refill: function(){
    // console.log('refill');
    var gems = this.getAllGems();
    var notReady = [];
    var colorsLength = this.gemColors.length;
    var tweenFill = [];

    for(var row = 0; row < this.rows; row++){
      for(var col = 0; col < this.cols; col++){
        if(gems[row][col] == undefined){

          var color = this.gemColors[ Math.floor( Math.random() * colorsLength )];            
	        var gem = new Gem(this.gemPosX[col], -this.gemSize * this.rows, this.gemSize, this.gemSize, color);
          this.addGem(gem, row, col);

          tweenFill = new TWEEN.Tween(gem)
            .to({y: this.gemPosY[row]}, 1500 - row * 50)
            .easing(TWEEN.Easing.Quintic.Out)
            .start();

               if (tweenFill){
      tweenFill.onComplete(this.findAndRemoveMatches.bind(this));
    }
        }
      }
    }

 
  },

  findSpecialTiles: function (matches) {
    var g = this.gems;
    var m = matches;
    var fill;
    var type = '';
    var r = 0;
    var c = 0;
    var specialGems = [];

    // Поиск 4inRow и 5inRow
    for (var i = 0; i < m.length; i++){
      for (var j = 0; j < m[i].length; j++){
        if (m[i].length == 3){
          continue
        } else if (m[i].length == 4){
          console.log('4 in row');
          break;
        } else if (m[i].length == 5){
          console.log('5 in row');
          break;
        }
      }
    }

    for (var row = 0; row < this.rows - 2; row++){
      for (var col = 0; col < this.cols - 2; col++){    
        fill = this.gems[row][col].fill;
        // Поиск L-фигур
        if (this.matchSpecialTilePattern(row, col, [[2,0]], [[2,2],[2,1],[1,0],[0,0]])){
          console.log('L normal');
          specialGems.push({row: row + 2, col: col, type: 'bomb', fill: fill});
        } 

        if (this.matchSpecialTilePattern(row, col, [[2,2]], [[2,1],[2,0],[1,2],[0,2]])){
          console.log('L flip x');
          specialGems.push({row: row + 2, col: col + 2, type: 'bomb', fill: fill});
        }

        if (this.matchSpecialTilePattern(row, col, [[0,2]], [[2,2],[1,2],[0,1],[0,0]])){
          console.log('L flip x & y');
          specialGems.push({row: row, col: col + 2, type: 'bomb', fill: fill});
        } 

        if (this.matchSpecialTilePattern(row, col, [[0,0]], [[2,0],[1,0],[0,2],[0,1]])){
          console.log('L flip y');
          specialGems.push({row: row, col: col, type: 'bomb', fill: fill});
        }

        // // Поиск T-фигур
        // if (this.matchSpecialTilePattern(row, col, [[0,1]], [[0,0],[0,2],[1,1],[2,1]])){
        //   console.log('T normal')
        // } 

        // if (this.matchSpecialTilePattern(row, col, [[2,1]], [[2,0],[2,2],[1,1],[0,1]])){
        //   console.log('T flip y')
        // }

        // if (this.matchSpecialTilePattern(row, col, [[1,0]], [[1,2],[1,1],[0,0],[2,0]])){
        //   console.log('T rotate left')
        // } 

        // if (this.matchSpecialTilePattern(row, col, [[1,2]], [[2,2],[0,2],[1,1],[1,0]])){
        //   console.log('T rotate right')
        // }
      }

      // console.log(specialGems)
    }
      return specialGems;
  },


  matchSpecialTilePattern: function (row, col, doubled, single) {
    // console.log('matchSpecialTilePattern')
    var g = this.gems;
    for (var i = 0; i < single.length; i++){
      var rS = row + single[i][0];
      var cS = col + single[i][1];
      var rD = row + doubled[0][0];
      var cD = col + doubled[0][1];
      
      if (g[rD][cD].fill == g[rS][cS].fill){
        continue;
      } 
      else {
        return false;
      }
    }

    return true;
  },


  createSpecialGem: function (specialGems) {
    if (!specialGems) return false;
    
    var type, row, col, fill;
    // console.log(specialGems);
    for (var i = 0; i < specialGems.length; i++){
      type = specialGems[i].type;
      row = specialGems[i].row;
      col = specialGems[i].col;
      fill = specialGems[i].fill;

      if (type == 'bomb'){
        this.createBomb(row, col, fill);
      }
    }

    return true;
  },

  createBomb: function (row, col, fill) {    
    console.log('bomb')
    // Заменить уровень прозрачности цвета на непрозрачный
    // var fill = fill.slice(0, -3) + '1)';
    var bomb = new Gem(this.gemPosX[col], this.gemPosY[row], this.gemSize, this.gemSize, fill, 'bomb');
    this.addGem(bomb, row, col);
  },

  createBombVertical: function () {

  },

  createBombHorizontal: function () {

  },

  createBombColored: function () {

  },

  bombExplosion: function(row, col){
    var aroundGems = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],[0,0]];
    
    for (var i = 0; i < aroundGems.length; i++){
      var r = row + aroundGems[i][0];
      var c = col + aroundGems[i][1];
      this.gems[r][c] = undefined;
    }

    return true;
  },


  lookForPossibles: function(){
    // console.log('lookForPossibles');

    for(var row = 0; row < this.cols; row++){
      for(var col = 0; col < this.rows; col++){
          // console.log('match')

        // воможна горизонтальная, две подряд 
        if (this.matchPattern(row, col, [[1,0]], [[-2,0],[-1,-1],[-1,1],[2,-1],[2,1],[3,0]])) {
          return true;
        }
        
        // воможна горизонтальная, две по разным сторонам    
        if (this.matchPattern(row, col, [[2,0]], [[1,-1], [1,1]])) {
          return true;
        }

        // возможна вертикальная, две подряд 
        if (this.matchPattern(row, col, [[0,1]], [[0,-2],[-1,-1],[1,-1],[-1,2],[1,2]])) {
          return true;
        }
        
        // воможна вертикальная, две по разным сторонам  
        if (this.matchPattern(row, col, [[0,2]], [[-1,1],[1,1]])) {
          return true;
        }
      }
    }

    return false;
  },

  matchPattern: function(col, row, mustHave, needOne) {
    // console.log('matchPattern')

    var thisType = this.gems[col][row].fill;

    for (var i = 0; i < mustHave.length; i++){
      if (!this.matchType(col + mustHave[i][0], row + mustHave[i][1], thisType)) {
        return false;
      }
    }

    for (var i = 0; i < needOne.length; i++){
      if (this.matchType(col + needOne[i][0], row + needOne[i][1], thisType)) {
        return true;
      }
    }

    return false;
  },

  matchType: function(row,col,type) {    
    // console.log('matchType')
    // убедимся, что фишка не выходит за пределы поля    
    if ((col < 0) || (col >= this.cols) || (row < 0) || (row >= this.rows)) return false;  
    return (this.gems[row][col].fill == type);
  },


  // Creates an object with x and y defined, set to the mouse position relative to the state's canvas
  // If you wanna be super-correct this can be tricky, we have to worry about padding and borders
  getMouse: function(e) {
    var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
    
    // Compute the total offset
    if (element.offsetParent !== null) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;
    
    return { x: mx, y: my };
  }
}

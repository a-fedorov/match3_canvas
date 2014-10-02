
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
  this.gemSize = 90;
  this.gemSizeSpaced = this.gemSize + this.offsetX;

  this.gemColors = [
    'rgba(241, 196, 15,  .6)', /* yeloow */
    'rgba(155, 89,  182, .6)', /* violet */
    'rgba(46,  204, 113, .6)', /* green */
    'rgba(52,  152, 219, .6)', /* blue */
    'rgba(52,  73,  94,  .5)', /* gray */
    'rgba(231, 76,  60,  .6)', /* red */
  ];

  this.specialGemsType = ['bomb', 'bombVertical', 'bombHorizontal', 'bombColored'];

  // Расчёт координат для каждого элемента на поле
  this.gemPosX = this.gemPosY = [];
  for (var i = 0; i < this.cols; i++){
    this.gemPosX[i] = this.offsetX + this.gemSize * i;
    this.gemPosY[i] = this.offsetY + this.gemSize * i;
  }

  // Выделение текущего выбранного объекта
  this.selection = [];
  this.selectionColor = 'rgba(0,0,0,.8)';
  this.selectionWidth = 3;

  // Список режимов игры
  // this.gameMode;

  // Инидикация набранных очков
  this.score = 0;
  // this.scoreLabel = ;
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
    // out:  3200,
    swap: 250,
  };


  this.isRemoved = false;
  
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

  var self = this;    

  // Убрать возможность выделять что либо на канвасе
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false); 
  // canvas.addEventListener('click', function(e) { self.selectGem(e); }, true );

  this.isDrag = false;
  this.startDragPos = {x: 0, y: 0};
  this.finishDragPos = {x: 0, y: 0}
  this.dragDistance = this.gemSize / 3;
  this.dragPrevSel;
  this.dragCurSel;

  canvas.addEventListener('mousedown', function(e){ self.swapOnDragBegin(e) }, false);
  canvas.addEventListener('mousemove', function(e){ self.swapOnDragUpdate(e); }, false);
  canvas.addEventListener('mouseup', function(e){ self.swapOnDragComplete(e) }, false);
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
        gems[i][j].draw(ctx);
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
    var gem = this.getGem(e);
    if (gem) this.dragPrevSel = gem;
  },

  swapOnDragUpdate: function(e){
    if (this.isDrag){
      this.finishDragPos = {x: e.layerX, y: e.layerY};
      var distanceX = this.finishDragPos.x - this.startDragPos.x;
      var distanceY = this.finishDragPos.y - this.startDragPos.y;
      var prevSel = this.dragPrevSel;
      var gem;

      if (prevSel){
        if (distanceX >= this.dragDistance && (prevSel.col + 1 < this.cols)){
          gem = this.gems[prevSel.row][prevSel.col + 1];
        } else if (distanceX <= -this.dragDistance && (prevSel.col - 1 < this.cols)){
          gem = this.gems[prevSel.row][prevSel.col - 1];
        } else if (distanceY >= this.dragDistance && (prevSel.row + 1 < this.rows)){
           gem = this.gems[prevSel.row + 1][prevSel.col];
        } else if (distanceY <= -this.dragDistance && (prevSel.row - 1 >= 0)){
          gem = this.gems[prevSel.row - 1][prevSel.col];
        }
      }

      if (gem) this.dragCurSel = gem;

      var ans = this.checkNeibours(this.dragPrevSel, this.dragCurSel);
      if (ans == 'neibours'){
        this.swapGems(this.dragPrevSel, this.dragCurSel);

        // Если передвинутые камни не создают линию - поменять их местами обратно
        var matches = this.lookForMatches();
        if (matches.length == 0){ 
          this.swapGems(this.dragPrevSel, this.dragCurSel, true); 
        }
        this.isDrag = false;
      } else if (ans == 'same'){
        this.dragPrevSel = undefined;
        this.dragCurSel = undefined;
        this.isDrag = false;
      }
    }
  },

  swapOnDragComplete: function(e){
    this.isDrag = false;
    this.startDragPos = {x: 0, y: 0};
    this.finishDragPos = {x: 0, y: 0};
    this.dragPrevSel = undefined;
    this.dragCurSel = undefined;
  },


  // Очистка всего поля
  clear: function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  },

  // Заполнение поля камнями
  spawn: function(){
    console.log('spawn');
    var w = this.gemSize - this.offsetX;
    var h = this.gemSize - this.offsetY;
    var colorsLength = this.gemColors.length;

    for (var i = 0; i < this.rows; i++){
      this.gems[i] = [];
      for (var j = 0; j < this.cols; j++){
        var color = this.gemColors[ Math.floor( Math.random() * colorsLength )];

        var g = new Gem(this.gemPosX[j], this.gemPosY[i], w, h, color);
        this.addGem(g, i, j)
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
        if (gems[i][j] !== undefined && gems[i][j].contains(mouse.x, mouse.y)){

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
              this.selection = [];
            }



            this.selection.shift();
          } 

          return;
        }
      }
    }
  },

  // selectGem: function(e) {
  //   var mouse = this.getMouse(e);
  //   var gems = this.gems;

  //   for (var i = 0; i < this.rows; i++){
  //     for (var j = 0; j < this.cols; j++){
  //       if (gems[i][j] !== undefined && gems[i][j].contains(mouse.x, mouse.y)){

  //         this.selection.push(gems[i][j]);

  //         if (this.selection.length == 2){
  //           var prevSel = this.selection[0];
  //           var curSel = this.selection[1];
            
  //           // Если выбран тот же камень - снять выделение
  //           // Иначе проверить не являются ли выбранные камни соседними
  //           if (prevSel.row == curSel.row && prevSel.col == curSel.col){
  //             this.selection = [];
  //           } else if (Math.abs(prevSel.col - curSel.col) == 1 && prevSel.row == curSel.row || 
  //                      Math.abs(prevSel.row - curSel.row) == 1 && prevSel.col == curSel.col) {

  //             this.swapGems(prevSel, curSel);

  //             // Если передвинутые камни не создают линию - поменять их местами обратно
  //             var matches = this.lookForMatches();
  //             if (matches.length == 0){
  //               this.swapGems(prevSel, curSel, true)
  //             }

  //             this.selection = [];
  //           }

  //           this.selection.shift();
  //         } 

  //         return;
  //       }
  //     }
  //   }
  // },

  getGem: function(e){
    var mouse = this.getMouse(e)
    for (var i = 0; i < this.rows; i++){
      for (var j = 0; j < this.cols; j++){
        if (this.gems[i][j].contains(mouse.x, mouse.y)){
          return this.gems[i][j];
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


 /* //  Поиск и удаление линий из одинаковых камней
  findAndRemoveMatches: function(){
    // console.log('findAndRemoveMatches')
    
    var self = this;
    var gems = this.getAllGems();
    var matches = this.lookForMatches();
    var tweenOut;
    // var isRemove = false;

    this.removedGems = [];
    this.matchesGems = [];

    this.findSpecialTiles(matches);

    for (var i = 0; i < matches.length; i++){
      var numPoints = matches[i].length;
		  this.updateScore(numPoints);

      for (var j = 0; j < matches[i].length; j++){
        var m = matches[i][j];

        if (gems[m.row][m.col]){
          this.removedGems.push(gems[m.row][m.col]);
          this.matchesGems.push(m);
          // gems[m.row][m.col] = undefined;
          // this.affectAbove(m);
          // console.log(m)

          // isRemove = true;
        }
      }
    }

    if (this.removedGems){
      // this.removeGems(this.removedGems);

    }

    // if (isRemove){
    //   this.refill();
    // }

    if(matches.length == 0){
      if (!this.lookForPossibles()){
        console.log('Game Over')
      }
    }
  },*/

  //  Поиск и удаление линий из одинаковых камней
  findAndRemoveMatches: function(){
    // console.log('findAndRemoveMatches')
    
    var self = this;
    var gems = this.getAllGems();
    var matches = this.lookForMatches();
    var tweenOut;
    var isRemove = false;

    this.findSpecialTiles(matches);

    for (var i = 0; i < matches.length; i++){
      var numPoints = matches[i].length;
      this.updateScore(numPoints);

      for (var j = 0; j < matches[i].length; j++){
        var m = matches[i][j];

        if (gems[m.row][m.col]){
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

    if (isRemove){
      this.refill();
    }

    if(matches.length == 0){
      if (!this.lookForPossibles()){
        console.log('Game Over')
      }
    }
  },

  // removeGems: function (){
  //   var self = this;
  //   if (this.removedGems instanceof Array && this.removedGems.length > 0){
  //     this.removedGems.forEach(function(r){
  //       r.y += 10;
        
  //       if (r.y > 1900){
  //         // this.gems[r.row][r.col] = undefined;
  //         r.y = 1900;
  //         self.isRemoved = true;
  //         self.removedGems = [];
  //         // return true;
  //       }
  //     });
  //   }
  // },



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


  // affectAbove: function() {
  //   // console.log('affectAbove');
  //   var self = this;

  //   this.matchesGems.forEach(function(gem){
  //     for (var row = gem.row - 1; row >= 0; row--){
  //       // if(self.gems[row][gem.col] !== undefined){
  //   //       var yNew = this.gemPosY[row] + this.gemSize;
  //       if(self.gems[row][gem.col] && self.gems[row][gem.col].y <= self.gemPosY[row]){
  //         self.gems[row][gem.col].y += 5;
  //         self.gems[row + 1][gem.col] = self.gems[row][gem.col];
  //       //   console.log(self.gems[row][gem.col].y)
  //       }
        
  //       // if (self.gems[row][gem.col].y > self.gemPosY[row] + self.gemSize){
  //         // self.gems[row][gem.col].y = self.gemPosY[row];
  //         // self.gems[row][gem.col].row += 1;
  //         // self.gems[row][gem.col] = undefined;

  //   // self.matchesGems.splice(row, 1);
  //       // }
  //     }
  //   })


  // },
  // // },


affectAbove: function(gem) {
    // console.log('affectAbove');
    
    var tweenDown;

    for (var row = gem.row - 1; row >= 0; row--){
      if(this.gems[row][gem.col] !== undefined){
        var yNew = this.gemPosY[row] + this.gemSize;

        tweenDown = new TWEEN.Tween(this.gems[row][gem.col])
          .to({y: yNew}, 500)
          .easing(TWEEN.Easing.Quintic.Out)
          .start();

        this.gems[row][gem.col].y = yNew;
        this.gems[row][gem.col].row += 1;
        this.gems[row + 1][gem.col] = this.gems[row][gem.col];
        this.gems[row][gem.col] = undefined;
      } 
    }
  },

  refill: function(){
    // console.log('refill');

    var gems = this.getAllGems();
    var w = this.gemSize - this.offsetX;
    var h = this.gemSize - this.offsetY;
    var colorsLength = this.gemColors.length;
    var tweenFill;

    for(var row = 0; row < this.rows; row++){
      for(var col = 0; col < this.cols; col++){
        if(gems[row][col] == undefined){
          var color = this.gemColors[ Math.floor( Math.random() * colorsLength )];            
	        var gem = new Gem(this.gemPosX[col], -725, w, h, color);
          this.addGem(gem, row, col);

          tweenFill = new TWEEN.Tween(gem)
            .to({y: this.gemPosY[row]}, 1000 - row * 100)
            .easing(TWEEN.Easing.Quintic.Out)
            .start();
        }
      }
    }

    if (tweenFill){
      tweenFill.onComplete(this.findAndRemoveMatches.bind(this));
    }
  },

  findSpecialTiles: function (matches) {
    var g = this.gems;
    var m = matches;

    // Поиск 4inRow и 5inRow
    for (var i = 0; i < m.length; i++){
      for (var j = 0; j < m[i].length; j++){
        if (m[i].length == 3){

        } else if (m[i].length == 4){
          console.log('4 in row');
          break;
        } else if (m[i].length == 5){
          console.log('5 in row');
          break;
        }
        // console.log(m[i][j].row, m[i][j].col, m[i].length);
      }
    }
    // console.log('/')

    // var row = 0;
    // var col = 0;
    // var type;
    for (var i = 0; i < this.rows - 2; i++){
      for (var j = 0; j < this.cols - 2; j++){    
        
        // Поиск L-фигур
        if (this.matchSpecialTilePattern(i, j, [[2,0]], [[2,2],[2,1],[1,0],[0,0]])){
          console.log('L normal');
        } 

        if (this.matchSpecialTilePattern(i, j, [[2,2]], [[2,1],[2,0],[1,2],[0,2]])){
          console.log('L flip x')
        }

        if (this.matchSpecialTilePattern(i, j, [[0,2]], [[2,2],[1,2],[0,1],[0,0]])){
          console.log('L flip x & y')
        } 

        if (this.matchSpecialTilePattern(i, j, [[0,0]], [[2,0],[1,0],[0,2],[0,1]])){
          console.log('L flip y')
        }


        // Поиск T-фигур
        if (this.matchSpecialTilePattern(i, j, [[0,1]], [[0,0],[0,2],[1,1],[2,1]])){
          console.log('T normal')
        } 

        if (this.matchSpecialTilePattern(i, j, [[2,1]], [[2,0],[2,2],[1,1],[0,1]])){
          console.log('T flip y')
        }

        if (this.matchSpecialTilePattern(i, j, [[1,0]], [[1,2],[1,1],[0,0],[2,0]])){
          console.log('T rotate left')
        } 

        if (this.matchSpecialTilePattern(i, j, [[1,2]], [[2,2],[0,2],[1,1],[1,0]])){
          console.log('T rotate right')
        }

      }
    }
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

  createSpecialTile: function () {

  },

  createBomb: function (row, col) {

  },

  createBombVertical: function () {

  },

  createBombHorizontal: function () {

  },

  createBombColored: function () {

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

    // Add padding and border style widths to offset
    // Also add the <html> offsets in case there's a position:fixed bar
    offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;
    
    return { x: mx, y: my };
  }
}

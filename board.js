
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
  this.gemSize = 80;
  this.gemSizeSpaced = this.gemSize + this.offsetX;

  this.gemColors = [
    'rgba(241, 196, 15,  .7)', /* yeloow */
    'rgba(155, 89,  182, .7)', /* violet */
    'rgba(46,  204, 113, .7)', /* green */
    'rgba(52,  152, 219, .7)', /* blue */
    'rgba(53,  73,  94,  .6)', /* gray */
    'rgba(231, 76,  60,  .7)', /* red */
  ]; 

  // this.isBombReady = 0;

  this.specialGemsType = ['bomb', 'bombVertical', 'bombHorizontal', 'bombColored'];

  // Расчёт координат для каждого камня на поле
  // this.gemPosX = this.gemPosY = [10, 95, 180, 265, 350, 435, 520, 605];
  this.gemPosX = this.gemPosY = [];
  for (var i = 0; i < this.cols; i++){
    this.gemPosX[i] = this.offsetX + this.gemSizeSpaced * i;
    this.gemPosY[i] = this.offsetY + this.gemSizeSpaced * i;
  }

  // Количество удалённых камней в каждом столбце
  this.removedInCols = [];
  for (var i = 0; i < this.cols; i++){
    this.removedInCols[i] = 0;
  }

  this.removedGems = [];
  this.removedAlpha = 1;

  this.prevSelection = []
  // Выделение текущего выбранного объекта
  this.firstSelection;
  this.selectionColor = 'rgba(0,0,0,.8)';
  this.selectionWidth = 3;

  // Список режимов игры
  // this.gameMode;

  this.alpha = 0;
  this.delta = 0.01;

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

  this.isRemoved = false;
  this.isMoved = false;
  this.isSwapped = false;
  this.isDropped = false;


  this.isDrag = false;
  this.startDragPos = {x: 0, y: 0};
  this.finishDragPos = {x: 0, y: 0};
  this.dragDistance = Math.floor(this.gemSize / 3);

  var self = this;    
  // Убрать возможность выделять что либо на канвасе
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false); 

  // Обмен фишек местами с помощью свайпов мышкой
  canvas.addEventListener('mousedown', function(e){ self.swapOnDragBegin(e); }, false);
  canvas.addEventListener('mousemove', function(e){ self.swapOnDragUpdate(e); }, false);
  canvas.addEventListener('mouseup', function(e){ self.swapOnDragComplete(e); }, false);

  // Тестовое заполнение игрового поля
  this.testTable = [[4,2,3,5,2,2,3,2], 
                    [2,1,2,5,3,3,2,3], 
                    [0,2,0,2,3,5,2,2], 
                    [5,0,0,1,0,3,4,4],
                    [0,0,4,5,5,4,4,3],
                    [0,1,5,5,0,1,3,4],
                    [4,5,5,2,5,3,1,4],
                    [5,5,3,5,5,4,4,1]];
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
        if (gems[i][j] == null) continue;
        
        var g = gems[i][j];
        var type = gems[i][j].type;

        if (type == 'removed'){
          ctx.save();
          ctx.globalAlpha = .5;
          g.draw(ctx);
          ctx.restore();
          // gems[i][j] = null;
          continue;
        }
        g.draw(ctx);

        if (type == 'bomb' || type == 'bombHoriz' || type == 'bombColor' || type == 'bombVert'){
          this.drawBomb(g, type);
        }
      }
    }


    // Отрисовка выделения вокруг выбранного камня
    if (this.firstSelection) {
      var sel = this.firstSelection;
      ctx.lineWidth = this.selectionWidth;
      ctx.strokeStyle = this.selectionColor;
      ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
    }
  },

  swapOnDragBegin: function(e){
    this.isDrag = true;
    this.startDragPos = {x: e.layerX, y: e.layerY};

    // Выбрать первыю фишку для обмена
    this.selectGem(e);
  },

  swapOnDragUpdate: function(e){
    if (this.isDrag){
      this.finishDragPos = {x: e.layerX, y: e.layerY};
      var distanceX = this.finishDragPos.x - this.startDragPos.x;
      var distanceY = this.finishDragPos.y - this.startDragPos.y;
      var prevSel = this.firstSelection;
      var x = 0;
      var y = 0;

      if (prevSel){
        // Если свайп вправо - выбрать фишку справа
        if (distanceX >= this.dragDistance && (prevSel.col + 1 < this.cols)){
          this.selectGem({pageX: e.pageX + this.gemSize - this.dragDistance, pageY: e.pageY})

        // Если свайп влево - выбрать фишку слева
        } else if (distanceX <= -this.dragDistance && (prevSel.col - 1 >= 0)){
          this.selectGem({pageX: e.pageX - this.gemSize + this.dragDistance, pageY: e.pageY})

        // Если свайп вниз - выбрать фишку снизу
        } else if (distanceY >= this.dragDistance && (prevSel.row + 1 < this.rows)){
          this.selectGem({pageX: e.pageX, pageY: e.pageY + this.gemSize - this.dragDistance})

        // Если свайп вверх - выбрать фишку сверху
        } else if (distanceY <= -this.dragDistance && (prevSel.row - 1 >= 0)){
          this.selectGem({pageX: e.pageX, pageY: e.pageY - this.gemSize + this.dragDistance})
        }
      }
    }
  },

  swapOnDragComplete: function(e){
    this.isDrag = false;
    this.startDragPos  = {x: 0, y: 0};
    this.finishDragPos = {x: 0, y: 0};
  },

  
  drawBomb: function(gem, type){
    var ctx = this.ctx;

    // Добавить квадрат размером в центре камня для обычной бомбы
    if (type == 'bomb'){
      ctx.save();    
      ctx.lineWidth = 2;
      ctx.strokeRect(gem.x + gem.w/4, gem.y + gem.h/4, gem.w/2, gem.h/2);
      ctx.restore();
    
    // Добавить три горизонтальные полосы для горизонтальной бомбы
    } else if(type == 'bombHoriz'){
      ctx.save();
      
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gem.x, gem.y + gem.h/3);
      ctx.lineTo(gem.x + gem.w, gem.y + gem.h/3);
      // ctx.moveTo(gem.x, gem.y + gem.h/2);
      // ctx.lineTo(gem.x + gem.w, gem.y + gem.h/2);
      ctx.moveTo(gem.x, gem.y + gem.h/3*2);
      ctx.lineTo(gem.x + gem.w, gem.y + gem.h/3*2);
      ctx.moveTo(gem.x + gem.w/3, gem.y);
      ctx.lineTo(gem.x + gem.w/3, gem.y + gem.h);
      // ctx.moveTo(gem.x + gem.w/2, gem.y);
      // ctx.lineTo(gem.x + gem.w/2, gem.y + gem.h);
      ctx.moveTo(gem.x + gem.w/3*2, gem.y);
      ctx.lineTo(gem.x + gem.w/3*2, gem.y + gem.h);
      ctx.stroke();
      ctx.restore();

    // Добавить рамку из R,G,B цветов для цветной бомбы
    } else if (type == 'bombColor'){
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,255,1)';  
      ctx.strokeRect(gem.x, gem.y, gem.w, gem.h);
      ctx.strokeStyle = 'rgba(255,0,0,1)';
      ctx.strokeRect(gem.x+2, gem.y+2, gem.w-4, gem.h-4);
      ctx.strokeStyle = 'rgba(0,255,0,1)';
      ctx.strokeRect(gem.x+4, gem.y+4, gem.w-8, gem.h-8);
      ctx.restore();

    }
  },


  // Очистка всего поля
  clear: function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  },


  getRow: function(rowIndex){
    var gems = this.getAllGems();
    var row = [];
    for (var col = 0; col < this.cols; col++){
      row.push(gems[rowIndex][col]);
    }

    return row;
  },
                     
  getColumn: function(columnIndex){
    var gems = this.getAllGems();
    var column = [];
    for (var row = 0; row < this.rows; row++){
      column.push(gems[row][columnIndex]);
    }

    return column;
  },

  // Заполнение поля камнями
  spawn: function(){
    console.log('spawn');
    var colorsLength = this.gemColors.length;
    var isPlayable = false;
    
    // Цикл, пока не создадим играбельную сетку
    // while (!isPlayable){
      // Добавляем фишки
      for (var i = 0; i < this.rows; i++){
        this.gems[i] = [];
        for (var j = 0; j < this.cols; j++){
          // var color = this.gemColors[ Math.floor( Math.random() * colorsLength )];
          var color = this.gemColors[this.testTable[i][j]];
          var g = new Gem(this.gemPosX[j], this.gemPosY[i], this.gemSize, this.gemSize, color);
          this.addGem(g, i, j);
        }
      }

      // Пробуем снова если на поле есть линии
      // if (this.lookForMatches().length != 0) continue;

      // Пробуем снова если на поле нет ни одного хода
      // if (this.lookForPossibles() == false) continue;

      // Нет линий и есть ходы - прерываем цикл
      isPlayable = true;
    // }

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
        if (gems[i][j] !== null && gems[i][j].contains(mouse.x, mouse.y)){

          //  Первая фишка выбрана    
          if (this.firstSelection == null){
            this.firstSelection = gems[i][j];

          // Повторный клик на первой фишке    
          } else if (this.firstSelection == gems[i][j]){
            console.log(gems[i][j].row, gems[i][j].col, gems[i][j].type, gems[i][j].isBombReady);
            this.firstSelection = null;

          // Клик на второй фишке
          } else {

            // Одинаковый ряд, проверяем соседство в колонке или
            // Одинаковая колонка, проверяем соседство в ряду     
            if ((this.firstSelection.row == gems[i][j].row) && (Math.abs(this.firstSelection.col - gems[i][j].col) == 1) ||
                (this.firstSelection.col == gems[i][j].col) && (Math.abs(this.firstSelection.row - gems[i][j].row) == 1)) {
              
              this.prevSelection[0] = this.firstSelection;
              this.prevSelection[1] = gems[i][j];

              this.makeSwap(this.firstSelection, gems[i][j]);
              this.firstSelection = null;

            // Нет соседства, скидываем выбор с первой фишки     
            } else {
              this.firstSelection = gems[i][j];
            }
          }
        
          // Прервать цикл
          return;
        }
      }
    }
  },


  getAllGems: function(){
    return this.gems;
  },

  makeSwap: function(gem1, gem2){
    this.swapGems(gem1, gem2);

    // Если передвинутые камни не создают линию - поменять их местами обратно
    if (this.lookForMatches().length == 0){
      // this.swapGems(gem1, gem2);
      setTimeout(this.swapGems.bind(this, gem1, gem2), 400);
    } else {
      this.isSwapped = true;
    }
  },


  //  Обмен местами двух камней
  swapGems: function(gem1, gem2, backSwap){
    console.log('swap');

    // Обмениваем значения row и col
    var tempRow = gem1.row;
    var tempCol = gem1.col;
    gem1.row = gem2.row;
    gem1.col = gem2.col;
    gem2.row = tempRow;
    gem2.col = tempCol;

    // Изменяем позицию в сетке
    this.gems[gem1.row][gem1.col] = gem1;
    this.gems[gem2.row][gem2.col] = gem2;
  },

  // Если какая-то фишка не на своем месте, двигаем ее чуть ближе   
  // такое происходит в случае обмена, или падения фишки
  moveGems: function (){
    var gems = this.gems;
    var posX = this.gemPosX;
    var posY = this.gemPosY;
    var step = 5;
    this.isMoved = false;

    for (var i = 0; i < this.rows; i++){
      for (var j = 0; j < this.cols; j++){

        if(gems[i][j] !== null){

          // смещаем вниз    
          if(gems[i][j].y < posY[gems[i][j].row]){
            gems[i][j].y += step;
            this.isMoved = true;

          // смещаем вверх
          } else if (gems[i][j].y > posY[gems[i][j].row]){
            gems[i][j].y -= step;
            this.isMoved = true;
          
          // смещаем вправо 
          } else if (gems[i][j].x < posX[gems[i][j].col]){
            gems[i][j].x += step;
            this.isMoved = true;
          
          // смещаем влево
          } else if (gems[i][j].x > posX[gems[i][j].col]){
            gems[i][j].x -= step;
            this.isMoved = true;
          }
        }
      }
    }

    // все падения завершены    
    if (this.isDropped && !this.isMoved) {
      this.isDropped = false;
      this.findAndRemoveMatches();

      // Обнулить количество удалённых камней для каждого столбца
      for (var i = 0; i < this.cols; i++){
        this.removedInCols[i] = 0;
      }
 
    // все обмены завершены    
    } else if (this.isSwapped && !this.isMoved) {
      this.isSwapped = false;
      this.findAndRemoveMatches();
    }
  },

  //  Поиск и удаление линий из одинаковых камней
  findAndRemoveMatches: function(){
    // console.log('findAndRemoveMatches');

    var gems = this.getAllGems();
    var matches = this.lookForMatches();
    var isBombExploded = false;
    var isAffected = false;

    this.findSpecialGems();

    for (var i = 0; i < matches.length; i++){
      for (var j = 0; j < matches[i].length; j++){

        var m = matches[i][j];
        var gem = gems[m.row][m.col];

        // Если образовано линию с бомбой - взорвать бомбу
        // if (gem && (m.type == 'bomb' || m.type == 'bombHoriz' || m.type == 'bombColor')){

        //     console.log(gem.row, gem.col, this.isDropped)

        //     var mNext = (matches[i][j+1] && matches[i][j+1].fill == m.fill) ? matches[i][j+1] : matches[i][j-1];
        //     var bombInRow = true;
        //     // Бомба с строке
        //     if (m.row == mNext.row){ bombInRow = true; }
        //     // Бомба в столбце
        //     if (m.col == mNext.col){ bombInRow = false; }


        //   // if (gem.isBombReady){
            // isBombExploded = this.bombExplosion(m);

            // if (isBombExploded){
              // this.affectAbove(gems[m.row][m.col])

              // gems[gem.row][gem.col] = null;
            // }

        //     // if (gem.type != 'bomb') gem.isBombReady = false;
        //   // } else {
        //     // gem.isBombReady = true;
        //   // }
        // } 

        // else {

          console.log(m.isBombReady)

        if (!gems[m.row][m.col]) continue;

        if (gems[m.row][m.col].type == 'normal') {
          gems[m.row][m.col] = null;
          this.affectAbove(m);
          // Подсчитать количество удалённых камней в каждом столбце
          this.removedInCols[m.col]++;
          // Опустить камни над удалённым вниз
          isAffected = true;
        }

        if (gem.isBombReady){
          isBombExploded = this.bombExplosion(gem);
        }

        if (gems[m.row][m.col]) gems[m.row][m.col].isBombReady = true;

      }
    }

    // Заполнить пустоты новыми камнями
    if (isAffected){
      this.refill();
    }


    if(matches.length == 0){
      if (!this.lookForPossibles()){
        console.log('Game Over');
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
      if(gems[col][row] !== null && 
         gems[col+i][row] !== null &&
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
      if(gems[col][row] !== null && 
         gems[col][row+i] !== null && 
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
    // if (!gem) return;
    var gems = this.getAllGems();
    for (var row = gem.row - 1; row >= 0; row--){
      if(gems[row][gem.col] !== null ){        
        gems[row][gem.col].row++;
        gems[row + 1][gem.col] = gems[row][gem.col];
        gems[row][gem.col] = null;
    // this.isDropped = true;
      }
    }

  },

  refill: function(){
    // console.log('refill');
    var gems = this.getAllGems();
    var colorsLength = this.gemColors.length;

    for(var row = 0; row < this.rows; row++){
      for(var col = 0; col < this.cols; col++){
        if(gems[row][col] == null){
          var color = this.gemColors[ Math.floor( Math.random() * colorsLength )];            
          var gem = new Gem(this.gemPosX[col], -this.gemSize, this.gemSize, this.gemSize, color);

          // Переместить камень вверх (на количество удалённых в столбце камней + 1 камень)
          gem.y = -this.gemSizeSpaced * (1 + this.removedInCols[col]--);

          this.addGem(gem, row, col);
          this.isDropped = true;
        }
      }
    } 
  },

  findSpecialGems: function () {
    var prev0 = this.prevSelection[0];
    var prev1 = this.prevSelection[1];

    this.findSpec(prev0);
    this.findSpec(prev1);
  },

  countSameColorGems: function(startGem, moveX, moveY){
    var curX = startGem.row + moveX;
    var curY = startGem.col + moveY;
    var startFill = startGem.fill;
    var count = 0;
    var gems = this.getAllGems();

    while(curX >= 0 && curY >= 0 && 
          curX < this.rows && curY < this.cols && gems[curX][curY] && 
          gems[curX][curY].fill == startFill && gems[curX][curY].type == 'normal'){
      count++;
      curX += moveX;
      curY += moveY;
    }

    return count;
  },

  findSpec: function(gem){
    var gems = this.getAllGems();

    var countUp = this.countSameColorGems(gem, -1, 0);
    var countDown = this.countSameColorGems(gem, 1, 0);
    var countLeft = this.countSameColorGems(gem, 0, -1);
    var countRight = this.countSameColorGems(gem, 0, 1);
  
    var countHoriz = countLeft + countRight + 1;
    var countVert = countUp + countDown + 1;

    if (countHoriz == 5 || countVert == 5){
      gem.type = 'bombColor';
      gem.isBombReady = false;
      // return true;
    } 

    if (countHoriz == 4 || countVert == 4){
      gem.type = 'bombHoriz';
      gem.isBombReady = false;
      // return true;
    } 

    if ((countUp == 2 && countRight == 2) ||
        (countUp == 2 && countLeft == 2) ||
        (countDown == 2 && countRight == 2) ||
        (countDown == 2 && countLeft == 2)){
      gem.type = 'bomb';
      gem.isBombReady = false;
      // return true;
    }


    // console.log(gem.type, countHoriz,countVert)

  },


  bombExplosion: function(bomb){
    if (!bomb) return;

    var gems = this.getAllGems();
    var bRow = bomb.row;
    var bCol = bomb.col;
    var bFill = bomb.fill;
    var bType = bomb.type;


    // if (bomb.isBombReady == false){
    //   gems[bRow][bCol].isBombReady = true;
    //   return;
    // }

    if (bType == 'bomb'){
      console.log('bomb')

      // return true;
    }

    if (bType == 'bombHoriz'){
      console.log('boom hor')
      for(var col = 0; col < this.cols; col++){
        if (col == bCol) continue;
        this.affectAbove(gems[bRow][col]);
      }

      return true;
    }

 // Если бомба цветная - удалить все камни того же цвета что и бомба
    if (bType == 'bombColor'){
      // Найти все камни одного цвета что и бомба
      for(var row = 0; row < this.rows-1; row++){
        for(var col = 0; col < this.cols; col++){
          if (row == bRow && col == bCol){ continue };
          if (gems[row][col] && this.matchType(row, col, bFill)){
            this.affectAbove(gems[row][col])
            this.removedInCols[col]++;
          }
        }
      }

      return true;
    }

    return false;
  },


  lookForPossibles: function(){
    // console.log('lookForPossibles');

    for(var row = 0; row < this.cols; row++){
      for(var col = 0; col < this.rows; col++){

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

    offsetX += element.offsetLeft;
    offsetY += element.offsetTop;

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;
    
    return { x: mx, y: my };
  }
};

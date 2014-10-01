var ui = {
  init: function () {
    this.menuPage.startBtn.addEvent();
    this.menuPage.optionsBtn.addEvent();
    
    this.gameModePage.normalMode.addEvent();
    this.gameModePage.timeMode.addEvent();
    this.gameModePage.endlessMode.addEvent();

    this.gamePage.topPanel.backBtn.addEvent();
  },

  menuPage: {
    element: document.querySelector('.menuPage'),
    show: function () { ui.showElement(this.element); },
    hide: function () { ui.hideElement(this.element); },

    startBtn: {
      element: document.querySelector('.start'),
      addEvent: function () {
        ui.addEvent(this.element, 'click', function(){
          ui.gameModePage.show();
          ui.menuPage.hide();
        });
      }
    },

    optionsBtn: {
      element: document.querySelector('.options'),
      addEvent: function () {
        ui.addEvent(this.element, 'click', function(){
          console.log('no options')
        })
      },
    }
    
  },

  gameModePage: {
    element: document.querySelector('.gameModePage'),

    show: function () { ui.showElement(this.element); },
    hide: function () { ui.hideElement(this.element); },

    normalMode: {
      element: document.getElementById('normal'),
      addEvent: function () {
        ui.addEvent(this.element, 'click', function(){
          ui.gamePage.show();
          ui.gameModePage.hide();

          ui.gamePage.bottomPanel.timer.hide();
          ui.gamePage.bottomPanel.levelProgress.show();
          startGame('normal');
        })
      },
    },

    timeMode: {
      element: document.getElementById('time'),
      addEvent: function () {
        ui.addEvent(this.element, 'click', function(){
          ui.gamePage.show();
          ui.gameModePage.hide();

          ui.gamePage.bottomPanel.timer.show();
          ui.gamePage.bottomPanel.levelProgress.hide();
          startGame('time');
        })
      }
    },

    endlessMode: {
      element: document.getElementById('endless'),
      addEvent: function () {
        ui.addEvent(this.element, 'click', function(){
          ui.gameModePage.hide();
          ui.gamePage.show();
          
          ui.gamePage.bottomPanel.timer.hide();
          ui.gamePage.bottomPanel.levelProgress.hide();
          startGame('endless');
        })
      }      
    }
  },

  gamePage: {
    element: document.querySelector('.gamePage'),
    
    show: function(){ ui.showElement(this.element); },
    hide: function(){ ui.hideElement(this.element); },

    canvas: {
      element: document.getElementById('board'),
    },

    topPanel: {
      element: document.querySelector('.topPanel'),

      scoreLabel: {
        element: document.querySelector('.score'),
        update: function(points){ this.element.innerHTML = 'Score: ' + points; },
        reset: function(){ this.element.innerHTML = 'Score: 0'; }
      },
      
      backBtn: {
        element: document.querySelector('.exit'),
        addEvent: function () {
          ui.addEvent(this.element, 'click', function(){
            ui.gamePage.hide();
            ui.gameModePage.show();
            ui.gamePage.topPanel.scoreLabel.reset();
          })
        }
      }
    },

    bottomPanel: {
      element: document.querySelector('.bottomPanel'),
  
      show: function() { ui.showElement(this.element); },
      hide: function() { ui.hideElement(this.element); },

      timer: {
        element: document.querySelector('.indicator'),
        container: document.querySelector('.time'),
        show: function() { ui.showElement(this.container); },
        hide: function() { ui.hideElement(this.container); },
        update: function(percent) { this.element.style.width = percent + '%'; },
        reset: function() { this.element.style.width = 100 + '%'}
      },

      levelProgress: {
        element: document.querySelector('.progress'),
        container: document.querySelector('.levelProgress'),
        show: function() { ui.showElement(this.container); },
        hide: function() { ui.hideElement(this.container); },
      }
    },
  },

  showElement: function (el) {
    el.style.visibility = 'visible';
    el.style.opacity = '1';
  },

  hideElement: function (el) {
    el.style.visibility = 'hidden';
    el.style.opacity = '0';
  },

  addEvent: function(el, eventType, eventFunction){
    el.addEventListener('click', eventFunction, true);
  },
}

  
  var game;
  
  ui.init();


  function startGame(mode){

    game = new Game(ui.gamePage.canvas.element)
    game.start(mode);

    // gremlinTest();
  }

  function gremlinTest(){
    var horde = gremlins.createHorde().gremlin(gremlins.species.clicker().clickTypes(['click'])); 
    horde.unleash();
  }

  // window.onload = startGame;
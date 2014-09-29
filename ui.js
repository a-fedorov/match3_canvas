var ui = {
  init: function () {
    this.menuPage.startBtn.addEvent();
    this.menuPage.optionsBtn.addEvent();
    this.gamePage.topPanel.backBtn.addEvent();
  },

  menuPage: {
    element: document.querySelector('.menuPage'),

    show: function () {
      ui.showElement(this.element);
    },

    hide: function () {
      ui.hideElement(this.element);
    },

    startBtn: {
      element: document.querySelector('.start'),
      addEvent: function () {
        ui.addEvent(this.element, 'click', function(){
          ui.gamePage.show();
          ui.menuPage.hide();

          startGame();
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

  gamePage: {
    element: document.querySelector('.gamePage'),
    
    show: function(){
      ui.showElement(this.element);
    },

    hide: function(){
      ui.hideElement(this.element);
    },

    canvas: {
      element: document.getElementById('board'),
    },

    topPanel: {
      element: document.querySelector('.topPanel'),

      scoreLabel: {
        element: document.querySelector('.score'),
        update: function(points){
          this.element.innerHTML = 'Score: ' + points;
        },
        reset: function(){
          this.element.innerHTML = 'Score: 0';
        }
      },
      
      backBtn: {
        element: document.querySelector('.exit'),
        addEvent: function () {
          ui.addEvent(this.element, 'click', function(){
            ui.gamePage.hide();
            ui.menuPage.show();

            ui.gamePage.topPanel.scoreLabel.reset();
          })
        }
      }
    },

    bottomPanel: {
      element: document.querySelector('.bottomPanel'),
      timer: {
        element: document.querySelector('.indicator'),
        update: function (percent) {
          this.element.style.width = percent + '%';
        },
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
  
  function startGame(){

    game = new Game(ui.gamePage.canvas.element)
    game.start();

    // gremlinTest();
  }

  function gremlinTest(){
    var horde = gremlins.createHorde().gremlin(gremlins.species.clicker().clickTypes(['click'])); 
    horde.unleash();
  }

  ui.init();
  // window.onload = startGame;
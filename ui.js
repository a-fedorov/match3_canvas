var ui = {
  init: function () {
    this.menu.startBtn.addEvent();
    this.menu.optionsBtn.addEvent();
    this.topPanel.backBtn.addEvent();
  },

  menu: {
    element: document.querySelector('.mainPage'),

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
          ui.canvas.show();
          ui.topPanel.show();
          ui.menu.hide();
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

  canvas: {
    container: document.querySelector('.container'),
    element: document.getElementById('board'),

    show: function () {
      ui.showElement(ui.canvas.container);
    },

    hide: function () {
      ui.hideElement(ui.canvas.container);
    },
  },


  topPanel: {
    element: document.querySelector('.topPanel'),

    show: function () {
      ui.showElement(ui.topPanel.element);
    },

    hide: function () {
      ui.hideElement(ui.topPanel.element);
    },

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
          ui.canvas.hide();
          ui.topPanel.hide();
          ui.menu.show();
          ui.topPanel.scoreLabel.reset();
        })
      }
    }
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
    ui.init();

    var canvas = document.getElementById('board');
    game = new Game(canvas)
    game.start();

    // gremlinTest();
  }

  function gremlinTest(){
    var horde = gremlins.createHorde().gremlin(gremlins.species.clicker().clickTypes(['click'])); 
    horde.unleash();
  }

  window.onload = startGame;
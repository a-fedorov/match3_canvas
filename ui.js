
  var menu = document.querySelector('nav');
  var canvasContainer = document.querySelector('.container')
  var topPanel = document.querySelector('.topPanel');

    var back = document.querySelector('.exit');
  back.addEventListener('click', showMenu, false);

  var start = document.querySelector('.start');
  start.addEventListener('click', startGame, false);

  function showMenu(){
    menu.style.visibility = 'visible';
    menu.style.opacity = '1';

    
    canvasContainer.style.opacity = '0';
    canvasContainer.style.visibility = 'hidden';

    topPanel.style.visibility = 'hidden';
    topPanel.style.opacity = '0';

  }

  function startGame(){
    menu.style.visibility = 'hidden';
    menu.style.opacity = '0';

    
    canvasContainer.style.visibility = 'visible';
    canvasContainer.style.opacity = '1';

    topPanel.style.visibility = 'visible';
    topPanel.style.opacity = '1';

    init();
  }


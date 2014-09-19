
  var menu = document.querySelector('nav');
  var canvasContainer = document.querySelector('.container')
  var topPanel = document.querySelector('.topPanel');

  function showMenu(){
    menu.style.display = 'block';
    canvasContainer.style.display = 'none';
    topPanel.style.display = 'none';
  }

  function startGame(){
    menu.style.display = 'none';    
    canvasContainer.style.display = 'block';
    topPanel.style.display = 'block';

    init();
  }
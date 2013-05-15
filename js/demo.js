function Stats() {
  this.objectsCount = 0;
  this.fps = 0;
  this.ms = 0;
}

(function() {
  var minX = 0, minY = 0;
  var maxX = 800, maxY = 600;
  var initialObjectsAmount = 10;
  var objectsPortion = 10;
  var gravity = 0.75//1.5 ;

  var textures = {};
  var bunnys = [];
  var stats = new Stats();

  var renderer, stage, container;

  bindListeners();

  function bindListeners() {
    window.addEventListener('load', init, false);
    window.onresize = resizeRenderer;
    window.onorientationchange = resizeRenderer;
  }

  function init() {
    loadTextures();
    createRenderer();
    createStage();

    renderScene();
  }

  function update() {
    //stats.start();

    // if isAdding..
    //

    updateBannysPosition();
    renderScene();

    //stats.end();
  }

  function updateBannysPosition() {
    var bunny;
    for (var i = bunnys.length; i--;) {
      bunny = bunnys[i];

      bunny.position.x += bunny.speedX;
      bunny.position.y += bunny.speedY;
      bunny.speedY += gravity;

      if (bunny.position.x > maxX) {
        bunny.speedX *= -1;
        bunny.position.x = maxX;
      } else if (bunny.position.x < minX) {
        bunny.speedX *= -1;
        bunny.position.x = minX;
      }

      if (bunny.position.y > maxY) {
        bunny.speedY *= -0.85;
        bunny.position.y = maxY;
        bunny.spin = (Math.random()-0.5) * 0.2
          if (Math.random() > 0.5) {
            bunny.speedY -= Math.random() * 6;
          }
      } else if (bunny.position.y < minY) {
        bunny.speedY = 0;
        bunny.position.y = minY;
      }
    }
  }

  function renderScene() {
    renderer.render(stage);
    requestAnimFrame(update);
  }

  function addSomeBunnys() {
    var bunny;
    for (var i = objectsPortion; i--;) {
      bunny = createBunny();
      container.addChild(bunny);
    }
  }

  function createBunny() {
    var bunny = new PIXI.Sprite(textures['bunny'], {x:0, y:0, width:26, height:37});
    bunny.speedX = Math.random() * 10;
    bunny.speedY = (Math.random() * 10) - 5;

    bunny.anchor.x = 0.5;
    bunny.anchor.y = 1;
    //bunny.alpha = 0.3 + Math.random() * 0.7;
    bunny.scale.y = 1;

    //bunny.rotation = Math.random() - 0.5;

    bunnys.push(bunny);
    stats.objectsCount++;
    return bunny;
  }

  function loadTextures() {
    textures = {
      bunny: new PIXI.Texture.fromImage("img/bunny.png")
    };
  }

  function createRenderer() {
    renderer = PIXI.autoDetectRenderer(maxX, maxY);

    if (!renderer instanceof PIXI.WebGLRenderer) {
      renderer.context.mozImageSmoothingEnabled = false;
      renderer.context.webkitImageSmoothingEnabled = false;
    }

    // display it
    document.body.appendChild(renderer.view);
    renderer.view.style.position = "absolute";
  }

  function createStage() {
    stage = new PIXI.Stage(0xFFFFFF);
    container = new PIXI.DisplayObjectContainer();

    stage.addChild(container);

    addSomeBunnys();
  }

  function resizeRenderer() {
    maxX = window.innerWidth;
    maxY = window.innerHeight;

    renderer.resize(maxX, maxY);
  }

})();


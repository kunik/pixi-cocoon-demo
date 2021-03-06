var Stats = (function() {
  return _constructor;

  function _constructor(reporter, reportInterval) {
    var objectsCount = 0;
    var objectsArea = 0;

    var startTime = Date.now();
    var prevTime = startTime;

    var fps, fpsMin, fpsMax;
    var ms, msMin, msMax;
    var framesCount;

    var reportIntervalId;

    var _this = {
      reset: function() {
        fps = 0, fpsMin = Infinity, fpsMax = 0;
        ms  = 0, msMin  = Infinity, msMax  = 0;

        framesCount = 0;
      },
      start: function() {
        return startTime = Date.now();
      },
      end: function() {
        var endTime = Date.now();

        ms = endTime - startTime;
        msMin = Math.min(msMin, ms);
        msMax = Math.max(msMax, ms);

        framesCount++;

        if (endTime > prevTime + 1000 ) {
          fps = Math.round((framesCount * 1000) / (endTime - prevTime));
          fpsMin = Math.min(fpsMin, fps);
          fpsMax = Math.max(fpsMax, fps);

          prevTime = endTime;
          framesCount = 0;
        }

        return endTime;
      },
      update: function() {
        return startTime = _this.end();
      },
      objectAdded: function(object) {
        objectsArea += object.width * object.height;
        objectsCount++;
      },
      info: function() {
        return {
          objects: {
            count: objectsCount,
            area: objectsArea
          },
          fps: {
            now: fps,
            min: fpsMin,
            max: fpsMax
          },
          ms: {
            now: ms,
            min: msMin,
            max: msMax
          }
        };
      },
      bindReporter: function(reporter, reportInterval) {
        if (reportIntervalId) {
          clearInterval(reportIntervalId);
        }

        reportIntervalId = setInterval(function() {
          reporter.call(_this, _this.info());
        }, reportInterval || 1000);
      }
    };

    _this.reset();

    if (reporter) {
      _this.bindReporter(reporter, reportInterval);
    }

    return _this;
  }

})();

(function() {
  var bunnyBig = true;

  var minX = 0, minY = 0;
  var maxX = 0, maxY = 0;
  var screenArea = 1;
  var initialObjectsAmount = 10;
  var objectsPortion = bunnyBig ? 1 : 10;
  var gravity = 0.75//1.5 ;
  var isAddingObjects = false;

  var textures = {};
  var bunnys = [];
  var stats = Stats();

  var renderer, stage, container;

  bindListeners();

  // PIXI patches
  (function() {
    //patch pixi to count objects and size
    var realAddChild = PIXI.DisplayObjectContainer.prototype.addChild;
    PIXI.DisplayObjectContainer.prototype.addChild = function(child) {
      if (child.texture) {
        stats.objectAdded(child);
      }
      realAddChild.call(this, child);
    };

    PIXI.InteractionManager.prototype.onMouseMove =
    PIXI.InteractionManager.prototype.onTouchMove =
    PIXI.InteractionManager.prototype.onTouchStart =
    PIXI.InteractionManager.prototype.onTouchEnd = function() {};
  })();

  function bindListeners() {
    window.addEventListener('load', init, false);
    window.onresize = resizeRenderer;
    window.onorientationchange = resizeRenderer;
  }

  function init() {
    loadTextures();
    createRenderer();
    createStage();
    createHandlers();

    renderScene();
  }

  function update() {
    stats.start();

    if (isAddingObjects) {
      addSomeBunnys();
    }

    updateBannysPosition();
    renderScene();

    stats.end();
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
    var bunny;

    if (bunnyBig) {
      bunny = new PIXI.Sprite(textures['bunny_big'], {x:0, y:0, width:145, height:125});
    } else {
      bunny = new PIXI.Sprite(textures['bunny'], {x:0, y:0, width:26, height:37});
    }

    bunny.speedX = Math.random() * 10;
    bunny.speedY = (Math.random() * 10) - 5;

    bunny.anchor.x = 0.5;
    bunny.anchor.y = 1;
    bunny.scale.y = 1;

    bunnys.push(bunny);
    return bunny;
  }

  function loadTextures() {
    textures = {
      bunny: new PIXI.Texture.fromImage("img/bunny.png"),
      bunny_big: new PIXI.Texture.fromImage("img/bunny_big.png"),
      button: new PIXI.Texture.fromImage("img/add.png")
    };
  }

  function createRenderer() {
    recalculateDimensions();

    var canvas = document.createElement('canvas');//CocoonJS.App.createScreenCanvas();
    renderer = new PIXI.CanvasRenderer(maxX, maxY);

    if (!renderer instanceof PIXI.WebGLRenderer) {
      renderer.context.mozImageSmoothingEnabled = false;
      renderer.context.webkitImageSmoothingEnabled = false;
    }

    document.body.appendChild(renderer.view);
  }

  function createStage() {
    stage = new PIXI.Stage(0xFFFFFF, true);
    container = new PIXI.DisplayObjectContainer();

    stage.addChild(container);
    stage.addChild(createDebugPanel());
    addSomeBunnys();
  }

  function createHandlers() {
    var down = function() { isAddingObjects = true; return false; };
    var up = function() { isAddingObjects = false; return false; };

    document.ontouchstart = document.onmousedown = down;
    document.ontouchend = document.onmouseup = up;
  }

  function createDebugPanel() {
    //hack for getting font height
    PIXI.Text.heightCache["font: 15px Arial;"] = 17;
    var debugPanel = new PIXI.Text("", {font:"15px Arial", fill:"red", align: "left", stroke: "#CCCCCC", strokeThickness: 7});
    debugPanel.position.x = 20;
    debugPanel.position.y = 20;
    debugPanel.setInteractive(true);

    stats.bindReporter(function(info) {
      var debugInfo = [
        'OBJECTS: ', info.objects.count, ' -> ', info.objects.area, 'px^2 \n',
        'NUMBER_OF_SCREENS: ', Math.round((info.objects.area / screenArea) * 100) / 100 , '\n',
        'FPS: ', info.fps.now, ' [', info.fps.min, '/', info.fps.max, ']\n',
        'FRAME_TIME: ', info.ms.now, ' [', info.ms.min, '/' , info.ms.max, ']'].join('');

      debugPanel.setText(debugInfo);
    });

    return debugPanel;
  }

  function recalculateDimensions() {
    maxX = window.innerWidth;
    maxY = window.innerHeight;
    screenArea = maxX * maxY;
  }

  function resizeRenderer() {
    recalculateDimensions();
    renderer.resize(maxX, maxY);
  }

})();


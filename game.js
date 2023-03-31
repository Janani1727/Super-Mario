kaboom({
  global: true,
  fullscreen: true,
  scale: 1.5,
  debug: true,
  clearColor: [0, 0, 0, 1],
});

const MOVE_SPEED = 120;
const JUMP_FORCE = 360;
const BIG_JUMP_FORCE = 550;
let CURRENT_JUMP_FORCE = JUMP_FORCE;
let isJumping = true;
const FALL_DEATH = 400;

loadRoot("https://i.imgur.com/");
loadSprite("coin", "wbKxhcd.png");
loadSprite("evil-shroom", "KPO3fR9.png");
loadSprite("brick", "pogC9x5.png");
loadSprite("block", "M6rwarW.png");
loadSprite("mario", "Wb1qfhK.png");
loadSprite("mushroom", "0wMd92p.png");
loadSprite("surprise", "gesQ1KP.png");
loadSprite("unboxed", "bdrLpi6.png");
loadSprite("pipe-top-left", "ReTPiWY.png");
loadSprite("pipe-top-right", "hj2GK4n.png");
loadSprite("pipe-bottom-left", "c1cYSbt.png");
loadSprite("pipe-bottom-right", "nqQ79eI.png");

loadSprite("blue-block", "fVscIbn.png");
loadSprite("blue-brick", "3e5YRQd.png");
loadSprite("blue-steel", "gqVoI2b.png");
loadSprite("blue-evil-shroom", "SvV4ueD.png");
loadSprite("blue-surprise", "RMqCc1G.png");

loadSprite("flower", "uaUm9sN.png");

scene("game", ({ level, score }) => {
  layers(["bg", "obj", "ui"], "obj");

  const maps = [
  
  
   
    [
      "                                                                                                     ", // level 1
      "                                                                                                     ",
      "                                                                                                     ",
      "                                                                                                     ",
      "         %      =*=%=                         =*=%=             =     %                              ",
      "                                      %                       ===                                 -+ ",
      "                    ^   ^                               ^    ====               ^       =*=       () ",
      "===============================   =======    =========  ===========  ======   ======   =====    =======           ",
    ],

    [
      "                                                                                                     £", // level 2
      "                                                          ~~                                         £",
      "£                                                         ()                                         £",
      "£                         x x x              ~~           ()         ~~                              £",
      "£     @@@@@@@         x x x x x x            ()       xxxx()xxxx     ()      @@@@@         x         £",
      "£                   x x x x x x x           x()           ()       xx()                 x  x      -+ £",
      "£           z   z x x x x x x x x           x()      z    ()     z   ()                 x  x      () £",
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ",
    ],

     [ 
      "                                                           %                                          ",                                                         
      "                                                                                                      ",
      "                                         =%=                                  %                          ",
      "                                                         ======                                       ", // level 3
      "                                                =====              =====                              ",
      "             %%                         =====                             =======                     ",
      "       %                           ====                                                              ",
      "                         *   ====                                                 ====        -+     ",
      "                        $$                                                                ==  ()     ",
      "               ^        ^                                                                    ====    ",
      "==========   =====   ==========                                                                     ",
    ],
  
 

   
  ];

  const levelCfg = {
    width: 20,
    height: 20,
    "=": [sprite("block"), solid()],
    $: [sprite("coin"), "coin"],
    "%": [sprite("surprise"), solid(), "coin-surprise"],
    "*": [sprite("surprise"), solid(), "mushroom-surprise"],
    "}": [sprite("unboxed"), solid()],
    "(": [sprite("pipe-bottom-left"), solid(), scale(0.5)],
    ")": [sprite("pipe-bottom-right"), solid(), scale(0.5)],
    "-": [sprite("pipe-top-left"), solid(), scale(0.5), "pipe"],
    "+": [sprite("pipe-top-right"), solid(), scale(0.5), "pipe"],
    "^": [sprite("evil-shroom"), solid(), body(), "dangerous"],
    "#": [sprite("mushroom"), solid(), body(), "mushroom"],
    "!": [sprite("blue-block"), solid(), scale(0.5)],
    "£": [sprite("blue-brick"), solid(), scale(0.5)],
    x: [sprite("blue-steel"), solid(), scale(0.5)],
    z: [sprite("blue-evil-shroom"), solid(), scale(0.5), body(), "dangerous"],
    "@": [sprite("blue-surprise"), solid(), scale(0.5), "coin-surprise"],
    "~": [sprite("flower"), solid()],
  };

  const gameLevel = addLevel(maps[level], levelCfg);

  // show level number at top
  add([text("level " + parseInt(level + 1)), pos(0, 0)]);

  // show game score at top
  const scoreLabel = add([
    text(score),
    pos(0, 15),
    layer("ui"),
    {
      value: score,
    },
  ]);

  function big() {
    let timer = 0;
    let isBig = false;
    return {
      update() {
        if (isBig) {
          timer -= dt();
          if (timer <= 0) {
            this.smallify();
          }
        }
      },
      isBig() {
        return isBig;
      },
      smallify() {
        this.scale = vec2(1);
        CURRENT_JUMP_FORCE = JUMP_FORCE;
        timer = 0;
        isBig = false;
      },
      biggify(time) {
        this.scale = vec2(2);
        CURRENT_JUMP_FORCE = BIG_JUMP_FORCE;
        timer = time;
        isBig = true;
      },
    };
  }

  const player = add([
    sprite("mario"),
    solid(), // things can't pass through Mario
    pos(30, 0), // starting position for player
    body(), // component for falling and jumping
    big(),
    origin("bot"), // more on starting place for player
  ]);

  action("mushroom", (m) => {
    // grab anything with mushroom tag and allow it to move
    m.move(20, 0);
  });

  player.on("headbump", (obj) => {
    if (obj.is("coin-surprise")) {
      // if the object headbumped is a coin surprise
      gameLevel.spawn("$", obj.gridPos.sub(0, 1)); // then we want the game to span a new coin sprite positioned above where the box was
      destroy(obj); // then destroy the original object we headbumped
      gameLevel.spawn("}", obj.gridPos.sub(0, 0)); // replace the coin surprise block with the unboxed block
    }
    if (obj.is("mushroom-surprise")) {
      gameLevel.spawn("#", obj.gridPos.sub(0, 1));
      destroy(obj);
      gameLevel.spawn("}", obj.gridPos.sub(0, 0));
    }
  });

  // use kaboom method collides
  player.collides("mushroom", (m) => {
    destroy(m); // destroy the mushroom
    player.biggify(6); // here we're using the method we wrote on the player and passing in 6 seconds for time
  });

  player.collides("coin", (c) => {
    destroy(c);
    scoreLabel.value += 1;
    scoreLabel.text = scoreLabel.value;
  });

  const ENEMY_SPEED = 20;
  action("dangerous", (d) => {
    d.move(-ENEMY_SPEED, 0);
  });

  player.collides("dangerous", (d) => {
    if (isJumping) {
      destroy(d);
    } else {
      go("lose", { score: scoreLabel.value });
    }
  });

  player.action(() => {
    camPos(player.pos); // set camera position to player position at all times
    if (player.pos.y >= FALL_DEATH) {
      go("lose", { score: scoreLabel.value }); // go to lose screen and take score with you
    }
  });

  player.collides("pipe", () => {
    keyPress("down", () => {
      go("game", {
        level: (level + 1) % maps.length,
        score: scoreLabel.value,
      });
    });
  });

  keyDown("left", () => {
    player.move(-MOVE_SPEED, 0);
  });

  keyDown("right", () => {
    player.move(MOVE_SPEED, 0);
  });

  player.action(() => {
    if (player.grounded()) {
      isJumping = false;
    }
  });

  keyPress("space", () => {
    if (player.grounded()) {
      isJumping = true;
      player.jump(CURRENT_JUMP_FORCE);
    }
  });
});

scene("lose", ({ score }) => {
  add([
    text("Game Over", 45),
    origin("center"),
    pos(width() / 2, height() / 3),
  ]);
  add([text(score, 32), origin("center"), pos(width() / 2, height() / 2)]);
});

start("game", { level: 0, score: 0 });

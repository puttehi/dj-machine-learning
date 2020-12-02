// ==============================
// Sketch settings, adjust as needed
// ==============================
const drawPlatformDebug = false; // show platform debug info on top of platforms
const drawDoodlerDebug = true; // show ML debug info on top of doodlers
const autoRestart = true; // don't show "Start" screen after all doodlers die
const unstuckSeconds = 3; // how many seconds can the doodlers score NOT increase before it is auto-moved
const unstuckFrames = 20; // how many frames to hold a movement input in stuck situation to unstuck?
// ML Model layer settings
const inputCount = 5;
const hiddenCount = 4;
const outputCount = 3;

const amountDoodlers = 100; // How many agents to train at once
const drawEveryXDoodlers = 2; // Less drawn doodlers = less lag = more agents to train

// ==============================
// Global variables, don't touch
// ==============================
var gameStarted;
var initModel = true;
var score = 0;
var highScore = 0;
var scores = [];
var averageScore = 0;
var generation = 0;

var gameSpeed = 100; // fps
let slider; // fps slider

var canvas;
var backgroundImg;

let doodlers = [];
let deadDoodlers = [];
let stuckThreshold = 0;

// model chooser menu buttons
var modelJSONInput;
var modelWeightsInput;
var trainButton; // Train a new model, starts game

let gotJson = false;
let gotBin = false;

function RemoveDoodler(doodler) {
  const index = doodlers.indexOf(doodler);
  if (doodler.actualScore > highScore) highScore = doodler.actualScore;
  if (index > -1) {
    let removedDoodler = doodlers.splice(index, 1);
    deadDoodlers.push(removedDoodler[0]);
  }
}

// ===========================
//  Preload the Image Sprites
// ===========================
function preload() {
  backgroundImg = loadImage("./assets/background/background.png");
  Doodler.Preload();
  Platform.preload();
  //ResetGame();
}
// ===========================
//  Create doodlers and setup FPS slider
// ===========================
function setup() {
  tf.setBackend("cpu"); // for easier data access for such a simple neural network
  canvas = createCanvas(400, 600);
  frameRate(gameSpeed);
  CreateGUI();
  gameStarted = false;
}

function CreateGUI(){
  slider = createSlider(1, 240, gameSpeed, 1);
  slider.position(10, 10);
  slider.style("width", "160px");
  slider.input(OnSliderChanged);
  slider.hide();
  stuckThreshold = gameSpeed * unstuckSeconds;
  modelJSONInput = createFileInput(IsJson, true);
  modelJSONInput.position(0, canvas.height / 2);
  modelJSONInput.position(
    200 - modelJSONInput.size().width * 0.3,
    250
  );
  modelWeightsInput = createFileInput(IsBin, true);
  modelWeightsInput.position(0, height / 2);
  modelWeightsInput.position(
    200 - modelWeightsInput.size().width * 0.3,
    280
  );
  trainButton = createButton("Train a new model");
  trainButton.position(0, height / 2 + 60);
  trainButton.center("horizontal");
  trainButton.position(
    200 - trainButton.size().width * 0.5,
    380
  );
  trainButton.mousePressed(StartGame);
}
// ===========================
//  Game loop
// ===========================
function draw() {
  background(247, 239, 231);
  image(backgroundImg, 0, 0, 400, 600);
  if (gameStarted == true) {
    update();
    platformList.forEach((platform) => {
      platform.draw();
      if (drawPlatformDebug) {
        platform.debugDraw({
          fontSize: 12,
          fontGrayscale: 5,
          padding: 12,
        });
      }
    });
    let best = BestDoodler();
    if (best) best.Draw();
    for (let i = 0; i < doodlers.length; i += drawEveryXDoodlers) {
      // only draw every so many to reduce lag and train more agents at once
      if (doodlers[i] != null) {
        if (doodlers[i] != best) {
          doodlers[i].Draw();
        }
      }
    }
    textSize(30);
    fill(0);
    text("Best score: " + score, 10, 60);
    text("Highscore: " + highScore, 10, 90);
    text("Average score: " + averageScore, 10, 120);
    text("Generation: " + generation, 10, 150);
    text(
      "Population(A/D): " + doodlers.length + "/" + deadDoodlers.length,
      10,
      180
    );
  } else if (!initModel) {
    drawMenu();
  } else {
    textSize(24);
    textAlign(CENTER);
    let loadLabel = text("Load a model", width / 2, height / 2 - 70);
	let trainLabel = text("New model", width / 2, 360);
    //let infoLabel = text("(1: model.json, 2: model_weights.bin)", width/2, height/2 - 50)
    textAlign(LEFT);
    textSize(16);
    let jsonLabel = text(
      ".json: ",
      modelJSONInput.position().x - textWidth(".json: "),
      modelJSONInput.position().y + modelJSONInput.size().height / 2 + 4
    );
    let binLabel = text(
      ".bin: ",
      modelWeightsInput.position().x - textWidth(".bin: "),
      modelWeightsInput.position().y + modelWeightsInput.size().height / 2 + 4
    );
    if (gotBin && gotJson) {
      LoadModel();
    }
  }
}

function OnSliderChanged() {
  frameRate(slider.value());
  gameSpeed = frameRate();
  stuckThreshold = gameSpeed * unstuckSeconds;
  console.log("frameRate is now: " + frameRate());
}

function update() {
  platformList.forEach((platform) => {
    platform.update();
  });
  score += platYChange;
  checkCollision();
  checkInput();
  if (doodlers.length > 0) {
    doodlers.forEach((doodler) => {
      doodler.Think();
      doodler.Update();
    });
  } else {
    // no doodlers alive, next generation
    NextGeneration();
    ResetGame();
  }
  moveScreen();
}

function drawMenu() {
  // "Start", from original sketch
  fill(0);
  textSize(60);
  text("Start", 140, 275);
  textSize(30);
  text("Score: " + score, 150, 325);
  textSize(20);
  text("High Score: " + highScore, 150, 360);
  textSize(12);
}
function keyPressed() {
  if (key === "S" || key === "s") {
    if (doodlers.length > 0) {
      let doodler = BestDoodler();
      doodler.brain.Save();
    }
  }
  if (key === "L" || key === "l") {
    NeuralNetwork.Load();
  }
}

function moveScreen() {
  if (doodlers.length > 0) {
    let bestDoodler = BestDoodler();
    if (bestDoodler.y < 250) {
      platYChange = 3;
      doodlers.forEach((doodler) => {
        doodler.yVelocity += 0.25;
      });
    } else {
      platYChange = 0;
    }
  }
}

function BestDoodler() {
  if (doodlers.length > 0) {
    let smallestValue = Infinity;
    let bestDoodler = doodlers[0];
    doodlers.forEach((doodler) => {
      if (doodler.y < smallestValue) {
        smallestValue = doodler.y;
        bestDoodler = doodler;
      }
    });
    return bestDoodler;
  }
}

// function mousePressed() {
//   if (gameStarted == false) {
//     if (initModel == false) {
//       // in "drawMenu()"
//       StartGame();
//     } else {
//       // choosing model (initial screen)
//     }
//   }
// }

function StartGame(model, generation) {
  score = 0;
  if (doodlers.length < amountDoodlers) {
    if (model) {
      console.log("if");
      console.log(model);
      for (let i = 0; i < amountDoodlers; i++) {
        doodlers.push(
          new Doodler({
            brain: new NeuralNetwork({
              model: model,
              generation: generation,
              inputs: inputCount,
              hiddens: hiddenCount,
              outputs: outputCount,
            }),
          })
        );
      }
    } else {
      console.log("else");
      for (let i = 0; i < amountDoodlers; i++) {
        doodlers.push(new Doodler());
      }
    }
  }
  Platform.InitNewGamePlatforms(4);
  for (let i = 0; i < doodlers.length; i++) {
    let doodlerSize = doodlers[i].size;
    doodlers[i].y = 350;
    doodlers[i].x =
      platformList[platformList.length - 1].xPos +
      (platformWidth / 2 - doodlerSize / 2);
    doodlers[i].yVelocity = 0.1;
  }
  if (trainButton) trainButton.hide();
  if (modelJSONInput) modelJSONInput.hide();
  if (modelWeightsInput) modelWeightsInput.hide();
  if (slider) slider.show();
  gameStarted = true;
}

// Files

function IsJson(file) {
  if (file) {
    //print(file)
    if (file.subtype == "json") {
      //print("file was json!")
      gotJson = true;
    } else {
      gotJson = false;
    }
  }
}

function IsBin(file) {
  if (file) {
    //print(file)
    if (file.subtype == "octet-stream") {
      //print("file was json!")
      gotBin = true;
    } else {
      gotBin = false;
    }
  }
}

function LoadModel() {
  print(modelJSONInput);
  print(modelJSONInput.elt.files[0]);
  print(modelWeightsInput);
  print(modelWeightsInput.elt.files[0]);
  LoadLayersModel(modelJSONInput.elt.files[0], modelWeightsInput.elt.files[0]); // bin is first for some reason
  gotBin = false;
  gotJson = false;
}

async function LoadLayersModel(json, weights) {
  const layersModel = await tf
    .loadLayersModel(tf.io.browserFiles([json, weights]))
    .then((res) => {
      //print(layersModel)
      //print(res)
      StartGame(res, 0);
    })
    .catch((err) => {
      print(err);
    });
  //print(model)
}

function ResetGame() {
  if (!autoRestart) {
    gameStarted = false;
    Platform.Reset();
  } else {
    gameStarted = false;
    Platform.Reset();
    StartGame();
  }
}

//function ResetGame() {
//    gameStarted = false;
//    Platform.Reset();
//}

// ===========================
//  Collisions
// ===========================
function checkCollision() {
  doodlers.forEach((doodler) => {
    doodler.CheckCollision();
  });
}

function checkInput() {
  if (doodlers.length > 0) {
    if (keyIsDown(LEFT_ARROW)) {
      doodlers[0].MoveLeft();
    }
    if (keyIsDown(RIGHT_ARROW)) {
      doodlers[0].MoveRight();
    }
  }
}

/// ======================
///  Debug
/// ======================
function drawDebugPanel(props) {
  textSize(props.fontSize);
  fill(props.fontGrayscale);
  text("x: " + nfc(doodlerX, 2), props.x, props.y + props.padding);
  text("y: " + nfc(doodlerY, 2), props.x, props.y + props.padding * 2);
  text("vel: " + nfc(doodlerVelocity, 2), props.x, props.y + props.padding * 3);
  text("Score: " + nfc(score, 2), props.x, props.y + props.padding * 4);
}

// ===========================
//  Doodler
// ===========================

const defaultSize = 60;
const defaultSpeed = 4;
const defaultX = 0,
  defaultY = 0;
const terminalVelocity = 10; //TODO: no idea about this, random number for now

var doodlerLeftImg;
var doodlerRightImg;

var doodlerId = 0;

class Doodler {
  constructor(props) {
    if (props) {
      this.size = props.size ? props.size : defaultSize;
      this.x = props.x ? props.x : 0;
      this.y = props.y ? props.y : 0;
      this.velocity = 0;
      this.speed = props.speed ? props.speed : defaultSpeed;
      this.isLookingLeft = false;
      this.brain = props.brain
        ? props.brain.Copy()
        : new NeuralNetwork({
            inputs: inputCount,
            hiddens: hiddenCount,
            outputs: outputCount,
          });
    } else {
      this.size = defaultSize;
      this.x = 0;
      this.y = 0;
      this.velocity = 0;
      this.speed = defaultSpeed;
      this.isLookingLeft = false;
      this.brain = new NeuralNetwork({
        inputs: inputCount,
        hiddens: hiddenCount,
        outputs: outputCount,
      });
    }
    // Fitness is normalized version of score
    this.fitness = 0;
    // Actual score is the game score
    this.actualScore = 0;

    // for visualizing brains choice
    this.choice = "<"; // or > or _

    // for auto-unstuck
    this.stuckFrames = 0; // how long has the doodler been stuck
    this.unstuckFrames = 0; // how long has the doodler been unstucking

    this.doodlerId = ++doodlerId;

    this.jumpYPos = height;
    this.jumpsOnSamePlatform = 0; // this negatively affects fitness
  }
  static Preload() {
    doodlerLeftImg = loadImage("./assets/player/player_left.png");
    doodlerRightImg = loadImage("./assets/player/player_right.png");
  }
  Draw() {
    fill(204, 200, 52);
    //tint(255, 128)
    if (this.isLookingLeft) {
      image(doodlerLeftImg, this.x, this.y, this.size, this.size);
    } else {
      image(doodlerRightImg, this.x, this.y, this.size, this.size);
    }
    if (drawDoodlerDebug) {
      this.DebugDrawNeuralData();
    }
  }
  DebugDrawNeuralData() {
    textSize(12);
    fill(50);
    stroke(200);
    //text("frame#: " + this.score, this.x, this.y)
    text("score: " + this.actualScore, this.x, this.y + 12);
    text("bad jumps: " + this.jumpsOnSamePlatform, this.x, this.y + 24);
    text("fitness: " + nfc(this.fitness, 5), this.x, this.y + 36);
    textSize(18);

    text(
      "ID: " + this.doodlerId,
      this.x + this.size * 0.75,
      this.y + this.size
    );
    textSize(30);
    fill(color(255, 0, 0, 255));
    text(this.choice, this.x + this.size * 0.25, this.y + this.size * 0.75);
  }
  CheckCollision() {
    platformList.forEach((plat) => {
      // Did the doodler hit a platform?
      if (
        this.x < plat.xPos + plat.width &&
        this.x + this.size > plat.xPos &&
        this.y + this.size < plat.yPos + plat.height &&
        this.y + this.size > plat.yPos &&
        this.yVelocity > 0
      ) {
        // Hit platform, jump!
        this.yVelocity = -10;
        if (nearlyEqual(this.jumpYPos, this.y, 0.05)) {
          this.jumpsOnSamePlatform++;
        }
        this.jumpYPos = this.y;
      }
    });

    // Did the doodler fall off the canvas?
    if (this.y > height) {
      // Doodler fell of the canvas, remove doodler and possibly update high score!
      if (this.actualScore > highScore) {
        highScore = this.actualScore;
      }
      scores.push(this.actualScore);
      averageScore = nfc(scores.reduce((p, c) => p + c, 0) / scores.length, 0);
      RemoveDoodler(this);
    }

    // screen wraps from left to right
    // Did the doodler go off the left side of the screen?
    if (this.x < -this.size) {
      // 0,0 is top left corner of doodler sprite
      // Doodler is off the left side of the screen, move to right side!
      this.x = width;
    }
    // Did the doodler go off the right side of the screen?
    else if (this.x > width) {
      // Doodler is off the right side of the screen, move to left side!
      this.x = -this.size; // 0,0 is top left corner of doodler sprite
    }
  }

  Update() {
    // doodler falls with gravity
    this.yVelocity += 0.2;
    this.y += this.yVelocity;
    const prevScore = this.actualScore;
    this.actualScore += platYChange;
    if (this.actualScore === prevScore) {
      this.stuckFrames++;
    } else {
      this.stuckFrames = 0;
    }
    if (
      this.stuckFrames >= stuckThreshold &&
      this.unstuckFrames < unstuckFrames
    ) {
      // Kill doodler if it was stuck too long on a single platform
      RemoveDoodler(this);
      this.unstuckFrames++;
    }
    if (this.unstuckFrames >= unstuckFrames) {
      this.unstuckFrames = 0;
      this.stuckFrames = 0;
    }
  }
  MoveLeft() {
    this.x -= this.speed;
    this.isLookingLeft = true;
  }
  MoveRight() {
    this.x += this.speed;
    this.isLookingLeft = false;
  }
  // Create a copy of this doodler
  Copy() {
    //console.log("copied doodler")
    let copy = new Doodler({
      brain: this.brain.Copy(),
    });
    copy.fitness = this.fitness;
    copy.doodlerId = this.doodlerId;
    return copy;
  }
  Mutate(rate) {
    this.brain.Mutate(rate);
  }
  Dispose() {
    this.brain.Dispose();
  }
  MaxPossibleHeight() {
    return this.jumpYPos - terminalVelocity * 10; //TODO: wild assumption, should calculate velocity changes..
  }
  Think() {
    // First find the closest platform to this doodler
    let closest = null;
    let closestDistance = Infinity;
    for (let i = 0; i < platformList.length; i++) {
      //let diff = platformList[i].yPos - this.y;
      let platCenter = platformList[i].center();
      let distance = dist(this.x, this.y, platCenter.xPos, platCenter.yPos);
      let wrappedDistance = dist(
        width + this.x,
        this.y,
        platCenter.xPos,
        platCenter.yPos
      ); // screen wraps so doodler can go through the side too!
      // if not the same platform, reachable and closest
      if (platCenter.yPos != this.jumpYPos) {
        if (platCenter.yPos > this.MaxPossibleHeight()) {
          if (distance < closestDistance) {
            closestDistance = distance;
            closest = platformList[i];
          } else if (wrappedDistance < closestDistance) {
            closestDistance = wrappedDistance;
            closest = platformList[i];
          }
        }
      }
    }
    if (closest != null) {
      stroke(color(0, 0, 0, 255));
      //line(this.x, this.y, closest.center().xPos, closest.center().yPos)
      stroke(color(0, 0, 255, 255));
      //line(this.x, this.y, this.x, this.MaxPossibleHeight())
    }
    // If everything went okay, create inputs for NN
    if (closest != null) {
      let inputs = [];
      let platCenter = closest.center();
      // x position of closest platform
      inputs[0] = map(platCenter.xPos, 0, width, 0, 1);
      // y position of closest platform
      inputs[1] = map(platCenter.yPos, 0, height, 0, 1);
      // doodlers X
      inputs[2] = map(this.x, 0, width, 0, 1);
      // doodlers Y
      inputs[3] = map(this.y, 0, height, 0, 1);
      // doodlers y velocity
      inputs[4] = map(
        this.yVelocity,
        -terminalVelocity,
        terminalVelocity,
        0,
        1
      );

      // Get the outputs from the network
      let outputs = [];
      outputs = this.brain.Predict(inputs);
      // Decide an input!
      if (outputs && outputs.length > 0) {
        let outputsArray = [outputs[0], outputs[1], outputs[2]]; // need to copy manually as p5.max has no idea of f32array
        let largestProbability = max(outputsArray);
        switch (largestProbability) {
          case outputsArray[0]:
            this.MoveLeft();
            this.choice = "<-";
            break;
          case outputsArray[1]:
            // do nothing
            this.choice = "--";
            break;
          case outputsArray[2]:
            this.MoveRight();
            this.choice = "->";
            break;
        }
      } else {
        console.error("Prediction error, no values");
      }
    }
  }
}

function nearlyEqual(a, b, epsilon) {
  let absA = abs(a);
  let absB = abs(b);
  let diff = abs(a - b);

  if (a == b) { // shortcut, handles infinities
    return true;
  } else if (a == 0 || b == 0 || (absA + absB < 0.0000001)) {
    // a or b is zero or both are extremely close to it
    // relative error is less meaningful here
    return diff < (epsilon * 0.0000001);
  } else { // use relative error
    return diff / min((absA + absB), 34000000000000000) < epsilon;
  }
}
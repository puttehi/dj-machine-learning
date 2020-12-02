// ===========================
//  Platforms
// ===========================
var platformList = []; // platforms in game
var platYChange = 0; // how much all platforms should move
var platformWidth = 90; // default width of platforms
var platformHeight = 20; // default height of platforms
var greenPlatformImg, bluePlatformImg, brownPlatformImg, whitePlatformImg;

class Platform {
  constructor(props) {
    this.xPos = props.x ? props.x : random(15, 300);
    this.yPos = props.y;
    this.width = props.width;
    this.height = props.height;
    this.sprite = props.sprite;
  }
  draw() {
    image(this.sprite, this.xPos, this.yPos, this.width, this.height);
  }
  update() {
    // move all platforms down
    this.yPos += platYChange;
    if (this.yPos > height) {
      Platform.DestroyOldest();
      Platform.Create();
    }
  }
  center(){
    return ({xPos: this.xPos + this.width * 0.5, yPos: this.yPos + this.height * 0.5})
  }
  debugDraw(props) {
    textSize(props.fontSize)
    fill(props.fontGrayscale)
    stroke(color(0,0,0))
    text("x: " + nfc(this.xPos, 2), this.xPos, this.yPos)
    text("y: " + nfc(this.yPos, 2), this.xPos, this.yPos + props.padding)
  }
  static Reset(){
    platformList = [];
  }
  static Create(props) {
    if (props) {
      if (props.unshift) {
        //console.log("CreatePlatform: props given using props (unshifting):" + props)
        platformList.unshift(new Platform({
          y: props.y ? props.y : 0,
          width: props.width ? props.width : platformWidth,
          height: props.height ? props.height : platformHeight,
          sprite: props.sprite ? props.sprite : greenPlatformImg
        }));
      } else {
        //console.log("CreatePlatform: props given using props (pushing):" + props)
        platformList.push(new Platform({
          y: props.y ? props.y : 0,
          width: props.width ? props.width : platformWidth,
          height: props.height ? props.height : platformHeight,
          sprite: props.sprite ? props.sprite : greenPlatformImg
        }));
      }
    } else {
      //console.log("CreatePlatform: no props given using defaults")
      platformList.unshift(new Platform({
        y: 0,
        width: platformWidth,
        height: platformHeight,
        sprite: greenPlatformImg
      }));
    }
  }
  static DestroyOldest() {
    var destroyedPlatform = platformList.pop();
    //console.log(`DestroyOldestPlatform: Popped platform ${destroyedPlatform}, there is now ${platformList.length} platforms in total`)
  }

  static InitNewGamePlatforms(amountPlatforms) {
    for (var i = 0; i < amountPlatforms; i++) {
      var platGap = height / amountPlatforms;
      var newPlatformYPosition = i * platGap;
      Platform.Create({
        y: newPlatformYPosition,
        width: platformWidth,
        height: platformHeight,
        sprite: greenPlatformImg,
        unshift: false
      });
    }
  }

  static preload() {
    greenPlatformImg = loadImage("https://raw.githubusercontent.com/JasonMize/coding-league-assets/master/doodle-jump-platform.png"); //TODO: Make green plat asset
    bluePlatformImg = loadImage("./assets/platforms/blue.png")
    brownPlatformImg = loadImage("./assets/platforms/brown.png")
    whitePlatformImg = loadImage("./assets/platforms/white.png")
  }
}
# Doodle Jump Machine Learning

A simple implementation of [TensorFlow.js](https://www.tensorflow.org/js) to implement reinforcement learning in a simplified clone of the platforming game Doodle Jump built on the [p5 framework](https://p5js.org/).

<img src="https://gitlab.dclabra.fi/PetteriZit/dj-machine-learning/-/raw/master/media/screenshot.png?raw=true" width="253" height="380" />

The game was rewritten from [this implementation by JasonMize](https://codepen.io/ainc/pen/ZxGXwd). 

The original game is published by Lima Sky LLC in the Google Play Store: [Link to app](https://play.google.com/store/apps/details?id=com.lima.doodlejump&hl=fi&gl=US).

## Try it out!

Clone this repository:

`git clone https://gitlab.dclabra.fi/PetteriZit/dj-machine-learning.git`

Go to the cloned directory:

`cd dj-machine-learning`

Serve the website (make sure you have [Node](https://nodejs.org/en/) installed on your local machine!): 

`npx serve`

Surf to shown ip and port on your web browser!

default: `localhost:5000`

## Training a new model

To train a new model, just press on the appropriate button and watch your agents go.

When you think you have trained enough, just press S on your keyboard to save the model.

You will download two files: 
* `best-doodler.json`
   * This file contains the model data and a reference to the weight file name (layout)
* `best-doodler.weights.bin`
   * This file contains the weights between the connections of the neural network nodes (training data)

If you want to speed up or slow down the program loop, drag the slider in the top left corner to adjust the speed cap.

[Check the `./media` folder for a demonstration](https://gitlab.dclabra.fi/PetteriZit/dj-machine-learning/-/blob/master/media/new.mp4)

## Loading a pre-trained model

If you got your model trained or want to test some of the models included in the `./models` directory, just upload the files from the menu.
* The `.json:` expects the `best-doodler.json` file
* The `.bin:` expects the `best-doodler.weights.bin` file

If you uploaded valid files the game will start using your uploaded model. If you want to save the additional training, just press S to save the model.

[Check the `./media` folder for a demonstration](https://gitlab.dclabra.fi/PetteriZit/dj-machine-learning/-/blob/master/media/pretrained.mp4)

**Note: Make sure there are no funny characters like `(1)` from downloading a similarly named file as the `.json` file contains a reference to the name of the `.bin` file and if Windows renamed it for you, the reference breaks!**

## Settings

You can adjust some of the settings on top of the `./sketch.js` file like:

* Amount of doodlers (default: 100)
* Amount of doodlers to draw (default: draw every other doodler)
    * Draw less doodlers to train more agents and not bog down the rendering loop
    * Best (top scoring) doodler is always drawn
* How long before a doodler is considered "stuck"
* Machine learning model node counts
    * If you change the input or output count, you need to modify other code!
* Drawing of platform and doodler debug information (positions/ML data)

## Additional information

### Neural network

The neural network "thinks" every frame about what to do and acts accordingly with the following data:

#### Layout
The neural network works on 3 layers: input-, hidden- and output layers.

The input layer takes in 5 inputs:
* Doodler x-position
* Doodler y-position
* Doodler y-velocity
* Next platforms x-position
* Next platforms y-position

And the output layer outputs 3 different outputs:
* Move left
* Don't Move
* Move right

<img src="https://gitlab.dclabra.fi/PetteriZit/dj-machine-learning/-/raw/master/media/ai_diagram_drawio.png?raw=true" width="600" height="233" />

#### Genetic algorithm

The genetic algorithm is quite simple. The doodlers gain fitness according to how good their score was compared to the whole generation and lose fitness on how many "bad jumps" they did compared to the whole generation.

Bad jumps are jumps where the doodler jumped on the same platform again. Bad jumps are weighted so they affect the resulting fitness more:

`doodler.fitness = (doodler.actualScore - (10 * doodler.jumpsOnSamePlatform)) / (scoreSum + (10 * badJumpSum));`

### Online information

Daniel Shiffman of CodingTrain has excellent video series on the topics at hand:

* [Coding Challenge #100.1: Neuroevolution Flappy Bird – Part 1](https://www.youtube.com/watch?v=c6y21FkaUqw)

* [3.1: Introduction to Session 3 - What is Machine Learning?](https://www.youtube.com/watch?v=LvIa0-ZKCrc)

* [9.2: Genetic Algorithm: How it works - The Nature of Code](https://www.youtube.com/watch?v=RxTfc4JLYKs)

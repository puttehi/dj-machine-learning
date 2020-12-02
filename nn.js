let visualizedModel;

class NeuralNetwork {
  constructor(props) {
    if (props) {
      this.input_nodes = props.inputs; // add ternary for getting this info from given model
      this.hidden_nodes = props.hiddens;
      this.output_nodes = props.outputs;
      this.model = props.model ? props.model : this.CreateModel();
      this.generation = generation;
    }
  }
  Save() {
    // Save to default Downloads-directory,
    // will download files best-doodler.json, best-doodler.weights.bin
    const saveData = this.model.save("downloads://best-doodler");
  }
  static Load() {
    const model = tf.loadLayersModel("./models/my-model.json");
    console.log(model);
  }
  Copy() {
    return tf.tidy(() => {
      const modelCopy = this.CreateModel();
      const weights = this.model.getWeights();
      const weightCopies = [];
      for (let i = 0; i < weights.length; i++) {
        weightCopies[i] = weights[i].clone();
      }
      modelCopy.setWeights(weightCopies);
      return new NeuralNetwork({
        model: modelCopy,
        inputs: this.input_nodes,
        hiddens: this.hidden_nodes,
        outputs: this.output_nodes,
      });
    });
  }
  CreateModel() {
    //console.log("yay")
    const model = tf.sequential();
    model.name = "Doodle Jump Bot";
    const hidden = tf.layers.dense({
      units: this.hidden_nodes,
      inputShape: [this.input_nodes],
      activation: "sigmoid",
    });
    hidden.name = "Hidden_layer";
    model.add(hidden);
    const output = tf.layers.dense({
      units: this.output_nodes,
      activation: "softmax",
    });
    output.name = "Output_layer";
    model.add(output);
    return model;
  }
  Predict(inputs) {
    return tf.tidy(() => {
      const xs = tf.tensor2d([inputs]);
      const ys = this.model.predict(xs);
      const outputs = ys.dataSync();
      return outputs;
    });
  }
  Mutate(rate) {
    tf.tidy(() => {
      const weights = this.model.getWeights();
      const mutatedWeights = [];
      for (let i = 0; i < weights.length; i++) {
        let tensor = weights[i];
        let shape = weights[i].shape;
        let values = tensor.dataSync().slice();
        for (let j = 0; j < values.length; j++) {
          if (random(1) < rate) {
            let w = values[j];
            values[j] = w + randomGaussian();
          }
        }
        let newTensor = tf.tensor(values, shape);
        mutatedWeights[i] = newTensor;
      }
      this.model.setWeights(mutatedWeights);
    });
  }
  Dispose() {
    this.model.dispose();
  }
}

const Matrix = require('./matrix.js');

class NeuralNetwork {

  // Ex. [4,8,8,2] :
  // 4 input nodes, 2 hidden layers with 8 nodes each, 2 output nodes
  constructor(struct) {

    if(struct.length < 3) {
      console.log("Neural Network structure not valid: You need at least an input, hidden an output layer.")
      return;
    }

    this._id = 0; // THIS IS REQUIRED TO STORE NEURAL NETWORK ON MONGODB

    this.net_struct = struct;

    this.weights = this.initWeights(struct);
    this.biases = this.initBiases(struct);


    // ==| TUNABLES |==
    this.learning_rate = 0.01;
    //^^^^^^^^^^^^^^^^^^^^^^^^

  }

  static initNeuralNetwork(old_net, new_output) {

    let new_net;

    if(new_output != undefined) {
      let new_struct = old_net.net_struct;
      new_struct[new_struct.length-1] = new_output;
      console.log("New struct: " + new_struct);
      new_net = new NeuralNetwork(new_struct);
    }
    else {
      new_net = new NeuralNetwork(old_net.net_struct);
    }
    
    // Copying weights
    for(let i in new_net.weights) {
      new_net.weights[i].populateFrom(Matrix.copy(old_net.weights[i]));
    }

    // Copying biases
    for(let i in new_net.biases) {
      new_net.biases[i].populateFrom(Matrix.copy(old_net.biases[i]));
    }

    new_net.learning_rate = old_net.learning_rate;

    return new_net;
  }

  initWeights(struct) {
    let weights = [];
    for (var i = 0; i < struct.length - 1; i++) {
      weights[i] = new Matrix(struct[i+1],struct[i]);
      weights[i].randomize();
    }
    // console.log(weights);
    return weights;
  }

  initBiases(struct) {
    let biases = [];
    for (var i = 0; i < struct.length - 1; i++) {
      biases[i] = new Matrix(struct[i+1],1);
      biases[i].randomize();
    }
    // console.log(biases);
    return biases;
  }

  predict(input) {
    let inputMatrix = Matrix.fromArray(input);
    // console.log(inputMatrix);

    let product = inputMatrix;

    for (var i = 0; i < this.net_struct.length - 1; i++) {

      let prev_product = product;
      product = Matrix.multiply(this.weights[i], prev_product);
      product.add(this.biases[i]);
      // console.log(product);
      product.map(sigmoid);

    }

    // console.log(product.toArray());

    return product.toArray();
  }

  train(input, target) {

    // Saving all predictions: To be used later when adjusting weights
    let products = [];
    products[0] = Matrix.fromArray(input);
    // console.log(inputMatrix);

    for (let i = 0; i < this.net_struct.length - 1; i++) {

      products[i+1] = Matrix.multiply(this.weights[i], products[i]);
      products[i+1].add(this.biases[i]);
      products[i+1].map(sigmoid);
    }

    // console.log(products);

    let targetMatrix = Matrix.fromArray(target);
    let errorsMatrix = Matrix.subtract(targetMatrix, products[products.length-1]);

    for (let i = this.net_struct.length - 1; i > 0; i--) {

      let prev_errors = errorsMatrix;

      if(i < this.net_struct.length - 1) {

        // Calculate the hidden layer errors
        let transposed_layer = Matrix.transpose(this.weights[i]);
        errorsMatrix = Matrix.multiply(transposed_layer, prev_errors);
      }

      // Calculating gradient
      let gradients = Matrix.map(products[i], dsigmoid);
      gradients.multiply(errorsMatrix);
      gradients.multiply(this.learning_rate);

      // Calculating Deltas
      let transposed_layer = Matrix.transpose(products[i-1]);
      let weights_deltas = Matrix.multiply(gradients, transposed_layer);

      // Apply changes to weights and biases
      this.weights[i-1].add(weights_deltas);
      this.biases[i-1].add(gradients);
    }

    // console.log(targetMatrix);
    // console.log(products[products.length-1]);
    // console.log(errorsMatrix);

  }
}

// Simgoid function and sigmoid derivate
function sigmoid(x)  { return 1 / (1 + Math.exp(-x)); }
function dsigmoid(y) { return y * (1-y); }



// Exporting the neural Network
module.exports = NeuralNetwork;

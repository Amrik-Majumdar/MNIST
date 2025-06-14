
from flask import Flask, render_template, request
import numpy as np

app = Flask(__name__)

class DNN:
    def __init__(self, sizes, epochs, lr):
        self.sizes = sizes
        self.epochs = epochs
        self.lr = lr
        self.params = {}

    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))

    def softmax(self, x):
        exps = np.exp(x - np.max(x))
        return exps / np.sum(exps)

    def forward_pass(self, x):
        p = self.params
        p['A0'] = x
        p['Z1'] = np.dot(p['W1'], p['A0'])
        p['A1'] = self.sigmoid(p['Z1'])
        p['Z2'] = np.dot(p['W2'], p['A1'])
        p['A2'] = self.sigmoid(p['Z2'])
        p['Z3'] = np.dot(p['W3'], p['A2'])
        p['A3'] = self.softmax(p['Z3'])
        return p['A3']

dnn = DNN([784, 128, 64, 10], 0, 0.01)
dnn.params['W1'] = np.load('W1.npy')
dnn.params['W2'] = np.load('W2.npy')
dnn.params['W3'] = np.load('W3.npy')

@app.route("/", methods=["GET", "POST"])
def index():
    prediction = None
    if request.method == "POST":
        pixels = request.form.get("pixels")
        pixels = [float(p) for p in pixels.split(",")]
        pixels = np.array(pixels).reshape(784, 1)
        output = dnn.forward_pass(pixels)
        prediction = int(np.argmax(output))
    return render_template("index.html", prediction=prediction)

if __name__ == "__main__":
    app.run(debug=True)

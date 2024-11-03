window.RxInlineWorker = function RxInlineWorker(func, self) {
    const global = window;
    var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);
    var _this = this;
    var functionBody;

    self = self || {};

    if (WORKER_ENABLED) {
        functionBody = func.toString().trim().match(
            /^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/
        )[1];
        
        return new global.Worker(global.URL.createObjectURL(
            new global.Blob([ functionBody ], { type: "text/javascript" })
        ));
    }

    function postMessage(data) {
        setTimeout(function() {
        _this.onmessage({ data: data });
        }, 0);
    }

    this.self = self;
    this.self.postMessage = postMessage;

    setTimeout(func.bind(self, self), 0);
}

RxInlineWorker.prototype.postMessage = function postMessage(data) {
    var _this = this;
    setTimeout(function() { _this.self.onmessage({ data: data }); }, 0);
};



// window.Gilgamesh = new window.RxInlineWorker(function(){
// }, self);


window.Gilgamesh = new RxInlineWorker(function(){


    this.map = function(x, in_min, in_max, out_min, out_max){
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

    this.onmessage = function (e) {

        const data = e.data;

        const type = data.type;

        this.imageData = data.imageData;

        this.centerX = data.centerX;
        this.centerY = data.centerY;
        this.zoom = data.zoom;
        this.resolution = data.resolution;
        this.diffusion = data.diffusion;

        this.width = data.width;
        this.height = data.height;

        this.imageData = this.UpdateMandelbrot();

        this.postMessage({ data : this.imageData, type : type });

    };

    this.UpdateMandelbrot = function(){

        const width = this.width;
        const height = this.height;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const zx = (x - width / 2) / this.zoom + this.centerX;
                const zy = (y - height / 2) / this.zoom + this.centerY;
              let cX = zx;
              let cY = zy;
        
              let iteration = 0;
              while (iteration < this.resolution) {
                const xtemp = cX * cX - cY * cY + zx;
                cY = 2 * cX * cY + zy;
                cX = xtemp;
        
                if (cX * cX + cY * cY > this.diffusion) break;
                iteration++;
              }

              const pixelIndex = (y * width + x) * 4;
              if (iteration === this.resolution) {
                const color = 255;
                this.imageData.data[pixelIndex] = color;
                this.imageData.data[pixelIndex + 1] = color;
                this.imageData.data[pixelIndex + 2] = color;
              } else {
                const normalizedIteration = iteration / this.resolution;
                const color = 255 * Math.sqrt(normalizedIteration);
                this.imageData.data[pixelIndex] = 50;
                this.imageData.data[pixelIndex + 1] = color;
                this.imageData.data[pixelIndex + 2] = color;

              }
              this.imageData.data[pixelIndex + 3] = 255;
            }
        }
    

        return this.imageData;
    };


}, self);
class SolarPanel {

    constructor(id, _c,_w,_s) {
        this._id = id; //needed for mongoDB
        this.capacity = _c;
        this.wattGeneration = _w; // Kw per minute
        this.stored_energy = _s;
        this.powered = true;
    }

    produce() {
        if(!this.powered) return 0;
        let currGeneration = Math.random() * this.wattGeneration;
        let prevStoredEnergy = this.stored_energy;
        this.stored_energy = (this.stored_energy + currGeneration > this.capacity) ? this.capacity : this.stored_energy + currGeneration;
        
        // console.log("Solar panel produced " + currGeneration + "Watt.");
        // console.log("Current stored energy: " + this.stored_energy);
        
        return this.stored_energy - prevStoredEnergy;
    }
}

if (typeof module !== 'undefined') {
  module.exports = SolarPanel;
}
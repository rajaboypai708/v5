// tick-loader.js

class TickDataLoader {
  constructor(dateStr, baseUrl = 'binance_data') {
    this.dateStr = dateStr;
    this.baseUrl = baseUrl;
    this.opens = null;
    this.closes = null;
    this.filledBoundary = -1; // last real-data index; -1 = not loaded yet
  }

  async load() {
    const [opensBuf, closesBuf] = await Promise.all([
      fetch(`${this.baseUrl}/opens-${this.dateStr}.bin`).then(r => r.arrayBuffer()),
      fetch(`${this.baseUrl}/closes-${this.dateStr}.bin`).then(r => r.arrayBuffer()),
    ]);

    this.opens = new Float64Array(opensBuf);
    this.closes = new Float64Array(closesBuf);
    this.filledBoundary = this._findFilledBoundary();
    return this.filledBoundary;
  }

  _findFilledBoundary() {
    // data is contiguous from index 0 — first NaN found is the boundary
    for (let i = 0; i < this.opens.length; i++) {
      if (Number.isNaN(this.opens[i])) return i - 1;
    }
    return this.opens.length - 1; // fully filled day (won't happen for "today, partial")
  }

  getOpen(secondOfDay) {
    if (secondOfDay < 0 || secondOfDay >= this.opens.length) return null;
    return this.opens[secondOfDay];
  }

  getClose(secondOfDay) {
    if (secondOfDay < 0 || secondOfDay >= this.closes.length) return null;
    return this.closes[secondOfDay];
  }

  hasData(secondOfDay) {
    const v = this.getOpen(secondOfDay);
    return v !== null && !Number.isNaN(v);
  }
}

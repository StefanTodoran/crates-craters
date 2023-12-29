export default class TrueSet<T> {
  private set: Set<string>;

  constructor() {
    this.set = new Set();
  }

  add(element: T) {
    this.set.add(JSON.stringify(element));
  }
  
  has(element: T) {
    return this.set.has(JSON.stringify(element));
  }
  
  delete(element: T) {
    return this.set.delete(JSON.stringify(element));
  }
  
  get size() {
    return this.set.size;
  }
}
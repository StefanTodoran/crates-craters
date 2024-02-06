export class AnySet<T> {
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

interface Position {
  x: number,
  y: number,
}

export class PositionSet {
  private set: Set<number>;
  private boardWidth: number;

  constructor(boardWidth: number) {
    this.set = new Set();
    this.boardWidth = boardWidth;
  }

  add(element: Position) {
    this.set.add(this.hash(element));
  }
  
  has(element: Position) {
    return this.set.has(this.hash(element));
  }
  
  delete(element: Position) {
    return this.set.delete(this.hash(element));
  }
  
  get size() {
    return this.set.size;
  }

  private hash(element: Position) {
    return element.y * this.boardWidth + element.x;
  }
}
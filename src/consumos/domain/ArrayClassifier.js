export default class ArrayClassifier {
  constructor(array, parentStrategy, parentChecker, childStrategy, expectedChilds, cleanUp, logger) {
    this.array = array;
    this.parentStrategy = parentStrategy;
    this.parentChecker = parentChecker;
    this.childStrategy = childStrategy;
    this.expectedChilds = expectedChilds
    this.cleanUp = cleanUp;
    this.logger = logger;
    this.log = []; // To log the ignored reagents.
    this.currParent; // To which reagent the numbers belong to.
    this.prevParent; // For error handling.
    this.skip = false; // Don't skip by default.
    this.currChild = expectedChilds.length; // Initial value for error handling.
  }
  
  parse() {
    let output = {}; // Return value accumulator.
    for (let element of this.array) {
      if (this.parentChecker(element)) {
        this.parentStrategy(element, output);
      } else {
        this.childStrategy(element, output);
      }
    }
    this.cleanUp();
    this.logger();
    return output;
  }
}
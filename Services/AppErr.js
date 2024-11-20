class AppErr extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = false;
    }
  }
  
  module.exports = AppErr;
  
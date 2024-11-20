class Methods {
    // Method to get all records
    async getAll(model) {
      try {
        const newRecord = await model.find();
        return {
          status: 200,
          result: newRecord,
        };
      } catch (error) {
        return {
          status: 400,
          result: error.message,
        };
      }
    }
  
    // Method to get a record by ID
    async getById(model, id) {
      try {
        const newRecord = await model.findById(id);
        return {
          status: 200,
          result: newRecord,
        };
      } catch (error) {
        return {
          status: 400,
          result: error.message,
        };
      }
    }
  
    // Method to create a new record
    async create(model, payload) {
      try {
        const newRecord = await model.create(payload);
        return {
          status: 200,
          result: newRecord,
        };
      } catch (error) {
        return {
          status: 400,
          result: error.message,
        };
      }
    }
  
    // Method to update a record by ID
    async update(model, id, payload) {
      try {
        const newRecord = await model.findByIdAndUpdate(id, payload, {
          new: true,
        });
        return {
          status: 200,
          result: newRecord,
        };
      } catch (error) {
        return {
          status: 400,
          result: error.message,
        };
      }
    }
  
    // Method to delete a record by ID
    async delete(model, id) {
      try {
        const result = await model.findByIdAndDelete(id);
        if (!result) {
          throw new Error(`Record with ID ${id} not found`);
        }
        return result;
      } catch (error) {
        throw new Error(`Unable to delete record: ${error.message}`);
      }
    }
  }
  
  module.exports = Methods;
  
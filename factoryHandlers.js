const ApiFeatures = require("../utils/apiFeatures");

exports.getAll = async (req, res, next) => {
  try {
    let features = new ApiFeatures(Model.find(), req.query)
      .search(modelName)
      .filter()
      .sort()
      .limitFields()
      .paginate(countDocuments);

    // Add a debug log before executing the query
    console.log("Final MongoDB query:", features.mongooseQuery.getQuery());

    const docs = await features.query;
    res.status(200).json({
      status: "success",
      results: docs.length,
      data: {
        data: docs,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

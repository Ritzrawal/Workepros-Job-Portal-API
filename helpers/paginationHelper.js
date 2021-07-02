
module.exports = async (req, defaultPage, defaultLimit)=> {
  const limit = req.query['limit'] && req.query['limit'] != 0 ? parseInt(req.query['limit'], 10) : defaultLimit;
  const page = req.query['page'] && req.query['page'] != 0 ? parseInt(req.query['page'], 10) : defaultPage;
  const skip = (page - 1) * limit;
  return {limit, skip};
};


const db = require('./db');

module.exports = (req) => {
  const {
    _end,
    _order,
    _sort,
    _start,
    sort,
    order,
    q,
  } = req.query;

  let final = {
    skip: 0,
    limit: 10000000000000000,
    // sort
    // order
  };

  if (_end && _start) {
    final.limit = _end - _start;
    final.skip = parseInt(_start, 10);
    delete req.query._end;
    delete req.query._start;
  } else if (_end) {
    final.limit = parseInt(_end, 10);
    delete req.query._end;
  } else if (_start) {
    final.skip = parseInt(_start, 10);
    delete req.query._start;
  }

  if (_sort) {
    final.sort = _sort;
    delete req.query._sort;
  }

  if (_order) {
    final.order = _order.toLowerCase() === 'asc' ? 1 : -1;
    delete req.query._order;
  }

  if (sort) {
    final.sort = sort;
    delete req.query.sort;
  }
  if (order) {
    final.order = order.toLowerCase() === 'asc' ? 1 : -1;
    delete req.query.order;
  }

  req.pagination = final;

  delete req.query.limit;
  delete req.query.skip;
  delete req.query.sort;
  delete req.query.order;

  if (req.query._id) {
    if (!Array.isArray(req.query._id)) {
      req.query._id = [req.query._id];
    }
    req.query._id = {
      $in: req.query._id.map((id) => db._id(id))
    }
  }

  return req
}
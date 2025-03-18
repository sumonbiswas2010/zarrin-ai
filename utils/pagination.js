const paginate = (query) => {
  let limit = +query.limit; // getting limit from query string and converting it to number.
  let offset = +query.page; // getting page from query string and converting it to number. then it is converting into offset for db queries.
  if (Number.isNaN(limit)) limit = 300;
  else if (limit > 500) limit = 500;
  if (Number.isNaN(offset)) offset = 0;
  else offset *= limit;
  return { limit, offset };
};

module.exports = {
  paginate,
};

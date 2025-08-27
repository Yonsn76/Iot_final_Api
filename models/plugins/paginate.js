const mongoose = require('mongoose');

// Plugin de paginación para Mongoose
const paginate = (schema, options) => {
  options = options || {};
  
  const defaultOptions = {
    page: 1,
    limit: 10,
    customLabels: {
      docs: 'docs',
      totalDocs: 'totalDocs',
      limit: 'limit',
      page: 'page',
      totalPages: 'totalPages',
      hasNextPage: 'hasNextPage',
      hasPrevPage: 'hasPrevPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage'
    }
  };

  const opts = { ...defaultOptions, ...options };

  schema.statics.paginate = async function(query, options) {
    const customLabels = { ...defaultOptions.customLabels, ...opts.customLabels };
    
    const page = parseInt(options.page) || opts.page;
    const limit = parseInt(options.limit) || opts.limit;
    const sort = options.sort || {};
    
    const skip = (page - 1) * limit;
    
    // Ejecutar queries en paralelo
    const [docs, totalDocs] = await Promise.all([
      this.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const prevPage = hasPrevPage ? page - 1 : null;
    
    const result = {
      [customLabels.docs]: docs,
      [customLabels.totalDocs]: totalDocs,
      [customLabels.limit]: limit,
      [customLabels.page]: page,
      [customLabels.totalPages]: totalPages,
      [customLabels.hasNextPage]: hasNextPage,
      [customLabels.hasPrevPage]: hasPrevPage,
      [customLabels.nextPage]: nextPage,
      [customLabels.prevPage]: prevPage
    };
    
    return result;
  };
};

module.exports = paginate;

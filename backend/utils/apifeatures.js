class ApiFeatures {
  constructor(dbQuery, queryObj) {
    this.dbQuery = dbQuery;
    this.queryObj = queryObj;
  }

  search() {
    const keyword = this.queryObj.keyword
      ? {
          name: {
            $regex: this.queryObj.keyword,
            $options: "i",
          },
        }
      : {};

    this.dbQuery = this.dbQuery.find({ ...keyword });
    return this;
  }

  filterByCategory() {
    const mainCategory = this.queryObj.mainCategory;
    const subCategory = this.queryObj.subCategory;

    if (mainCategory && !subCategory) {
      this.dbQuery = this.dbQuery.find({
        "category.mainCategory": mainCategory,
        "category.subCategory": { $exists: true },
      });
    } else if (mainCategory && subCategory) {
      this.dbQuery = this.dbQuery.find({
        "category.mainCategory": mainCategory,
        "category.subCategory": subCategory,
      });
    }
 
   
    return this;
  }
  filterByPrice() {
    const queryCopy = { ...this.queryObj };
    //   Removing some fields for category
    const removeFields = [
      "keyword",
      "page",
      "limit",
      "mainCategory",
      "subCategory",
    ];

    removeFields.forEach((key) => delete queryCopy[key]);

    // Filter For Price and Rating

    let queryObj = JSON.stringify(queryCopy);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    
    this.dbQuery = this.dbQuery.find(JSON.parse(queryObj));

    return this;
  }

  pagination(resultPerPage) {
    const currentPage = Number(this.queryObj.page) || 1;

    const skip = resultPerPage * (currentPage - 1);

    this.dbQuery = this.dbQuery.limit(resultPerPage).skip(skip);

    return this;
  }
}

module.exports = ApiFeatures;

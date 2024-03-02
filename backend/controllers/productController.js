const Product = require("../Models/productModel");
const Verient = require("../Models/verientModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncFuncError = require("../middleware/catchAsyncFuncError");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");

// Get all products.
exports.getAllProducts = catchAsyncFuncError(async (req, res, next) => {
  const resultPerPage = 8;
  const productsCount = await Product.countDocuments({});
  let apifeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filterByCategory()
    .filterByPrice();

  // Kindly look back twice

  let products = await apifeature.dbQuery;
  let filteredProductsCount = products.length;

  apifeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filterByCategory()
    .filterByPrice()
    .pagination(resultPerPage);

  products = await apifeature.dbQuery;

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  });

  next();
});

// Get all products (ADMIN)
exports.getAdminProducts = catchAsyncFuncError(async (req, res) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

// create Product => admin
exports.createProduct = catchAsyncFuncError(async (req, res, next) => {
  const { thumbnail } = req.body;

  if (!thumbnail) {
    return next(new ErrorHandler("Thumbnail Image required . ", 400));
  }

  let uploadedThumbnail = {
    public_id: "Sample ID",
    url: "Sample Url",
  };
  // try {
  //   const result = await cloudinary.v2.uploader.upload(thumbnail, {
  //     folder: "products",
  //   });

  //   uploadedThumbnail = {
  //     public_id: result.public_id,
  //     url: result.secure_url,
  //   };
  // } catch (error) {
  //   return next(new ErrorHandler("Error in thumbnail Uploading . ", 400));
  // }

  const { name, description, category, verients = [] } = req.body;

  if (verients.length < 1) {
    return next(new ErrorHandler("Add atleast one verient.", 401));
  }

  // console.log(req.user.id)
  const product = await Product.create({
    name,
    description,
    category,
    user: req.user.id,
    thumbnail: uploadedThumbnail,
  });

  try {
    for (let i = 0; i < verients.length; i++) {
      const {
        storage,
        color,
        used,
        quantity,
        accessories,
        price,
        pta,
        condition,
        discount,
        images: vImages,
      } = verients[i];

      const imagesLink = [
        {
          public_id: "Sample Id",
          url: "Sample Url",
        },
      ];

      // let images = [];

      // if (typeof vImages === "string") {
      //   images.push(vImages);
      // } else {
      //   images = vImages;
      // }

      // const imagesLink = [];

      // for (let i = 0; i < images.length; i++) {
      //   const result = await cloudinary.v2.uploader.upload(images[i], {
      //     folder: "products",
      //   });

      //   imagesLink.push({
      //     public_id: result.public_id,
      //     url: result.secure_url,
      //   });
      // }

      await Verient.create({
        storage,
        color,
        accessories,
        condition,
        price,
        quantity,
        used,
        pta,
        product: product._id,
        discount,
        images: imagesLink,
        user:req.user.id
      });

      // Increment totalQuantity after Verient creation
      product.totalQuantity += quantity;
    }
  } catch (error) {
    console.log("Error in Adding verients while creating product", error);
  }
  // body should be object on schema

  await product.save({ validateBeforeSave: true });
  res.status(201).json({
    success: true,
    product,
  });
  next();
});

// Get single Product
exports.getSingleProduct = catchAsyncFuncError(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    res.status(200).json({
      success: true,
      product,
    });

    next();
  } catch (error) {
    return next(new ErrorHandler("Product not Found", 500));
  }
});

// Update products -- Admin
exports.updateProduct = catchAsyncFuncError(async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler("Product not foound.", 500));
    }

    // For images
    //   let images = [];

    //   if (typeof req.body.images === "string") {
    //     images.push(req.body.images);
    //   } else {
    //     images = req.body.images;
    //   }
    //   if (images !== undefined) {
    //     for (let i = 0; i < product.images.length; i++) {
    //       await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    //     }
    //   }

    // const imagesLink = [];

    // for (let i = 0; i < images.length; i++) {
    //   const result = await cloudinary.v2.uploader.upload(images[i], {
    //     folder: "products",
    //   });

    //   imagesLink.push({
    //     public_id: result.public_id,
    //     url: result.secure_url,
    //   });
    // }

    // req.body.images = imagesLink

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    return next(new ErrorHandler("Product not Found", 500));
  }
});

//  Delete product
exports.deleteProduct = catchAsyncFuncError(async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(500).json({
        success: false,
        message: "Product not found",
      });
    }

    // delete images from cloudinary

    // for (let i = 0; i < product.images.length; i++) {
    //   await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    // }

    await Verient.deleteMany({ product: req.params.id });
    await Product.deleteOne({ _id: req.params.id });
    res.status(200).json({
      success: true,
      message: "Product deleted successfuly1 ",
    });
    next();
  } catch (err) {
    return next(new ErrorHandler("Product not Found", 500));
  }
});

// ***********************************************************************************
// ***********************************************************************************

// Create New review or update the review
exports.createProductReview = catchAsyncFuncError(async (req, res, next) => {
  // For images
  // let images = [];

  // if (typeof req.body.images === "string") {
  //   images.push(req.body.images);
  // } else {
  //   images = req.body.images;
  // }

  // const imagesLink = [];

  // for (let i = 0; i < images.length; i++) {
  //   const result = await cloudinary.v2.uploader.upload(images[i], {
  //     folder: "reviews",
  //   });

  //   imagesLink.push({
  //     public_id: result.public_id,
  //     url: result.secure_url,
  //   });
  // }

  // req.body.images = imagesLink;

  const { rating, comment, productId } = req.body;
  let isUpdated = false;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  //find product
  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
    isUpdated = true;
  } else {
    product.reviews.unshift(review);
    product.numberOfReviews = product.reviews.length;
  }

  let sum = 0;
  product.reviews.forEach((rev) => {
    sum += rev.rating;
  });

  product.ratings = sum / product.reviews.length;

  await product.save({
    validateBeforeSave: false,
  });

  res.status(200).json({
    success: true,
    message: isUpdated ? "Review Updated" : "Review added",
  });
});

// Get All Reviews of a product
exports.getProductReviews = catchAsyncFuncError(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product not Found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// delete Review
exports.deleteReview = catchAsyncFuncError(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not Found", 404));
  }

  const reviews = product.reviews.filter((rev) => {
    return rev._id.toString() !== req.query.id.toString();
  });

  let avg = 0;
  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;
  if (reviews.length === 0 || reviews.length < 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numberOfReviews = reviews.length;
  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings: ratings || 0,
      numberOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    }
  );

  res.status(200).json({
    success: true,
  });
});

// Get single Product
// exports.getSingleProduct = async (req, res, next) => {

//     const product = await Product.findById(req.params.id);

//     if (!product) {
//         return next(new Error())
//     }

//     res.status(200).json({
//         success: true,
//         product
//     })
// }

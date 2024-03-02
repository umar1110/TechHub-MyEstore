const catchAsyncFuncError = require("../middleware/catchAsyncFuncError");
const Verient = require("../Models/verientModel");
const Product = require("../Models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const cloudinary = require("cloudinary");

exports.addVerient = catchAsyncFuncError(async (req, res, next) => {
  const { productId } = req.params;

  let isUpdated = false;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("Product Not Exists. ", 400));
  }

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
  } = req.body;

  let createdVerient;
  const prevStcok = await Verient.findOne({
    storage,
    color,
    used,
    accessories: accessories ? accessories : "With no accessories",
    pta,
    condition,
    product: productId,
  });

  if (prevStcok) {
    if (price !== prevStcok.price) {
      prevStcok.price = price;
    }
    if (discount != prevStcok.discount) {
      prevStcok.discount = discount;
    }
    prevStcok.quantity += quantity;
    prevStcok.user = req.user.id;

    await prevStcok.save({ validateBeforeSave: true });
    createdVerient = prevStcok;
    isUpdated = true;
  } else {
    if (!vImages) {
      return next(
        new ErrorHandler("Atleast one image require of verient.", 401)
      );
    }

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

    const imagesLink = {
      public_id: "result.public_id",
      url: "result.secure_url",
    };
    createdVerient = await Verient.create({
      storage,
      color,
      accessories,
      condition,
      price,
      quantity,
      used,
      pta,
      product: productId,
      discount,
      images: imagesLink,
      user: req.user.id,
    });
  }

  product.totalQuantity += quantity;

  product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: isUpdated
      ? "Verient have been updated "
      : "Verient have been added",
    verient: createdVerient,
  });
});

exports.deleteVerient = catchAsyncFuncError(async (req, res, next) => {
  const { verientId } = req.params;

  const verient = await Verient.findById(verientId);

  if (!verient) {
    return next(new ErrorHandler("Verient not foound.", 400));
  }

  // delete images from cloudinary

  // for (let i = 0; i < verient.images.length; i++) {
  //   await cloudinary.v2.uploader.destroy(verient.images[i].public_id);
  // }

  await Verient.findByIdAndDelete(verientId);
  return res.status(200).json({
    success: true,
    message: "Verient deleted successfully.",
  });
});
exports.updateVerient = catchAsyncFuncError(async (req, res, next) => {
  const { verientId } = req.params;

  let verient = await Verient.findById(verientId);

  if (!verient) {
    return next(new ErrorHandler("Verient not foound.", 400));
  }

  if (req.body.images) {
    console.log("Upadte images in updateVerient Controller");
  }
  verient = await Verient.findByIdAndUpdate(verientId, req.body, {
    new: true,
  });

  return res.status(200).json({
    success: true,
    message: "Verient Updated Succcessfully.",
    verient,
  });
});

// User Get verients
exports.getVerients = catchAsyncFuncError(async (req, res, next) => {
  const { productId } = req.params;

  const verients = await Verient.find({ product: productId });

  if (!verients) {
    return next(new ErrorHandler("No Verient Available", 500));
  }

  return res.status(200).json({
    success: true,
    verients,
  });
});

const mongoose = require("mongoose");
const Product = require("./productModel");
const verientSchema = new mongoose.Schema(
  {
    storage: {
      type: Number, // In GBs
      required: [true, "Storage required to add verient."],
    },
    color: {
      type: String,
    },
    used: {
      type: Boolean,
      required: [true, "Add used or not to add verient."],
    },
    quantity: {
      type: Number,
      required: [true, "Add quantity to add verient."],
      default: 0,
    },
    discount: {
      // Any one accept , and set other by yourself before save
      rate: {
        type: Number,
      },
      discountPrice: {
        type: Number,
      },
    },

    accessories: {
      type: String,
      default: "With no accessories",
    },
    price: {
      type: Number,
      required: [true, "Price required to Add verient"],
      max: [9999999, "Price must not be greater than 9999999"],
    },
    pta: {
      type: Boolean,
      required: [true, "Pta or Non Pta ? "],
    },
    condition: {
      type: Number,
      required: [true, "Condition required "],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "Product required to create verient"],
    },
    prevPrice: {
      // Just to cehck in post function
      type: Number,
      default: 0,
    },
    afterDiscoutPrice: {
      type: Number,
      default: 0,
    },

    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    user: {
      // get whenever product created
      type: mongoose.Schema.ObjectId,
      ref: "User", // means we are getting it by document of User Collection
      //   required: true,
    },
  },
  { timestamps: true }
);

verientSchema.pre("save", async function (next) {
  if (!this.isModified("price") && !this.isModified("discount")) {
    return next();
  }

  if (this.discount.rate) {
    const discountedPrice = (this.discount.rate / 100) * this.price;

    this.afterDiscoutPrice = this.price + discountedPrice;
    this.discount.discountPrice = discountedPrice;
  } else if (this.discount.discountPrice) {
    this.afterDiscoutPrice = this.price + this.discount.discountPrice;
    const discoutRate = (this.discount.discountPrice / this.price) * 100;

    this.discount.rate = discoutRate;
  }

  return next();
});

verientSchema.post("save", async function (doc) {
  if (doc.prevPrice === doc.price) {
    return;
  }
  const Verient = this.model("Verient");
  const lowestPriceVerient = await Verient.findOne({})
    .sort({ price: 1 }) // Sort in ascending order based on the price
    .exec();

  const product = await Product.findById(doc.product);

  const lowestPriceStocForProduct = {
    beforeDiscountPrice: lowestPriceVerient.price,
    afterDiscountPrice: lowestPriceVerient.afterDiscoutPrice,
    discountRate: lowestPriceVerient.discount.rate,
  };

  product.lowestPriceVerient = lowestPriceStocForProduct;

  await product.save({ validateBeforeSave: false });

  this.prevPrice = doc.price;
  await doc.save();
});

module.exports = mongoose.model("Verient", verientSchema);

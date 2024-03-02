const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  { 
    name: {
      type: String,
      required: [true, "Please Enter product name"],
      unique:true,
      trim: true,
    },

    description: {
      type: String,
    },

    lowestPriceVerient: {
      beforeDiscountPrice: {
        type: Number,
        default: 0,
      },
      afterDiscountPrice: {
        type: Number,
        default: 0,
      },
      discountRate: {
        type: Number,
        default: 0,
      },
    },

    ratings: {
      type: Number,
      default: 0,
    },
    thumbnail: 
      {
        public_id: {
          type: String,
          required: [true, "Public Id missing in Thumbnial"],
        },
        url: {
          type: String,
          required: [true, "Url missing in Thumbnial"],

        },
      },
    

    category: {
      mainCategory: {
        // Eg :  Laptop , Phone , Etc
        type: String,
        required: [true, "PLease Enter Product Category"],
      },
      subCategory: {
        // Eg :  Samsung , Oppo , Iphone etc
        type: String,
        required: [true, "PLease Enter Product Category"],
      },
    },

    totalQuantity: {
      type: Number,
      default: 0,
      
      maxLength: [4, "Quantity cannot exceed 4 characters"],
    },

    numberOfReviews: {
      type: Number,
      default: 0,
    },

    reviews: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          required: true,
        },
        comment: {
          type: String,
          required: true,
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

module.exports = mongoose.model("Product", productSchema);

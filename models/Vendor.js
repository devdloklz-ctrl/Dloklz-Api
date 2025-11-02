import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    store_name: String,
    first_name: String,
    last_name: String,
    phone: String,
    social: {
      fb: String,
      twitter: String,
      pinterest: String,
      linkedin: String,
      youtube: String,
      instagram: String,
      flickr: String,
      threads: String,
    },
    show_email: Boolean,
    address: Array,
    location: String,
    banner: String,
    gravatar: String,
    shop_url: String,
    rating: {
      rating: String,
      count: Number,
    },
    enabled: Boolean,
    registered: String,
    payment: String,
    trusted: Boolean,
    company_name: String,
    vat_number: String,
    company_id_number: String,
    bank_name: String,
    bank_iban: String,
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", VendorSchema);

const mongoose = require('mongoose');

const countryStateCitySchema = new mongoose.Schema(
    {
      country_states_cities: {
        country_name: String,
        states: [{
          state_name: String,
          cities: [String],
        }],
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

module.exports = mongoose.model('CountryStateCity', countryStateCitySchema);

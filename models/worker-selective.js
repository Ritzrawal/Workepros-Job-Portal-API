const mongoose = require('mongoose');

const workerSelectiveSchema = new mongoose.Schema(
    {
      default_work_exp_roles: [String],
      default_certificates: [String],
      default_work_perf_benefits: [String],
      default_work_perf_dev_type: [String],
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

module.exports = mongoose.model('WorkerSelective', workerSelectiveSchema);

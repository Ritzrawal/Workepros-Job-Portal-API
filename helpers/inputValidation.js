const Joi = require('@hapi/joi');
const { validateData } = require('../helpers/reqAndJoiObjectValidator');
const { trimAndLowCase } = require('../helpers/manipulation');
const responseHelper = require('./responseHelper');
const { User, Category, Company } = require('../models');
const {
  EMAIL_REG,
  INVALID_EMAIL,
  INVALID_PASS,
  PASS_REG,
  SERVER_ERROR,
  USER_EMAIL_EXISTS,
  CATEGORY_EXISTS,
  TIME_REG,
  FILES_REQUIRED,
  USER_NOT_FOUND,
  COMPANY_EXISTS,
  NO_ACCESS,
  FILES_FORMAT_ERROR,
} = require('../utils/constVariables');
const roles = ['employer', 'worker'];
const duration = ['MONTHLY', 'ANUALLY'];
const plan = ['STANDARD', 'BUSINESS', 'PREMIUM'];
const ticket = ['open', 'resolved'];
const subscriber = ['SUBSCRIBED', 'RENEWED', 'EXPIRED', 'UPGRADED', 'PENDING'];
const categoryJoiSchema = Joi.object({
  title: Joi.string()
    .required(),
  skills: Joi.array()
    .items(Joi.string())
    .required(),
});

module.exports = {
  // Sign-in validation
  signInValidation: async (req, res, next) => {
    try {
      const JoiSchema = await Joi.object({
        email: Joi.string()
          .regex(EMAIL_REG)
          .rule({
            message: INVALID_EMAIL,
          })
          .required(),
        password: Joi.string()
          .required(),
      });
      await validateData(req.body, JoiSchema, {}, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // Sign-up validation
  signUpValidation: async (req, res, next) => {
    try {
      let errors = {};

      const joiSchemaObj = {
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string()
          .regex(EMAIL_REG)
          .rule({
            message: INVALID_EMAIL,
          })
          .required(),
        password: Joi.string()
          .regex(PASS_REG)
          .rule({
            message: INVALID_PASS,
          })
          .required(),
        role: Joi.string().valid(...roles).required(),
      };
      // joiSchemaObj['first_name'] = req.body['role'] && req.body['role'] === 'employer' ? Joi.string().optional().allow(null, '') : Joi.string().required();
      // joiSchemaObj['last_name'] = req.body['role'] && req.body['role'] === 'employer' ? Joi.string().optional().allow(null, '') : Joi.string().required();
      joiSchemaObj['company_name'] = req.body['role'] && req.body['role'] === 'employer' ? Joi.string().required() : Joi.string().optional().allow(null, '');
      const JoiSchema = await Joi.object(joiSchemaObj);
      if (req.body['role'] && req.body['role'] === 'employer' && await duplicateCompany(await trimAndLowCase(req.body['company_name']), req)) {
        errors['company'] = COMPANY_EXISTS;
      }
      errors = await dbSameEmailError(req.body['email'], errors);
      return await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // Google sign in body validation
  googleAuthValidation: async (req, res, next) => {
    try {
      const JoiSchema = await Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().regex(EMAIL_REG).rule({ message: INVALID_EMAIL, }).required(),
        profile_id: Joi.string().required(),
        profile_image: Joi.string().allow(null, '').optional(),
        role: Joi.string().required(),
      });

      await validateData(req.body, JoiSchema, {}, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  googleSignInValidation: async (req, res, next) => {
    try {
      const JoiSchema = await Joi.object({
        first_name: Joi.string(),
        last_name: Joi.string(),
        email: Joi.string().regex(EMAIL_REG).rule({ message: INVALID_EMAIL, }),
        profile_id: Joi.string().required(),
        profile_image: Joi.string().allow(null, '').optional(),
      });
      await validateData(req.body, JoiSchema, {}, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // forgot password validation
  forgotPasswordValidation: async (req, res, next) => {
    try {
      try {
        const JoiSchema = await Joi.object({
          email: Joi.string()
            .regex(EMAIL_REG)
            .rule({
              message: INVALID_EMAIL,
            })
            .required(),
        });
        await validateData(req.body, JoiSchema, {}, res, next);
      } catch (error) {
        logger.error(error);
        return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // change password validation
  changePasswordValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        authorization: Joi.string()
          .required(),
        password: Joi.string()
          .regex(PASS_REG)
          .rule({
            message: INVALID_PASS,
          })
          .required(),
      });
      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // change password from setting
  settingChangePasswordValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        old_password: Joi.string()
          .required(),
        new_password: Joi.string()
          .regex(PASS_REG)
          .rule({
            message: INVALID_PASS,
          })
          .required(),
      });

      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // Category validation
  categoryValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = categoryJoiSchema;

      if (await duplicateCategory(await trimAndLowCase(req.body['title']))) {
        errors['category'] = CATEGORY_EXISTS;
      }
      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // Job validation
  JobValidation: async (req, res, next) => {
    try {
      const phase = ['draft', 'published'];
      let workStartAndEndJoiSchema = Joi.object({
        start: Joi.string().regex(TIME_REG).allow('', null).optional(),
        end: Joi.string().regex(TIME_REG).allow('', null).optional(),
        off: Joi.boolean().required(),
      }).required();
      let joiCompObj;
      if (req.body['phase'] == 'published') {
        joiCompObj = Joi.object({
          title: Joi.string()
            .required(),
          // skill_level: Joi.string()
          //     .required(),
          // desired_experience: Joi.number()
          //     .required(),
          job_type: Joi.string()
            .required(),
          pay_rate: Joi.object({
            min: Joi.number().required(),
            max: Joi.number().required(),
            pay_type: Joi.string().required(),
          })
            .optional(),
          summary: Joi.string()
            .required(),
          responsibilities: Joi.string().allow('', null)
            .optional(),
          address: Joi.object({
            city: Joi.string().required(),
            state: Joi.string().required(),
          }).required(),
          working_schedule: Joi.object({
            sunday: workStartAndEndJoiSchema,
            monday: workStartAndEndJoiSchema,
            tuesday: workStartAndEndJoiSchema,
            wednesday: workStartAndEndJoiSchema,
            thursday: workStartAndEndJoiSchema,
            friday: workStartAndEndJoiSchema,
            saturday: workStartAndEndJoiSchema,
          })
            .required(),
          job_role: Joi.array()
            .items(Joi.string())
            .required(),
          benefits: Joi.array()
            .items(Joi.string())
            .optional(),
          certificates: Joi.array()
            .items(Joi.string())
            .optional(),
          categories: Joi.array()
            .items(Joi.object({
              title: Joi.string()
                .required(),
              skills: Joi.array()
                .items(Joi.string())
                .required(),
              desired_experience: Joi.number()
                .required(),
            }))
            .required(),
          phase: Joi.string().valid(...phase).required(),
        });
      } else {
        workStartAndEndJoiSchema = Joi.object({
          start: Joi.string().regex(TIME_REG).allow('', null).optional(),
          end: Joi.string().regex(TIME_REG).allow('', null).optional(),
          off: Joi.boolean().optional(),
        }).optional();
        joiCompObj = Joi.object({
          title: Joi.string()
            .required(),
          job_type: Joi.string().allow('', null).optional(),
          pay_rate: Joi.object({
            min: Joi.number().optional(),
            max: Joi.number().optional(),
            pay_type: Joi.string().optional(),
          }).optional(),
          job_role: Joi.array()
            .items(Joi.string())
            .optional(),
          summary: Joi.string().allow('', null),
          responsibilities: Joi.string().allow('', null).optional(),
          address: Joi.object({
            city: Joi.string().allow('', null),
            state: Joi.string().required(),
          }).optional(),
          working_schedule: Joi.object({
            sunday: workStartAndEndJoiSchema,
            monday: workStartAndEndJoiSchema,
            tuesday: workStartAndEndJoiSchema,
            wednesday: workStartAndEndJoiSchema,
            thursday: workStartAndEndJoiSchema,
            friday: workStartAndEndJoiSchema,
            saturday: workStartAndEndJoiSchema,
          })
            .optional(),
          benefits: Joi.array()
            .items(Joi.string())
            .optional(),
          certificates: Joi.array()
            .items(Joi.string())
            .optional(),
          categories: Joi.array()
            .items(Joi.object({
              title: Joi.string().optional(),
              skills: Joi.array()
                .items(Joi.string()),
              desired_experience: Joi.number().optional(),
            })).optional(),
          phase: Joi.string().valid(...phase).required(),
        });
      }
      const errors = {};

      const JoiSchema = joiCompObj;

      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // Company validation
  CompanyValidation: async (req, res, next) => {
    try {
      const errors = {};

      const JoiSchema = await Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        position: Joi.string().required(),
        profile_image: Joi.any().allow(null, '').optional(),
        website: Joi.string().allow("", null),
        phone_number: Joi.string().required(),
        year_founded: Joi.string().allow("", null),
        address: Joi.object({
          city: Joi.string(),
          country: Joi.string(),
          state: Joi.string()
        }),
        categories: Joi.array()
          .items(Joi.object({
            title: Joi.string()
              .required(),
            skills: Joi.array()
              .items(Joi.string())
              .optional(),
          })).required(),
      });
      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // updating user general info validation
  profileUpdateGeneralValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        address: Joi.string().required(),
        travel_will: Joi.string().required(),
        profile_image: Joi.any().allow(null, '').optional(),
      });
      if (!await userExistsOrNot(req.user['user_id'])) {
        errors['email'] = USER_NOT_FOUND;
      }

      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // updating user trades and skills validation
  profileUpdateTradesAndSkillsValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        categories: Joi.array().items(Joi.object({
          title: Joi.string().required(),
          is_primary: Joi.boolean().required(),
          experience_time: Joi.number().required(),
          skills: Joi.array().items(Joi.string().optional()),
        })).required(),
      });

      if (!await userExistsOrNot(req.user['user_id'])) {
        errors['email'] = USER_NOT_FOUND;
      }

      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // updating user work experience validation
  profileUpdateWorkExpValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        work_experience: Joi.array().items(Joi.object({
          company_name: Joi.string().required(),
          company_id: Joi.string().optional(),
          role: Joi.string().required(),
          from: Joi.object({
            year: Joi.number().required(),
            month: Joi.string().required(),
          }).required(),
          to: Joi.object({
            year: Joi.number().required(),
            month: Joi.string().required(),
          }).required(),
          description: Joi.string().allow(null, '').optional(),
          currently_work: Joi.boolean().optional(),
          categories: Joi.array().items(Joi.string().optional()),
          other_worked_category: Joi.boolean().optional(),
        }),
        ).required(),
      });

      if (!await userExistsOrNot(req.user['user_id'])) {
        errors['email'] = USER_NOT_FOUND;
      }

      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // updating user certificates validation
  profileUpdateCertificatesValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        certificates: Joi.array().items(Joi.string()).optional(),
      });

      if (!await userExistsOrNot(req.user['user_id'])) {
        errors['email'] = USER_NOT_FOUND;
      }

      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // updating user work preferences validation
  profileUpdateWorkPreferenceValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        work_preferences: Joi.object({
          benefits: Joi.array().items(Joi.string().optional()),
          job_type: Joi.array().items(Joi.string().optional()),
          company_size: Joi.array().items(Joi.string().optional()),
          development_type: Joi.array().items(Joi.string().optional()),
        }).optional(),
      });

      if (!await userExistsOrNot(req.user['user_id'])) {
        errors['email'] = USER_NOT_FOUND;
      }

      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerValidation: async (req, res, next) => {
    return ['worker'].includes(req.user['role']) ? next() : responseHelper(false, NO_ACCESS, 400, '', {}, res);
  },
  employerValidation: async (req, res, next) => {
    return ['employer', 'employer-member'].includes(req.user['role']) ? next() : responseHelper(false, NO_ACCESS, 400, '', {}, res);
  },
  adminValidation: async (req, res, next) => {
    return ['admin', 'super-admin'].includes(req.user['role']) ? next() : responseHelper(false, NO_ACCESS, 400, '', {}, res);
  },
  superAdminValidation: async (req, res, next) => {
    return ['super-admin'].includes(req.user['role']) ? next() : responseHelper(false, NO_ACCESS, 400, '', {}, res);
  },
  fileValidation: async (req, res, next) => {
    try {
      const errors = {};
      const imageExtensions = ['png', 'jpg', 'jpeg'];
      const videoExtensions = ['mp4', 'mpeg'];
      const files = req.files['files'];
      if (!files) {
        return responseHelper(false, FILES_REQUIRED, 400, '', {}, res);
      }
      if (['profile_image', 'cover_image', 'post'].includes(req.body['file_for'])) {
        if (!imageExtensions.includes(files.mimetype.split('/').pop())) {
          return responseHelper(false, FILES_FORMAT_ERROR, 400, '', {}, res);
        }
      } else {
        if (files.length) {
          for (let index = 0; index < files.length; index++) {
            if (![...imageExtensions, ...videoExtensions].includes(files[index].mimetype.split('/').pop())) {
              responseHelper(false, FILES_FORMAT_ERROR, 400, '', {}, res);
              break;
            }
          }
        } else {
          if (![...imageExtensions, ...videoExtensions].includes(files.mimetype.split('/').pop())) {
            return responseHelper(false, FILES_FORMAT_ERROR, 400, '', {}, res);
          }
        }
      }

      const file_for = ['profile_image', 'cover_image', 'post'];
      const JoiSchema = Joi.object({
        file_for: Joi.string().valid(...file_for).required(),
      });

      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  postValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        message: Joi.string()
          .required(),
        files: Joi.array()
          .items(Joi.string())
          .allow('', null)
          .optional(),
      });
      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  messageValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        receiver_id: Joi.string()
          .required(),
        conversation_id: Joi.string().allow(null, '')
          .optional(),
        message: Joi.string()
          .required(),
        job_id: Joi.string().allow(null, '')
          .optional(),
      });
      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  supportMessageValidation: async (req, res, next) => {
    try {
      const errors = {};
      const sender = await User.findOne({ _id: req.user.user_id, $or: [{ role: 'admin' }, { role: 'super-admin' }] });
      if (sender) {
        const JoiSchema = await Joi.object({
          conversation_id: Joi.string().required(),
          message: Joi.string().required(),
          job_id: Joi.string().allow(null, '').optional()
        })
        await validateData(req.body, JoiSchema, errors, res, next);
      } else {
        const JoiSchema = await Joi.object({
          message: Joi.string().required(),
          job_id: Joi.string().allow(null, '').optional(),
        })
        await validateData(req.body, JoiSchema, errors, res, next);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  supportTicketValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        conversation_id: Joi.string().required(),
        status: Joi.string().valid(...ticket).required()
      });
      await validateData(req.query, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  CompanyUpdateValidation: async (req, res, next) => {
    try {
      const errors = {};
      const workStartAndEndJoiSchema = Joi.object({
        start: Joi.string().regex(TIME_REG).allow('', null).optional(),
        end: Joi.string().regex(TIME_REG).allow('', null).optional(),
        off: Joi.boolean().required(),
      }).required();

      const JoiSchema = await Joi.object({
        company_name: Joi.string().required(),
        year_founded: Joi.string().allow("", null),
        license_number: Joi.string().allow("", null),
        company_size: Joi.string().allow("", null),
        working_schedule: Joi.object({
          sunday: workStartAndEndJoiSchema,
          monday: workStartAndEndJoiSchema,
          tuesday: workStartAndEndJoiSchema,
          wednesday: workStartAndEndJoiSchema,
          thursday: workStartAndEndJoiSchema,
          friday: workStartAndEndJoiSchema,
          saturday: workStartAndEndJoiSchema,
        }).required(),
        address: Joi.object({
          city: Joi.string().allow("", null),
          country: Joi.string().allow("", null),
          state: Joi.string().allow("", null)
        }),
        overview: Joi.string().allow("", null),
        profile_image: Joi.any().allow(null, '').optional(),
        images: Joi.any().allow(null, '').optional(),
        website: Joi.string().allow("", null),
        email: Joi.string().required(),
        phone_number: Joi.string().required(),
        categories: Joi.array()
          .items(Joi.object({
            title: Joi.string()
              .optional(),
            skills: Joi.array()
              .items(Joi.string())
              .optional(),
          }))
          .optional(),
      });
      if (req.body['company_name'] && await duplicateCompany(await trimAndLowCase(req.body['company_name']), req)) {
        errors['company'] = COMPANY_EXISTS;
      }
      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  SubscriptionPlanValidation: async (req, res, next) => {
    try {
      const error = {};
      const JoiSchema = await Joi.object({
        duration: Joi.string().valid(...duration).required(),
        plan: Joi.string().valid(...plan).required(),
        features: Joi.array().required(),
        job_limit: Joi.string().required(),
        price: Joi.string().required()
      });
      return await validateData(req.body, JoiSchema, error, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  addAdminValidation: async (req, res, next) => {
    try {
      const error = {};
      const JoiSchema = await Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().regex(EMAIL_REG).rule({ message: INVALID_EMAIL, }).required(),
        password: Joi.string().regex(PASS_REG).rule({ message: INVALID_PASS, }).required(),
      });
      return await validateData(req.body, JoiSchema, error, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // Sign-in validation
  adminSignInValidation: async (req, res, next) => {
    try {
      const JoiSchema = await Joi.object({
        email: Joi.string().regex(EMAIL_REG).rule({ message: INVALID_EMAIL, }).required(),
        password: Joi.string().required(),
      });
      await validateData(req.body, JoiSchema, {}, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  addTeamMemberValidation: async (req, res, next) => {
    try {
      let error = {};
      const JoiSchema = await Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().regex(EMAIL_REG).rule({ message: INVALID_EMAIL, }).required(),
        home: Joi.boolean().allow("", null),
        view_edit_jobs: Joi.boolean().allow("", null),
        manage_candidates: Joi.boolean().allow("", null),
        post_new_jobs: Joi.boolean().allow("", null),
        post_jobs: Joi.boolean().allow("", null),
        messages: Joi.boolean().allow("", null),
        calender: Joi.boolean().allow("", null),
        sub_contractor: Joi.boolean().allow("", null),
        company_settings: Joi.boolean().allow("", null),
        add_remove_staff: Joi.boolean().allow("", null),
        manage_subscription: Joi.boolean().allow("", null),
        view_update_billing: Joi.boolean().allow("", null),
      });
      error = await dbSameEmailError(req.body['email'], error);
      return await validateData(req.body, JoiSchema, error, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getMemeberValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        member_id: Joi.string().required()
      });
      await validateData(req.query, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  subscribeValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        plan_status: Joi.string().valid(...subscriber).required()
      });
      await validateData(req.query, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
};

const dbSameEmailError = async (email, errors) => {
  const user = await User.findOne({ email });
  if (user) {
    errors['email'] = USER_EMAIL_EXISTS;
  }
  return errors;
};

const duplicateCategory = async (title) => {
  const category = await Category.findOne({ title }).lean();
  return category ? true : false;
};

const duplicateCompany = async (company_name, req) => {
  const where = {
    company_name,
  };
  if (req.user && req.user['company_id']) {
    where['_id'] = { $ne: req.user['company_id'] };
  }
  const company = await Company.findOne(where).lean();
  return company ? true : false;
};

const userExistsOrNot = async (_id) => {
  const user = await User.findOne({ _id }).lean();
  return user ? true : false;
};


const {
    CompanyValidation,
    employerValidation,
    workerValidation,
    adminValidation,
    CompanyUpdateValidation,
} = require('../../helpers/inputValidation');
const clientAuth = require('../../middleware/clientAuth');
const CompanyController = require('./companyController');


module.exports = (router, passport) => {
    // for all users-------------------------------------------
    // gets all companies for normal users
    router.get(
        '/companies',
        clientAuth,
        CompanyController.getCompanies,
    );

    router.get('/worker/companies/saved', passport.authenticate('bearer', { session: false }), workerValidation, CompanyController.getWorkerCompanies);

    // get company detail for normal users
    router.get(
        '/companies/:company_id',
        clientAuth,
        CompanyController.getCompany,
    );

    // get company jobs for normal users
    router.get('/companies/:company_id/jobs', clientAuth, CompanyController.getCompanyJobs);


    // for employers-------------------------------------------
    // update default created company on sign up with company detail in 2nd step
    router.put(
        '/employer/update-company',
        passport.authenticate('bearer', { session: false }),
        employerValidation,
        CompanyValidation,
        CompanyController.employerUpdateCompany,
    );

    // update default created company on sign up with company detail in setting of employer portal
    router.put(
        '/employer/update-company-detail',
        passport.authenticate('bearer', { session: false }),
        employerValidation,
        CompanyUpdateValidation,
        CompanyController.employerUpdateCompany,
    );

    // for workers---------------------------------------------
    // search company with a keyword
    router.get('/worker/companies/:query', passport.authenticate('bearer', { session: false }), workerValidation, CompanyController.workerSearchCompany);

    // get company suggestions(work remaining need to match worker profile)
    router.get('/worker/get-company-suggestions', passport.authenticate('bearer', { session: false }), workerValidation, CompanyController.workerGetCompanySuggestions);

    // get company suggestions(work remaining need to match worker profile)
    router.get('/worker/set-company-status/:company_id/:status', passport.authenticate('bearer', { session: false }), workerValidation, CompanyController.workerCompanyStatusUpdate);
    router.get('/worker/get-companies/:status', passport.authenticate('bearer', { session: false }), workerValidation, CompanyController.workerGetFollowedSavedCompanies);

    //save or unsave company
    router.post('/worker/save-unsave-company/:company_id', passport.authenticate('bearer', { session: false }), workerValidation, CompanyController.workerSaveUnsaveCompany);


    // for admins----------------------------------------------
    router.get(
        '/admin/get-companies',
        passport.authenticate('bearer', { session: false }),
        adminValidation,
        CompanyController.adminGetCompanies,
    );
};

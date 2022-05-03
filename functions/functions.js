const axios = require("axios");

module.exports = {
    ifNotLoggedIn: (req, res, next) => {
        if (!req.session.isLoggedIn) {
            return res.redirect('/login');
        };
        next();
    },
    
    ifLoggedIn: (req, res, next) => {
        if (req.session.isLoggedIn) {
            return res.redirect('/');
        };
        next();
    },
    validateEmail: (mail) => {
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
            return true;
        };
        return false;
    },
    // getUserData: async (token) => {
    //     const response = await axios({
    //         method: "GET",
    //         url: "https://read-like-a-book-api.herokuapp.com/user/get/data",
    //         headers: {
    //             authorization: "bearer " + token,
    //         },
    //     })
    //     .then(
    //         (response) => {
    //             return response;
    //         },
    //     );
    //     return response;
    // },
};

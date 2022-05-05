const express = require("express");
const path = require("path");
const cookieSession = require("cookie-session");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const PORT = process.env.PORT || 8080;

const app = express();

app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname, "static")));

app.use(
    cookieSession({
        name: "session",
        keys: [ process.env.COOKIEKEY ],
        maxAge: 24 * 60 * 60 * 1000,
    }),
);

const {
    ifNotLoggedIn,
    ifLoggedIn,
    validateEmail,
} = require("./functions/functions");

app.get("/register", async (req, res, next) => {
    res.render("layouts/register", {
        title: "Bookstore | Sign up",
    });
});

app.post("/register", async (req, res, next) => {
    if (req.body.username.length < 8) {
        return res.render("layouts/register", {
            title: "Bookstore | Sign up",
            error: "Your username has to be 8+ length.",
        });
    } else if (req.body.password.length < 8) {
        return res.render("layouts/register", {
            title: "Bookstore | Sign up",
            error: "Your password has to be 8+ length.",
        });
    } else if (!validateEmail(req.body.email)) {
        return res.render("layouts/register", {
            title: "Bookstore | Sign up",
            error: "Your email is not valid.",
        });
    } 
    axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/users/register",
        data: {
            username: req.body.username,
            password: req.body.password,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            role: req.body.role,
        }
    }).then(
        (response) => {
            if (response.data.success) {
                res.render("layouts/register", {
                    title: "Bookstore | Sign up",
                    message: "Registration success!",
                });
            } else {
                res.render("layouts/register", {
                    title: "Bookstore | Sign up",
                    error: response.data.payload.data,
                });
            }
            
        }
    );
});

app.get("/login", ifLoggedIn, async (req, res, next) => {
    res.render("layouts/login", {
        title: "Bookstore | Log In",
    });
});

app.post("/login", async (req, res, next) => {
    axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/users/login",
        data: {
            username: req.body.username,
            password: req.body.password,
        }
    }).then(
        (response) => {
            if (response.data.success) {
                req.session.isLoggedIn = true;
                req.session.token = response.data.payload.token;
                res.redirect("/");
            } else {
                res.render("layouts/login", {
                    title: "Bookstore | Log In",
                    message: response.data.payload.data,
                });
            }
            
        }
    );
});

app.get("/change-password", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    res.render("layouts/change-password", {
        title: "Bookstore | Change Password",
        userData: JSON.stringify(responseUserData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.post("/change-password", ifNotLoggedIn, async (req, res, next) => {
    if (req.body.password.length < 8) {
        const responseUserData = await axios({
            method: "GET",
            url: "https://webpro-api.herokuapp.com/users/get/data",
            headers: {
                authorization: "bearer " + req.session.token,
            }
        })
        const responsePointData = await axios({
            method: "GET",
            url: "https://webpro-api.herokuapp.com/users/get/point",
            headers: {
                authorization: "bearer " + req.session.token,
            }
        })
        const responseCartData = await axios({
            method: "GET",
            url: "https://webpro-api.herokuapp.com/carts/get/all",
            headers: {
                authorization: "bearer " + req.session.token,
            }
        })
        return res.render("layouts/change-password", {
            title: "Bookstore | Change Password",
            userData: JSON.stringify(responseUserData.data.payload.data),
            cartData: JSON.stringify(responseCartData.data.payload.data),
            point: responsePointData.data.payload.data[0].point,
            message: "Your new password has to be 8+ length.",
        });
    }
    
    const response = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/users/change/password",
        headers: {
            authorization: "bearer " + req.session.token,
        },
        data: {
            password: req.body.password,
        },
    })
    req.session = null;
    res.render("layouts/login", {
        title: "Bookstore | Login",
        message: "Your password has changed. Please Re-Login",
    });
});

app.get("/", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseBooksData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/books/get/all",
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    res.render("layouts/home", {
        title: "Bookstore | Home",
        userData: JSON.stringify(responseUserData.data.payload.data),
        booksData: JSON.stringify(responseBooksData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.get("/search", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseBooksData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/books/get/all",
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    res.render("layouts/home", {
        title: "Bookstore | Home",
        userData: JSON.stringify(responseUserData.data.payload.data),
        booksData: JSON.stringify(responseBooksData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.post("/search", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    let toRequest;
    if (req.body.search == "") {
        toRequest = "https://webpro-api.herokuapp.com/books/get/all";
    } else {
        toRequest = "https://webpro-api.herokuapp.com/books/search/"+req.body.search;
    }
    const responseBooksData = await axios({
        method: "GET",
        url: toRequest,
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    res.render("layouts/home", {
        title: "Bookstore | Home",
        userData: JSON.stringify(responseUserData.data.payload.data),
        booksData: JSON.stringify(responseBooksData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.get("/book/:id", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseBooksData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/books/get/book/"+req.params.id,
    })
    const responseCommentsData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/comments/book/"+req.params.id,
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    let synopsis = responseBooksData.data.payload.data[0].synopsis;
    responseBooksData.data.payload.data[0].synopsis = "";
    res.render("layouts/book-info", {
        title: "Bookstore | Book Info",
        userData: JSON.stringify(responseUserData.data.payload.data),
        book: JSON.stringify(responseBooksData.data.payload.data),
        comments: JSON.stringify(responseCommentsData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        synopsis: synopsis,
        point: responsePointData.data.payload.data[0].point,
    });
});

app.post("/like", ifNotLoggedIn, async (req, res, next) => {
    const response = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/comments/"+req.body.id+"/like",
    })
    res.redirect("back");
});

app.post("/post", ifNotLoggedIn, async (req, res, next) => {
    const response = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/comments/book/"+req.body.id,
        headers: {
            authorization: "bearer " + req.session.token,
        },
        data: {
            comment: req.body.comment,
        },
    })
    res.redirect("back");
});

app.post("/addToCart", ifNotLoggedIn, async (req, res, next) => {
    const response = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/carts/add",
        headers: {
            authorization: "bearer " + req.session.token,
        },
        data: {
            book_id: req.body.id,
        },
    })
    res.redirect("back");
});

app.get("/cart", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    res.render("layouts/cart", {
        title: "Bookstore | Cart",
        userData: JSON.stringify(responseUserData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.post("/buy", ifNotLoggedIn, async (req, res, next) => {
    let responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        },
    })
    responseCartData = responseCartData.data.payload.data;

    let responseAddOrderData = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/orders/add",
        headers: {
            authorization: "bearer " + req.session.token,
        },
    })
    responseAddOrderData = responseAddOrderData.data.payload.data;

    responseCartData.forEach(async (element) => {
        await axios({
            method: "POST",
            url: "https://webpro-api.herokuapp.com/order-items/add",
            headers: {
                authorization: "bearer " + req.session.token,
            },
            data: {
                book_id: element.id,
                order_id: responseAddOrderData.insertId,
                quantity: element.quantity,
            }
        })
    });

    let responsePointData = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/users/point",
        headers: {
            authorization: "bearer " + req.session.token,
        },
        data: {
            method: "+",
            point: parseInt(req.body.pointToAdd),
        }
    })

    const responseClearCart = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/carts/clear",
        headers: {
            authorization: "bearer " + req.session.token,
        },
    })
    res.redirect("back");
});

app.get("/orders", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseOrdersData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/orders/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    res.render("layouts/orders", {
        title: "Bookstore | Orders",
        userData: JSON.stringify(responseUserData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        ordersData: JSON.stringify(responseOrdersData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.get("/order/:id", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseOrdersData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/order-items/get/" + req.params.id,
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    res.render("layouts/order-items", {
        title: "Bookstore | Order Items",
        userData: JSON.stringify(responseUserData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        orderData: JSON.stringify(responseOrdersData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.get("/orders-status", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseOrdersData = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/orders/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    res.render("layouts/orders-status", {
        title: "Bookstore | Orders Status",
        userData: JSON.stringify(responseUserData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        ordersData: JSON.stringify(responseOrdersData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.get("/order-status/:id", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseOrdersData = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/order-items/get/" + req.params.id,
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    res.render("layouts/order-status-items", {
        title: "Bookstore | Order Status Items",
        userData: JSON.stringify(responseUserData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        orderData: JSON.stringify(responseOrdersData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.post("/change-status", ifNotLoggedIn, async (req, res, next) => {
    const response = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/orders/status",
        headers: {
            authorization: "bearer " + req.session.token,
        },
        data: {
            order_id: req.body.order_id,
            status: req.body.status,
        }
    })
    res.redirect("back");
});

app.get("/prizes", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePrizesData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/prizes/get/all",
    })
    res.render("layouts/prizes", {
        title: "Bookstore | Prize",
        userData: JSON.stringify(responseUserData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        prizes: JSON.stringify(responsePrizesData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.post("/redeem", ifNotLoggedIn, async (req, res, next) => {
    const response = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/prize-history/history",
        headers: {
            authorization: "bearer " + req.session.token,
        },
        data: {
            prize_id: req.body.prize_id,
        },
    })

    let responsePointData = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/users/point",
        headers: {
            authorization: "bearer " + req.session.token,
        },
        data: {
            method: "-",
            point: req.body.pointToSub,
        }
    })

    res.redirect("/prizes-history");
});

app.get("/prizes-history", ifNotLoggedIn, async (req, res, next) => {
    const responseUserData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/data",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responsePointData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/users/get/point",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseCartData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/carts/get/all",
        headers: {
            authorization: "bearer " + req.session.token,
        }
    })
    const responseHistoryData = await axios({
        method: "GET",
        url: "https://webpro-api.herokuapp.com/prize-history/get/history",
        headers: {
            authorization: "bearer " + req.session.token,
        },
    })
    res.render("layouts/prizes-history", {
        title: "Bookstore | Prize History",
        historyData: JSON.stringify(responseHistoryData.data.payload.data),
        userData: JSON.stringify(responseUserData.data.payload.data),
        cartData: JSON.stringify(responseCartData.data.payload.data),
        point: responsePointData.data.payload.data[0].point,
    });
});

app.get("/clearCartToEmpty", ifNotLoggedIn, async (req, res, next) => {
    const response = await axios({
        method: "POST",
        url: "https://webpro-api.herokuapp.com/carts/clear",
        headers: {
            authorization: "bearer " + req.session.token,
        },
    })
    res.redirect("back");
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

app.use((req, res, next) => {
    res.status(404).json({
        data: "Not found.",
    });
});

app.listen(PORT, () => {
    console.log("Running on PORT:" + PORT);
});
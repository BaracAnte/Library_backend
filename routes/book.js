const express = require("express");
const { body } = require("express-validator");

const bookController = require("../controllers/book");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/books", bookController.getBooks);

// POST /book/post
router.post(
  "/addBook",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("description").trim().isLength({ min: 5 }),
  ],
  bookController.createBook
);

router.get("/getOne/:bookId", bookController.getBook);

router.put(
  "/updateBook/:bookId",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("description").trim().isLength({ min: 5 }),
  ],
  bookController.updateBook
);

router.delete("/deleteBook/:bookId", isAuth, bookController.deleteBook);

router.post("/borrow/:bookId", isAuth, bookController.borrowBook);

router.post("/return/:bookId", isAuth, bookController.returnBook);

module.exports = router;

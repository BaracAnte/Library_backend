const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const Book = require("../models/book");
const User = require("../models/user");

exports.getBooks = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = req.query.perPage || 20;
  try {
    const totalItems = await Book.find().countDocuments();
    const books = await Book.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Fetched books successfully!.",
      books: books,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createBook = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed, entered data is incorrect.");
      error.statusCode = 422;
      throw error;
    }
    if (!req.file) {
      const error = new Error("No image provided.");
      error.statusCode = 422;
      throw error;
    }
    const imageUrl = req.file.path;
    const title = req.body.title;
    const description = req.body.description;
    const count = req.body.count;
    const book = new Book({
      title: title,
      description: description,
      imageUrl: imageUrl,
      count: count,
    });
    if (req.role !== "Admin") {
      const error = new Error("Not authorized to add book!");
      error.statusCode = 403;
      throw error;
    }
    await book.save();
    res.status(201).json({
      message: "Book created successfully!",
      book: book,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      const error = new Error("Could not find book.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Book fetched.", book: book });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateBook = async (req, res, next) => {
  const bookId = req.params.bookId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const description = req.body.description;
  let imageUrl = req.body.image;
  let count = req.body.count;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error("No file picked.");
    error.statusCode = 422;
    throw error;
  }
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      const error = new Error("Could not find book.");
      error.statusCode = 404;
      throw error;
    }
    if (req.role !== "Admin") {
      const error = new Error("Not authorized to update book!");
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== book.imageUrl) {
      clearImage(book.imageUrl);
    }
    book.title = title;
    book.imageUrl = imageUrl;
    book.description = description;
    book.count = count;
    const result = await book.save();
    res.status(200).json({ message: "Book updated!", book: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  try {
    const book = await Book.findById(bookId);

    if (!book) {
      const error = new Error("Could not find book.");
      error.statusCode = 404;
      throw error;
    }
    if (req.role !== "Admin") {
      const error = new Error("Not authorized to delete book!");
      error.statusCode = 403;
      throw error;
    }
    // Check logged in user
    clearImage(book.imageUrl);
    await Book.findByIdAndRemove(bookId);

    res.status(200).json({ message: "Deleted book." });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.borrowBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      const error = new Error("Could not find book.");
      error.statusCode = 404;
      throw error;
    }
    if (book.count == 0) {
      const error = new Error("Could not borrow, book unavailable.");
      error.statusCode = 404;
      throw error;
    }
    const ifBorroved = await User.find({
      books: bookId,
    });
    if (ifBorroved.length != 0) {
      const error = new Error("Could not borrow, already borrowed.");
      error.statusCode = 404;
      throw error;
    }
    book.count = book.count - 1;
    const result = await book.save();

    const user = await User.findById(req.userId);
    user.books.push(book);

    await user.save();

    res.status(200).json({ message: "Book borrowed.", book: book });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.returnBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  try {
    const ifBorroved = await User.find({
      books: bookId,
    });
    if (ifBorroved.length == 0) {
      const error = new Error("Could not return, user has no such book.");
      error.statusCode = 404;
      throw error;
    }

    const user = await User.findById(req.userId);
    user.books.pull(bookId);
    await user.save();

    const book = await Book.findById(bookId);
    book.count = book.count + 1;
    const result = await book.save();

    res.status(200).json({ message: "Book returned.", book: book });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

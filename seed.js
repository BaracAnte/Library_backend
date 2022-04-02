const express = require("express");
const app = express();
const mongoose = require("mongoose");

const { faker } = require("@faker-js/faker");

const Book = require("./models/book");
const User = require("./models/user");

mongoose
  .connect(
    "mongodb+srv://ante:pass1234@cluster0.ymezl.mongodb.net/library?retryWrites=true&w=majority"
  )
  .then((result) => {
    app.listen(8080, () => {
      console.log(`Listening on Port 8080`);
    });
  })
  .catch((err) => console.log(err));

const seedDb = async () => {
  await Book.deleteMany({});
  await User.deleteMany({});

  let books = [];
  let users = [];

  for (let i = 0; i < 50; i++) {
    const title = faker.name.findName();
    const description = faker.lorem.paragraphs();
    const imageUrl = faker.image.avatar();
    const count = getRandomInt(15);
    const book = {
      title: title,
      description: description,
      imageUrl: imageUrl,
      count: count,
    };

    books.push(book);
  }

  await Book.insertMany(books);

  const name = "Admin";
  const email = "admin@mail.com";
  const password = "secretpassword1";
  const role = "Admin";
  const books_arr = [];

  const adminUser = User({
    name: name,
    email: email,
    password: password,
    role: role,
    books: books_arr,
  });
  await adminUser.save();

  for (let i = 0; i < 30; i++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const name = firstName + " " + lastName;
    const email = faker.internet.email(firstName, lastName);
    const password = faker.internet.password();
    const role = "User";
    const books_arr = [];
    const user = {
      name: name,
      email: email,
      password: password,
      role: role,
      books: books_arr,
    };

    users.push(user);
  }

  await User.insertMany(users);
};

seedDb().then(() => {
  mongoose.connection.close().then(() => {
    console.log("Done!!");
  });
});

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

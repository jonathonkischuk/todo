// declare our requirements
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// set up our app consant as an express intance
const app = express();

// set our app up to use EJS
app.set('view engine', 'ejs');

// allows app to use bodyParser and express to use a static route, 'public'
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// use mongoose to connect to our local mongoDB
mongoose.connect("mongodb+srv://admin-jonathon:testPass012@cluster0.bgcmssp.mongodb.net/todoDB", {useNewUrlParser: true});


// create the schema for our items
const itemsSchema = {

  name: String

};

// create the Item model
const Item = mongoose.model("Item", itemsSchema);

// create 3 items with the itemsSchema, and then add them to our defaultItems array
const item1 = new Item ({
  name: "Welcome to your To-Do List!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Check this box to delete an item when it's complete."
});

const defaultItems = [item1, item2, item3];


// create a schema for our lists
const listSchema = {

  name: String,
  items: [itemsSchema]

};
// create the List model
const List = mongoose.model("List", listSchema);

// get request for out root route '/'
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Successfully added items.");
        };
      });
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })

});


// post request for out root route '/'
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

// // post request for out delete route '/delete' which deletes the item we check off and redirects us to the root route
app.post("/delete", function(req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully removed item from DB.");
        res.redirect("/");
      }
    });
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

// // get request for out custom list route, which allows us to make a new list for whatever we may need
app.get("/:listName", function(req, res) {

  const listName = _.capitalize(req.params.listName);

  List.findOne({name: listName}, function(err, foundList) {
    if (!err) {
      // create a new list
      if (!foundList) {
        const list = new List ({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      }
      else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        console.log("List Exists!");
      }
    }

  });

});

// // get request for about route '/about' which allows us to render the about.ejs page
app.get("/about", function(req, res){
  res.render("about");
});


// listen to port on heroku and if it isn't available we open it on local host:3000
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully...");
});

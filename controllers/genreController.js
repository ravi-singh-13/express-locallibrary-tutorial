const Genre =  require("../models/genre");
const Book = require("../models/book");

const async = require("async");
const { body , validationResult } = require("express-validator");


//Display list of all Genre.
exports.genre_list = (req, res) => {
    Genre.find()
         .sort({name:1})
         .exec(function (err, list_genre){
            if (err) {
              return next(err)
            }
            res.render("genre_list",{
              title: "Genre List",
              genre_list: list_genre,
            })
         })
};

//display detail page for a specific Genre;
exports.genre_detail = (req, res, next) => {
    async.parallel(
      {
        genre(callback){
          Genre.findById(req.params.id).exec(callback);
        },

        genre_books(callback){
          Book.find({genre: req.params.id}).exec(callback);
        },
      },
      (err, results) => {
        if (err){
          return  next(err)
        }
        if (results.genre == null){
          const err = new Error("Genre not found");
          err.status =  404;
          return next(err)
        }
        // Successful, so render
        res.render("genre_detail", {
          title:"Genre Detail",
          genre: results.genre,
          genre_books: results.genre_books
        })
      }
    )
};

//Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
    res.render("genre_form", {title: "Create Genre"});
};

// Handle genre create on POST.
exports.genre_create_post = [
  // Validate  and sanitize the name field.
  body("name", "Genre name required").trim().isLength({min:1}).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validtion errors from a request.
    const errors = validationResult(req);

    //Create a genre object with escaped and trimed data.
    const genre = new Genre({name: req.body.name});

    if (!errors.isEmpty()) {
      // there are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form",{
        title: "Create Genre",
        genre,
        errors:errors.array(),
      });
      return;
    }else{
      //data from form is valid.
      //check if Genre with same name alredy exist.
      Genre.findOne({name: req.body.name}).exec((err , found_genre) => {
        if(err){
          return next(err);
        }

        if(found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
        }else{
          genre.save((err) => {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre details page.
            res.redirect(genre.url);
          })
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res) => {
    async.parallel({
      genre(callback){
        Genre.findById(req.params.id).exec(callback)
      },
      books(callback){
        Book.find({genre: req.params.id}).exec(callback)
      },
    },
    (err , results)=>{
      if (err){
        return next(err);
      }
      if(results.genre == null){
        res.redirect("/catalog/genres");
      }

      res.render("genre_delete",{
        title: "Delete Genre",
        books: results.books,
        genre: results.genre,
      })

    }
    )
  };
  
  // Handle Genre delete on POST.
  exports.genre_delete_post = (req, res) => {
    async.parallel({
      genre(callback){
        Genre.findById(req.body.genreid).exec(callback)
      },
      books(callback){
        Book.find({genre: req.body.genreid}).exec(callback)
      },
    },
    (err , results)=>{
      if (err){
        return next(err);
      }
      if(results.books > 0){
      res.render("genre_delete",{
        title: "Delete Genre",
        books: results.books,
        genre: results.genre,
      })
      return ;
      }
      Genre.findByIdAndRemove(req.body.genreid, (err)=>{
        if(err){
          return next(err);
        }
      
      res.redirect("/catalog/genres");
    });
    }
    )
  };
  
  // Display Genre update form on GET.
  exports.genre_update_get = (req, res) => {
   Genre.findById(req.params.id).exec((err, genre)=>{
    if (err) {
      return next(err);
    };
    if(genre == null) {
      const err = new Error("genre not found");
      err.status = 404;
      return next(err)
    };
    res.render("genre_form",{
      title: "Update Genre",
      genre,
    })

   })
  };
  
  // Handle Genre update on POST.
  exports.genre_update_post = [
    body("name","Genre name require")
    .trim()
    .isLength({min:1})
    .escape(),

    (req, res, next)=>{
      const errors = validationResult(req);

      const genre = new Genre({
        name:req.body.name,
        _id: req.params.id
      })

      if(!errors.isEmpty()) {
          res.render("genre_form",{
            title: "Update Genre",
            name:req.body.name,
            errors: errors.array(),
          })
      }else{
        Genre.findOne({name:req.body.name}).exec((err, found_genre)=>{
          if(err){
            return next(err);
          }
          if(found_genre){
            res.redirect(found_genre.url)
          }else{
            Genre.findByIdAndUpdate(req.params.id, genre, {},(err)=>{
              
                return next(err);
              
            })
            res.redirect(genre.url);
          }
        })
      }


    }
  ]

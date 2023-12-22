const Game = require("../models/game");
const GameInstance = require("../models/gameInstance");
const Genre = require("../models/genre")
const Studio = require("../models/studio")
const Console = require("../models/console")



const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const multer  = require('multer')
var path = require('path');

const fs = require('fs');
const aos = require('aos')


const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage, })

exports.index = asyncHandler(async (req, res, next) => {
    let newError = '';

    const [games, gameNumber, gameInstanceNumber, genreNumber, studioNumber, consoleNumber] = await Promise.all([
        Game.find({}).sort({date: -1}).exec(),
        Game.countDocuments({}).exec(),
        GameInstance.countDocuments({}).exec(),
        Genre.countDocuments({}).exec(),
        Studio.countDocuments({}).exec(),
        Console.countDocuments({}).exec()
    ])
    .catch(err => {
      newError = new Error(err);
    })

    res.render("index", {title: "Index",
                games: games,
            gameNumber: gameNumber,
            gameInstanceNumber: gameInstanceNumber,
            genreNumber: genreNumber,
            studioNumber: studioNumber,
            consoleNumber: consoleNumber,
            aos: aos,
            error: newError})
  });

// Display list of all games.
exports.game_list = asyncHandler(async (req, res, next) => {
    
  const gameList = await Game.find({}).exec().catch(err => (next(err)));

    let game_count = [];

    for (let i = 0; i < gameList.length; i++) {
      let actualGame = await GameInstance.countDocuments({game : gameList[i].id})
      .catch(err => {next(err)});
      game_count.push(actualGame)
    }
   
  
    res.render("game_list", {
      title: "Game List",
      game_list: gameList,
      game_count: game_count, 
    })
  });

  // Display detail page for a specific game.
exports.game_detail = asyncHandler(async (req, res, next) => {
  const [game, game_instances] = await Promise.all([
    Game.findById(req.params.id).populate("studio").populate("genre").populate("console"),
    GameInstance.find({game: req.params.id})
  ])
  .catch(err => { next(err)  })

  res.render('game_detail', {
    title: 'Game Detail',
    game: game,
    game_instances: game_instances,
  })
});

// Display game create form on GET.
exports.game_create_get = asyncHandler(async (req, res, next) => {
  // Get all studios, consoles and genres, wich we can use for adding to our game.
  const [allStudios, allConsoles, allGenres] = await Promise.all([
    await Studio.find({}).exec(),
    await Console.find({}).exec(),
    await Genre.find({}).exec(),
  ]).catch(err => {next(err)});

  res.render("game_form", {
    title: "Create a game",
    studios: allStudios,
    consoles: allConsoles,
    genres: allGenres,
  })
});

// Handle game create on POST.
exports.game_create_post = [
  // Convert the genre to an array.
  (req, res, next) => { 
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    if (!(req.body.console instanceof Array)) {
      if (typeof req.body.console === "undefined") req.body.console = [];
      else req.body.console = new Array(req.body.console);
    }
    next();
  },

  upload.single('cover'),

  //Validate and sanitize fields.
  body("title", "Title must not be empty.")
  .trim()
  .isLength({ min: 1})
  .escape(),
  body("studio", "Studio must not be empty")
  .trim()
  .isLength({ min: 1})
  .escape(),
  body("release_year", "Year of realease must not be empty")
  .trim()
  .isInt({min: 1950, max: 2030})
  .escape(),
  body("console.*").escape(),
  body("genre.*").escape(),
  // Process request after validation and sanitization.

  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    
    let finalImg = ''

    if (req.file) {
      finalImg = {
        data: new Buffer.from(req.file.buffer, 'base64'), contentType: req.file.mimetype 
      }
    }

    // Create a game object with escaped and trimmed data.
    const game = new Game({
      title: req.body.title,
      studio: req.body.studio,
      release_year: req.body.release_year,
      console: req.body.console,
      genre: req.body.genre,
      img: finalImg,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all studios, genres and consoles for form.
      const [allStudios, allConsoles, allGenres] = await Promise.all([
        await Studio.find({}).exec(),
        await Console.find({}).exec(),
        await Genre.find({}).exec(),
      ]);

      // Mark out selected genres and consoles as checked
      for (const genre of allGenres) {
        if (game.genre.indexOf(genre._id) > -1) {
          genre.checked = "true";
        }
      }
      for (const console of allConsoles) {
        if (game.console.indexOf(console._id) > -1) {
          console.checked = "true";
        }
      }
      res.render("game_form", {
        title: "Create a game",
        studios: allStudios,
        consoles: allConsoles,
        game: game,
        genres: allGenres,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid. Save game.
      await game.save();
      res.redirect(game.url);
    }
  })
];

// Display game delete form on GET.
exports.game_delete_get = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.id).catch(err => next(err));
  const game_instances = await GameInstance.find({game: req.params.id}).catch(err => next(err));

  if (game === null) {
    // No results.
    res.redirect("catalog/games");
  }

  res.render('game_delete.pug', {
              title: 'Delete Game',
              game: game,
              game_instances: game_instances,
  })
});

// Handle game delete on POST.
exports.game_delete_post = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.id).catch(err => next(err));
  const game_instances = await GameInstance.find({game: req.params.id}).catch(err => next(err));

  if (game_instances.length > 0) {
    // There are game instances associated, so re render the form for delete
    res.render("game_delete", {
                title: 'Delete a Game',
                game: game,
                game_instances: game_instances,
    });
    return
  } else {
    // Game has no game instance associated, can be deleted.
    await Game.findByIdAndRemove(req.body.gameid);
    res.redirect("/catalog/games");
  };
});

// Display game update form on GET.
exports.game_update_get = asyncHandler(async (req, res, next) => {
  
  const [game, allStudios, allConsoles, allGenres] = await Promise.all([
    await Game.findById(req.params.id),
    await Studio.find({}).exec(),
    await Console.find({}).exec(),
    await Genre.find({}).exec(),
  ]).catch(err => {next(err)});

  if (game === null) {
    // No results.
    const err = new Error("Game nopt found");
    err.statusd = 404;
    return next(err);
  }

  // Mark our selected genres as checked
  for (const genre of allGenres) {
    for (const game_g of game.genre) {
      if (genre._id.toString() === game_g._id.toString()) {
        genre.checked = "true";
      }
    }
  }

    // Mark our selected consoles as checked
    for (const console of allConsoles) {
      for (const game_c of game.console) {
        if (console._id.toString() === game_c._id.toString()) {
          console.checked = "true";
        }
      }
    }

  res.render("game_form", {
    title: "Update a Game",
    studios: allStudios,
    genres: allGenres,
    consoles: allConsoles,
    game: game,
  });
});

// Handle game update on POST.
exports.game_update_post = [
    // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    if (!(req.body.console instanceof Array)) {
      if (typeof req.body.console === "undefined") {
        req.body.console = [];
      } else {
        req.body.console = new Array(req.body.console);
      }
    }
    next();
  },

  upload.single('cover'),

  // Validate and sanitize fields.
    body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1})
    .escape(),
    body("studio", "Studio must not be empty")
    .trim()
    .isLength({ min: 1})
    .escape(),
    body("release_year", "Year of realease must not be empty")
    .trim()
    .isInt({min: 1950, max: 2030})
    .escape(),
    body("console.*").escape(),
    body("genre.*").escape(),
    // Process request after validation and sanitization.

    
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
    const errors = validationResult(req);

    const loadedGame = await Game.findById(req.params.id);
    let finalImg = loadedGame.img;
      console.log(req.file)
    if (req.file !== undefined) {
       finalImg = {
        data: new Buffer.from(req.file.buffer, 'base64'), contentType: req.file.mimetype 
      }
    }
    
    // Create a game object with escaped and trimmed data.
    const game = new Game({
      title: req.body.title,
      studio: req.body.studio,
      release_year: req.body.release_year,
      console: req.body.console,
      genre: req.body.genre,
      img: finalImg,
      _id: req.params.id, // This is required, or a new ID will be asigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all studios, genres and consoles for form.
      const [allStudios, allConsoles, allGenres] = await Promise.all([
        await Studio.find({}).exec(),
        await Console.find({}).exec(),
        await Genre.find({}).exec(),
      ]);

      // Mark out selected genres and consoles as checked
      for (const genre of allGenres) {
        if (game.genre.indexOf(genre._id) > -1) {
          genre.checked = "true";
        }
      }
      for (const console of allConsoles) {
        if (game.console.indexOf(console._id) > -1) {
          console.checked = "true";
        }
      }
      console.log(game)
      res.render("game_form", {
        title: "Update Game",
        studios: allStudios,
        consoles: allConsoles,
        game: game,
        genres: allGenres,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid. Save game.
      const thegame = await Game.findByIdAndUpdate(req.params.id, game, {});
      res.redirect(thegame.url);
    }
    })
];
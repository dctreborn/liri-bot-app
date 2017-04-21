var request = require('request');
var inquire = require('inquirer');
var twitter = require('twitter');
var spotify = require('spotify');
var fs = require('fs');

var argLength = process.argv.length;

var choice = process.argv[2];
var search = '';

//get search term if argument length is 3 or more
if (argLength > 3) {
    console.log(argLength);
    for (var i = 3; i < argLength; i++) {
        search += ' ' + process.argv[i];
    }
    search = search.trim();
} else {
    search = process.argv[3];
}

var client = new twitter(require('./keys.js').twitterKeys);

//menu tree
if (choice != null) {
    menu();
} else {
    inquire.prompt([
        {
            type: 'list',
            message: 'Choose a function',
            choices: ['my-tweets', 'spotify-this-song', 'movie-this', 'do-what-it-says', 'clear-log'],
            name: 'command'
        }
    ]).then(function (user) {
        choice = user.command;
        menu();
    });
}

//menu redirects
function menu() {
    switch (choice) {
        case 'my-tweets':
            getTweets();
            break;
        case 'spotify-this-song':
            searchMusic();
            break;
        case 'movie-this':
            searchMovie();
            break;
        case 'do-what-it-says':
            readText();
            break;
        case 'clear-log':
            fs.unlink('log.txt', function (err) {
                if (err) {
                    console.log("No file to clear.");
                }
            });
            break;
        default:
            console.log('Please enter my-tweets, spotify-this-song <song name>, movie-this <movie name>, do-what-it-says, or clear-log.');
    }
}

//get tweets
function getTweets() {
    console.log('Display twitter feed');
    var params = { screen_name: 'RukaSariSari' };

    client.get('statuses/user_timeline', params, function (error, tweets, response) {
        if (!error) {
            var array = tweets;
            var length = tweets.length;

            for (var i = 0; i < length; i++) {
                console.log('Post #' + (i + 1));
                console.log('Date: ' + array[i].created_at);
                console.log(array[i].text);
                console.log('-----');

                logFile('Post #' + (i + 1));
                logFile('Date: ' + array[i].created_at);
                logFile(array[i].text);
                logFile('-----');
            }
        }
    });
}

//spotify prompt
function searchMusic() {
    if (search != null) {
        getMusic(search);
    } else {
        inquire.prompt([
            {
                message: 'Which song do you want to know about?',
                name: 'song',
                type: 'input',
                default: 'The Sign Ace of Base'
            }
        ]).then(function (entry) {
            getMusic(entry.song);
        });
    }
}

//spotify search
function getMusic(title) {
    spotify.search({ type: 'track', query: title }, function (err, data) {
        if (err) {
            console.log('Error occurred: ' + err);
            return;
        }
        var song = data.tracks.items[0];
        console.log('-----');
        console.log('Artist(s): ' + song.artists[0].name);
        console.log('Song Title: ' + song.name);
        console.log('Link: ' + song.preview_url);
        console.log('Album: ' + song.album.name);
        console.log('-----');

        logFile('-----');
        logFile('Artist(s): ' + song.artists[0].name);
        logFile('Song Title: ' + song.name);
        logFile('Link: ' + song.preview_url);
        logFile('Album: ' + song.album.name);
        logFile('-----');

    });
}

//movie prompt
function searchMovie() {
    if (search != null) {
        getMovie(search);
    } else {
        inquire.prompt([
            {
                message: 'Which movie do you want to know about?',
                name: 'movie',
                type: 'input',
                default: 'Mr. Nobody'
            }
        ]).then(function (entry) {
            getMovie(entry.movie);
        });
    }
}

//movie search
function getMovie(title) {
    title = combineWords(title);
    request('http://www.omdbapi.com/?t=' + title + '&y=&plot=short&r=json', function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var json = JSON.parse(body);

            console.log('-----');
            console.log('Title: ' + json.Title);
            console.log('Release Date: ' + json.Released);
            console.log('imdbRating: ' + json.imdbRating);
            console.log('Country: ' + json.Country);
            console.log('Language(s): ' + json.Language);
            console.log('Plot: ' + json.Plot);
            console.log('Actors: ' + json.Actors);

            logFile('-----');
            logFile('Title: ' + json.Title);
            logFile('Release Date: ' + json.Released);
            logFile('imdbRating: ' + json.imdbRating);
            logFile('Country: ' + json.Country);
            logFile('Language(s): ' + json.Language);
            logFile('Plot: ' + json.Plot);
            logFile('Actors: ' + json.Actors);

            var rotten = json.Ratings;
            for (var i = 0; i < rotten.length; i++) {
                if (rotten[i].Source == 'Rotten Tomatoes') {
                    console.log('RottenTomatoes Rating: ' + rotten[i].Value);
                    logFile('RottenTomatoes Rating: ' + rotten[i].Value);
                    break;
                }
            }
            var rottenURL = 'https://www.rottentomatoes.com/search/?search=' + json.Title.replace(/[\s]/g, '+');
            console.log('RottenTomatoes URL: ' + rottenURL);
            console.log('-----');

            logFile('RottenTomatoes URL: ' + rottenURL);
            logFile('-----');
        }
    });
}

//read text file
function readText() {
    fs.readFile('random.txt', 'utf8', function (error, data) {
        var dataArray = data.split(',');

        choice = dataArray[0];
        search = dataArray[1];

        menu();
    });
}

//log text to log.txt
function logFile(text) {
    fs.appendFile('log.txt', text + '\n', errorCall());
}

//error callback for logFile
function errorCall(err) {
    if (err) throw err;
}

//replace spaces with +
function combineWords(word) {
    return word.replace(/\s/g, '+');
}
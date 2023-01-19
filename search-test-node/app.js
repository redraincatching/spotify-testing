/*
    so the method for searching for an artist is as follows
    we first get user input in the form of a string (GET request)
    then we search for the top few artists returned by spotify's search with another GET request
    the user clicks on an individual one -> we have that exact ID so we get to that page (event listener)
    then there's also a "related artists" request that might be useful
*/

// instaniating the wrapper
const SpotifyWebApi = require('../');

const APIController = (function() {
    // so this will handle all the requests

    var spotifyApi = new SpotifyWebApi({
        clientId: "2165473919fe4b0891ac4becaa5866ee",
        clientSecret: "b78f201d7bc747a2ba335c1d694d27ce"
    });

    // private methods

    // TOKEN THING GOES HERE

    // take string input and search
    const _searchArtists = async (search) => {

        spotifyApi.searchArtists(`${search}`)
            .then(function (data) {
                console.log(`search artists by "${search}":`, data.body);
                return data.body;
            }, function (err) {
                console.error(err);
            });
    }

    // TODO: when this works add a hipster tag search

    // then display the information of a single artist when selected
    const _displayArtist = async (artistId) => {

        spotifyApi.getArtist(`${artistId}`)
            .then(function (data) {
                console.log('Artist information', data.body);
                return data.body;
            }, function (err) {
                console.error(err);
            });
    }

    // and get that artist's top tracks
    const _displayTopTracks = async (artistId) => {

        spotifyApi.getArtistTopTracks(`${artistId}`, 'GB')
            .then(function (data) {
                console.log(data.body);
            }, function (err) {
                console.log('something went wrong', err);
            });
    }

    // and top albums
    const _displayTopAlbums = async (artistId) => {

        const limit = 10;

        spotifyApi
            .getArtistAlbums(`${artistId}`, { limit: limit})
            .then(
                function (data) {
                    console.log('album information:', data.body);
                    return data.body;
                },
                function (err) {
                    console.error(err);
                }
            );
    }

    // closures
    return {
        getToken() {
            return _getToken();
        },
        searchArtists(search) {
            return _searchArtists(search);
        },
        displayArtists(artistId) {
            return _displayArtist(artistId);
        },
        displayTopTracks(artistId) {
            return _displayTopTracks(artistId);
        },
        displayTopAlbums(token, artistId) {
            return _displayTopAlbums(artistId);
        }
    }
})();

const UIController = (function() {
    // and this will take care of the changing of the html elements

    // object to hold references to element ids
    const DOMElements = {
        searchbar: '.search',
        btnSubmit: '.btn',
        divSingleArtist: '.single_artist',
        hfToken: '#hidden_token',
        artistList: '#artist_list',
        trackList: '#track_list',
        albumList: '#album_list'
    }

    // public methods this time
    return {

        // method to get the input field and submit button
        inputField() {
            return {
                searchbar: document.querySelector(DOMElements.searchbar),
                submit: document.querySelector(DOMElements.btnSubmit),
                selected: document.querySelector(DOMElements.divSingleArtist),
                artists: document.querySelector(DOMElements.artistList),
                tracks: document.querySelector(DOMElements.trackList),
                albums: document.querySelector(DOMElements.albumList)
            }
        },
        
        // method to display the names of the artists
        createArtist(id, name) {
            const html = `<li id=${id}>${name}</li>`;
            document.querySelector(DOMElements.artistList).insertAdjacentHTML('beforeend', html);
        },

        // same for tracks
        createTrack(id, name, album) {
            const html = `<li id=${id}>${name} - ${album}</li>`;
            document.querySelector(DOMElements.trackList).insertAdjacentHTML('beforeend', html);
        },

        // and for albums
        createAlbum(id, name) {
            const html = `<li id=${id}>${name}</li>`;
            document.querySelector(DOMElements.albumList).insertAdjacentHTML('beforeend', html);
        },

        // and then selecting a single artist
        selectArtist(name, img) {
            const detailDiv = document.querySelector(DOMElements.divSingleArtist);
            // any time user clicks a new artist, we need to clear out the artist detail div
            detailDiv.innerHTML = '';

            const html =
            `
            <img src="${img}" alt="">        
            <br>
            artist: ${name}
            `;

            detailDiv.insertAdjacentHTML('beforeend', html)
        },

        // and some resets
        resetArtists() {
            this.inputField().artists.innerHTML = '';
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
        },

        resetAlbums() {
            this.inputField().albums.innerHTML = '';
        },

        resetSelectedArtist() {
            this.inputField().selected.innerHTML = '';
            this.resetTracks();
            this.resetAlbums();
        },

        // handy

        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }

})();


// now for the app controller
const APPController = function(APICtrl, UICtrl) {

    // get input field object references
    const DOMInputs = UICtrl.inputField();

    // store token on page load
    const storeToken = async () => {
        // receive it
        const token = await APICtrl.getToken();
        // store it
        UICtrl.storeToken(token);
    }

    // create event listener on search button
    DOMInputs.submit.addEventListener('click', async (e) => {

        // prevent page reset
        e.preventDefault();
        // clear the previous results
        UICtrl.resetArtists();
        UICtrl.resetSelectedArtist();

        // get stored token
        const token = UICtrl.getStoredToken();

        // get the query
        const query = DOMInputs.searchbar.value;

        // actually search for the artists
        if (query === "") {
            alert("you must enter a string to search for an artist");
        } else {
            // perform the search
            const artists = await APICtrl.searchArtists(token, query);

            // and create a list item for each one
            artists.forEach(el => UICtrl.createArtist(el.href, el.name));
        };

    });

    // now one to display a selected artist



    return {
        init() {
            console.log('app is starting');
            storeToken();
        }
    }
}(APIController, UIController);

// initialise on page load
APPController.init();
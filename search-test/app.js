/*
    so the method for searching for an artist is as follows
    we first get user input in the form of a string (GET request)
    then we search for the top few artists returned by spotify's search with another GET request
    the user clicks on an individual one -> we have that exact ID so we get to that page (event listener)
    then there's also a "related artists" request that might be useful
*/

const APIController = (function() {
    // so this will handle all the requests

    const clientId = "2165473919fe4b0891ac4becaa5866ee";
    const clientSecret = "b78f201d7bc747a2ba335c1d694d27ce";
    // security :)

    // private methods
    // authorisation to use the spotify features
    const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }

    // take string input and search
    const _searchArtists = async (token, search) => {
        console.log("start of search");

        const limit = 10;

        const result = await fetch(`https://api.spotify.com/v1/search?q=${search}&limit=${limit}&type=artist`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();

        console.log("end of search");
        return data.artists;
    }

    // TODO: when this works add a hipster tag search

    // then display the information of a single artist when selected
    const _displayArtist = async (token, artistId) => {

        const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data;
    }

    // and get that artist's top tracks
    const _displayTopTracks = async (token, artistId) => {

        const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.tracks;
    }

    // and top albums
    const _displayTopAlbums = async (token, artistId) => {

        const limit = 10;

        const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.items;
    }

    // closures
    return {
        getToken() {
            return _getToken();
        },
        searchArtists(token, search) {
            return _searchArtists(token, search);
        },
        displayArtists(token, artistId) {
            return _displayArtist(token, artistId);
        },
        displayTopTracks(token, artistId) {
            return _displayTopTracks(token, artistId);
        },
        displayTopAlbums(token, artistId) {
            return _displayTopAlbums(token, artistId);
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
        const token = UICtrl.getStoredToken().token;

        // get the query
        const query = DOMInputs.searchbar.value;

        // actually search for the artists
        // TODO: handle no search results
        if (query === "") {
            alert("you must enter a string to search for an artist");
        } else {
            // perform the search
            const artists = await APICtrl.searchArtists(token, query);

            // and create a list item for each one
            artists.items.forEach(el => UICtrl.createArtist(el.href, el.name));
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
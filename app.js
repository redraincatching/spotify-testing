const APIController = (function() {

    const clientId = "2165473919fe4b0891ac4becaa5866ee";
    const clientSecret = "b78f201d7bc747a2ba335c1d694d27ce";

    // private methods
    const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });
        
        const data = await result.json();
        return data.access_token();
    }

    const _getGenres = async (token) => {

        const result = await fetch(`https://api.spotify.com/v1/browse/categories`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token }
        });

        const data = await result.json();
        return data.categories.items;
    }

    const _getPlaylistByGenre = async (token, genreId) => {

        const limit = 10;

        const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, {
            method: 'GET',
            headers: {'Authorization' : 'Bearer ' + token }
        });

        const data = await result.json();
        return data.playlists.items;
    }

    const _getTracks = async (token, tracksEndPoint) => {
        
        const limit = 10;

        const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
            method: 'GET',
            headers: {'Authorization' : 'Bearer ' + token }
        });

        const data = await result.json();
        return data.items;
    }

    const _getTrack = async (token, trackEndPoint) => {

        const result = await fetch(`${trackEndPoint}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data;
    }

    // closures
    // these public functions can call the private ones
    return {
        getToken() {
            return _getToken();
        },
        getGenres(token) {
            return _getGenres(token);
        },
        getPlaylistByGenres(token, genreId) {
            return _getPlaylistByGenre(token, genreId);
        },
        getTracks(token, tracksEndPoint) {
            return _getTracks(token, tracksEndPoint);
        },
        getTrack(token, trackEndPoint) {
            return _getTrack(token, trackEndPoint);
        }
    }
})();


const UIController = (function() {

    // object to hold references to html element selectors
    // so we don't have to type the specific selector name every time
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'
    }

    // public methods
    return {

        // method to get the input fields
        // returns an object with the following name, so basically the actual html field
        // useful for attaching event listeners
        inputField() {
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },
        /*
            so querySelector returns the first element within the document that matches the specified selectors, or null
        */

        // methods to create the select list options
        createGenre (text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        },

            // so we pass the text and value into our template literal of the html we want to insert
            // querySelector finds the element with the selectgenre id in our DOMElements, a dropdown selector
            // and insertAdjacentHTML puts the html we've provided in as the last child of the parent element we found with querySelector
            // the next few methods follow the same approach

        createPlaylist (text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML('beforeend', html);
        },

        // need method to create a track list group item 
        createTrack(id, name) {
            const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', html);
        },

        // need method to create the song detail
        createTrackDetail(img, title, artist) {

            const detailDiv = document.querySelector(DOMElements.divSongDetail);
            // any time user clicks a new song, we need to clear out the song detail div
            detailDiv.innerHTML = '';

            const html =
            `
            <div class="row col-sm-12 px-0">
                <img src="${img}" alt="">        
            </div>
            <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12">${title}:</label>
            </div>
            <div class="row col-sm-12 px-0">
                <label for="artist" class="form-label col-sm-12">By ${artist}:</label>
            </div> 
            `;

            detailDiv.insertAdjacentHTML('beforeend', html)
        },
        
        // these just reset stuff

        resetTrackDetail() {
            this.inputField().songDetail.innerHTML = '';
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            this.resetTrackDetail();
        },

        resetPlaylist() {
            this.inputField().playlist.innerHTML = '';
            this.resetTracks();
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


/*
    so you'll notice that the ui and api controllers have nothing to do with each other
    this is known as separation of concerns
    so we'll make another module that handles all of that 
*/

const APPController = (function(UICtrl, APICtrl) {

    // get input field object refs
    const DOMInputs = UICtrl.inputField();

    // get genres on page load
    const loadGenres = async () => {
        // get the token
        const token = await APICtrl.getToken();
        // store it
        UICtrl.storeToken(token);
        // get the genres
        const genres = await APICtrl.getGenres(token);
        // populate
        genres.forEach(element => UICtrl.createGenre(element.name, element.id));
        
    }

    // create genre change event listener
    DOMInputs.genre.addEventListener('change', async () => {
        // reset the playlist
        UICtrl.resetPlaylist();
        // get stored token
        const token = UICtrl.getStoredToken().token;
        // get the genre select field
        const genreSelect = UICtrl.inputField().genre;
        // get the genre id associated with the selected genre
    });

})(UIController, APIController);
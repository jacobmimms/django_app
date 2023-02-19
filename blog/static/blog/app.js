// (async () => {
// 	const { Player } = await waitForSpotifyWebPlaybackSDKToLoad();
// 	console.log("The Web Playback SDK has loaded.");
//     console.log(window.Spotify)
//   })();



function upvotePost(e){
    e.preventDefault()
    console.log(e)
    console.log("upvote")
}

function downvotePost(e){
    e.preventDefault()
    console.log(e)
    console.log("downvote")
}

let ajax_reply = function (endpoint, request_parameters) {
    $.post(endpoint, request_parameters)
        .done(response => {
            if (response == "fail") {
                $('#login-warning').show()
                return
            }
            parent_id = request_parameters.parent_id
            $(`#comment${parent_id}-replies`).prepend(response.html)
            $(`#comment${parent_id}-replies`).removeClass("hidden")
            $(`#reply${parent_id}`).addClass("hidden")
        })
}

let reply = function (post_id, parent_id, csrf_token) {
    if ($(`#reply-text-area${parent_id}`).val().trim() == "" || $(`#reply-text-area${parent_id}`).val().trim() == null) {
        $(`#reply-text-area${parent_id}`).val("")
        return
    }
    console.log(window.location.origin)
    console.log(post_id)
    var endpoint = `${window.location.origin}/${post_id}/post/comment`
    ajax_reply(endpoint, {
        comment: $(`#reply-text-area${parent_id}`).val(),
        post_id: post_id,
        parent_id: parent_id,
        is_reply: "true",
        csrfmiddlewaretoken: csrf_token,
    })
    $(`#reply-text-area${parent_id}`).val("")
}


let ajax_comment = function (post_id, request_parameters) {
    var endpoint = `${window.location.origin}/${post_id}/post/comment`
    $.post(endpoint, request_parameters)
        .done(response => {
            if (response == "fail") {
                $('#login-warning').show()
                return
            }
            $("#comment-section").prepend(response)
            newCount = parseInt($("#comment-count").attr("value")) + 1
            $("#comment-count").attr("value", newCount)
            $("#comment-count").text(`Comments (${newCount})`)
        })
}
let comment = function (parent_id, csrf_token) {
    if ($(`#comment-text-area`).val().trim() == "" || $(`#comment-text-area`).val().trim() == null) {
        $("#comment-text-area").val("")
        return
    }
    ajax_comment(parent_id, {
        comment: $(`#comment-text-area`).val(),
        parent_id: parent_id,
        post_id: parent_id,
        is_reply: "false",
        csrfmiddlewaretoken: csrf_token,
    })
    $("#comment-text-area").val("")
}


let ajax_vote = function (endpoint, request_parameters) {
    const arrows = {active:{up:'▲', down:'▼'}, inactive:{up:'△', down:'▽'}}
    $.post(endpoint, request_parameters)
        .done(response => {
            if (response == false) {
                return
            }
            id = response.id
            element_id = `#${response.vote_type}${id}`
            other_id = response.vote_type == 'up' ? `#down${id}` : `#up${id}`
            vote_type = response.vote_type
            vote_status = response.was_active ? "inactive" : "active"
            added_class = response.was_active ? 'bg-slate-300' : 'bg-slate-400'
            removed_class = response.was_active ? 'bg-slate-400' : 'bg-slate-300'
            $(element_id).html(arrows[vote_status][vote_type])
            $(element_id).removeClass(removed_class)
            $(element_id).addClass(added_class)
            if (response.flip) {
                $(other_id).html(arrows.inactive[vote_type == 'up' ? 'down' : 'up'])
                $(other_id).removeClass(added_class)
                $(other_id).addClass(removed_class)
            }
            $(`#votes${id}`).html(response.votes)
        })
}


let vote = (vote_type, obj_type, id, csrf_token) => {
    ajax_vote(`${window.location.origin}/vote`, {
        vote_type: vote_type,
        obj_type: obj_type,
        id: id,
        csrfmiddlewaretoken: csrf_token
    })
}


let sort = () => {
    $("#comment-section").get(0).scrollIntoView()
}


$("body").on('DOMSubtreeModified', "#comment-section", function() {
    $("#comment-count").html(`Comments (${$("#comment-section").children().length})`);
});


$('#main-content').scroll(function() { 
    if($('#main-content').scrollTop() === 0) {
        $("#header").show(200);
    }
});



var lastScrollTop = 0;
var last_time = Date.now();
$('#main-content').scroll(function() {
    var elapsed = Date.now() - last_time
    if (elapsed < 200) {
        return;
    }
    st = $(this).scrollTop();
    if(st-lastScrollTop > 70) {
        $('#header').hide(200, easing='linear');
    }
    else if (st-lastScrollTop < -70) {
        $('#header').show(200, easing='linear');
    }
    last_time = Date.now();
    lastScrollTop = st;
});


async function waitForSpotifyWebPlaybackSDKToLoad (access_token, failure_url) {
    // get the spotify access token from the hidden input
    return new Promise(resolve => {
      if (window.Spotify) {
        resolve(window.Spotify);
      } else {
        window.onSpotifyWebPlaybackSDKReady = () => {
            window.spotifyApi = new SpotifyApi(access_token, null, failure_url)
            console.log("Spotify SDK starting", access_token)
            const token = access_token;
            const player = new Spotify.Player({
                name: 'Bros Code',
                getOAuthToken: cb => { cb(token); },
                volume: 0.5
            });
            // Ready
            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                window.spotifyApi.setDeviceId(device_id)
                window.spotifyApi.setPlayer(player)
            });
        
            // Not Ready
            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });
        
            player.addListener('initialization_error', ({ message }) => {
                console.error(message);
            });
        
            player.addListener('authentication_error', ({ message }) => {
                console.error(message);
                console.log("Redirecting to failure url")
                window.location.replace(failure_url)
            });
        
            player.addListener('account_error', ({ message }) => {
                console.error(message);
            });

            // make the player the current active player by transferring playback using the device id
         


            player.connect();
            window.player = player;
        }
      }
    });
  };
  

async function getPlaybackState() {   
    return new Promise(resolve => 
        {
            if (window.player) {
                let current_state = window.player.getCurrentState()
                resolve(current_state)
            } else {
                resolve("User is not playing music through the Web Playback SDK")
            }
        }
    )
}

async function nextSong() {
    if (window.player) {
        return window.player.nextTrack().then(() => {
            console.log('Skipped to next track!');
            return getPlaybackState().then(state => {
                return state
            }).catch(err => {
                console.log(err)
            })
        });
    } else {
        return "User is not playing music through the Web Playback SDK"
    }
}

function seekSong(position) {
    if (window.player) {
        window.player.seek(position);
    } else {
        return "User is not playing music through the Web Playback SDK"
    }
}

function togglePlay() {
    if (!window.player) {
        return "User is not playing music through the Web Playback SDK"
    } else {
        window.player.togglePlay().then(() => {
            console.log('Toggled playback!');
        }).catch(err => {
            console.log(err)
        });
    }
}

async function currentSongId() {
    if (window.player) {
        return window.player.getCurrentState().then(state => {
            if (!state) {
                console.error('User is not playing music through the Web Playback SDK');
                return;
            }
            let {
                current_track: currentTrack,
                next_tracks: [nextTrack]
            } = state.track_window;
            return currentTrack.id
        })
    } else {
        return "User is not playing music through the Web Playback SDK"
    }

}

class SpotifyApi {
    constructor(access_token, refresh_token, failure_url) {
        this.access_token = access_token
        this.refresh_token = refresh_token
        this.api_url = 'https://api.spotify.com/v1/'
    }
    setDeviceId(device_id) {
        this.device_id = device_id
    }
    setPlayer(player) {
        this.player = player
        this.transferPlayback(this.device_id)
        this.player.activateElement().then( 
            () => {
                console.log("activated")
            }
        )
    }
    async playSong(song_id, timestamp) {
        return new Promise(resolve => {
            console.log("playing sonog", song_id, "at timestamp", timestamp)
            $.ajax({
                url: `${this.api_url}me/player/play`,
                type: 'PUT',
                data: JSON.stringify({
                    "uris": [`spotify:track:${song_id}`],
                    "position_ms": timestamp
                }),
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    console.log(response)
                    resolve(response)
                },
                error: (response) => {
                    console.log(response)
                    resolve(response)
                }
            })
        })
    }
    transferPlayback(device_id) {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}me/player`,
                type: 'PUT',
                data: JSON.stringify({
                    "device_ids": [device_id],
                    "play": true
                }),
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }

    async getPlaybackState() {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}me/player`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }
    async getCurrentlyPlaying() {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}me/player/currently-playing`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }
    
    async getRecommendations(seed_tracks, seed_artists, seed_genres, limit) {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}recommendations?seed_tracks=${seed_tracks}&seed_artists=${seed_artists}&seed_genres=${seed_genres}&limit=${limit}`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }
    async getFavoriteSongs(limit) {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}me/tracks?limit=${limit}`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }
    async getRecommendationsFromSong(seed_tracks, limit, max_tempo, min_tempo, max_danceability, min_danceability, max_energy, min_energy, max_valence, min_valence) {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}recommendations?seed_tracks=${seed_tracks}&limit=${limit}`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }
    async getTrack(track_id) {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}tracks/${track_id}`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }
}
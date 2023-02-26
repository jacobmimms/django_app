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
    return new Promise(resolve => {
        if (window?.spotifyApi?.player) {
            resolve(window?.spotifyApi?.player);
        } else {
            window.onSpotifyWebPlaybackSDKReady = () => {
                const token = access_token;
                const player = new Spotify.Player({
                    name: 'Bros Code',
                    getOAuthToken: cb => { cb(token);},
                    volume: 0.5
                });
                player.addListener('ready', ({ device_id }) => {
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
                player.connect();
                window.player = player;
                resolve(window.spotifyApi);
            }
        }
    });
};
  

async function getPlaybackState() {   
    return new Promise(resolve => 
        {
            if (window.spotifyApi.player) {
                let current_state = window.spotifyApi.player.getCurrentState()
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
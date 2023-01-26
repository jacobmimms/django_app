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


// $(window).resize(function() {
//     width = $(window).width();
//     height = $(window).height();
//     if (width < 600) {
//         $("#sidebar-left").hide(300);
//     }
//     if (width >= 600) {
//         if (!$("#sidebar-left").is(":hidden")) {
//             $("#sidebar-left").show(300);
//         }
//     }
// });


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
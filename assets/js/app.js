const fs = require('fs');
const dedent = require('dedent-js');
const PythonShell = require('python-shell');
const terminate = require('terminate');
const dialog = require('electron').remote.require('electron').dialog;


var instapyPath = '';
var interval;
var pyshell;
var running = false;

// Initial path based on last usage
var checkPath = settings.get('instapyPath');
if (checkPath) {
    instapyPath = checkPath;
    displayPath(checkPath);
}

var params = {
    check: {
        restrictTags_on: true,
        restrictUsers_on: '',
        excludeFriends_on: '',
        ignoreRestrict_on: '',
        interact_on: '',
        fLiked_on: '',
        comments_on: '',
        followCount_on: '',
        byTags_on: '',
        byImg_on: '',
        byLoc_on: '',
        fUsers_on: '',
        fFollowers_on: '',
        fFollowing_on: '',
        unfollowUsers_on: ''
    },
    username: '',
    password: '',
    restrictTags: '',
    restrictUsers: '',
    excludeFriends: '',
    ignoreRestrict: '',
    fLikedPercent: '',
    fLikedTimes: '',
    commentPercent: '',
    comments: '',
    commentsMedia: '',
    commentsEmoji: '',
    upperCount: '',
    lowerCount: '',
    byTagsTags: '',
    byTagsAmount: '',
    byTagsMedia: '',
    byImgUrl: '',
    byImgAmount: '',
    byImgMedia: '',
    byLocUrl: '',
    byLocAmount: '',
    byLocMedia: '',
    fUsersLists: '',
    fFollowersUsers: '',
    fFollowersAmount: '',
    fFollowersDelay: '',
    fFollowersRandom: '',
    fFollowingUsers: '',
    fFollowingAmount: '',
    fFollowingDelay: '',
    fFollowingRandom: '',
    unfollowUsers: '',
    interactRandom: '',
    interactAmount: '',
    interactPercent: ''
}

var app = {
    /* -------- APP METHOD -------- */
    // Compiling python script
    compileScript: function() {
        var check = params.check;
        var identity = app.identity()
        var restrictTag = app.restrictTags(check.restrictTags_on);
        var restrictUser = app.restrictUsers(check.restrictUsers_on);
        var excludeFriends = app.excludeFriends(check.excludeFriends_on);
        var ignoreRestrict = app.ignoreRestrict(check.ignoreRestrict_on);
        var interact = app.interact(check.interact_on);
        var fLiked = app.fLiked(check.fLiked_on);
        var comments = app.comments(check.comments_on);
        var followCount = app.followCount(check.followCount_on);
        var fFollowers = app.fFollowers(check.fFollowers_on);
        var fFollowing = app.fFollowing(check.fFollowing_on);
        var fUsers = app.fUsers(check.fUsers_on);
        var unfollowUsers = app.unfollowUsers(check.unfollowUsers_on);
        var byTags = app.byTags(check.byTags_on);
        var byImages = app.byImages(check.byImg_on);
        var byLocations = app.byLocations(check.byLoc_on);

        // Python script template
        var content = dedent(`
            from instapy import InstaPy
            ${identity}
            \nsession.login()
            ${restrictTag}${restrictUser}${excludeFriends}${ignoreRestrict}${fLiked}${comments}${followCount}${interact}${byTags}${byImages}${byLocations}${fFollowers}${fFollowing}${fUsers}${unfollowUsers}
            \nsession.end()
        `);
        return content;
    },
    // Write and save Script to local storage
    createScript: function(content) {
        fs.writeFile(instapyPath.concat('/quickstart.py'), content, (err) => {
            if (err) throw err;
        });
    },
    // format input string to match python script syntax
    parser: function(input) {
        var parsed = "'" + input.replace(/\s+/g, '').split(',').join("', '") + "'";

        return parsed;
    },
    // Updating checkboxes value
    updateParams: function() {
        for (var i in params.check) {
            params.check[i] = $('#'+i).is(':checked');
        }
    },
    updatePath: function() {
        path = dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        displayPath(path);
        settings.set('instapyPath', path[0]);
        clearInterval(interval);
        interval = setInterval(fileCheck(path[0]), 4000);
        instapyPath = path[0];
    }, 
    /* --------- INPUT PROCESSING --------- */
    identity: function() {
        params.username = $('#username').val();
        params.password = $('#password').val();
        var content = `\nsession = InstaPy(username='${params.username}', password='${params.password}')`;
        return content;
    },
    restrictTags: function(on) {
        var content = ``;

        if (on) {
            params.restrictTags = this.parser($('#restrictTags').val());
            content = `\nsession.set_dont_like([${params.restrictTags}])`;
        }

        return content;
    },
    restrictUsers: function(on) {
        var content = ``;

        if (on) {
            params.restrictUsers = this.parser($('#restrictUsers').val());
            content = `\nsession.set_ignore_users([${params.restrictUsers}])`;
        }

        return content;
    },
    excludeFriends: function(on) {
        var content = ``;

        if (on) {
            params.excludeFriends = this.parser($('#excludeFriends').val());
            content = `\nsession.set_dont_include([${params.excludeFriends}])`;
        } 

        return content;
    },
    ignoreRestrict: function(on) {
        var content = ``;

        if (on) {
            params.ignoreRestrict = this.parser($('#ignoreRestrict').val());
            content = `\nsession.set_ignore_if_contains([${params.ignoreRestrict}])\n`;
        }

        return content;
    },
    interact: function(on) {
        var content = ``;

        if (on) {
            params.interactAmount = $('#fLikedPercent').val();
            params.interactPercent = $('#fLikedTimes').val();
            if ($('#interactRandom').val()) {
                params.interactRandom = 'True';
            } else {
                params.interactRandom = 'False';
            }
            content = `\nsession.set_user_interact(amount=${params.interactAmount}, random=${params.interactRandom}, percentage=${params.interactPercent})\n`;
        } 

        return content;
    },
    fLiked: function(on) {
        var content = ``;

        if (on) {
            params.fLikedPercent = $('#fLikedPercent').val();
            params.fLikedTimes = $('#fLikedTimes').val();
            content = `\nsession.set_do_follow(enabled=True, percentage=${params.fLikedPercent}, times=${params.fLikedTimes})`;
        } 

        return content;
    },
    comments: function(on){
        var content = ``;

        if (on) {
            params.comments = this.parser($('#comments').val());
            params.commentsPercent = $('#commentsPercent').val();

            if($('#byImgMedia').val() === 1) {
                params.commentsMedia = "'Photo'";
            } else if ($('#commentsMedia').val() === 2) {
                params.commentsMedia = "'Video'";
            } else {
                params.commentsMedia = "None";
            }
            content = `\nsession.set_do_comment(enabled=True, percentage=${params.commentsPercent})\nsession.set_comments([${params.comments}], media=${params.commentsMedia})`;
        }

        return content;
    },
    followCount: function(on) {
        var content = ``;

        if (on) {
            params.upperCount = $('#upperCount').val();
            params.lowerCount = $('#lowerCount').val();
            content = `\nsession.set_upper_follower_count(limit = ${params.upperCount})\nsession.set_lower_follower_count(limit = ${params.lowerCount})`;
        }

        return content;
    },
    fFollowers: function(on) {
        var content = ``;
        var interact = 'False';

        if (on) {
            params.fFollowersUsers = this.parser($('#fFollowersUsers').val());
            params.fFollowersAmount = $('#fFollowersAmount').val();
            params.fFollowersDelay = $('#fFollowersDelay').val();

            if ($('#fFollowersRandom').checked) {
                params.fFollowersRandom = 'True';
            } else {
                params.fFollowersRandom = 'False';
            }
            if (params.check.interact_on) {
                interact = 'True';
            }
            content = `\nsession.follow_user_followers([${params.fFollowersUsers}], amount=${params.fFollowersAmount}, delay=${params.fFollowersDelay}, random=${params.fFollowersRandom}, interact=${interact})`;
        }

        return content;
    },
    fFollowing: function(on) {
        var content = ``;
        var interact = 'False';

        if (on) {
            params.fFollowingUsers = this.parser($('#fFollowingUsers').val());
            params.fFollowingAmount = $('#fFollowingAmount').val();
            params.fFollowingDelay = $('#fFollowingDelay').val();

            if ($('#fFollowersRandom').checked) {
                params.fFollowingRandom = 'True';
            } else {
                params.fFollowingRandom = 'False';
            }
            if (params.check.interact_on) {
                interact = 'True';
            }
            content = `\nsession.follow_user_following([${params.fFollowingUsers}], amount=${params.fFollowingAmount}, delay=${params.fFollowingDelay}, random=${params.fFollowingRandom}, interact=${interact})`;
        }

        return content;
    },
    fUsers: function(on) {
        var content = ``;

        if (on) {
            params.fUsers = this.parser($('#fUsersLists').val());
            content = `\nsession.follow_by_list([${params.fUsers}], times=1)`
        }

        return content;
    },
    unfollowUsers: function(on) {
        var content = ``;

        if (on) {
            params.unfollowAmount = $('#unfollowAmount').val();
            content = `\nsession.unfollow_users(amount=${params.unfollowAmount})`;
        }

        return content;
    },
    byTags: function(on) {
        var content = ``;

        if (on) {
            params.byTagsTags = this.parser($('#byTagsTags').val());
            params.byTagsAmount = $('#byTagsAmount').val();

            if($('input[name=byTagsMedia]:checked').val() === '1') {
                params.byTagsMedia = "'Photo'";
            } else if ($('input[name=byTagsMedia]:checked').val() === '2') {
                params.byTagsMedia = "'Video'";
            } else {
                params.byTagsMedia = "None";
            }
            content = `\nsession.like_by_tags([${params.byTagsTags}], amount=${params.byTagsAmount}, media=${params.byTagsMedia})`;
        }

        return content;
    },
    byImages: function(on) {
        var content = ``;

        if (on) {
            params.byImgUrl = this.parser($('#byImgUrl').val());
            params.byImgAmount = $('#byImgAmount').val();

            if($('input[name=byImgMedia]:checked').val() === '1') {
                params.byImgMedia = "'Photo'";
            } else if ($('input[name=byImgMedia]:checked').val() === '2') {
                params.byImgMedia = "'Video'";
            } else {
                params.byImgMedia = "None";
            }
            content = `\nsession.like_from_image([${params.byImgUrl}], amount=${params.byImgAmount}, media=${params.byImgMedia})`;
        }

        return content;
    },
    byLocations: function(on) {
        var content = ``;

        if (on) {
            params.byLocUrl = this.parser($('#byLocUrl').val());
            params.byLocAmount = $('#byLocAmount').val();

            if($('input[name=byLocMedia]:checked').val() === '1') {
                params.byLocMedia = "'Photo'";
            } else if ($('input[name=byLocMedia]:checked').val() === '2') {
                params.byLocMedia = "'Video'";
            } else {
                params.byLocMedia = "None";
            }
            content = `\nsession.like_by_locations([${params.byLocUrl}], amount=${params.byLocAmount}, media=${params.byLocMedia})\n`;
        }

        return content;
    }
}

var shell = {
    initProcess: function() {
        pyshell = new PythonShell('quickstart.py',{pythonOptions: ['-u'], cwd: instapyPath});
        running = !pyshell.terminated

        // Listen to message event and display it to  modal
        pyshell.on('message', function (message) {
            if (message) {
                shell.writeLog(message)
            }
        });

        // Listen to process close event, then change modal action content
        pyshell.on('close', function() {
            $('#terminate').addClass('disabled')
            $('#logButton').removeClass('disabled')
            $('#finish').removeClass('disabled').on('click', function() {
                running = !pyshell.terminated
                $("#fireButton").removeClass('loading')
            })
            $('.actions > .loader').hide()
            $('.actions > label')[0].innerText = 'InstaPy ended'
        })

        // Listen to process exit event and terminate the process (since it won't terminate itself)
        pyshell.childProcess.on('exit', (err) => {
            shell.killProcess(pyshell.childProcess.pid)
        });

        // end the input stream and allow the process to exit 
        pyshell.end(function (err) {
            if (err) {
                shell.writeLog(err, 'red')
            }
        });
    },
    killProcess: function(pid) {
        terminate(pid, function (err) {
            if (err) throw err;
        });
    },
    writeLog: function( content, color = false) {
        var text = document.createTextNode(content)
        var p = document.createElement('p')
        if (color) {
            p.style.color = color
        }

        p.appendChild(text)
        document.getElementById('exec-log').appendChild(p)
        $('#modal-content').stop().animate({
            scrollTop: $('#modal-content')[0].scrollHeight
        }, 800);
    },
    clearLog: function() {
        var log = document.getElementById("exec-log");
        while (log.firstChild) {
            log.removeChild(log.firstChild);
        }
    },
    openLog: function() {
        var array = fs.readFileSync(instapyPath.concat('/logs/logFile.txt')).toString().split('\n');

        array.forEach(function(e) {
            shell.writeLog(e);
        })
    }
}

// Interface interaction handler
var handler = {
    submit: function() {
        app.updateParams();
        app.createScript(app.compileScript());
    }
};

$(document).ready(function() {
    $('#getPath').on('click', function() {
        app.updatePath()
    })
    $("#myform").submit(function(e) {
        e.preventDefault();
        if( $('#myform').form('is valid') && selectionCheck()) {
            handler.submit();
            $('.test').modal('show')
            $('.actions > .button').show()
            if (!running) {
                $("#fireButton").addClass('loading')
                $('.actions > .loader').show()
                $('#terminate')
                $('#finish').addClass('disabled')
                $('#logButton').addClass('disabled')
                $('.actions > label')[0].innerText = 'InstaPy running...'
                $("#terminate").removeClass('disabled').off('click').on('click', function(e) {
                    shell.killProcess(pyshell.childProcess.pid)
                })

                // Clear modal content
                shell.clearLog();

                // Initiate script executing process
                shell.initProcess();
            }
        }
    })
    $('#logButton').click(function() {
        $('.test').modal('show')
        $('.actions > .button').hide()
        $('#logButton').addClass('loading')
        $('#logButton').removeClass('loading')
        shell.clearLog()
        shell.openLog();
    })
    interval = setInterval(fileCheck(instapyPath),4000)
});

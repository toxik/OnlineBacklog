(function (document, $) { // let's pull all of this into context of nice function

    // CONSTANTS
    // ===========
var HTML_CARD = "<section class=card><div class=text />",
    PROJECT = "<section class=project><a href=# class=project-link /> <span class=controls />",
    PROJECT_EDIT = "<form id=project_edit><fieldset><legend>Proiect</legend><label>Titlu " +
                    "<input class=title></label><label>Developeri<input class=developers></label>" + 
                    "<input type=submit> <input type=reset value=Cancel></fieldset></form>",
    // some class names
    DRAG = "drag",
    EDIT = "edit",
    PICK = "pick",
    MARK = "mark",
    
    // putem lucra la un singur proiect o data
    PROJECT_KEY = null,
    
    // domeniul pe care lucram
    DOMAIN    = "navigheaza.ro",
    
    // selectors
    CARD      = ".card",
    TEXT      = ".text",
    TAG       = ".tag",
    ACTION    = "menu a",

    HAS_MARK = ':has(.' + MARK + ')',

    DOT = ".", // :) used to turn class names into selectors

    // events
    CLICK     = "click",
    DBLCLICK  = "dblclick",
    HOVER     = "hover",
    KEYDOWN   = "keydown",
    MOUSEDOWN = "mousedown",
    MOUSEUP   = "mouseup",
    MOUSEMOVE = "mousemove",

    // other strings
    CONTENTEDITABLE = "contentEditable",

    VALUE = "value",

    TOP  = "top",
    LEFT = "left",

    TRUE  = !0 + "", // == "true"  //  little inconsistency, but I use "true" only as a string

    COLORS = ['white', 'green', 'blue', 'red', 'orange', 'yellow'],

    // checks if class name contains one of the colors
    R_COLORCLASS = new RegExp('\\b(' + COLORS.join(')|(') + ')\\b'),

    // checks if event type is mouseenter or mouseover
    R_MOUSEIN = /^mouse(enter|over)/i,

    // namespace object for actions triggered by toolbar icons
    ACTIONS = {
        // load projects function
        lp: function() {
            // clear all current projects from list
            $('.project', $projects).remove();
            $projects.block({ message: 'Se incarca..' });
            $.ajax({
                contentType: 'application/json',
                url: '/rest/Project',
                type: 'GET',
                dataType: 'json',
                success: function(data) { 
                    if (! $.isArray(data.list.Project))
                        data.list.Project = [ data.list.Project ];
                    
                    $.each(data.list.Project, function(i, project) {
                        $(PROJECT)
                            .data(project)
                            .genText()
                            .appendTo($projects);
                    });
                    $projects.unblock();
                },
                error: ACTIONS.handleError
            });
        },
    
        // load
        l: function( project_name, project_key ) {
            if (confirm("Sigur doriti sa incarcati noul proiect? \n" + project_name )) {
                ACTIONS.r();
            
                $projectName.text( project_name );
                PROJECT_KEY = project_key;
                
                // sa incarcam noile note
                $.blockUI({ message: 'Se incarca notele...'});
                $.ajax({
                    contentType: 'application/json',
                    url: '/rest/Note?feq_project='+project_key,
                    type: 'GET',
                    dataType: 'json',
                    error: ACTIONS.handleError,
                    success: function(data) {
                        //console.log(data.list.Note);
                        if (data.list.Note &&
                            !$.isArray(data.list.Note))
                                data.list.Note = [ data.list.Note ];
                        
                        if (data.list.Note)
                        $.each(data.list.Note, function (i, card) {
                            $(HTML_CARD)
                                .css('left', card.pos_x + 'px').css('top', card.pos_y + 'px')
                                .addClass(card.color || COLORS[5]) // .addClass
                                //.css(card) // we are interested in top and left values only, rest will be hopefully ignored ;)
                                .data(card)
                                .saveText(card.description)
                                .appendTo($board);
                        });
                        
                        $.unblockUI();
                    }
                });
                
            }
        },
        
        // clears board by removing saved data & reloads the page
        r: function () {
            PROJECT_KEY = null;
            $projectName.text( 'Niciun proiect incarcat...' );
            $('section.card', $board).remove();
        },

        // CARD ACTIONS
        
        // edit
        e: function ($card) {
            $card[DBLCLICK](); // hacky way of saying .trigger("dblclick"),
                               // because dblclick launches edit mode
        },
        
        // change color, by switching to next color from the list
        // 'cause color pickers are so unusable...
        // and, anyway, there are only six colors, right?
        c: function ($card) {
            var color = $card.color();
            if (color) {
                $card.removeClass(color);
                color = COLORS.indexOf(color);
                color = COLORS[++color < 6 ? color : 0]; // 6 is COLORS.length
                $card.addClass(color); // .addClass
                // salvam aici culoarea si nu ne mai complicam atat..
                $.ajax({
                    contentType: 'application/json',
                    url: '/rest/Note/' + $card.data('key'),
                    type: 'POST',
                    dataType: 'json',
                    data: JSON.stringify({
                        'Note' : {
                            'color'   : color
                        }
                    }),
                    success: function(data) {
                        $card.data(data.Note);
                    },
                    error: ACTIONS.handleError
                });
            }
        },
        
        // delete
        d: function ($card) {
            if (confirm("Sigur doriti sa stergeti aceasta inregistrare?")) {
                $card.block({ message: 'se sterge..'});
                $.ajax({
                    contentType: 'application/json',
                    url: '/rest/Note/' + $card.data('key'),
                    type: 'DELETE',
                    success: function() {
                        $card.unblock();
                        $card.fadeOut(function() {
                            $card.remove();
                        });
                    }
                })
            }
        },
        
        // delete project
        dp: function ( $project ) {
            var key = $project.data('key');
            $project.parent().fadeOut(function () {
                $project.parent().remove();
                $.ajax({
                    contentType: 'application/json',
                    url: '/rest/Project/' + key,
                    type: 'DELETE',
                    dataType: 'json'
                });
            });
        },

        // TEXT FORMATTING
        
        // bold -- yes, you guesed it right ;)
        b: function () {
            document.execCommand("bold", false, "");
        },
        
        // italic
        i: function () {
            document.execCommand("italic", false, "");
        },
        
        // heading
        h: function () {
            block("p", "h2");
        },
        
        // paragraph
        p: function () {
            block("h2", "p");
        },
        
        handleError: function(obj) { 
            if (obj.status == 200)
                return; // aceasta nu este eroare.. !!
            if (obj.status == 403)
                alert('Interzis! Ati incercat sa faceti o operatie la care nu aveti acces.');
            else if (obj.status == 404)
                alert('Nu am gasit resursa! Ati facut o operatie care nu exista. (?!)');
            else if (obj.status == 400)
                alert('S-a produs o eroare. Verificati inputul dat!');
            else if (obj.status == 401)
                // bug-ul de la delogare si relogare..
                window.location.reload();
            else
                alert('S-a produs o eroare necunoscuta! ' + obj.status);
        }

    },

// Now, these down there can be finally called variables
// even though some of them don't change much

    // VARIABLES
    // ===========

    // jQuery objects with application elements
    $document = $(document),
    $body = $(document.body),
    
    $projects, // <aside id=projects> -- contains all user's visible projects
    $board,   // <section id=board>   -- contains all the cards added on a project
    $leftBar,
    $deck,    // <aside id=deck>      -- contains set of new cards to take
    $actions, // <menu>               -- toolbar with card actions
    $editbar, // <menu class=edit>    -- toolbar with text formatting actions
    $projectName,

    data; // here is were board data is loaded

// FUNCTIONS
// ===========

// Firefox for some reason didn't work well with execCommand("formatblock",...)
// so here is some workaround for that
//   find     - is name of the tag we want to replace
//   replace  - is name of the tag we want to have
// In the case of card text only "p" and "h2" are possible
function block(find, replace) {
    if ($.browser.mozilla) {
        var $node = $(getSelection().anchorNode);
        if ($node.is(TEXT)) {
            $node = $node.find(find).eq(0);
        } else {
            $node = $node.closest(TEXT + " " + find);
        }
        $node.replaceWith(function (i, html) {
            return "<" + replace + ">" + html + "</" + replace + ">";
        });
    } else {
        document.execCommand("formatblock", false, "<" + replace + ">");
    }
}

// returns all the tags with given text
function tags(text) {
    return $board.find(TAG).filter(function () {
        return $(this).text().toLowerCase() == text.toLowerCase();
    });
}

// builds an actions toolbar for given list of actions
function buildActions(actions) {
    var menu = $("<menu>");
    $.each(actions, function (i, action) {
        menu.append("<a href=# class=" + action[0] + " title='" + action[1] + "'/>");
    });
    return menu
        // on click on action icon
        .delegate(ACTION, CLICK, function (e) {
            ACTIONS[this.className]($(this).closest(CARD)); // launch action based on class name
            return false;
        });
}

// closes edit mode and stores or discards changes
// by default changes are saved
//   cancel - if true, discards the changes
function closeEdit(cancel) {
    var $card = $board.find(CARD + DOT + EDIT).eq(0), value;
    
    $editbar.detach();

    $body.add($card.drop()).removeClass(EDIT); // .removeClass
    value = cancel ? $card.data(VALUE) : $card.find(TEXT).html();
    $card.saveText(value)
        .find(TEXT)
            .attr(CONTENTEDITABLE, false) // cannot remove the attr because Firefox is complaining
            .blur();
    $document.unbind(KEYDOWN);
    
    // salvam.
    $card.block({ message: 'se salveaza nota..'});
    $.ajax({
        contentType: 'application/json',
        url: '/rest/Note/' + $card.data('key') + '?type=full',
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
            'Note' : { 'description'   : value }
        }),
        success: function(data) {
            $card.data(data.Note);
            $card.unblock();
        },
        error: ACTIONS.handleError
    });
}

function parseDevelopers( devs ){
    var developers =  devs ? devs.item : [];
    if (!$.isArray(developers))
        developers = [ developers ];
    for (i in developers)
        developers[i] += '@' + DOMAIN;
    
    return developers.join(',');
}

// key code based action aliases (for hot-keys)
$.extend(ACTIONS, {
    66: ACTIONS.b, // Ctrl + B
    73: ACTIONS.i, // Ctrl + I
    72: ACTIONS.h, // Ctrl + H
    // 80: ACTIONS.p -- using 'G' as a hotkey for paraGraph, as printing on Ctrl+P cannot be canceled in IE9
    71: ACTIONS.p, // Ctrl + G
    83: closeEdit  // Ctrl + S -- not working in IE9 (cannot prevent save dialog)
});


// JQUERY EXTENSIONS
// ===================

// override default easing with easeOutBack
// this is a shortened version of easeOutBack from jQuery UI
$.easing.swing = function (x, t, b, c, d, s) {
    return c * ((t = t / d - 1) * t * (((s = 1.70158) + 1) * t + s) + 1) + b;
};

// jQuery.fn.pick -- visually picks the card(s) (by adding 'pick' class and moving
//                   it a little to top / left
//
// jQuery.fn.drop -- drops the card(s) back
$.each([PICK, "drop"], function (i, name) {
    var pick = name == PICK;
    function offset(i, value) {
        return parseInt(value, 10) + (pick ? -5 : 5);
    }
    
    $.fn[name] = function () {
        return this.each(function ($this) {
            $this = $(this);
            if ($this.hasClass(PICK) != pick) { // .hasClass
                $this.toggleClass(PICK, pick).css(TOP, offset).css(LEFT, offset); // .toggleClass
            }
        });
    };
});

$.fn.extend({

    // jQuery.fn.color -- returns a color class of the card
    color: function (color) { // var as param
        color = this[0].className.match(R_COLORCLASS);
        return color ? color[0] : "";
    },
    
    // jQuery.fn.genText -- generates a project resource
    genText: function() {
        var $this = $(this), data = $this.data(); 
            //developers = data.developers ? data.developers.item : [];
        
        data.developers = parseDevelopers(data.developers); 
        
        //console.log(data);
        $this.find('.project-link').data(data).text( data.title );
        if (data._editable === "true")
            $this.find('.controls').html(
                '<a href=# class=project-edit data-id=' + data.key + '></a>' +
                '<a href=# class=project-delete data-id=' + data.key + '></a>'
            );
        return $this;
    },

    // jQuery.fn.saveText -- saves and formats card text... and something more ;)
    saveText: function (text) {
        // if HEX color tag found in text, use this color as card background :)
        var colorTag = text.match(/(\s|^|>)(#[a-f0-9]{3}([a-f0-9]{3})?)\b/i);
        colorTag = colorTag ? colorTag[2] : "";

        this.closest(CARD)
            .css({ backgroundColor: colorTag, borderColor: colorTag }) // change color to HEX tag found (if any)
            .data(VALUE, text)                                         // store raw text
            .find(TEXT).html(                                          // format and put card text
                text.replace(/(\s|^|>)(#\w*)(\b)/gi, "$1<span class=tag>$2</span>$3")   // #tags

                    // parsing and making links clickable is done with *VERY* basic regexp
                    // 'cause something more sophisticated would not fit 
                    // so fingers crossed that it will not cause problems ;)
                    //
                    // one of the problems -- &nbsp; may break link parsing
                    .replace(/&nbsp;/g, " ")
                    .replace(/(\s|^|>)(https?\:\/\/[^\s<>]+)/g, "$1<a href=$2 target=_new>$2</a>")
            );
        //console.log(this);
        return this;
    },

    // jQuery.fn.move -- a shortcut to the only animation used
    move: function (left) {
        return this.animate({ left: left });
    }

});


// And after all these definitions finally something will begin to happen

$(function () { 
    // building the board
    $board = $("<section id=board>").appendTo($body);
    
    // adding a nice Project name in the background
    $projectName = $("<h1 id=projectName>Niciun proiect incarcat...</h1>").appendTo($body);

    // adding the projects container
    // building the projects widget
    $projects = $("<aside id=projects><h2>Proiecte</h2><p id=projectCtrls><a href=# id=newProject>new</a> | "+
                    "<a href=# id=refreshProjects>refresh</a> | <a href=# id=clearProject>clear</a></p></aside>")
                    .appendTo($body);

    // preparing toolbars
    $actions = buildActions([ ["e", "Modificare"], ["c", "Schimbare culoare"], ["d", "Stergere"] ]);

    $editbar = buildActions([["b", "Bold (Ctrl+B)"],
                             ["i", "Italic (Ctrl+I)"],
                             ["h", "Titlu (Ctrl+H)"],
                             ["p", "Paragraf (Ctrl+R)"]]).addClass(EDIT); // .addClass

    //buildActions([["r", "Clear board"]]).appendTo($body);
    
    // preparing deck with new cards
    $deck = $("<aside id=deck>").appendTo($body)
        // on hover cards in deck are animated to encourage users to take them :)
        .delegate(CARD, HOVER, function (event) {
            if (!$body.hasClass(EDIT) && !$body.hasClass(MARK)) { // .hasClass
                $(this).stop().move(R_MOUSEIN.test(event.type) ? 20 : 0);
            }
        })
        // on mousedown new card is added to the board and can be dragged
        .delegate(CARD, MOUSEDOWN, function (event) {
            // adding new cards from deck
            if (!$body.hasClass(EDIT) && !$body.hasClass(MARK) && PROJECT_KEY) { // .hasClass
                var $card = $(this);
                $card.clone()          // clone deck card and add it to the board
                    .pick().addClass(DRAG)
                    .css($card.offset())
                    .data('_editable', 'true')
                    .appendTo($board)
                    .trigger(event);   // start dragging new card
                
                $card.hide();             // hide deck card
                setTimeout(function () {  // and show it again after a while
                    $card.css(LEFT, -40).show().move(0);
                }, 1000);
            }
        });
    
    $body.delegate('#projects', HOVER, function (event) {
        $(this).stop().animate({ right: R_MOUSEIN.test(event.type) ? -45 : -250 })
    })
    
    // add a card to the deck for each color
    $.each(COLORS, function (i, color) {
        i = 6 - i; // 6 is COLORS.length
        $(HTML_CARD)
            .appendTo($deck)
            .addClass(color) // .addClass
            .css(TOP, i * 30).css(LEFT, -40)
            .delay(i * 100) // animate cards into view one by one
            .move(0);
    });

    $board
        // CARD EVENTS
        // on mousedown init card dragging
        .delegate(CARD, MOUSEDOWN, function (mouseDownEvent) {
            // don't drag in edit mode or if a tag or action is clicked on a card
            if (!$body.hasClass(EDIT) && !$(mouseDownEvent.target).is(TAG + "," + ACTION) &&
                    $(this).data('_editable') === "true") { // .hasClass
                var $card = $(this).appendTo($board),
                    offset = $card.offset();
                
                $document
                    .bind(MOUSEMOVE, function (moveEvent) {
                        // pick a card and move it around
                        $card.pick().addClass(DRAG) // .addClass
                            .css(LEFT, offset[LEFT] + moveEvent.pageX - mouseDownEvent.pageX)
                            .css(TOP,  offset[TOP]  + moveEvent.pageY - mouseDownEvent.pageY);
                    });
                
                return false; // and don't select text, please
            }
        })
        // on mouseup finish dragging
        .delegate(CARD, MOUSEUP, function ($card) { // var as param
            $card = $(this);
            $document.unbind(MOUSEMOVE);
            if ($card.hasClass(DRAG)) { // .hasClass
                $card.removeClass(DRAG);   // .removeClass
                if (!$card.hasClass(MARK)) {
                    $card.drop(); // drop a card, but only if it is not selected
                    
                    if ( typeof $card.data('key') == "undefined") {
                        // daca e card nou, trebuie sa-l salvam in db si e actiune blocanta
                        $card.block({ message: 'se initializeaza..'});
                        $.ajax({
                            contentType: 'application/json',
                            url: '/rest/Note?type=full',
                            type: 'POST',
                            dataType: 'json',
                            data: JSON.stringify({
                                'Note' : {
                                    'pos_x'       : parseInt($card.css('left')) + "",
                                    'pos_y'       : parseInt($card.css('top')) + "",
                                    'color'       : $card.color(),
                                    'project'     : PROJECT_KEY,
                                    'description' : 'scrieti ceva aici..'
                                }
                            }),
                            success: function(data) {
                                $card.data(data.Note);
                                $card.saveText('scrieti ceva aici..');
                                $card.unblock();
                            },
                            error: ACTIONS.handleError
                        });
                        
                    } else {
                        // trebuie sa-i modificam doar noua valoare a pozitiei
                        $.ajax({
                            contentType: 'application/json',
                            url: '/rest/Note/' + $card.data('key'),
                            type: 'POST',
                            data: JSON.stringify({
                                'Note' : {
                                    'pos_x' : parseInt($card.css('left')) + "",
                                    'pos_y' : parseInt($card.css('top')) + ""
                                }
                            }),
                            error: ACTIONS.handleError
                        });
                    }
                }
            }
        })
        // on dblclick start editing card text
        .delegate(CARD, DBLCLICK, function (event) {
            // don't start editing if a tag or action was clicked
            var $card = $(this);
            if ($card.data('_editable') === "false")
                return false;
            if (!$(event.target).is(TAG + "," + ACTION)) {
                var $text = $card.find(TEXT),
                    value = $card.data(VALUE);
                
                if ($text[0][CONTENTEDITABLE] != TRUE) {
                    $document[CLICK](); // trigger document click to unselect cards
                                        // check line 549 to see what it does
                    $body.add($card.pick().removeClass(MARK)).addClass(EDIT); // .addClass
                    $editbar.appendTo($card);
                    
                    $text
                        .html(value)
                        .attr(CONTENTEDITABLE, TRUE)
                        .focus();
                    
                    $document.bind(KEYDOWN, function (keyEvent) { // bind hot-keys listener
                            if (keyEvent.which == 27) { // ESC pressed - cancel edit
                                closeEdit(TRUE);
                            }
                            if (keyEvent.ctrlKey && ACTIONS[keyEvent.which]) {
                                ACTIONS[keyEvent.which]();
                                return false;
                            }
                    });
                }
            }
        })
        // on hover show action toolbar
        .delegate(CARD, HOVER, function (event) {
            var $card = $(this), editable = $card.data('_editable') !== "false",
                author = $card.data('owner') || "", date = $card.data('modified_at') || "";
            
            if (date) {
                // date = new Date(date); // poate o sa formatam mai ok
                // formatam frumos data
                date = date.substr(8,2) + '.' + date.substr(5,2) + '.' + date.substr(0,4) 
                        + ' @ ' + date.substr(11,2) + ':' + date.substr(14,2);
            }
            // daca nu are drept de scriere nu afisam bara de actiuni
            if (R_MOUSEIN.test(event.type)) {
                if ( author && date )
                    $('<p class=author>' + author + ' &mdash; ' + date + '</p>')
                        .appendTo($card);
                if (!editable)
                    return false;
                $actions.appendTo($card);
            } else {
                $('p.author', $card).remove();
                if (!editable)
                    return false;
                $actions.detach();
            }
            
        })
        
        // TAG EVENTS
        // on hover highlight all tags with same text
        .delegate(TAG, HOVER, function (event) {
            // toggle hover class on all tags with same text
            tags($(this).text()).toggleClass(HOVER, R_MOUSEIN.test(event.type)); // .toggleClass
        })
        // on click select all cards with same tags
        .delegate(TAG, CLICK, function ($cards) { // var as param
            $cards = tags($(this).text()).toggleClass(MARK).closest(CARD); // .toggleClass
            
            if ($(this).hasClass(MARK)) { // .hasClass
                // tags were selected, so highlight tagged cards
                $cards.pick()
                    .add($body).addClass(MARK); // .addClass
            } else {
                // tags were unselected, so drop tagged cards
                $cards.not(HAS_MARK).removeClass(MARK).drop();
                $body.not(HAS_MARK).removeClass(MARK); // .removeClass
            }
        });

    $document
        // when clicked somewhere on the page close edit mode and unselect all cards
        .bind(CLICK, function ($target) {
            $target = $($target.target);
            if ($body.hasClass(EDIT) && !$target.closest(CARD + DOT + EDIT)[0]) { // .hasClass
            // if in edit mode and clicked outside edited card, close edit mode and save
                closeEdit();
            } else if ($target.has($body)[0]) { // .has($body) is a short way of checking if element is document root
                // if clicked somewhere on the page background, unselect all cards
                $(DOT + MARK).removeClass(MARK).drop(); // .removeClass
            }
        });
    
    
    $projects
        .delegate('.project-link', CLICK, function(e){
            var $this = $(this),
                title = $this.text(),
                key   = $this.data('key');
            ACTIONS.l( title, key );
            return false;
        })
        .delegate('.project-delete', CLICK, function(e){
            var $this = $(this).parent().prev();
            if (confirm('Sigur doriti sa stergeti proiectul ' + "\n" + $this.text() + ' ?')) 
                ACTIONS.dp( $this );
            return false;
        })
        .delegate('.project-edit, #newProject', CLICK, function(e){
            var $canvas = $(PROJECT_EDIT);
                key = $(this).data('id');
                data = (key ? $(this).parent().prev().data() : null);
                
            if (data != null) {
                $canvas.find('input.title').val( data.title || "" )
                $canvas.find('input.developers').val( data.developers || "");
            }
            
            $canvas.submit(function() {
                $canvas.block({ message: 'se salveaza..' });
                var helloKitty = ( data != null ) ? data.key : '', update = 
                    {  'Project' : { 'title'   : $canvas.find('input.title').val() } },
                    developers = $canvas.find('input.developers').val();
                if ( developers )
                    update.Project.developers = { 'item' : developers.replace(' ','').split(',') };
                $.ajax({
                    contentType: 'application/json',
                    url: '/rest/Project/' + helloKitty + '?type=full',
                    type: 'POST',
                    dataType: 'json',
                    data: JSON.stringify(update),
                    success: function(data) {
                        data = data.Project;
                        data.developers = parseDevelopers(data.developers);
                        //console.log(data);
                        $canvas.unblock();
                        
                        if (helloKitty) {
                            if(helloKitty == PROJECT_KEY) 
                                $projectName.text( data.title );
                            $.each( $projects.find('.project'), function(i, project) {
                                var $project = $(project);
                                if($project.data('key') == helloKitty) {
                                    $project.find('a:first')
                                        .data( data )
                                        .text( data.title );
                                }
                            });
                        }
                        else
                           ACTIONS.lp();
                        $.unblockUI();
                    },
                    error: function() {
                        alert('Verificati datele introduse!');
                        //ACTIONS.handleError
                        $canvas.unblock();
                    }
                });
                return false;
            });
            $canvas.find('input[type=reset]').click($.unblockUI);
            
            $.blockUI({ 
                css: {
                    border: 'none', 
                    padding: '10px', 
                    paddingTop: '5px',
                    '-webkit-border-radius': '5px', 
                },
                message: $canvas
            }); 
            
            $('.blockOverlay').attr('title','Click pentru anulare').click($.unblockUI);
            return false;
        });
    
    $('#refreshProjects').click( function(e) {
        e.preventDefault();
        ACTIONS.lp();
        return false;
    });
    
    $('#clearProject').click( function(e) { ACTIONS.r(); e.preventDefault(); } );
    
    // sa incarcam lista noastra de proiecte
    ACTIONS.lp();
});

// And that's all folks!

})(document, jQuery);

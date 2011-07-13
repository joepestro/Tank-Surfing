/*  This is a page that acts like an <iframe>, but cached html is loaded into it 
    manually and therefore can be interacted with.   */

function Page() {};

Page._reveal = false;
Page._location = 'http://www.google.com/intl/en/options/'; // starting url
Page._locations = [];
Page._currentLocationIndex = -1;
Page._html = null;

Page.navigateTo = function(url) {
    Page._location = url;
    Page._locations.push(url);
    Page._currentLocationIndex++;
    
    location.hash = url;
    
	var domain = parseURL(url).protocol + '://' + parseURL(url).host;
	var domainURI = new URI(url);

    // fade out effect when changing pages
	$("body").fadeOut("fast");

	$.ajax({
	    url: url,
	    type: 'GET',
		timeout: 10000,
	    success: function(res) {
			var html = res.responseText;
			if (!html || !html.match(/<body[^]*?<\/body>/ig)) {
				$("body").append('<div id="overlay"<center><p class="frown">:-(</p><p>Sorry, this page could not be loaded. Please try <strong>another link</strong>.</p><p>We are going back to the last page now.</p></center></div>');
				$("body").fadeIn("fast");
				window.setTimeout(Page.goBack, 4000);
				return;
			}

			// convert all relative html paths in this string to absolute path
			html = absoluteizeHTML(html, domainURI);
			Page._html = html;
			
            // populate body
            var body = html.match(/<body[^]*?<\/body>/ig);
            $("#b").html(body[0]);

            // populate minimap
            $("#m").html(body[0]);
			
			// update external css
			var links = html.match(/<link[^]*?>/ig);
			if (links)
				$('#b').append(links.join(''));

			// update inline css
			var styles = html.match(/<style[^]*?<\/style>/ig);
			if (styles)
				$('#b').append(styles.join(''));

			// update inline javascript
			var scripts = html.match(/<script[^]*?<\/script>/ig);
			if (scripts)
				$('#b').append(scripts.join(''));
			
			// links should not cause full page reload
			Page.localizeLinks();		
			
			// fade back in and create fog
			$("body").fadeIn("slow");			
			Page.createFog();
			$(document).focus();
	    },
		error: function(res, status) {
			alert('There was an error with the XHR loading the page.');
		}
	});
};

Page.goBack = function() {    
	$("#overlay").remove();
    if (Page._currentLocationIndex > 0) {
        Page._currentLocationIndex--;
        Page.navigateTo(Page._locations[Page._currentLocationIndex]);
        Page._currentLocationIndex--;
    }
};

Page.goForward = function() {    
	$("#overlay").remove();
    if (Page._currentLocationIndex < Page._locations.length - 1) {
        Page._currentLocationIndex++;
        Page.navigateTo(Page._locations[Page._currentLocationIndex]);
        Page._currentLocationIndex++;
    }
};

Page.localizeLinks = function() {
	$('a').click(function(event) {
		// load new link here
		Page.navigateTo(event.target.href);

		// don't reload page
		return false;
	});

	$('form').submit(function(event) {
		// load new link here
		Page.navigateTo(event.target.action + '?' + $(this).serialize());

		// don't reload page
		return false;
	});
};

Page.getFaviconPath = function() {
	return parseURL(Page._location).protocol + '://' + parseURL(Page._location).host + '/favicon.ico';
};

Page.setPixel = function(imageData, x, y, r, g, b, a) {
	index = (x + y * imageData.width) * 4;
    imageData.data[index+0] = r;
    imageData.data[index+1] = g;
    imageData.data[index+2] = b;
    imageData.data[index+3] = a;
};

Page.createFog = function() {
	// main
	$("#fog").remove(); // clear previous page fog
    $("body").append('<canvas id="fog"></canvas>');
	$("#fog").attr("width", $(document).width());
	$("#fog").attr("height", $(document).height());
	
	var ctx = $("#fog")[0].getContext("2d");
    ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
    ctx.fillRect(0, 0, $(document).width(), $(document).height());

	// minimap
	$("#fog-mini").remove(); // clear previous page fog
    $("body").append('<canvas id="fog-mini"></canvas>');
	$("#fog-mini").attr("width", $("#m").width()*.2);
	$("#fog-mini").attr("height", $("#m").height()*.2);
	if ($.browser.webkit)
		$("#m").prepend('<div id="player-mini" class="webkit-player-mini"></div>');
	else if ($.browser.mozilla)
		$("#m").prepend('<div id="player-mini" class="mozilla-player-mini"></div>');
	
	var ctx = $("#fog-mini")[0].getContext("2d");
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, $("#m").width()*.2-1, $("#m").height()*.2-1);
};

Page.revealFog = function(xCenter, yCenter, radius) {
	if ($("#fog").length == 0 || $("#fog-mini").length == 0) return;
	
 	var ctx = $("#fog")[0].getContext("2d");
 	ctx.clearRect(xCenter - radius/2, yCenter - radius/2, radius, radius);
 	 
	ctx = $("#fog-mini")[0].getContext("2d");
	ctx.clearRect(xCenter*.2 - radius/2*.2, yCenter*.2 - radius/2*.2, radius*.2, radius*.2);

 	 // this just draws on top of the canvas, doesn't erase
 	 /*
 	 c.fillStyle = "0xff";
 	 c.beginPath();
 	 c.arc(xCenter, yCenter, radius, 0, Math.PI*2, true);
 	 c.closePath();
 	 c.fill();
 	 */
 	  	 
 	 // setting each pixel in a circle manually is really slow (obviously!)
 	 /*
     var r2 = radius * radius;    
     for (var x = -radius; x <= radius; x++) {
         var height = parseInt(Math.sqrt(r2 - x*x));

         for (var y = -height; y < height; y++)
            Page.setPixel(Page._imageData, xCenter + x, yCenter + y, 255, 255, 255, 0x00); // 0x00
     }
     c.putImageData(Page._imageData, 0, 0); // at coords 0,0
     */
};

Page.createMinimap = function() {
    // oh no! chrome doesn't support drawWindow()
    if ($.browser.webkit)
        $("body").append('<div id="m" class="webkit-mini"></div>');
    else if ($.browser.mozilla)
        $("body").append('<div id="m" class="mozilla-mini"></div>');
    
	// position this help bubble on minimap
	$("#minimap-bubble").css("position", "fixed");
	$("#minimap-bubble").css("bottom", 100);
	$("#minimap-bubble").css("right", 30);
};

Page.iframeLoaded = function() {
	var windowWidth = $(window).width();
    var windowHeight = $(window).height();

	var canvas = $('#minimap')[0];
    var ctx = canvas.getContext("2d");  
    ctx.clearRect(0, 0, 200, 200);  
    ctx.save();  
    ctx.scale(200 / windowWidth, 200 / windowHeight);  
    ctx.drawWindow($("#i")[0].contentWindow, 0, 0, windowWidth, windowHeight, "rgb(0,0,0)");  
    ctx.restore();
};

Page.createVirtualKeyboard = function() {
	$("body").append('<div id="up" class="key">&uarr;</div>');
	$("body").append('<div id="down" class="key">&darr;</div>');
	$("body").append('<div id="left" class="key">&larr;</div>');
	$("body").append('<div id="right" class="key">&rarr;</div>');
	$("body").append('<div id="spacebar" class="key">Shoot</div>');
	
	$(".key").mousedown(function() {
		$(this).addClass("pressed");
		
		var e = jQuery.Event("keydown");
		switch($(this).attr("id")) {
			case 'up':
				e.which = 38;
				break;
			case 'down':
				e.which = 40;
				break;
			case 'left':
				e.which = 37;
				break;
			case 'right':
				e.which = 39;
				break;
			case 'spacebar':
				e.which = 32;
				break;
		}
		$(document).trigger(e);
	});
	
	$(".key").mouseup(function() {
		$(this).removeClass("pressed");
		
		var e = jQuery.Event("keyup");
		switch($(this).attr("id")) {
			case 'up':
				e.which = 38;
				break;
			case 'down':
				e.which = 40;
				break;
			case 'left':
				e.which = 37;
				break;
			case 'right':
				e.which = 39;
				break;
			case 'spacebar':
				e.which = 32;
				break;
		}
		
		$(document).trigger(e);
	});
	
	initTouchEvents();
};

Page.createBubble = function(id, text) {
	$("body").append('<iframe frameborder="0" id="' + id + '" class="bubble"></iframe>');
	
	// set content of iframe
	$($("#" + id)[0].contentWindow.document.body).html(
	'<table class="popup"><tbody><tr><td id="topleft" class="corner"></td><td class="top"></td><td id="topright" class="corner"></td></tr>' +
	'<tr><td class="left"></td><td><div class="popup-contents">' + text + '</div></td><td class="right"></td></tr>' +
	'<tr><td class="corner" id="bottomleft"></td><td class="bottom">' +
	'<img width="30" height="29" alt="popup tail" src="/images/bubble-tail2.png"/></td><td id="bottomright" class="corner"></td></tr>' + 
    '</tbody></table>');

	// apply css to iframe
	var frm = $("#" + id)[0].contentWindow.document;
	var otherhead = frm.getElementsByTagName("head")[0];
	var link = frm.createElement("link");
	link.setAttribute("rel", "stylesheet");
	link.setAttribute("type", "text/css");
	link.setAttribute("href", "css/popup.css");
	otherhead.appendChild(link);
};

Page.showBubbles = function() {
	$("#back-bubble").css("position", "fixed");
	$("#back-bubble").css("bottom", 0);
	$("#back-bubble").css("left", 400);
	
	$(".bubble").fadeIn();
};

/*  On page load, go to desired url!  */

$(document).ready(function() {		
    // insert fake body
    $("body").append('<div id="b"></div>');
    
	// help bubbles
	Page.createBubble('you-bubble', '<p>This is you. Use <strong>&uarr; &darr; &larr; &rarr;</strong> to move.</p><p>Fire at links with the <strong>spacebar</strong>.</p>');
	Page.createBubble('minimap-bubble', '<p>This is the <strong>minimap</strong>.</p><p>It shows an overview of the page.</p>');
	Page.createBubble('back-bubble', '<p>Drive <strong>down</strong> to scroll automatically.</p><p>(and off the <strong>left side</strong> to go back)</p>');
	Page.showBubbles();

    // minimap (lower right corner)
    Page.createMinimap();

	// virtual keyboard for iphone / ipad
	if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
		Page.createVirtualKeyboard();
	} else {
		$(document).click(function(event) {
			if ($(event.target).hasClass("key")) return;
			
			Page.createBubble('click-bubble', '<p>Whoops! Surf using your <strong>keyboard</strong> instead.</p>');
			$("#click-bubble").css("position", "absolute");
			$("#click-bubble").css("top", event.pageY - $("#click-bubble").height()/2 - 20);
			$("#click-bubble").css("left", event.pageX - $("#click-bubble").width()/2);
			$('#click-bubble').fadeIn();
			$('#click-bubble').delay(2000).fadeOut("fast", function() {
				$(this).remove();
			});
		});
	}

    // load starting url into body
	Page.navigateTo(Page._location);
});

// fog clearing	using mouse, disabled for now
/*
$(window).mousedown(function(event) {
	Page._reveal = true;
});

$(window).mouseup(function(event) {
	Page._reveal = false;
});

$(window).mousemove(function(event) {	
	if (Page._reveal)
	    Page.revealFog(event.pageX, event.pageY, 50);
});
*/

// to manually activate the virtual keyboard, try this
$(window).konami(Page.createVirtualKeyboard, "84,79,85,67,72"); // T O U C H

$(window).resize(function() {		
	$("#fog").css("width", $(document).width());
	$("#fog").css("height", $(document).height());
	
	$("#fog-mini").css("width", $("#m").width()*.2);
	$("#fog-mini").css("height", $("#m").height()*.2);
});

$(window).blur(function() {
	$(".popup").fadeIn();
});

$(window).error(function(){
    return true;
});
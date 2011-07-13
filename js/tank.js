/*  This is a tank. It can drive around on the screen with up, down, left, 
    right; it can shoot with space. Shooting a link triggers navigation.   */

function Tank() {};

// current movement
Tank._left = false;
Tank._right = false;
Tank._forward = false;
Tank._backward = false;

// tank and bullet speed
Tank._speed = 4;
Tank._bulletTimeout = 40;

// how long a bullet has lived
Tank._bulletLifetime = 0;
Tank._bulletAngle = 0;

// timer for bubbles to reappear
Tank._inactiveTimer = null;

// links in range
Tank._linksInRange = [];

if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i))
	Tank._speed *= 4;

Tank.updateFrame = function() {    
    // tank movement	
	if (Tank._left)
		$("#tank").animate({ rotate: '-=5deg' }, { queue: false, duration: 0 });
	else if (Tank._right)
		$("#tank").animate({ rotate: '+=5deg' }, { queue: false, duration: 0 });

	if (Tank._forward) {
		var actualAngle = parseInt($("#tank").rotate());
		$("#player").animate({
			top: '-=' + Math.cos(actualAngle*(Math.PI/180)) * Tank._speed,
			left: '+=' + Math.sin(actualAngle*(Math.PI/180)) * Tank._speed,
			}, { queue: false, duration: 0 });
	}
	else if (Tank._backward) {
		var actualAngle = parseInt($("#tank").rotate());
		$("#player").animate({
			top: '+=' + Math.cos(actualAngle*(Math.PI/180)) * Tank._speed,
			left: '-=' + Math.sin(actualAngle*(Math.PI/180)) * Tank._speed,
			}, { queue: false, duration: 0 });
	}
	
	// tank minimap movement
	$("#player-mini").css("position", "relative");
	if ($.browser.webkit) {
		$("#player-mini").css("top", $("#player").position().top);
		$("#player-mini").css("left", $("#player").position().left);
	} else if ($.browser.mozilla) {
		$("#player-mini").css("top", $("#player").position().top * 0.5);
		$("#player-mini").css("left", $("#player").position().left * 0.5);
	}
	
	// bullet movement
	Tank._bulletLifetime++;
	if (Tank._bulletLifetime > Tank._bulletTimeout) {
	    $(".bullet").remove();
	    Tank._bulletLifetime = 0;
	} else {
	    $(".bullet").animate({
    		top: '-=' + Math.cos(Tank._bulletAngle*(Math.PI/180)) * Tank._speed * 2,
    		left: '+=' + Math.sin(Tank._bulletAngle*(Math.PI/180)) * Tank._speed * 2,
    		}, { queue: false, duration: 0 });
	}
}

Tank.updateEnvironment = function() {    
    // check for bullet collision with links
	if ($(".bullet").length > 0 && Tank._linksInRange.length > 0) {
	    var bullet = $(".bullet")[0];
	    
	    $.each(Tank._linksInRange, function() {            
	        if (collision(bullet, this)) {
	            $(".bullet").remove();
	            
				if (this.href) {					
	            	// we don't want any query strings
		            var url = parseURL(this.href);
		            Page.navigateTo(url.protocol + "://" + url.host + url.path);
				}
	        }
	    });
    }
    
    // reveal fog where tank is
    Page.revealFog($("#player").position().left, $("#player").position().top, 300);
    
    // left edge of screen triggers back button
    if ($("#player").position().left < -1) {
        $("#player").css({ left: $(document).width() - 41 });
        Page.goBack();
    } else if ($("#player").position().left > $(document).width() - 41) {
	    $("#player").css({ left: 0 });
	    Page.goForward();
	}
    
	// scroll page to keep tank in center
	if (!navigator.userAgent.match(/iPhone/i) && !navigator.userAgent.match(/iPad/i)) {
		if ($("#player").position().top > $(window).scrollTop() + $(window).height() - 41 || $("#player").position().top < $(window).scrollTop() + 41/2)
	        $('html, body, #m').animate({ scrollTop: $("#player").position().top - $(window).height()/2 + 41 }, { queue: false, duration: 100 });
    
	    if ($("#player").position().left < $(document).width() - 41 && ($("#player").position().left > $(window).scrollLeft() + $(window).width() - 41 || $("#player").position().left < $(window).scrollLeft() + 41/2))
	        $('html, body, #m').animate({ scrollLeft: $("#player").position().left - $(window).width()/2 + 41 }, { queue: false, duration: 100 });
	}

	// move tank help bubble
	$("#you-bubble").css("position", "absolute");
	$("#you-bubble").css("top", $("#player").position().top - 41*2);
	$("#you-bubble").css("left", $("#player").position().left - $("#you-bubble").width() / 2 + 41);
}

Tank.blinkMinimap = function() {
	$('#player-mini').fadeOut(500, function() {
		$('#player-mini').fadeIn(500);
	});
}

Tank.shoot = function(playerName) {
    if ($(".bullet").length > 0) return;
        
    Tank._bulletLifetime = 0;
    Tank._bulletAngle = parseInt($("#tank").rotate());
    
    Tank._linksInRange = [];
    $("#b a").each(function() {
        var x1 = $("#player").position().left;
        var x2 = $(this).offset().left;
        var y1 = $("#player").position().top;
        var y2 = $(this).offset().top;
        
        if (Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) < Tank._bulletTimeout * 8)
            Tank._linksInRange.push(this);
    });
        
    $('body').append('<img src="' + Page.getFaviconPath() + '" class="bullet" width="8px" height="8px" />');
    $('.bullet').css("top", $("#player").position().top + 41/2 - 4);
    $('.bullet').css("left", $("#player").position().left + 24/2 - 4); 
}


/*  On page load, put a tank on the screen.  */

$(document).ready(function() {
	$('body').append(
	    '<div id="player"> \
            <img src="images/tank.png" width="24px" height="41px" id="tank" /> \
		    <span>You</span> \
	    </div>'
	);
	$("#tank").rotate("125deg");
		
	// set up frame updater
	window.setInterval(Tank.updateFrame, 20); // 50 fps
	window.setInterval(Tank.updateEnvironment, 100); // 10 ups
    window.setInterval(Tank.blinkMinimap, 1000);

    // keyboard handlers
	$(document).keydown(function(e) {
		switch (e.which) {
			case 32: // space
			case 13: // return
				e.stopPropagation();
				e.preventDefault();
				Tank.shoot();
				break;
			case 37: // left
			case 65: // a
				e.stopPropagation();
				e.preventDefault();
				Tank._left = true;
				Tank._right = false;
				break;
			case 38: // up
			case 87: // w
				e.stopPropagation();
				e.preventDefault();
				Tank._forward = true;	
				Tank._backward = false;	
				break;
			case 39: // right
			case 68: // d
				e.stopPropagation();
				e.preventDefault();
				Tank._right = true;
				Tank._left = false;
				break;
			case 40: // down
			case 83: // s
				e.stopPropagation();
				e.preventDefault();
				Tank._backward = true;
				Tank._forward = false;
				break;
		}	
		
		$(".bubble").hide();
		window.clearTimeout(Tank._inactiveTimer);
	});

	$(document).keyup(function(e) {
		switch (e.which) {
			case 37: // left
			case 65: // a
				e.stopPropagation();
				e.preventDefault();
				Tank._left = false;
				break;
			case 38: // up
			case 87: // w
				e.stopPropagation();
				e.preventDefault();
				Tank._forward = false;
				break;
			case 39: // right
			case 68: // d
				e.stopPropagation();
				e.preventDefault();
				Tank._right = false;
				break;
			case 40: // down
			case 83: // s
				e.stopPropagation();
				e.preventDefault();
				Tank._backward = false;
				break;
		}	
		
		if (!Tank._forward && !Tank._backward && !Tank._left && !Tank._right)
			Tank._inactiveTimer	= window.setTimeout(Page.showBubbles, 1000);
	});
});
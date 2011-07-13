/*  These are some helpful functions.   */

function parseURL(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
        hash: a.hash.replace('#',''),
        path: a.pathname.replace(/^([^\/])/,'/$1'),
        relative: (a.href.match(/tp:\/\/[^\/]+(.+)/) || [,''])[1],
        segments: a.pathname.replace(/^\//,'').split('/')
    };
}

function collision(object1, object2) {
    var left1, left2;
    var right1, right2;
    var top1, top2;
    var bottom1, bottom2;

    left1 = $(object1).offset().left;
    left2 = $(object2).offset().left;
    right1 = left1 + parseInt($(object1).width());
    right2 = left2 + parseInt($(object2).width());
    top1 = $(object1).offset().top;
    top2 = $(object2).offset().top;
    bottom1 = top1 + parseInt($(object1).height());
    bottom2 = top2 + parseInt($(object2).height());

    if (bottom1 < top2) return false;
    if (top1 > bottom2) return false;
    if (right1 < left2) return false;
    if (left1 > right2) return false;

    return true;
}

function absoluteizeHTML(html, domainURI) {
	// convert everything that looks like this:
	// <img src="/images/logo.gif" />
	//
	// to something like this:
	// <img src="http://www.google.com/images/logo.gif" />
	html = html.replace(/src=["'].*?["']/ig, function(match) {
		var pathURI = new URI(match.substring(5, match.length - 1));
		return 'src="' + pathURI.resolve(domainURI).toString() + '"';
	});
	
	// convert everything that looks like this:
	// <a href="/services/"></a>
	//
	// to something like this:
	// <a href="http://www.google.com/services/"></a>
	html = html.replace(/href=["'].*?["']/ig, function(match) {
		var pathURI = new URI(match.substring(6, match.length - 1));
		return 'href="' + pathURI.resolve(domainURI).toString() + '"';
	});
	
	// convert everything that looks like this:
	// @import "/groups/style.css"
	//
	// to something like this:
	// @import "http://groups.google.com/groups/style.css"
	html = html.replace(/@import( )?\(?["'].*?["']\)?/ig, function(match) {
		var pathURI = new URI(match.substring(6, match.length - 1));
		return '@import("' + pathURI.resolve(domainURI).toString() + '")';
	});

	// &amp -> &
	html = html.replace(/&amp;/ig, '&');
	
	return html;
}
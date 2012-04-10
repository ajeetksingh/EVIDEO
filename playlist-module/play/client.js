


function writeCookie(name,value,days) {
    var date, expires;
    if (days) {
        date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        expires = "; expires=" + date.toGMTString();
            }else{
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}
function readCookie(name) {
    var i, c, ca, nameEQ = name + "=";
    ca = document.cookie.split(';');
    for(i=0;i < ca.length;i++) {
        c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1,c.length);
        }
        if (c.indexOf(nameEQ) == 0) {
            return c.substring(nameEQ.length,c.length);
        }
    }
    return '';
}
function getUsername()
{
	var str=document.referrer;
	var str1=str.split('=');
	console.log(str1[1]);
	return str1[1];
}
var QueryString = function () {
  	// This function is anonymous, is executed immediately and 
  	// the return value is assigned to QueryString!
  	var query_string = {};
  	var query = window.location.search.substring(1);
  	var vars = query.split("&");
  	for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();
var username=getUsername();
var videoid=QueryString.id;

var user;
if(username && username.length <= 25 )
{
	console.log("writing cookie");
	writeCookie('sessionId', username, 3);
	
}
user=readCookie('sessionId');
console.log(user);
function deleteBookmark(id)
{
	var r=confirm("Do you really want to delete Bookmark ?");
	if (r==true)
  	{
	var xmlhttp;
		
		 var mid= QueryString.id;
		// var mstart=document.form.start.value;
		// var mstop=document.form.stop.value;
		// var mtype=document.form.type.value;
		// var mval=document.form.val.value;
		 var str= "id="+id;
 		//alert(mstart);
		if (window.XMLHttpRequest)
		  {// code for IE7+, Firefox, Chrome, Opera, Safari
 			 xmlhttp=new XMLHttpRequest();
 		 }
		else
 		 {// code for IE6, IE5
  			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
 		 }
		xmlhttp.onreadystatechange=function()
		  {
 		 	if (xmlhttp.readyState==4 && xmlhttp.status==200)
  		 	 {
 		 	  document.getElementById("wrapper").innerHTML=xmlhttp.responseText;
   		 	}
  		}
		xmlhttp.open("GET","http://evideo.iitj.ac.in:8080/json-delete-bookmark.php?"+str+'&jsoncallback=?',true);
		xmlhttp.send();
		popup('popUpDeleteBookmark');
	}

}
function deleteLink(id)
{
 	// alert(id);
	var r=confirm("Do you really want to delete Link ?");
	if (r==true)
  	{
	var xmlhttp;
		
		 var mid= QueryString.id;
		// var mstart=document.form.start.value;
		// var mstop=document.form.stop.value;
		// var mtype=document.form.type.value;
		// var mval=document.form.val.value;
		 var str= "id="+id+"&media_id="+mid;
 		//alert(mstart);
		if (window.XMLHttpRequest)
		  {// code for IE7+, Firefox, Chrome, Opera, Safari
 			 xmlhttp=new XMLHttpRequest();
 		 }
		else
 		 {// code for IE6, IE5
  			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
 		 }
		xmlhttp.onreadystatechange=function()
		  {
 		 	if (xmlhttp.readyState==4 && xmlhttp.status==200)
  		 	 {
 		 	  document.getElementById("wrapper").innerHTML=xmlhttp.responseText;
   		 	}
  		}
		xmlhttp.open("GET","http://evideo.iitj.ac.in:8080/json-delete-link.php?"+str+'&jsoncallback=?',true);
		xmlhttp.send();
		popup('popUpDiv5');
	}
}
function deleteAnnotation(id)
{
 	// alert(id);
	var r=confirm("Do you really want to delete Annotation ?");
	if (r==true)
  	{
 
		var xmlhttp;
		
		 var mid= QueryString.id;
		// var mstart=document.form.start.value;
		// var mstop=document.form.stop.value;
		// var mtype=document.form.type.value;
		// var mval=document.form.val.value;
		 var str= "id="+id+"&media_id="+mid;
 		//alert(mstart);
		if (window.XMLHttpRequest)
		  {// code for IE7+, Firefox, Chrome, Opera, Safari
 			 xmlhttp=new XMLHttpRequest();
 		 }
		else
 		 {// code for IE6, IE5
  			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
 		 }
		xmlhttp.onreadystatechange=function()
		  {
 		 	if (xmlhttp.readyState==4 && xmlhttp.status==200)
  		 	 {
 		 	  document.getElementById("wrapper").innerHTML=xmlhttp.responseText;
   		 	}
  		}
		xmlhttp.open("GET","http://evideo.iitj.ac.in:8080/json-delete-annotation.php?"+str+'&jsoncallback=?',true);
		xmlhttp.send();
		popup('popUpDiv6');
	}
	
}
function editAnnotation(id)
{
 	
	
		 var mid= QueryString.id;
		var title;
		var time;
		var stop;
		var titleid;
		 var str= "id="+id+"&media_id="+mid;
 				 $.getJSON('http://evideo.iitj.ac.in:8080/json-retrieve-annotation.php?'+str+'&jsoncallback=?', function(r) {
 		console.log("Inside getJSON");
			//alert(r);
			r=JSON.stringify(r);
			var temp =JSON.parse(r); 
                      console.log(temp[0].title);
			title=temp[0].title;
			time=temp[0].time;
			stop=temp[0].stop;
			titleid=temp[0].titleid;
			console.log(title);
			document.editform.val.value=title;
			document.editform.start.value=time;
	document.editform.stop.value=stop;
	document.editform.id.value=titleid;
                      //create_sidebar(r,str);
			//create_sidebar1(r,str);
   		//console.log(JSON.stringify(data));
 
		});
	
	
	popup('popUpDiv7');
}
function seekVideoPage(id)
{
 	
	
		
		var title;
		var start;
		var stop;
		var media_id;
		var bid;
		var user=readCookie('sessionId');
		 var str= "id="+id+"&user="+user;
 				 $.getJSON('http://evideo.iitj.ac.in:8080/json-retrieve-bookmark-nextid.php?'+str+'&jsoncallback=?', function(r) {
 		console.log("Inside getJSON");
			//alert(r);
			r=JSON.stringify(r);
			var temp =JSON.parse(r); 
                      console.log(temp[0].title);
			title=temp[0].title;
			start=temp[0].start;
			stop=temp[0].stop;
			media_id=temp[0].media_id;
			bid=temp[0].bid;
			if(media_id)
			{
			window.location = "http://evideo.iitj.ac.in/engage/ui/watch.html?id="+media_id+"&start="+start+"&stop="+stop+"&bid="+bid;
                      }
			else
			{
				alert("End of Bookmarks");
			}
		});
}
function seekVideo(id)
{
 	
		var runCommand='abcd('+id+')';
		console.log(id);
		var title;
		var start;
		var stop;
		var media_id;
		 var str= "id="+id;
 				 $.getJSON('http://evideo.iitj.ac.in:8080/json-retrieve-bookmark.php?'+str+'&jsoncallback=?', function(r) {
 		console.log("Inside getJSON");
			//alert(r);
			r=JSON.stringify(r);
			var temp =JSON.parse(r); 
                      console.log(temp[0].title);
			title=temp[0].title;
			start=temp[0].start;
			stop=temp[0].stop;
			media_id=temp[0].media_id;
			if(media_id)
			{
			window.location = "http://evideo.iitj.ac.in/engage/ui/watch.html?id="+media_id+"&start="+start+"&stop="+stop+"&bid="+id;
                      }
			else
			{
				alert("End of Bookmarks");
			}
		});
}

function seekVideoForBookmark(id)
{
 	
		var runCommand='abcd('+id+')';
		console.log(id);
		var title;
		var start;
		var stop;
		var media_id;
		 var str= "id="+id;
 				 $.getJSON('http://evideo.iitj.ac.in:8080/json-retrieve-bookmark.php?'+str+'&jsoncallback=?', function(r) {
 		console.log("Inside getJSON");
			//alert(r);
			r=JSON.stringify(r);
			var temp =JSON.parse(r); 
                      console.log(temp[0].title);
			title=temp[0].title;
			start=temp[0].start;
			stop=temp[0].stop;
			media_id=temp[0].media_id;
			if(media_id)
			{
			window.location = "http://evideo.iitj.ac.in/engage/ui/watch.html?id="+media_id+"&start="+start+"&bid="+id+"&run="+runCommand;
                      }
			
		});
}
function downloadPlaylist(pid)
{
		var user=readCookie('sessionId');
		 var str= "id="+pid;
 				 $.getJSON('http://evideo.iitj.ac.in:8080/json-retrieve-playlist.php?'+str+'&jsoncallback=?', function(r) {
 		console.log("Inside downloadPlaylist");
			//alert(r);
			r=JSON.stringify(r);
			var temp =JSON.parse(r); 
			var play=temp[0].playlist;
			console.log(play);
		var xmlhttp;
		document.getElementById("dwnbtn"+pid).innerHTML="Wait....";
		
		if (window.XMLHttpRequest)
		  {// code for IE7+, Firefox, Chrome, Opera, Safari
 			 xmlhttp=new XMLHttpRequest();
 		 }
		else
 		 {// code for IE6, IE5
  			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
 		 }
		xmlhttp.onreadystatechange=function()
		  {
 		 	if (xmlhttp.readyState==4 && xmlhttp.status==200)
  		 	 {
				console.log(xmlhttp.responseText);
 		 	  document.getElementById("dwnbtn"+pid).innerHTML=xmlhttp.responseText;
   		 	}
  		}
		xmlhttp.open("GET","http://evideo.iitj.ac.in:8080/play/index.php?pname="+play+"&uname="+user,true);
		xmlhttp.send();
		});


}
function deletePlaylist(id)
{
 	// alert(id);
	var r=confirm("Do you really want to delete Link ?");
	if (r==true)
  	{
	var xmlhttp;
		
		 var mid= QueryString.id;
		// var mstart=document.form.start.value;
		// var mstop=document.form.stop.value;
		// var mtype=document.form.type.value;
		// var mval=document.form.val.value;
		 var str= "id="+id;
 		//alert(mstart);
		if (window.XMLHttpRequest)
		  {// code for IE7+, Firefox, Chrome, Opera, Safari
 			 xmlhttp=new XMLHttpRequest();
 		 }
		else
 		 {// code for IE6, IE5
  			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
 		 }
		xmlhttp.onreadystatechange=function()
		  {
 		 	if (xmlhttp.readyState==4 && xmlhttp.status==200)
  		 	 {
 		 	  document.getElementById("wrapper").innerHTML=xmlhttp.responseText;
   		 	}
  		}
		xmlhttp.open("GET","http://evideo.iitj.ac.in:8080/json-delete-playlist.php?"+str+'&jsoncallback=?',true);
		xmlhttp.send();
		popup('popUpDiv9');
		// vp4.load_app4("Playlist");	
	}
}
/*function deleteAll()
{
	
	var user=readCookie('sessionId');
	var str= "user="+user;
					if (window.XMLHttpRequest)
					  {// code for IE7+, Firefox, Chrome, Opera, Safari
 			 			xmlhttp=new XMLHttpRequest();
 		 			}
					else
 		 			{// code for IE6, IE5
  						xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
 		 			}
					xmlhttp.onreadystatechange=function()
		  			{
 		 				if (xmlhttp.readyState==4 && xmlhttp.status==200)
  		 	 			{
 		 	  				console.log(xmlhttp.responseText);
							// document.getElementById("plbtn"+pid).innerHTML=xmlhttp.responseText;
   		 				}
  					}
					xmlhttp.open("GET","http://evideo.iitj.ac.in:8080/play/deleteFolder.php?"+str+'&jsoncallback=?',true);
					xmlhttp.send();
}*/
function changePlaylist(pid)
{
		
		var url;
		var user=readCookie('sessionId');
		 var str= "id="+pid;
 				 $.getJSON('http://evideo.iitj.ac.in:8080/json-retrieve-playlist.php?'+str+'&jsoncallback=?', function(r) {
 		console.log("Inside changePlaylist");
			//alert(r);
			r=JSON.stringify(r);
			var temp =JSON.parse(r); 
			var play=temp[0].playlist;
			console.log(play);
			url=temp[0].url;
			
			if(document.getElementById("plbtn"+pid).innerHTML == "Make Playlist"){
				var player= flowplayer("playerFlow", "flowplayer-3.2.7.swf", "loading.flv" );
				$("playerFlow").load();

					document.getElementById("plbtn"+pid).innerHTML="Wait....";
					var str= "play="+play+"&user="+user;
					//alert(str);
 					if (window.XMLHttpRequest)
					  {// code for IE7+, Firefox, Chrome, Opera, Safari
 			 			xmlhttp=new XMLHttpRequest();
 		 			}
					else
 		 			{// code for IE6, IE5
  						xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
 		 			}
					xmlhttp.onreadystatechange=function()
		  			{
 		 				if (xmlhttp.readyState==4 && xmlhttp.status==200)
  		 	 			{
 		 	  				console.log(xmlhttp.responseText);
							 document.getElementById("plbtn"+pid).innerHTML=xmlhttp.responseText;
   		 				}
  					}
					xmlhttp.open("GET","http://evideo.iitj.ac.in:8080/play/createPlaylistFolder.php?"+str+'&jsoncallback=?',true);
					xmlhttp.send();
			}
			else{
			
			
			var player= flowplayer("playerFlow", "flowplayer-3.2.7.swf", url );
			$("playerFlow").load();
			
			}
			//clearTimeout(t);
			//alert(url);
			//document.getElementById("playerFlow").href=url;
			//console.log(document.getElementById("playerFlow").href);
                    //  console.log(temp[0].title);
			//title=temp[0].title;
			//start=temp[0].start;
			//stop=temp[0].stop;
			//media_id=temp[0].media_id;
			//bid=temp[0].bid;
			/*if(media_id)
			{
			window.location = "http://evideo.iitj.ac.in/engage/ui/watch.html?id="+media_id+"&start="+start+"&stop="+stop+"&bid="+bid;
                      }
			else
			{
				alert("End of Bookmarks");
			}*/
		});
}
function abcd(id)
{	
	popup('popUpBookmarkEdit');
	editBookmark(id);
}

function editBookmark(id)
				{

					var mid=QueryString.id;
					var title;
					var description;
					var start;
					var stop;
					var str= "id="+id;//+"&title="+mval+"&url="+murl+"&description="+mtype+"&start="+mstart+"&stop="+mstop;
					//alert(str);	
				        $.getJSON('http://evideo.iitj.ac.in:8080/get-bookmark-data.php?'+str+'&jsoncallback=?', function(r) {
 					console.log("Inside getJSON");
                      			r=JSON.stringify(r);
                       			var temp =JSON.parse(r); 
                     			console.log(temp[0].title);
                       			title=temp[0].title;
                       			description=temp[0].description;
					start=temp[0].start;
					stop=temp[0].stop;
					document.formbookmarkedit.title1.value=title;
					//document.formbookmarkedit.url1.value=url;
					document.formbookmarkedit.description1.value=description;
					document.formbookmarkedit.start1.value=start;
					document.formbookmarkedit.stop1.value=stop;
					document.formbookmarkedit.id.value=id;
			//create_sidebar1(r,str);
   		//console.log(JSON.stringify(data));
 
		});	
				 		
				//popup('popUpDivUpdateLink');	
				
				}


function editLink(id)
				{

					var mid=QueryString.id;
					var title;
					var url;
					var description;
					var start;
					var stop;
					var str= "id="+id+"&media_id="+mid;//+"&title="+mval+"&url="+murl+"&description="+mtype+"&start="+mstart+"&stop="+mstop;
					//alert(str);	
				        $.getJSON('http://evideo.iitj.ac.in:8080/get-link-data.php?'+str+'&jsoncallback=?', function(r) {
 					console.log("Inside getJSON");
                      			r=JSON.stringify(r);
                       			var temp =JSON.parse(r); 
                     			console.log(temp[0].title);
                       			title=temp[0].title;
                       			url=temp[0].url;
					description=temp[0].description;
					start=temp[0].start;
					stop=temp[0].stop;
					document.formlinkedit.title1.value=title;
					document.formlinkedit.url1.value=url;
					document.formlinkedit.description1.value=description;
					document.formlinkedit.start1.value=start;
					document.formlinkedit.stop1.value=stop;
					document.formlinkedit.id.value=id;
			//create_sidebar1(r,str);
   		//console.log(JSON.stringify(data));
 
		});	
				 		
				//popup('popUpDivUpdateLink');	
				
				}
		function updateLink()
			{
 			
			var xmlhttp;
		        //var indices=new Array();
			//var id=14;
                        var mid=QueryString.id;
		//var mid= QueryString.id;
		var mstart=document.formlinkedit.start1.value;
		var mstop=document.formlinkedit.stop1.value;
		var mtype=document.formlinkedit.description1.value;
		var mval=document.formlinkedit.title1.value;
                var murl=document.formlinkedit.url1.value;
		var id=document.formlinkedit.id.value;
		 var str= "id="+id+"&media_id="+mid+"&title="+mval+"&url="+murl+"&description="+mtype+"&start="+mstart+"&stop="+mstop;
		
 		//alert(str);
		if (window.XMLHttpRequest)
		  {// code for IE7+, Firefox, Chrome, Opera, Safari
 			 xmlhttp=new XMLHttpRequest();
 		 }
		else
 		 {// code for IE6, IE5
  			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
 		 }
		xmlhttp.onreadystatechange=function()
		  {
 		 	if (xmlhttp.readyState==4 && xmlhttp.status==200)
  		 	 {
 		 	  alert("Data updated Successfully!");
			 } 
  		}
		xmlhttp.open("GET","http://evideo.iitj.ac.in:8080/update-link-data.php?"+str+'&jsoncallback=?',true);
		xmlhttp.send();
		popup('popUpDivLinkEdit');		
		popup('popUpDivUpdateLink');
}

function updateBookmark()
			{
 			
			var xmlhttp;
		        //var indices=new Array();
			//var id=14;
                        var mid=QueryString.id;//alert(mid);
		//alert('Hi!!');
		//var mid= QueryString.id;
		var mstart=document.formbookmarkedit.start1.value;
		//alert(mstart);
		var mstop=document.formbookmarkedit.stop1.value;//alert(mstop);
		var mtype=document.formbookmarkedit.description1.value;//alert(mtype);
		var mval=document.formbookmarkedit.title1.value;//alert(mval);
                //var murl=document.formlinkedit.url1.value;
		var id=document.formbookmarkedit.id.value;//alert(id);
		 var str= "id="+id+"&media_id="+mid+"&title="+mval+"&description="+mtype+"&start="+mstart+"&stop="+mstop;
		
 		//alert(str);
		if (window.XMLHttpRequest)
		  {// code for IE7+, Firefox, Chrome, Opera, Safari
 			 xmlhttp=new XMLHttpRequest();
 		 }
		else
 		 {// code for IE6, IE5
  			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
 		 }
		xmlhttp.onreadystatechange=function()
		  {
 		 	if (xmlhttp.readyState==4 && xmlhttp.status==200)
  		 	 {
 		 	  alert("Data updated Successfully!");
			 } 
  		}
		xmlhttp.open("GET","http://evideo.iitj.ac.in:8080/update-bookmark-data.php?"+str+'&jsoncallback=?',true);
		xmlhttp.send();
		popup('popUpBookmarkEdit');		
		popup('popUpDivUpdateBookmark');
}


function openBookmark()
{
	document.formbookmarkadd.id.value=QueryString.id;
	document.formbookmarkadd.username.value=user;
	popup('popUpBookmarkAdd');
}
function abc1()
{
 popup('popUpDiv3');
}
function abc2(id)
{
 popup('popUpDivLinkEdit');
 editLink(id);
}

function abc3(id)
{	
	seekVideoForBookmark(id);	
	
	
		
}

function abc()
{
 popup('popUpDiv');
}
if (jQuery) (function ($) {
    // http://stackoverflow.com/questions/1067464/need-to-cancel-click-mouseup-events-when-double-click-event-detected
    $.fn.fixClick =  function (click, dblclick) {

        var app = this;
        app.click = click;
        app.dblclick = dblclick;
        app.firstClick = false;
        app.timer = null;
        app.delay = 300;

        $(this).click(function (e){

        var ins = this;
        ins.e = e;

            if (app.firstClick == false) {
            app.timer = setTimeout(function () {
            app.click(ins.e);
            app.firstClick = false;
            }, app.delay);
            }
        app.firstClick = true;

        }).dblclick(function (e){
        clearTimeout(app.timer);
        app.firstClick = false;
        app.dblclick(e);
        });

        return this;
    };
})(jQuery);

(function ($) {
    var g = this;

    g.gevent = function (act, lab, val) {
        if (!act) {
            return;
        }

        if (typeof val == 'undefined') {
            if (typeof lab != 'undefined') {
                g._gaq.push(['vp._trackEvent', 'widget', act, lab]);
            }
            g._gaq.push(['vp._trackEvent', 'widget', act]);
        } else {
            if (typeof lab != 'undefined') {
                g._gaq.push(['vp._trackEvent', 'widget', act, lab, val]);
            }
            g._gaq.push(['vp._trackEvent', 'widget', act, val]);
        }
    };
})(jQuery);



(function ($) {
    var g = this,
        players = {},
        vp = {},
	vp1 = {},
	vp2 = {},
	vp4={},
        style = null,
        host,
        local;

    host = document.location.host;
    // host='localhost';
    local = (host == 'localhost');
    local = false;

    // if (local) {
    //     $('head').append('<link rel="stylesheet" href="http://localhost:8080/style/default.css" type="text/css" />');
    // } else {
        style = 'REPLACE_WITH_STYLE'; //todo: automate this
        style = '._vp_widget{ width: 400px;} .vp_header{ width:100%; text-align:right; background-color:lightgray; border:1px solid gray; text-align:center}.vp_footer{ width:100%; text-align:right; background-color:lightgray; border:1px solid gray}.vp_footer a{margin-right:5px}.vp_list{ float:left; text-align:left; border:1px solid gray; background-color:white; width:100%; overflow:auto; position: relative}.vp_lst_even{background-color:white;padding:4px}.vp_lst_odd{background-color:lightgray;padding:4px;}.vp_lst_active{background-color:#787676}.vp_time{ position:absolute; margin:0 3px 0 0; right:0px; background-color:gray; width:45px; text-align:center; border:1px solid darkgrey; color:ghostwhite; text-decoration:none}';
	 style += '._vp_widget1{ width: 400px;} .vp_header{ width:100%; text-align:right; background-color:lightgray; border:1px solid gray; text-align:center}.vp_footer{ width:100%; text-align:right; background-color:lightgray; border:1px solid gray}.vp_footer a{margin-right:5px}.vp_list{ float:left; text-align:left; border:1px solid gray; background-color:white; width:100%; overflow:auto; position: relative}.vp_lst_even{background-color:white;padding:4px}.vp_lst_odd{background-color:lightgray;padding:4px;}.vp_lst_active{background-color:#787676}.vp_time{ position:absolute; margin:0 3px 0 0; right:0px; background-color:gray; width:45px; text-align:center; border:1px solid darkgrey; color:ghostwhite; text-decoration:none}';
	style += '._vp_widget2{ width: 400px;} .vp_header{ width:100%; text-align:right; background-color:lightgray; border:1px solid gray; text-align:center}.vp_footer{ width:100%; text-align:right; background-color:lightgray; border:1px solid gray}.vp_footer a{margin-right:5px}.vp_list{ float:left; text-align:left; border:1px solid gray; background-color:white; width:100%; overflow:auto; position: relative}.vp_lst_even{background-color:white;padding:4px}.vp_lst_odd{background-color:lightgray;padding:4px;}.vp_lst_active{background-color:#787676}.vp_time{ position:absolute; margin:0 3px 0 0; right:0px; background-color:gray; width:45px; text-align:center; border:1px solid darkgrey; color:ghostwhite; text-decoration:none}';
	style += '._vp_widget4{ width: 400px;} .vp_header{ width:100%; text-align:right; background-color:#FDE7CE; border:1px solid gray; text-align:center}.vp_footer{ width:100%; text-align:right; background-color:#FDE7CE; border:1px solid gray}.vp_footer a{margin-right:5px;color:#A01A1A}.vp_list{ float:left; text-align:left; border:1px solid gray; background-color:white; width:100%; overflow:auto; position: relative}.vp_lst_even{background-color:white;padding:4px}.vp_lst_odd{background-color:#FDE7CE;padding:4px;}.vp_lst_active{background-color:#787676}.vp_time{ position:absolute; margin:0 3px 0 0; right:0px; background-color:gray; width:45px; text-align:center; border:1px solid darkgrey; color:ghostwhite; text-decoration:none}';
        // style += ".vp_list img{ border-style:none; padding: 0 2px;} .vp_list a img:hover{ background:gray;}";
        style += '.vp_list a:hover{ color:gray; }';
        // style += ".expand:hover, .collapse:hover {border-top:2px solid gray}";
        style += ".expand {background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAQAAABuBnYAAAAAGUlEQVQImWNggIANQIgC8AlsQIOYAiQbCgAUMxNBUqWR0wAAAABJRU5ErkJggg==') left no-repeat; padding: 0 12px; text-decoration:none;}";
        style += ".collapse {background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAQAAABuBnYAAAAAEklEQVQIW2NgIANsQIOYAiQDAOcmCwGcy16yAAAAAElFTkSuQmCC') left no-repeat; padding: 0 12px; text-decoration: none}";

        // style += ".vp_top_list:hover, .vp_sub_list:hover {border-top:2px solid gray}";
        // style += ".expand {background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAQAAABuBnYAAAAAGUlEQVQImWNggIANQIgC8AlsQIOYAiQbCgAUMxNBUqWR0wAAAABJRU5ErkJggg==') center no-repeat; padding: 0 3px; text-decoration:none;}";
        // style += ".collapse {background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAQAAABuBnYAAAAAEklEQVQIW2NgIANsQIOYAiQDAOcmCwGcy16yAAAAAElFTkSuQmCC') center no-repeat; padding: 0 3px; text-decoration: none}";
        style += ".vp_sub_list {padding: 0 12px;}";
        style += ".vp_entry {padding: 0 12px; }";
	//edited_Devanshu
	style +=".squareSelected ul { border: 2px solid #8B8378;position: absolute; width:47px; margin-left:350px; margin-top:40px; float:left; text-align: center; background-color:rgba(173, 255, 47, 1);}";
        // http://www.phpied.com/dynamic-script-and-style-elements-in-ie/
        // do we need this ?
	style +=".squareSelected li { margin-left:-40px;}";
	style +=".list {cursor:pointer;}";
	style +=".listSelected {cursor: default;  background-color:rgba(255, 127, 80, 1);}";
	style +="clear { /* generic container (i.e. div) for floating buttons */    overflow: hidden;    width: 100%;}a.button {    background: transparent url('bg_button_a.gif') no-repeat scroll top right;    color: #444;    display: block;    float: left;    font: normal 12px arial, sans-serif;    height: 24px;    margin-right: 6px;    padding-right: 18px; /* sliding doors padding */    text-decoration: none;}a.button span {    background: transparent url('bg_button_span.gif') no-repeat;    display: block;    line-height: 14px;    padding: 5px 0 5px 18px;} a.button:active {    background-position: bottom right;    color: #000;    outline: none; /* hide dotted outline in Firefox */}a.button:active span {    background-position: bottom left;    padding: 6px 0 4px 18px; /* push text down 1px */}";
	style+=".button1 {   border-top: 1px solid #b52b2b;   background: #A01A1A;   background: -webkit-gradient(linear, left top, left bottom, from(#A01A1A), to(#A01A1A));   background: -webkit-linear-gradient(top, #A01A1A,#A01A1A);   background: -moz-linear-gradient(-90deg, #A01A1A, #A01A1A);   background: -ms-linear-gradient(top, #A01A1A, #A01A1A);   background: -o-linear-gradient(top, #A01A1A, #A01A1A);   padding: 3px 6px;   -webkit-border-radius: 4px;   -moz-border-radius: 4px;   border-radius: 4px;   -webkit-box-shadow: rgba(0,0,0,1) 0 1px 0;   -moz-box-shadow: rgba(0,0,0,1) 0 1px 0;   box-shadow: rgba(0,0,0,1) 0 1px 0;   text-shadow: rgba(0,0,0,.4) 0 1px 0;  color: #ffffff;   font-size: 12px;   font-family:arial,helvetica,clean,sans-serif;   text-decoration: none;   vertical-align: middle;   } .button1:hover {   border-top-color: #b31616;   background: #b31616;   color: #f7f7f7;   } .button1:active {   border-top-color: #80111a;   background: #80111a;   } .button2{   margin: 5px;    text-decoration: none;    font: 14px 'Trebuchet MS',Arial, Helvetica; /*Change the em value to scale the button*/    display: inline-block;    text-align: center;    color: #fff;    border: 1px solid #9c9c9c; /* Fallback style */    border: 1px solid rgba(0, 0, 0, 0.3);               text-shadow: 0 1px 0 rgba(0,0,0,0.4);    box-shadow: 0 0 .05em rgba(0,0,0,0.4);    -moz-box-shadow: 0 0 .05em rgba(0,0,0,0.4);    -webkit-box-shadow: 0 0 .05em rgba(0,0,0,0.4);}.button2, .button2 span{    -moz-border-radius: .3em;    border-radius: .3em;}.button2 span{    border-top: 1px solid #fff; /* Fallback style */    border-top: 1px solid rgba(255, 255, 255, 0.5);    display: block;    padding: 0.5em 2.5em;    /* The background pattern */    background-image: -webkit-gradient(linear, 00,100% 100%, color-stop(.25, rgba(0, 0, 0, 0.05)), color-stop(.25, transparent), to(transparent)),-webkit-gradient(linear, 0 100%, 100% 0, color-stop(.25, rgba(0, 0, 0, 0.05)), color-stop(.25, transparent), to(transparent)),                      -webkit-gradient(linear, 0 0, 100% 100%, color-stop(.75, transparent), color-stop(.75, rgba(0, 0, 0, 0.05))),                      -webkit-gradient(linear, 0 100%, 100% 0, color-stop(.75,transparent), color-stop(.75, rgba(0, 0, 0, 0.05)));    background-image: -moz-linear-gradient(45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent),                      -moz-linear-gradient(-45deg, rgba(0, 0, 0,0.05) 25%, transparent 25%, transparent),                      -moz-linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.05) 75%),                      -moz-linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.05) 75%);    /* Pattern settings */    -moz-background-size: 3px 3px;    -webkit-background-size: 3px 3px;    background-size: 3px 3px;}.button2:hover{    box-shadow: 0 0 .1em rgba(0,0,0,0.4);    -moz-box-shadow: 0 0 .1em rgba(0,0,0,0.4);    -webkit-box-shadow: 0 0 .1em rgba(0,0,0,0.4);}.button2:active{    /* When pressed, move it down 1px */    position: relative;    top: 1px;}.button-blue{    background: #A01A1A;    background: -webkit-gradient(linear, left top, left bottom, from(#A01A1A), to(#A01A1A) );    background: -moz-linear-gradient(-90deg, #A01A1A, #A01A1A);    filter:  progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr='#A01A1A',endColorstr='#A01A1A');}.button-blue:hover{    background: #FDE7CE;    background: -webkit-gradient(linear, left top, left bottom, from(#A01A1A), to(A01A1A) );    background: -moz-linear-gradient(-90deg, #A01A1A, #A01A1A);    filter:  progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr='#A01A1A', endColorstr='#A01A1A');}.button-blue:active{    background: #A01A1A;}";
        var s = document.createElement('style');
        s.setAttribute("type", "text/css");
        if (s.styleSheet) {   // IE
            s.styleSheet.cssText = style;
        } else {                // the world
            s.appendChild(document.createTextNode(style));
        }

        $('head').append(s);
    // }


    function log(args) {
        if (typeof console == 'undefined' || typeof console.log == 'undefined') {
            return;
        }
        console.log(arguments);
    }

    (function () {
        var queue = [];

        function register(fn) {
            log('registering', queue.length, fn);
            return queue.push({
                fn: fn,
                enabled: true
            }) - 1;
        }

        function deregister(i) {
            queue[i].enabled = false;
        }

        function reregister(i) {
            queue[i].enabled = true;
        }

        function run_all() {
            function run_first(lst, i) {
                if (lst.length > i)  {
                    setTimeout(function () {
                        if (lst[i].enabled) {
                            try {
                                lst[i].fn();
                            } catch (x) {
                                log(x);
                            }
                        }
                        run_first(lst, i+1);
                    }, 0);      //just to not overhog the frontend.
                } else {
                    setTimeout(run_all, 1000); //every second
                }
            }
            run_first(queue, 0);
        }

        // api
        vp.background = {
            register: register,
            deregister: deregister,
            reregister: reregister
        };
	vp1.background = {
            register: register,
            deregister: deregister,
            reregister: reregister
        };
	vp2.background = {
            register: register,
            deregister: deregister,
            reregister: reregister
        };
	vp4.background = {
            register: register,
            deregister: deregister,
            reregister: reregister
        };


        $('document').ready(run_all);
    }());


   


    


    function is_flow_player() {
        return $('object#player_api').filter(':visible').length != 0;
    }

    function get_player() {
        if (is_flow_player()) {
            if (!players.flowplayer.player) {
                players.flowplayer.player = flo_obj;
                g.gevent('player-load', 'flowplayer');
            }
            return 'flowplayer';
        } else if (typeof ytplayer != 'undefined' && ytplayer != null) {
            // players.yt.player initialized by the global function onYoutube..
            // players.yt.player = ytPlayer;
            return 'yt';
        } else {
            return 'none';
        }
    };

   


    // converts seconds to (min, sec) pair. no hr!
    function sec2norm(sec) {
        var m, str = '';
        sec = parseInt(sec);
        m = parseInt(sec / 60);
        if (m) {
            str += m + ':';
        }

        sec = parseInt(sec % 60) + '';

        if (sec.length == 1) {
            sec = '0'+sec;
        }
        str += sec;
        return str;
    }

    function title_hover($div) {
        $div.hover(function () {
            $(this).find('.vp_time').css('display', 'inline');
        }, function () {
            $(this).find('.vp_time').css('display', 'none');
        });
        $div.find('.vp_time').css('display', 'none');
    }

    function make_title(v) {
        // var plus_link = '<a href="javascript:;" class="sublist expand">&nbsp;&nbsp;&nbsp</a>';
        // var indent = '<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';
        // var usual = '<span>&nbsp;&nbsp;&nbsp;&nbsp';
	var value = new Array(v.id, v.time, v.title);
        var div = $('<div>').append($('<a>', {
            id    : ('vp_id_'+v.time).replace('.', '_'),
            href  : 'javascript:Opencast.Watch.seekSegment('+v.time+')'
        }).append($('<span>', {
            html: $('<span> <span class="vp_fns"></span><a style="float:right" class="button" href="javascript:editAnnotation('+v.id+');"><span >Edit</span></a><a href="javascript:deleteAnnotation('+v.id+');"><img style="float:right;cursor:pointer;" src="close_button.png"></a><p style="text-align:justify; width:23em;"><span class="vp_title" >'+v.title+'</span></span>').addClass( v.childrens ? 'expand sublist' : v.top ? 'vp_sub_list' : 'vp_entry')
        }).append($('<span>', {
            'class': 'vp_time',
            html: sec2norm(v.time)
        }))).css({'text-decoration':'none'}).data({
            time: v.time,
            title: v.title
        }));

        div.data({
            time: v.time,
            title: v.title
        });

        div.fixClick(
           //fwd_video_fn(v)
         function () {
            log('double');
        });

        // div.css({
        //     position: 'relative'
        // });

        if (v.top) {
            div.hide();
        } else {
            div.addClass('top');
        }

        title_hover(div);

        return div;
    }
    function make_title1(v) {
        // var plus_link = '<a href="javascript:;" class="sublist expand">&nbsp;&nbsp;&nbsp</a>';
        // var indent = '<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';
        // var usual = '<span>&nbsp;&nbsp;&nbsp;&nbsp';
        var div = $('<div>').append($('<a>', {
            id    : ('vp_id_'+v.time).replace('.', '_'),
            href  : 'javascript:Opencast.Watch.seekSegment('+v.time+')'
        }).append($('<span>', {
            html: $('<span> <span class="vp_fns"></span>'+'<span class="vp_title" style="font-weight:bold;">'+v.title+'<a href="'+v.url+'" style="color:blue;" target="_blank">[View More]</a><a style="float:right;" class="button" href="javascript:abc2('+v.id+');"><span>Edit</span></a><a href="javascript:deleteLink('+v.id+');"><img style="float:right;cursor:pointer;" src="close_button.png"></a></span></span><p>'+v.description+'</p>').addClass( v.childrens ? 'expand sublist' : v.top ? 'vp_sub_list' : 'vp_entry')
        }).append($('<span>', {
            'class': 'vp_time',
            html: sec2norm(v.time)
        }))).css({'text-decoration':'none'}).data({
            time: v.time,
            title: v.title
        }));

        div.data({
            time: v.time,
            title: v.title
        });

        div.fixClick(
         // fwd_video_fn(v)
         function () {
            log('double');
        });

        // div.css({
        //     position: 'relative'
        // });

        if (v.top) {
            div.hide();
        } else {
            div.addClass('top');
        }

        title_hover(div);

        return div;
    }
     function make_title2(v) {
        // var plus_link = '<a href="javascript:;" class="sublist expand">&nbsp;&nbsp;&nbsp</a>';
        // var indent = '<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';
        // var usual = '<span>&nbsp;&nbsp;&nbsp;&nbsp';
        var div = $('<div>').append($('<a>', {
            id    : ('vp_id_'+v.time).replace('.', '_'),
            href  : 'javascript:seekVideo('+v.id+')'
        }).append($('<span>', {
            html: $('<span> <span class="vp_fns"></span>'+'<span class="vp_title" style="font-weight:bold;">'+v.title+'<a style="float:right;" class="button" href="javascript:abc3('+v.id+');"><span>Edit</span></a><a href="javascript:deleteBookmark('+v.id+');"><img style="float:right;cursor:pointer;" src="close_button.png"></a></span></span><p>'+v.desc+'</p>').addClass( v.childrens ? 'expand sublist' : v.top ? 'vp_sub_list' : 'vp_entry')
        }).append($('<span>', {
            'class': 'vp_time',
            html: sec2norm(v.start)+"-"+sec2norm(v.stop)
        }))).css({'text-decoration':'none'}).data({
            time: v.start,
            title: v.title
        }));

        div.data({
            time: v.start,
            title: v.title
        });

        div.fixClick(
           // fwd_video_fn(v)
        function () {
            log('double');
        });

        // div.css({
        //     position: 'relative'
        // });

        if (v.top) {
            div.hide();
        } else {
            div.addClass('top');
        }

        title_hover(div);

        return div;
    }

    function make_title4(v) {
        // var plus_link = '<a href="javascript:;" class="sublist expand">&nbsp;&nbsp;&nbsp</a>';
        // var indent = '<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';
        // var usual = '<span>&nbsp;&nbsp;&nbsp;&nbsp';
        var div = $('<div>').append($('<a>', {
            id    : ('vp_id_'+v.url).replace('.', '_'),
            href  : ''
        }).append($('<span>', {
            html: $('<span> <span class="vp_fns"></span>'+'<span class="vp_title" style="font-weight:bold;">'+v.title+'<a style="float:right;" class="button1" href="javascript:changePlaylist('+v.id+');"><span id="plbtn'+v.id+'">Make Playlist</span></a><a style="float:right;" class="button1" href="javascript:downloadPlaylist('+v.id+');"><span id="dwnbtn'+v.id+'">Download</span></a><a href="javascript:deletePlaylist('+v.id+');"><img style="float:right;cursor:pointer;" src="Delete.png"></a></span></span><p>'+v.url+'</p>').addClass( v.childrens ? 'expand sublist' : v.top ? 'vp_sub_list' : 'vp_entry')
        }).append($('<span>', {
            'class': 'vp_time',
            html: v.duration
        }))).css({'text-decoration':'none'}).data({
            time: v.url,
            title: v.title
        }));

        div.data({
            time: v.url,
            title: v.title
        });

        div.fixClick(
           // fwd_video_fn(v)
         function () {
            log('double');
        });

        // div.css({
        //     position: 'relative'
        // });

        if (v.top) {
            div.hide();
        } else {
            div.addClass('top');
        }

        title_hover(div);

        return div;
    }

    function make_all_titles(videos) {
        return $.map(videos, make_title);
    }
	function make_all_titles1(videos) {
        return $.map(videos, make_title1);
    }
	function make_all_titles2(videos) {
        return $.map(videos, make_title2);
    }

	function make_all_titles4(videos) {
        return $.map(videos, make_title4);
    }	

    function block_for_time(vds, sec) {
        var i;

        if (typeof sec === 'undefined' || sec === null) {
            return vds[0];
        }

        for (i=0; i<vds.length; i++) {
            if (vds[i].time > sec) {
                break;
            }
        }
        i--;

        if (i<0) {
            return null;
        }

        return vds[i];
    };

    vp.scroll_to_point = true;
	vp1.scroll_to_point = true;
	vp2.scroll_to_point = true;
	vp4.scroll_to_point=true;
    function progress_param_fn(vds) {
        var last_v = null;
        return function (sec) {
            var v = block_for_time(vds, sec),
                id,
                $vpl = $('.vp_list'),
                scroll = 0;

            if (!vp.scroll_to_point) {
                return;
            }

            if (!v) {
                return;
            }

            if (last_v == v) {
                return;
            }
            last_v = v;

            id = ('#vp_id_'+v.time).replace('.', '_');

            // highlight the relavent block
            $vpl.children().removeClass('vp_lst_active');
            $(id).parent().addClass('vp_lst_active');

            // scroll to the point
            scroll = $vpl.scrollTop() + $(id).offset().top - $vpl.offset().top;
            $vpl.scrollTop(scroll - 100);

            g.gevent('progress', get_player(), sec);
        };
    };

    var app = {};

    app.dom = {
        style: {

        },
	//edited_Devanshu
        create_header: function (str) {
            return $('<div>', {
                id: 'vp_header',
                'class': 'vp_header',
                'html': '<a class="button" href="javascript:abc()"><span>Add '+str+'</span></a>&nbsp;&nbsp;&nbsp;<a href="http://medialab.iitj.ac.in">'+str+'</a>&nbsp;&nbsp;<img id="close" style="margin-left:125px;cursor:pointer;" src="close_button.png">'
		
            });
        },
	create_header1: function (str) {
            return $('<div>', {
                id: 'vp_header',
                'class': 'vp_header',
                'html': '<a class="button" href="javascript:abc1()"><span>Add '+str+'</span></a>&nbsp;&nbsp;&nbsp;<a href="http://medialab.iitj.ac.in">'+str+'</a>&nbsp;&nbsp;<img id="close" style="margin-left:125px;cursor:pointer;" src="close_button.png">'
		
            });
        },
	create_header2: function (str) {
            return $('<div>', {
                id: 'vp_header',
                'class': 'vp_header',
                'html': '<a class="button" href="javascript:openBookmark()"><span>Add '+str+'</span></a>&nbsp;&nbsp;&nbsp;<a href="http://medialab.iitj.ac.in">'+str+'</a>&nbsp;&nbsp;<img id="close" style="margin-left:125px;cursor:pointer;" src="close_button.png">'
		
            });
        },
	create_header4: function (str) {
            return $('<div>', {
                id: 'vp_header',
                'class': 'vp_header',
                'html': '<a class="button1" style:"float:left;" href="javascript:playlist()"><span>Add '+str+'</span></a>&nbsp;&nbsp;&nbsp;<a href="http://medialab.iitj.ac.in">'+str+'</a>&nbsp;&nbsp;<img id="close" style="margin-left:125px;cursor:pointer;" src="Delete.png">'
		
            });
        },
        create_footer: function () {
            return $('<div>', {
                id: 'vp_footer',
                'class': 'vp_footer',
                'html': $('<a>', {
                    'href': "http://iitj.ac.in",
                    'html': 'Powered by IIT Rajasthan'
                })
            });
        },
        create_list: function (w) {
            var res= $('<div>', {
                id: 'vp_list',
                'class': 'vp_list'
            }).css('height', Math.round(w * 10 / 8) + 'px');
            return res;
        }
    };

    function get_widget_div() {
        var c = '_vp_widget',
            cq = '.'+c,
            $vp;

        $vp = $(cq);

//not getting

        if ($vp.length == 0 && /nptel.iitm.ac.in/.test(document.location.host)) {
            if ($('table.tableheader:contains("Browse by concepts")').length) {
                $('table.tableheader:contains("Browse by concepts")').replaceWith('<div class="'+c+'"></div>');
                log('created one:', c, $(cq), $(cq).css('width'));
            } else {
                $('table:contains("Feedback")').filter(":contains('Coordinators')").last().parent().append('<div class="'+c+'"></div>');
                log('created one afresh:', c, $(cq), $(cq).css('width'));
            }
            $vp = $(cq);
        }

        $vp.html('');

        return $vp;
    }
 function get_widget_div1() {
        var c = '_vp_widget1',
            cq = '.'+c,
            $vp1;

        $vp1 = $(cq);

//not getting

        if ($vp1.length == 0 && /nptel.iitm.ac.in/.test(document.location.host)) {
            if ($('table.tableheader:contains("Browse by concepts")').length) {
                $('table.tableheader:contains("Browse by concepts")').replaceWith('<div class="'+c+'"></div>');
                log('created one:', c, $(cq), $(cq).css('width'));
            } else {
                $('table:contains("Feedback")').filter(":contains('Coordinators')").last().parent().append('<div class="'+c+'"></div>');
                log('created one afresh:', c, $(cq), $(cq).css('width'));
            }
            $vp1 = $(cq);
        }

        $vp1.html('');

        return $vp1;
    }
function get_widget_div2() {
        var c = '_vp_widget2',
            cq = '.'+c,
            $vp2;

        $vp2 = $(cq);

//not getting

        if ($vp2.length == 0 && /nptel.iitm.ac.in/.test(document.location.host)) {
            if ($('table.tableheader:contains("Browse by concepts")').length) {
                $('table.tableheader:contains("Browse by concepts")').replaceWith('<div class="'+c+'"></div>');
                log('created one:', c, $(cq), $(cq).css('width'));
            } else {
                $('table:contains("Feedback")').filter(":contains('Coordinators')").last().parent().append('<div class="'+c+'"></div>');
                log('created one afresh:', c, $(cq), $(cq).css('width'));
            }
            $vp2 = $(cq);
        }

        $vp2.html('');

        return $vp2;
    }

function get_widget_div4() {
        var c = '_vp_widget4',
            cq = '.'+c,
            $vp4;

        $vp4 = $(cq);

//not getting

        if ($vp4.length == 0 && /nptel.iitm.ac.in/.test(document.location.host)) {
            if ($('table.tableheader:contains("Browse by concepts")').length) {
                $('table.tableheader:contains("Browse by concepts")').replaceWith('<div class="'+c+'"></div>');
                log('created one:', c, $(cq), $(cq).css('width'));
            } else {
                $('table:contains("Feedback")').filter(":contains('Coordinators')").last().parent().append('<div class="'+c+'"></div>');
                log('created one afresh:', c, $(cq), $(cq).css('width'));
            }
            $vp4 = $(cq);
        }

        $vp4.html('');

        return $vp4;
    }

//not getting
    function collapse_titles(data) {
        return $.map(data, function (e, i) {
            var prev = data[i-1];
            if (i>0 && $.trim(e.title) == $.trim(prev.title)) {
               log("data e", e.title);
                if (!prev.top) {
                    prev.childrens = [];
                } else {
                    prev = prev.top;
                }
                prev.childrens.push(e);
                e.top = prev;
	
                return e;
            }
		// log("collapse_titles", e);
            return e;
        });
    }
	
	function create_menu()
	{
		$("<div class='squareSelected'><ul class='list' style='list-style-type:none;'><li class='listSelected'>Annotation<li id='doc'>Document<li>Link<li>Playlist</ul></div>").appendTo("._vp_widget");
		$("div.squareSelected").hide();
		/*var $vp1 = get_widget_div(),
            $vpl1 = $vp.find('.vp_list');
	$vpl1 = app.dom.create_list(120);
       
        $vp1.append($vpl1);*/
        
	}

/////////////////////////////////////////////////////////////////////////////////////////
	var $vp1;
	
    function create_sidebar1(data,str) {
        // data should be clean. Ex: shouldnt break the json structure.
        log("logging data", data);
        console.log("In load App inside create_sidebar");
	console.log("string value:",data);
	$vp1 = get_widget_div1();
         var $vpl = $vp1.find('.vp_list'),
            $footer = $vp1.find('.vp_footer'),
            $header = $vp1.find('.vp_header'),
            owidth,
            w,
            old;

        data = collapse_titles(data);
        log("data", data);

        log('width: ', $vp1.css('width'));
        w = parseInt($vp1.css('width'));

        // header
        $header = app.dom.create_header1(str);
        $vp1.append($header);

        log('creating header: ', $header);

        // index list
        $vpl = app.dom.create_list(w);
        log('creating list: ', w, $vpl);
        $vp1.append($vpl).show();
        log('showing list: ', $vpl);

        // footer
        $footer = app.dom.create_footer();
        log('creating footer: ');
        $vp1.append($footer);

        $.each(make_all_titles1(data), function (i, v) {
            $vpl.append(v);
        });

        $vpl.children('div').addClass('vp_lst_even');
        $vpl.children('div').filter(':visible').filter(':odd').addClass('vp_lst_odd');
        // $vpl.children('div:odd').css({'background-color':'lightgray'}).end()
        //     .children('div').css('padding', '4px').end();
	
        $vp1.show();
	//edited_Devanshu

	//creating menu

	//$("<div class='squareSelected'><ul class='list' style='list-style-type:none;'><li class='listSelected'>Annotation<li id='doc'>Document<li>Link<li>Playlist</ul></div>").appendTo(".menu_place");
	//	$("div.squareSelected").hide();


	//on clicking document menu

		
	/* var $vp1 = get_widget_div(),
            $vpl1 = $vp.find('.vp_list');
	$vpl1 = app.dom.create_list(120);
        log('creating list: ', 120, $vpl1);
        $vp1.append($vpl1).show();
        log('showing list: ', $vpl);*/
        $('#close',$vp1).live('click',function(e){
	$vp1.hide();	
	});
        $('.expand', $vp1).live('click', function (e) {
            var $self = $(this);
            e.preventDefault();
            e.stopPropagation();
            var sublist = $self.closest('div').nextUntil('.top');

            $self.removeClass('expand').addClass('collapse');
            sublist.first().css('border-top', '2px solid gray')
                .end().last().css('border-bottom', '2px solid gray');
            sublist.filter(':odd').addClass('vp_lst_odd').end().show();
		
        });
        $('.collapse', $vp1).live('click', function (e){
            var $self = $(this);
            e.preventDefault();
            e.stopPropagation();
            var sublist = $self.closest('div').nextUntil('.top');

            $self.removeClass('collapse').addClass('expand');
            sublist.filter(':odd').removeClass('vp_lst_odd').end().hide();
        });

        players.data = data;

        // initialize the players
        players.flowplayer.init();
        players.yt.check_n_load();

        g.gevent('widget-load', get_player());
    };

////////////////////////////////////////////////////////////////////////////////////////
	var $vp2;

function create_sidebar2(data,str) {
        // data should be clean. Ex: shouldnt break the json structure.
        log("logging data", data);
        console.log("In load App inside create_sidebar2");
	console.log("string value:",data);
	$vp2 = get_widget_div2();
         var $vpl = $vp2.find('.vp_list'),
            $footer = $vp2.find('.vp_footer'),
            $header = $vp2.find('.vp_header'),
            owidth,
            w,
            old;

        data = collapse_titles(data);
        log("data", data);

        log('width: ', $vp2.css('width'));
        w = parseInt($vp2.css('width'));

        // header
        $header = app.dom.create_header2(str);
        $vp2.append($header);

        log('creating header: ', $header);

        // index list
        $vpl = app.dom.create_list(w);
        log('creating list: ', w, $vpl);
        $vp2.append($vpl).show();
        log('showing list: ', $vpl);

        // footer
        $footer = app.dom.create_footer();
        log('creating footer: ');
        $vp2.append($footer);

        $.each(make_all_titles2(data), function (i, v) {
            $vpl.append(v);
        });

        $vpl.children('div').addClass('vp_lst_even');
        $vpl.children('div').filter(':visible').filter(':odd').addClass('vp_lst_odd');
        // $vpl.children('div:odd').css({'background-color':'lightgray'}).end()
        //     .children('div').css('padding', '4px').end();
	
        $vp2.show();
	//edited_Devanshu

	$('#close',$vp2).live('click',function(e){
	$vp2.hide();	
	});
        $('.expand', $vp2).live('click', function (e) {
            var $self = $(this);
            e.preventDefault();
            e.stopPropagation();
            var sublist = $self.closest('div').nextUntil('.top');

            $self.removeClass('expand').addClass('collapse');
            sublist.first().css('border-top', '2px solid gray')
                .end().last().css('border-bottom', '2px solid gray');
            sublist.filter(':odd').addClass('vp_lst_odd').end().show();
		
        });
        $('.collapse', $vp2).live('click', function (e){
            var $self = $(this);
            e.preventDefault();
            e.stopPropagation();
            var sublist = $self.closest('div').nextUntil('.top');

            $self.removeClass('collapse').addClass('expand');
            sublist.filter(':odd').removeClass('vp_lst_odd').end().hide();
        });

        players.data = data;

        // initialize the players
        players.flowplayer.init();
        players.yt.check_n_load();

        g.gevent('widget-load', get_player());
    };

/////////////////////////////////////////////////////////////////////////////////////////	
	var $vp4;

function create_sidebar4(data,str) {
        // data should be clean. Ex: shouldnt break the json structure.
        log("logging data", data);
        console.log("In load App inside create_sidebar2");
	console.log("string value:",data);
	$vp4 = get_widget_div4();
         var $vpl = $vp4.find('.vp_list'),
            $footer = $vp4.find('.vp_footer'),
            $header = $vp4.find('.vp_header'),
            owidth,
            w,
            old;

        data = collapse_titles(data);
        log("data", data);

        log('width: ', $vp4.css('width'));
        w = parseInt($vp4.css('width'));

        // header
        $header = app.dom.create_header4(str);
        $vp4.append($header);

        log('creating header: ', $header);

        // index list
        $vpl = app.dom.create_list(w);
        log('creating list: ', w, $vpl);
        $vp4.append($vpl).show();
        log('showing list: ', $vpl);

        // footer
        $footer = app.dom.create_footer();
        log('creating footer: ');
        $vp4.append($footer);

        $.each(make_all_titles4(data), function (i, v) {
            $vpl.append(v);
        });

        $vpl.children('div').addClass('vp_lst_even');
        $vpl.children('div').filter(':visible').filter(':odd').addClass('vp_lst_odd');
        // $vpl.children('div:odd').css({'background-color':'lightgray'}).end()
        //     .children('div').css('padding', '4px').end();
	
        $vp4.show();
	//edited_Devanshu

	$('#close',$vp4).live('click',function(e){
	$vp4.hide();	
	});
        $('.expand', $vp4).live('click', function (e) {
            var $self = $(this);
            e.preventDefault();
            e.stopPropagation();
            var sublist = $self.closest('div').nextUntil('.top');

            $self.removeClass('expand').addClass('collapse');
            sublist.first().css('border-top', '2px solid gray')
                .end().last().css('border-bottom', '2px solid gray');
            sublist.filter(':odd').addClass('vp_lst_odd').end().show();
		
        });
        $('.collapse', $vp4).live('click', function (e){
            var $self = $(this);
            e.preventDefault();
            e.stopPropagation();
            var sublist = $self.closest('div').nextUntil('.top');

            $self.removeClass('collapse').addClass('expand');
            sublist.filter(':odd').removeClass('vp_lst_odd').end().hide();
        });

        players.data = data;

        // initialize the players
        players.flowplayer.init();
        players.yt.check_n_load();

        g.gevent('widget-load', get_player());
    };

///////////////////////////////////////////////////////////////////////////////////////////////////////
	var vp;
    function create_sidebar(data,str) {
        // data should be clean. Ex: shouldnt break the json structure.
        log("logging data", data);
        console.log("In load App inside create_sidebar");
	console.log("string value:",data);
	$vp = get_widget_div();
         var $vpl = $vp.find('.vp_list'),
            $footer = $vp.find('.vp_footer'),
            $header = $vp.find('.vp_header'),
            owidth,
            w,
            old;

        data = collapse_titles(data);
        log("data", data);

        log('width: ', $vp.css('width'));
        w = parseInt($vp.css('width'));

        // header
        $header = app.dom.create_header(str);
        $vp.append($header);

        log('creating header: ', $header);

        // index list
        $vpl = app.dom.create_list(w);
        log('creating list: ', w, $vpl);
        $vp.append($vpl).show();
        log('showing list: ', $vpl);

        // footer
        $footer = app.dom.create_footer();
        log('creating footer: ');
        $vp.append($footer);

        $.each(make_all_titles(data), function (i, v) {
            $vpl.append(v);
        });

        $vpl.children('div').addClass('vp_lst_even');
        $vpl.children('div').filter(':visible').filter(':odd').addClass('vp_lst_odd');
        // $vpl.children('div:odd').css({'background-color':'lightgray'}).end()
        //     .children('div').css('padding', '4px').end();
	
        $vp.show();
	//edited_Devanshu

	
        $('#close',$vp).live('click',function(e){
	$vp.hide();	
	});
        $('.expand', $vp).live('click', function (e) {
            var $self = $(this);
            e.preventDefault();
            e.stopPropagation();
            var sublist = $self.closest('div').nextUntil('.top');

            $self.removeClass('expand').addClass('collapse');
            sublist.first().css('border-top', '2px solid gray')
                .end().last().css('border-bottom', '2px solid gray');
            sublist.filter(':odd').addClass('vp_lst_odd').end().show();
		
        });
        $('.collapse', $vp).live('click', function (e){
            var $self = $(this);
            e.preventDefault();
            e.stopPropagation();
            var sublist = $self.closest('div').nextUntil('.top');
		
            $self.removeClass('collapse').addClass('expand');
            sublist.filter(':odd').removeClass('vp_lst_odd').end().hide();
        });
	//var $l=$(".vp_list").children().length();
	
	
		
		
	

      /*  players.data = data;

        // initialize the players
        players.flowplayer.init();
        players.yt.check_n_load();

        g.gevent('widget-load', get_player());*/
    };


    window.onYouTubePlayerReady = function (playerId) {
        log('youtube ready');
        g.gevent('player-load', 'yt');
        players.yt.onready();
    };

    vp.create_sidebar = create_sidebar;
     vp1.create_sidebar1 = create_sidebar1;
    vp2.create_sidebar2 = create_sidebar2;
    vp4.create_sidebar4 = create_sidebar4;
    function get_nptel_vid() {
        var $vp = get_widget_div(),
            vid = $vp.attr('data-vid');

        if (vid) {
            return vid;
        }

        // try the uri, for the vid
        var vsearch = window.location.search.substr(1).split('&')[1];
        if (vsearch) {
            return vsearch.split('=')[1];
        }

        // try the first a in lectures.
        vid = $('#videolinks').find('a').first().attr('id');
        if (vid) {
            return vid;
        }

        return false;
    }
    vp.get_nptel_vid = get_nptel_vid;

    function get_nptel_lecture_string() {
        var href = $('span#player').attr('href'),
            objs,
            l,
            i;

        function get_c_n_f_from_path(path) { //course and file
            var l;
            if (!path) {
                return false;
            }

            l = path.split('/');

            if (l.length < 3) {
                return false;
            }

            return [l[l.length-2], l[l.length-1].split('.')[0]];
        }

        objs = ['span#player', 'a[href$=".mp4"]', 'a[href$=".3gp"]'];
        for (i in objs) {
            l = get_c_n_f_from_path($(objs[i]).attr('href'));
            if ($.isArray(l)) {
                break;
            }
        }

        if (document.location.host == 'www.videopulp.in' || document.location.host == 'localhost:4000')  {
            l = ['1074', 'lec01'];
        }

        if (document.location.host == 'localhost') {
            l = ['webex', 'demo'];
        }

        if ($.isArray(l)) {
            return l.join('-');
        }

        return false;
    }
    vp.get_nptel_lecture_string = get_nptel_lecture_string;

    function mixpannel_init () {
        g._gaq = g._gaq || [];
        g._gaq.push(
            ['vp._setAccount', 'UA-20154189-2'],
            ['vp._trackPageview']
        );
        g._gaq.push();

        if (!local) {
            // $.getScript('http://www.google-analytics.com/ga.js');
            // $.getScript('http://api.mixpanel.com/site_media/js/api/mixpanel.js');
        }

    }

    vp.load_app = function (str) {
            console.log("In load App");
		
		 $.getJSON('http://evideo.iitj.ac.in:8080/json-create-Annotation.php?media_id='+videoid+'&jsoncallback=?', function(r) {
 		console.log("Inside getJSON");
                      console.log(JSON.stringify(r));
                      create_sidebar(r,str);
			
 
		});
	
    };
vp1.load_app1 = function (str) {
     /*   var key = get_nptel_vid(), ks;
        if (key) {
            ks = 'vid=' + key;
        } else {
            ks = 'vkey='+get_nptel_lecture_string();
        }*/
        console.log("In load App");
		/*$.getJSON('vp_nptel-data.js', function (r) {
					  console.log("Inside getJSON");
                      console.log(JSON.stringify(r));
                      create_sidebar(r,str);
                  });*/
		 $.getJSON('http://evideo.iitj.ac.in:8080/json-create.php?media_id='+videoid+'&jsoncallback=?', function(r) {
 		console.log("Inside getJSON");
                      console.log(JSON.stringify(r));
                      //create_sidebar(r,str);
			create_sidebar1(r,str);
   		//console.log(JSON.stringify(data));
 
		});
	/*var annotationDataURL = 'js/engage_plugins/demodata/vp_nptel-data.json';	
	$.ajax(
        {
            url: annotationDataURL ,
            dataType: 'json',
            
            success: function (r)
            {
                 console.log("Inside getJSON");
		 console.log(JSON.stringify(r));
                      create_sidebar(r,str);
            },
            // If no data comes back
            error: function (xhr, ajaxOptions, thrownError)
            {
                console.log("error");
            }
		
	});*/
    };
vp2.load_app2 = function (str) {
     /*   var key = get_nptel_vid(), ks;
        if (key) {
            ks = 'vid=' + key;
        } else {
            ks = 'vkey='+get_nptel_lecture_string();
        }*/
        console.log("In load App");
		/*$.getJSON('vp_nptel-data.js', function (r) {
					  console.log("Inside getJSON");
                      console.log(JSON.stringify(r));
                      create_sidebar(r,str);
                  });*/
		 $.getJSON('http://evideo.iitj.ac.in:8080/json-get-bookmark.php?user='+user+'&jsoncallback=?', function(r) {
 		console.log("Inside getJSON");
                      console.log(JSON.stringify(r));
                      //create_sidebar(r,str);
			create_sidebar2(r,str);
   		//console.log(JSON.stringify(data));
 
		});
	/*var annotationDataURL = 'js/engage_plugins/demodata/vp_nptel-data.json';	
	$.ajax(
        {
            url: annotationDataURL ,
            dataType: 'json',
            
            success: function (r)
            {
                 console.log("Inside getJSON");
		 console.log(JSON.stringify(r));
                      create_sidebar(r,str);
            },
            // If no data comes back
            error: function (xhr, ajaxOptions, thrownError)
            {
                console.log("error");
            }
		
	});*/
    };

vp4.load_app4 = function (str) {
     /*   var key = get_nptel_vid(), ks;
        if (key) {
            ks = 'vid=' + key;
        } else {
            ks = 'vkey='+get_nptel_lecture_string();
        }*/
        console.log("In load App");
		/*$.getJSON('vp_nptel-data.js', function (r) {
					  console.log("Inside getJSON");
                      console.log(JSON.stringify(r));
                      create_sidebar(r,str);
                  });*/
		 $.getJSON('http://evideo.iitj.ac.in:8080/json-get-playlist.php?user='+user+'&jsoncallback=?', function(r) {
 		console.log("Inside getJSON");
                      console.log(JSON.stringify(r));
                      //create_sidebar(r,str);
			create_sidebar4(r,str);
   		//console.log(JSON.stringify(data));
 
		});
	/*var annotationDataURL = 'js/engage_plugins/demodata/vp_nptel-data.json';	
	$.ajax(
        {
            url: annotationDataURL ,
            dataType: 'json',
            
            success: function (r)
            {
                 console.log("Inside getJSON");
		 console.log(JSON.stringify(r));
                      create_sidebar(r,str);
            },
            // If no data comes back
            error: function (xhr, ajaxOptions, thrownError)
            {
                console.log("error");
            }
		
	});*/
    };

    // actual call to api
    $(document).ready(function () {
	deleteAll();
       vp4.load_app4("Playlist");	
	//vp.load_app("Annotations");	
	//console.log("annotation loaded");
	$("#tb1").click(function(){
		  vp.load_app("Annotations");
			console.log("it is hide");
		//$vp.show();	
	
	});
	$("#addedAnnotate").click(function(){
		 
		  console.log("it is hide");
		  vp.load_app("Annotations");
	
	});
	$("#tb3").click(function(){
		
		vp1.load_app1("Links");	
		
		console.log("link tab clicked");
	
	});
	$("#tb4").click(function(){
		
		vp2.load_app2("Bookmarks");	
		
		console.log("Bookmark tab clicked");
	
	});

	$("#tb5").click(function(){
		
		vp4.load_app4("Playlist");	
		
		console.log("Playlist tab clicked");
	
	});

	$("#addedLink").click(function(){
		 
		  console.log("it is hide");
		  vp1.load_app1("Links");
	
	});
	$("#deletedLink").click(function(){
		 
		  console.log("it is hide");
		  vp1.load_app1("Links");
	
	});
	$("#deletedAnnotation").click(function(){
		 
		  console.log("it is hide");
		 vp.load_app("Annotations");
	
	});
	$("#editedAnnotation").click(function(){
		 
		  console.log("it is hide");
		 vp.load_app("Annotations");
	
	});
	$("#updatedLink").click(function(){
		 
		  console.log("it is hide");
		  vp1.load_app1("Links");
	
	});
	$("#addBookmark").click(function(){
		 
		  console.log("it is hide");
		  vp2.load_app2("Bookmarks");
	
	});
	$("#updatedBookmark").click(function(){
		 
		  console.log("it is hide");
		  vp2.load_app2("Bookmarks");
	
	});
	$("#deletedBookmark").click(function(){
		 
		  console.log("it is hide");
		  vp2.load_app2("Bookmarks");
	
	});

	$("#deletedPlaylist").click(function(){
		 
		  console.log("it is hide");
		  vp4.load_app4("Playlists");
	
	});	

	$("#logout").click(function(){
	console.log("writing cookie");
	writeCookie('sessionId', "", 3);
	user=readCookie('sessionId');
	console.log(user);  

		
	});
    });

    g._vpulp = vp;
    vp.players = players;

})(jQuery);



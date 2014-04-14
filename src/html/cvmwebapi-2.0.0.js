window.CVM={version:"2.0.0"};(function(b){var h=null,a=false,j=[];b.debugLogging=true;b.version="1.0";b.markPageLoaded=function(){a=true};b.launchRDP=function(q,n){var p=800,k=600,o=24;if(n!=undefined){var m=n.split("x");p=parseInt(m[0]);k=parseInt(m[1]);if(m.length>2){o=parseInt(m[2])}}var l=window.open("http://cernvm.cern.ch/releases/webapi/webrdp/webclient.html#"+q+","+p+","+k,"WebRDPClient","width="+p+",height="+k);l.moveTo((screen.width-p)/2,(screen.height-k)/2);setTimeout(function(){l.focus()},100);l.focus()};b.startCVMWebAPI=function(n,m,k){var l=function(){var o=new b.WebAPIPlugin();var p=true;o.connect(function(t){if(!p){return}if(t){n(o)}else{var u=document.createElement("iframe");u.src="//cernvm-online.cern.ch";u.width="100%";u.height=400;u.frameBorder=0;c.createFramedWindow(u);var q=0,s,r=function(){if(q!=0){clearTimeout(q)}q=setTimeout(s,5000)};s=function(){o.connect(function(v){alert("Bah:"+v);if(v){clearTimeout(q);n(o)}else{r()}})};p=true;r()}})};if(!a){j.push(l)}else{l()}};b.EventDispatcher=function(k){this.events={}};b.EventDispatcher.prototype.__fire=function(l,k){if(b.debugLogging){console.log("Firing",l,"(",k,")")}if(this.events[l]==undefined){return}var n=this.events[l];for(var m=0;m<n.length;m++){n[m].apply(this,k)}};b.EventDispatcher.prototype.addEventListener=function(k,l){if(this.events[k]==undefined){this.events[k]=[]}this.events[k].push(l)};b.EventDispatcher.prototype.removeEventListener=function(k,m){if(this.events[k]==undefined){return}var l=this.events[k].indexOf(m);if(l<0){return}this.events.splice(l,1)};b.ProgressFeedback=function(){};var f="ws://127.0.0.1:1793",e="cernvm-webapi:";b.Socket=function(){b.EventDispatcher.call(this);this.interaction=new c(this);this.connecting=false;this.connected=false;this.socket=null;this.lastID=0;this.responseCallbacks={};this.authToken="";if(window.location.hash){this.authToken=window.location.hash.substr(1)}};b.Socket.prototype=Object.create(b.EventDispatcher.prototype);b.Socket.prototype.__handleClose=function(){this.__fire("disconnected");c.hideInteraction()};b.Socket.prototype.__handleOpen=function(k){this.__fire("connected",k.version)};b.Socket.prototype.__handleData=function(l){var m=JSON.parse(l);if(m.id){var k=this.responseCallbacks[m.id];if(k!=undefined){k(m)}}else{if(m.type=="event"){var l=m.data;if(m.name=="interact"){this.interaction.handleInteractionEvent(m.data)}else{this.__fire(m.name,m.data)}}}};b.Socket.prototype.send=function(m,n,p,o){var r=this;var s="a-"+(++this.lastID);var k={type:"action",name:m,id:s,data:n||{}};if(p){var q=null,l=function(t){if(!t){return""}return"on"+t[0].toUpperCase()+t.substr(1)};if(o!==0){q=setTimeout(function(){delete r.responseCallbacks[s];if(p.onError){p.onError("Response timeout")}},o||10000)}this.responseCallbacks[s]=function(u){if(q!=null){clearTimeout(q)}if((u.name=="succeed")||(u.name=="failed")){delete r.responseCallbacks[s]}var t=l(u.name);if(p[t]){p[t].apply(r,u.data||[])}}}this.socket.send(JSON.stringify(k))};b.Socket.prototype.close=function(){if(!this.connected){return}this.socket.close();this.connected=false;this.__handleClose()};b.Socket.prototype.connect=function(n){var m=this;if(this.connected){return}if(this.connecting){return}this.connecting=true;var q=function(r){try{var u=setTimeout(function(){r(false)},100);var s=new WebSocket(f);s.onerror=function(v){clearTimeout(u);if(!m.connecting){return}r(false)};s.onopen=function(v){clearTimeout(u);if(!m.connecting){return}r(true,s)}}catch(t){console.warn("[socket] Error setting up socket! ",t);r(false)}};var l=function(r,w,s,v){var x=new Date().getTime();if(!v){v=x}if(!s){s=50}var u=w-(x-v);var t=setTimeout(function(){r(false)},u);var y=function(A,z){if(A){clearTimeout(t);r(true,z)}else{if(u<s){return}clearTimeout(t);setTimeout(function(){l(r,w,s,v)},s)}};q(y)};var k=function(r){m.connecting=false;m.connected=true;m.socket=r;m.socket.onclose=function(){console.warn("Remotely disconnected from CernVM WebAPI");m.__handleClose()};m.socket.onmessage=function(s){m.__handleData(s.data)};m.send("handshake",{version:b.version,auth:m.authToken},function(u,t,s){console.info("Successfuly contacted with CernVM WebAPI v"+u.version);m.__handleOpen(u)});if(n){n(true)}};var p=function(r){console.error("Unable to contact CernVM WebAPI");if(!m.connecting){return}m.connecting=false;m.connected=false;if(n){n(false)}};var o=function(s,r){if(!s){p()}else{k(r)}};q(function(s,r){if(s){k(r)}else{var t=document.createElement("iframe");t.src=e+"launch";t.style.display="none";document.body.appendChild(t);l(o,5000)}})};var d=1,i=2,g=256;var c=b.UserInteraction=function(k){this.socket=k};c.hideInteraction=function(){if(c.activeScreen){document.body.removeChild(c.activeScreen);c.activeScreen=null}};c.createButton=function(n,o){var l=document.createElement("button");l.innerHTML=n;l.style.display="inline-block";l.style.marginBottom="0";l.style.textAlign="center";l.style.verticalAlign="middle";l.style.borderStyle="solid";l.style.borderWidth="1px";l.style.borderRadius=l.style.webkitBorderRadius=l.style.mozBorderRadius="4px";l.style.userSelect=l.style.webkitUserSelect=l.style.mozUserSelect=l.style.msUserSelect="none";l.style.margin="5px";l.style.padding="6px 12px";l.style.cursor="pointer";var k=function(p,t){var q=parseInt(p.slice(1),16),v=Math.round(2.55*t),s=(q>>16)+v,r=(q>>8&255)+v,u=(q&255)+v;return"#"+(16777216+(s<255?s<1?0:s:255)*65536+(r<255?r<1?0:r:255)*256+(u<255?u<1?0:u:255)).toString(16).slice(1)},m=function(u){var q=parseInt(u.slice(1),16),t=(q>>16),s=(q>>8&255),p=(q&255),v=(t*299+s*587+p*114)/1000;return(v>=128)?"black":"white"};l.style.backgroundColor=o;l.style.borderColor=k(o,-20);l.onmouseover=function(){l.style.backgroundColor=k(o,-10)};l.onmouseout=function(){l.style.backgroundColor=o};l.style.color=m(o);return l};c.createFramedWindow=function(n,m,t,o){var r=document.createElement("div"),q=document.createElement("div"),k=document.createElement("div"),p=document.createElement("div"),l=document.createElement("div");r.style.position="absolute";r.style.left="0";r.style.top="0";r.style.right="0";r.style.bottom="0";r.style.zIndex=60000;r.style.backgroundColor="rgba(255,255,255,0.8)";r.appendChild(q);q.style.marginLeft="auto";q.style.marginRight="auto";q.style.marginBottom=0;q.style.marginTop=0;q.style.backgroundColor="#FCFCFC";q.style.border="solid 1px #E6E6E6";q.style.borderRadius=q.style.webkitBorderRadius=q.style.mozBorderRadius="5px";q.style.boxShadow=q.style.webkitBoxShadow=q.style.mozBoxShadow="1px 2px 4px 1px rgba(0,0,0,0.2)";q.style.padding="10px";q.style.fontFamily="Verdana, Geneva, sans-serif";q.style.fontSize="14px";q.style.color="#666;";q.style.width="70%";k.style.color="#333";k.style.marginBottom="8px";p.style.textAlign="center";p.style.color="#333";p.style.marginTop="8px";q.appendChild(k);if(m){if(typeof(m)=="string"){k.innerHTML=m;k.style.fontSize="1.6em";k.style.marginBottom="8px"}else{k.appendChild(m)}}if(n){l.appendChild(n)}q.appendChild(l);q.appendChild(p);if(t){if(typeof(t)=="string"){p.innerHTML=t}else{p.appendChild(t)}}var s=function(){var u=(window.innerHeight-q.clientHeight)/2;if(u<0){u=0}q.style.marginTop=u+"px"};r.onclick=function(){if(o){o()}else{c.hideInteraction()}};q.onclick=function(u){u.stopPropagation()};c.hideInteraction();c.activeScreen=r;document.body.appendChild(r);s();return r};c.displayLicenseWindow=function(s,p,n,r,m){var o=document.createElement("div"),t=document.createElement("span"),l;t.innerHTML="&nbsp;";if(n){l=document.createElement("iframe"),l.src=p;l.width="100%";l.height=450;l.frameBorder=0}else{l=document.createElement("div");l.width="100%";l.style.height="450px";l.style.display="block";l.innerHTML=p}var k=c.createButton("Accept License","#E1E1E1");lnkCancel=c.createButton("Decline License","#FAFAFA");o.style.padding="6px";o.appendChild(k);o.appendChild(t);o.appendChild(lnkCancel);var q;q=c.createFramedWindow(l,s,o,function(){document.body.removeChild(q);if(m){m()}});k.onclick=function(){document.body.removeChild(q);if(r){r()}};lnkCancel.onclick=function(){document.body.removeChild(q);if(m){m()}}};c.confirm=function(p,k,r){var o=document.createElement("div"),q=document.createElement("div");o.innerHTML=k;o.style.width="100%";var n,m=c.createButton("Ok","#E1E1E1"),l=c.createButton("Cancel","#FAFAFA");m.onclick=function(){document.body.removeChild(n);r(true)};l.onclick=function(){document.body.removeChild(n);r(false)};q.appendChild(m);q.appendChild(l);n=c.createFramedWindow(o,p,q,function(){document.body.removeChild(n);r(false)})};c.alert=function(o,k,q){var n=document.createElement("div"),p=document.createElement("div");n.innerHTML=k;n.style.width="100%";var m,l=c.createButton("Ok","#FAFAFA");l.onclick=function(){document.body.removeChild(m)};p.appendChild(l);m=c.createFramedWindow(n,o,p)};c.confirmLicense=function(l,k,m){c.displayLicenseWindow(l,k,false,function(){m(true)},function(){m(false)})};c.confirmLicenseURL=function(l,k,m){c.displayLicenseWindow(l,k,true,function(){m(true)},function(){m(false)})};c.prototype.handleInteractionEvent=function(l){var k=this.socket;if(l[0]=="confirm"){c.confirm(l[1],l[2],function(m,n){if(m){k.send("interactionCallback",{result:d|(n?g:0)})}else{k.send("interactionCallback",{result:i|(n?g:0)})}})}else{if(l[0]=="alert"){c.alert(l[1],l[2],function(m){})}else{if(l[0]=="confirmLicense"){c.confirmLicense(l[1],l[2],function(m,n){if(m){k.send("interactionCallback",{result:d|(n?g:0)})}else{k.send("interactionCallback",{result:i|(n?g:0)})}})}else{if(l[0]=="confirmLicenseURL"){c.confirmLicenseURL(l[1],l[2],function(m,n){if(m){k.send("interactionCallback",{result:d|(n?g:0)})}else{k.send("interactionCallback",{result:i|(n?g:0)})}})}}}}};b.WebAPIPlugin=function(){b.Socket.call(this)};b.WebAPIPlugin.prototype=Object.create(b.Socket.prototype);b.WebAPIPlugin.prototype.stopService=function(){this.send("stopService")};b.WebAPIPlugin.prototype.requestSession=function(n,m,l){var k=this;this.send("requestSession",{vmcp:n},{onSucceed:function(q,o){var p=new b.WebAPISession(k,o);k.responseCallbacks[o]=function(r){p.handleEvent(r)};if(m){m(p)}},onFailed:function(p,o){console.error("Failed to request session! "+p);if(l){l(p,o)}},onProgress:function(p,o){k.__fire("progress",[p,o])},onStarted:function(o){k.__fire("started",[o])},onCompleted:function(o){k.__fire("completed",[o])}})};b.WebAPISession=function(k,m){b.EventDispatcher.call(this);this.socket=k;this.session_id=m;var l=undefined;Object.defineProperties(this,{state:{get:function(){return l}},stateName:{get:function(){return l}},ip:{get:function(){return l}},ram:{get:function(){return l}}})};b.WebAPISession.prototype=Object.create(b.EventDispatcher.prototype);b.WebAPISession.prototype.handleEvent=function(k){this.__fire(k.name,k.data)};b.WebAPISession.prototype.start=function(k){this.socket.send("start",{session_id:this.session_id,parameters:k||{}})};b.WebAPISession.prototype.stop=function(){this.socket.send("stop",{session_id:this.session_id})};b.WebAPISession.prototype.pause=function(){this.socket.send("pause",{session_id:this.session_id})};b.WebAPISession.prototype.resume=function(){this.socket.send("resume",{session_id:this.session_id})};b.WebAPISession.prototype.reset=function(){this.socket.send("reset",{session_id:this.session_id})};b.WebAPISession.prototype.hibernate=function(){this.socket.send("hibernate",{session_id:this.session_id})};b.WebAPISession.prototype.close=function(){this.socket.send("close",{session_id:this.session_id})};b.WebAPISession.prototype.get=function(l,k){this.socket.send("get",{session_id:this.session_id,key:l},{onSucceed:function(m){k(m)}})};b.WebAPISession.prototype.openRDPWindow=function(l,k){this.get("rdpURL",function(n){var m=n.split("@");b.launchRDP(m[0],m[1])})};if(window.jQuery==undefined){if(a){return}window.addEventListener("load",function(l){a=true;for(var k=0;k<j.length;k++){j[k]()}})}else{jQuery(function(){if(a){return}a=true;for(var k=0;k<j.length;k++){j[k]()}})}})(window.CVM);
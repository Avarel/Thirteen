(()=>{"use strict";var e={800:(e,t,n)=>{n.d(t,{Z:()=>u});var r=n(81),i=n.n(r),s=n(645),o=n.n(s),a=n(667),l=n.n(a),c=new n.U(n(217)),h=o()(i()),d=l()(c);h.push([e.id,".shadow{box-shadow:0 4px 8px 0 rgba(0,0,0,.2),0 6px 20px 0 rgba(0,0,0,.19)}.button{padding:10px;background:#fff;border-radius:5px;font-size:15px;cursor:pointer;user-select:none;transition:all ease-in-out .2s}.button:hover{transform:scale(1.05, 1.05)}.button:active{transform:none;background:#cacaca}.button.disabled{background:#636363}.container{width:100%;max-width:800px;margin:0 auto}body{height:100vh;width:100vw;margin:0}.hero{height:100%;width:100%;display:flex;flex-direction:column;font-family:Lato,sans-serif;background:url("+d+"),linear-gradient(to bottom, #3d4046, #1c1e22)}.hero header{height:80px;width:100vw;background:rgba(0,0,0,.5)}.hero header .container{display:flex;align-items:center;justify-content:center}.hero header .container h1{color:#fff;text-align:center;margin:20px}.hero header .container section.buttons{flex:1;display:flex;justify-content:flex-end}.hero header .container section.buttons .button{margin-right:20px}.hero section.content{flex:1;display:flex;justify-items:center;align-items:center}.hero section.content .container{display:flex;height:100%;flex-direction:column;justify-content:center}.hero section.content .box{width:100%;max-width:800px;height:100%;max-height:600px;display:flex;flex-direction:column;background:rgba(0,0,0,.2);border-radius:5px;color:#fff;overflow:hidden}.hero section.content .box .game{width:100%;height:100%;max-height:600px;background:rgba(0,0,0,.2);overflow:hidden}.hero section.content .box .game .login-box{width:90vw;max-width:300px;margin:20px auto 0px;padding:20px;background:rgba(0,0,0,.5);border-radius:5px;color:#000}.hero section.content .box .game .login-box .login-selection{display:flex;align-items:center;justify-content:center;margin-bottom:10px}.hero section.content .box .game .login-box .login-selection input#username-select{border-radius:5px;padding:10px;font-size:15px;border:none;flex:1;margin-right:10px;transition:all ease-in-out .2s}.hero section.content .box .game .login-box .login-selection input#username-select:hover{transform:scale(1.05, 1.05)}.hero section.content .box .game .login-box .login-selection input#username-select:disabled{background:gray;color:#585858}.hero section.content .box .game .login-box .login-selection select#game-size-select{justify-content:flex-end;height:38px;background:#fff;font-size:15px;border:none;border-radius:5px;transition:all ease-in-out .2s}.hero section.content .box .game .login-box .login-selection select#game-size-select:hover{transform:scale(1.05, 1.05)}.hero section.content .box .game .login-box .login-selection select#game-size-select:disabled{background:gray;color:#585858}.hero section.content .box .game .login-box .button{flex:0 1}.hero section.content .box .status{display:flex;align-items:center;width:100%;height:38px;background:rgba(0,0,0,.5)}.hero section.content .box .status .text{flex:1;margin-left:10px;text-align:center}.hero section.content .box .status .button{border-radius:0;background:#1e1e1e}.hero section.content .box .status .button:active{transform:none}.hero section.content .box .status .button#play{background:#006400}.hero section.content .box .status .button#play:hover{transform:none;background:#009600}.hero section.content .box .status .button#pass{background:#640000}.hero section.content .box .status .button#pass:hover{transform:none;background:#960000}",""]);const u=h},645:e=>{e.exports=function(e){var t=[];return t.toString=function(){return this.map((function(t){var n="",r=void 0!==t[5];return t[4]&&(n+="@supports (".concat(t[4],") {")),t[2]&&(n+="@media ".concat(t[2]," {")),r&&(n+="@layer".concat(t[5].length>0?" ".concat(t[5]):""," {")),n+=e(t),r&&(n+="}"),t[2]&&(n+="}"),t[4]&&(n+="}"),n})).join("")},t.i=function(e,n,r,i,s){"string"==typeof e&&(e=[[null,e,void 0]]);var o={};if(r)for(var a=0;a<this.length;a++){var l=this[a][0];null!=l&&(o[l]=!0)}for(var c=0;c<e.length;c++){var h=[].concat(e[c]);r&&o[h[0]]||(void 0!==s&&(void 0===h[5]||(h[1]="@layer".concat(h[5].length>0?" ".concat(h[5]):""," {").concat(h[1],"}")),h[5]=s),n&&(h[2]?(h[1]="@media ".concat(h[2]," {").concat(h[1],"}"),h[2]=n):h[2]=n),i&&(h[4]?(h[1]="@supports (".concat(h[4],") {").concat(h[1],"}"),h[4]=i):h[4]="".concat(i)),t.push(h))}},t}},667:e=>{e.exports=function(e,t){return t||(t={}),e?(e=String(e.__esModule?e.default:e),/^['"].*['"]$/.test(e)&&(e=e.slice(1,-1)),t.hash&&(e+=t.hash),/["'() \t\n]|(%20)/.test(e)||t.needQuotes?'"'.concat(e.replace(/"/g,'\\"').replace(/\n/g,"\\n"),'"'):e):e}},81:e=>{e.exports=function(e){return e[1]}},994:e=>{var t=[];function n(e){for(var n=-1,r=0;r<t.length;r++)if(t[r].identifier===e){n=r;break}return n}function r(e,r){for(var s={},o=[],a=0;a<e.length;a++){var l=e[a],c=r.base?l[0]+r.base:l[0],h=s[c]||0,d="".concat(c," ").concat(h);s[c]=h+1;var u=n(d),p={css:l[1],media:l[2],sourceMap:l[3],supports:l[4],layer:l[5]};if(-1!==u)t[u].references++,t[u].updater(p);else{var g=i(p,r);r.byIndex=a,t.splice(a,0,{identifier:d,updater:g,references:1})}o.push(d)}return o}function i(e,t){var n=t.domAPI(t);return n.update(e),function(t){if(t){if(t.css===e.css&&t.media===e.media&&t.sourceMap===e.sourceMap&&t.supports===e.supports&&t.layer===e.layer)return;n.update(e=t)}else n.remove()}}e.exports=function(e,i){var s=r(e=e||[],i=i||{});return function(e){e=e||[];for(var o=0;o<s.length;o++){var a=n(s[o]);t[a].references--}for(var l=r(e,i),c=0;c<s.length;c++){var h=n(s[c]);0===t[h].references&&(t[h].updater(),t.splice(h,1))}s=l}}},569:e=>{var t={};e.exports=function(e,n){var r=function(e){if(void 0===t[e]){var n=document.querySelector(e);if(window.HTMLIFrameElement&&n instanceof window.HTMLIFrameElement)try{n=n.contentDocument.head}catch(e){n=null}t[e]=n}return t[e]}(e);if(!r)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");r.appendChild(n)}},216:e=>{e.exports=function(e){var t=document.createElement("style");return e.setAttributes(t,e.attributes),e.insert(t,e.options),t}},565:(e,t,n)=>{e.exports=function(e){var t=n.nc;t&&e.setAttribute("nonce",t)}},795:e=>{e.exports=function(e){var t=e.insertStyleElement(e);return{update:function(n){!function(e,t,n){var r="";n.supports&&(r+="@supports (".concat(n.supports,") {")),n.media&&(r+="@media ".concat(n.media," {"));var i=void 0!==n.layer;i&&(r+="@layer".concat(n.layer.length>0?" ".concat(n.layer):""," {")),r+=n.css,i&&(r+="}"),n.media&&(r+="}"),n.supports&&(r+="}");var s=n.sourceMap;s&&"undefined"!=typeof btoa&&(r+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(s))))," */")),t.styleTagTransform(r,e,t.options)}(t,e,n)},remove:function(){!function(e){if(null===e.parentNode)return!1;e.parentNode.removeChild(e)}(t)}}}},589:e=>{e.exports=function(e,t){if(t.styleSheet)t.styleSheet.cssText=e;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(e))}}},217:(e,t,n)=>{e.exports=n.p+"./assets/bg-tile.png"}},t={};function n(r){var i=t[r];if(void 0!==i)return i.exports;var s=t[r]={id:r,exports:{}};return e[r](s,s.exports,n),s.exports}n.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return n.d(t,{a:t}),t},n.d=(e,t)=>{for(var r in t)n.o(t,r)&&!n.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),n.U=function(e){var t=new URL(e,"x:/"),n={};for(var r in t)n[r]=t[r];for(var r in n.href=e,n.pathname=e.replace(/[?#].*/,""),n.origin=n.protocol="",n.toString=n.toJSON=()=>e,n)Object.defineProperty(this,r,{enumerable:!0,configurable:!0,value:n[r]})},n.U.prototype=URL.prototype,n.p="",(()=>{var e,t,r,i=n(994),s=n.n(i),o=n(795),a=n.n(o),l=n(569),c=n.n(l),h=n(565),d=n.n(h),u=n(216),p=n.n(u),g=n(589),f=n.n(g),y=n(800),m={};m.styleTagTransform=f(),m.setAttributes=d(),m.insert=c().bind(null,"head"),m.domAPI=a(),m.insertStyleElement=p(),s()(y.Z,m),y.Z&&y.Z.locals&&y.Z.locals,function(e){e.opt={cardSize:{width:80,height:120,padding:20},animationSpeed:150,table:document.querySelector("body"),cardBack:"red",cardUrl:"./assets/img/cards.png"};let t,n=new Map;e.init=function(t){if(t)for(let n in t)e.opt.hasOwnProperty(n)&&t[n]&&(e.opt[n]=t[n]);e.opt.table.style.position="relative"},e.newDeck=function(){let e=[];for(let t=0;t<52;t++)e.push(new r(t));return e},function(e){e[e.Spades=0]="Spades",e[e.Clubs=1]="Clubs",e[e.Diamonds=2]="Diamonds",e[e.Hearts=3]="Hearts"}(t=e.Suit||(e.Suit={}));class r{constructor(t){this.id=t,this.faceUp=!1,this.hidden=!1,this.element=document.createElement("div"),this.element.className="card",this.element.style.width=`${e.opt.cardSize.width}px`,this.element.style.height=`${e.opt.cardSize.height}px`,this.element.style.backgroundImage=`url(${e.opt.cardUrl})`,this.element.style.position="absolute",this.element.style.cursor="pointer",this.element.onclick=function(e){let t=n.get(this);if(t.container){let e=t.container.clickHandler;e&&e.func.call(e.context||window,t)}},n.set(this.element,this),e.opt.table.appendChild(this.element),this.face(!1)}delete(){n.delete(this.element),this.element.remove()}static from(e,t){return new r(this.calculateID(e,t))}static calculateID(e,n){if(0>n||n>=13)throw new Error("Illegal rank");switch(e){case t.Spades:return n;case t.Clubs:return n+13;case t.Diamonds:return n+26;case t.Hearts:return n+39}}get rank(){if(0<=this.id&&this.id<13)return this.id;if(13<=this.id&&this.id<26)return this.id-13;if(26<=this.id&&this.id<39)return this.id-26;if(39<=this.id&&this.id<52)return this.id-39;throw new Error("Illegal id")}get vcRank(){switch(this.rank){case 0:return 11;case 1:return 12;default:return this.rank-2}}get suit(){if(0<=this.id&&this.id<13)return t.Spades;if(13<=this.id&&this.id<26)return t.Clubs;if(26<=this.id&&this.id<39)return t.Diamonds;if(39<=this.id&&this.id<52)return t.Hearts;throw new Error("Illegal id")}toString(){return`${this.suit}${this.rank}`}moveTo(e,t,n){0==n?(this.element.style.top=`${t}px`,this.element.style.left=`${e}px`):(this.element.style.transition=`all ease-in-out ${n}ms`,this.element.style.top=`${t}px`,this.element.style.left=`${e}px`,setTimeout((()=>{this.element.style.transition=""}),n))}rotate(e){this.element.style.transform=`rotate(${e}deg)`}face(n){if(n){let n=-(this.rank+1)*e.opt.cardSize.width,r=e.opt.cardSize.height;switch(this.suit){case t.Spades:r*=-3;break;case t.Clubs:r*=-0;break;case t.Diamonds:r*=-1;break;case t.Hearts:r*=-2}this.element.style.backgroundPosition=`${n}px ${r}px`}else{let t="red"==e.opt.cardBack?0:-e.opt.cardSize.height;this.element.style.backgroundPosition="0px "+t+"px"}}display(e){e?(this.hidden=!1,this.element.style.display="block"):(this.hidden=!0,this.element.style.display="none")}}e.Card=r;class i{constructor(e={cx:0,cy:0}){void 0!==e.left?this.left=e.left:void 0!==e.right&&(this.right=e.right),void 0!==e.top?this.top=e.top:void 0!==e.bottom&&(this.bottom=e.bottom),void 0!==e.cx&&(this.cx=e.cx),void 0!==e.cy&&(this.cy=e.cy)}get x(){return void 0!==this.left?this.left:void 0!==this.right?e.opt.table.clientWidth-this.right:e.opt.table.clientWidth/2+(this.cx||0)}set x(e){this.left=e}get y(){return void 0!==this.top?this.top:void 0!==this.bottom?e.opt.table.clientHeight-this.bottom:e.opt.table.clientHeight/2+(this.cy||0)}set y(e){this.top=e}}e.Anchor=i;class s{constructor({position:e,angle:t,faceUp:n,hidden:r,zIndex:s}={}){this.array=[],this.position=e||new i,this.angle=t||0,this.faceUp=n||!1,this.hidden=r||!1,this.zIndex=s||0}clear(){this.array.length=0}sort(){let e=[];for(let t=0;t<this.array.length;t++)e.push([t,this.array[t]]);e.sort(((e,t)=>{let n=e[1].vcRank-t[1].vcRank;return 0==n&&(n=e[1].suit-t[1].suit),0==n?e[0]-t[0]:n})),this.array=e.map((([e,t])=>t))}shuffle(){let e=this.array.length;if(0!=e)for(;--e;){let t=Math.floor(Math.random()*(e+1)),n=this.array[e],r=this.array[t];this.array[e]=r,this.array[t]=n}}draw(e,t){if(t){let t=[];for(let n=0;n<e;n++)t.push(this.array.splice(Math.floor(Math.random()*this.array.length),1)[0]);return t}return this.array.splice(0,e)}addCards(...e){for(let t=0;t<e.length;t++){let n=e[t];n.container&&n.container.removeCards(n),this.array.push(n),n.container=this}}removeCards(...e){let t=[];for(let n=0;n<e.length;n++)for(let r=0;r<this.array.length;r++)this.array[r]==e[n]&&t.push(this.array.splice(r,1)[0]);return t}removeID(e){let t=this.array.findIndex((t=>t.id==e));return-1!=t?this.array.splice(t,1)[0]:void 0}topCard(){return this.array[this.array.length-1]}face(e){this.faceUp=e}click(e,t){this.clickHandler={func:e,context:t}}render({speed:t,callback:n}={}){this.sort(),t=t||e.opt.animationSpeed,this.calcPosition();let r=52*this.zIndex;for(let e=0;e<this.array.length;e++){let n=this.array[e];n.element.style.zIndex=(r++).toString(),n.moveTo(n.targetPosition.left,n.targetPosition.top,t)}let i=()=>{for(let e=0;e<this.array.length;e++)this.array[e].face(this.faceUp);this.display(!this.hidden)};0==t?i():setTimeout(i,t),n&&setTimeout(n,t)}display(e){this.hidden=!e;for(let t of this.array)t.display(e)}toString(){return"Container"}delete(){for(let e of this.array)e.delete();this.array.length=0}}e.Container=s,e.Deck=class extends s{constructor(e={}){super(e)}calcPosition(){let t=Math.round(this.position.x-e.opt.cardSize.width/2),n=Math.round(this.position.y-e.opt.cardSize.height/2);for(let e=0;e<this.array.length;e++){let r=this.array[e];e>0&&e%6==0&&(n-=1,t-=1),r.rotate(this.angle),r.targetPosition={top:n,left:t}}}toString(){return"Deck"}deal(e,t,n,r){let i=this,s=0,o=e*t.length;!function e(){0!=i.array.length&&s!=o?(t[s%t.length].addCards(i.topCard()),t[s%t.length].render({callback:e,speed:n}),s++):r&&r()}()}},e.Hand=class extends s{constructor(e={}){super(e)}calcPosition(){let t=this.array.length-1,n=this.angle*(Math.PI/180),r=e.opt.cardSize.width+t*e.opt.cardSize.padding*Math.cos(n),i=e.opt.cardSize.height-t*e.opt.cardSize.padding*Math.sin(n),s=Math.round(this.position.x-r/2),o=Math.round(this.position.y-i/2);for(let t=0;t<this.array.length;t++){let r=this.array[t];r.rotate(this.angle),r.targetPosition={top:o-t*e.opt.cardSize.padding*Math.sin(n),left:s+t*e.opt.cardSize.padding*Math.cos(n)}}}toString(){return"Hand"+super.toString()}},e.Pile=class extends s{constructor(){super(...arguments),this.dealCounter=0}calcPosition(){let t=Math.round(this.position.x-e.opt.cardSize.width/2),n=Math.round(this.position.y-e.opt.cardSize.height/2);for(let e=0;e<this.array.length;e++)this.array[e].targetPosition={top:n,left:t}}toString(){return"Pile"}deal(e,t){this.dealCounter||(this.dealCounter=e*t.length)}}}(e||(e={})),function(e){e.Client=class{constructor(e,t){this.handler=t,console.log("Connecting to server..."),this.ws=new WebSocket(e,"thirteen-game"),this.ws.onopen=e=>{this.handler.onConnect&&this.handler.onConnect.call(this,e)},this.ws.onclose=e=>{this.handler.onDisconnect&&this.handler.onDisconnect.call(this,e)},this.ws.onmessage=e=>this.onReceive(e)}send(e){this.ws.send(JSON.stringify(e))}disconnect(){this.ws.close(1e3)}onReceive(e){let t=this.handler;if(null==t)return;let n=JSON.parse(e.data);switch(console.log(n),n.type){case"IDENTIFY":this.id=n.id,t.onIdentify&&t.onIdentify.call(this,n);break;case"QUEUE_UPDATE":t.onQueueUpdate&&t.onQueueUpdate.call(this,n);break;case"READY":t.onReady&&t.onReady.call(this,n);break;case"END":t.onEnd&&t.onEnd.call(this,n);break;case"PLAY":t.onPlay&&t.onPlay.call(this,n);break;case"TURN_CHANGE":t.onTurnChange&&t.onTurnChange.call(this,n);break;case"SUCCESS":t.onSuccess&&t.onSuccess.call(this,n);break;case"ERROR":t.onError&&t.onError.call(this,n)}}}}(t||(t={})),function(e){e.debounce=function(e,t,n,r){let i;return 3==arguments.length&&"boolean"!=typeof n&&(r=n,n=!1),function(){let s=arguments;r=r||this,n&&!i&&e.apply(r,s),clearTimeout(i),i=setTimeout((()=>{!n&&e.apply(r,s),i=void 0}),t)}},e.rotate=function(e,t){if(-1==t)throw new Error("negative shift");let n=[];for(let r=0;r<e.length;r++)n.push(e[(r+t)%e.length]);return n};const t=["Awesome","Big","Small","Smart","Good","Great","Adorable","Fancy","Witty","Fast","Eager","Nice","Lively","Gifted","Red","Cute","Clever","Crazy","Calm","Cunning"],n=["Dog","Cat","Lion","Eagle","Bird","Panda","Fish","Bear","Hedgehog","Quail","Chicken","Ant","Bug","Beetle","Zebra","Horse"];function r(e){return e[Math.floor(Math.random()*e.length)]}e.randomName=function(){return r(t)+" "+r(n)},e.randomElement=r}(r||(r={}));var b=e.Card,x=e.Deck,v=e.Hand,w=e.Anchor;let S,k=document.querySelector(".game");function C(e){document.querySelector(".status .text").innerText=e}e.init({table:k});class P{constructor(e){this.table=e,this.api=new t.Client("ws://127.0.0.1:2794",this),this.players=[],this.dealDeck=new x,this.history=new E(3);for(let e=0;e<52;e++)this.dealDeck.addCards(new b(0));this.dealDeck.render(),this.playButton=document.querySelector("#play"),this.passButton=document.querySelector("#pass"),window.onresize=r.debounce((()=>this.renderAll({speed:0})),500)}get selfPlayer(){return this.players[0]}getPlayerByID(e){return this.players.find((t=>t.id==e))}onConnect(e){console.log("Connected to server.")}onDisconnect(e){console.log("Disconnected from server."),D.loginBox(!0,!0),D.connectBtn.innerText="Connect",S=void 0,this.delete()}onIdentify(e){let t=D.usernameSelect.value,n=parseInt(D.gameSizeSelect.value);D.loginBox(!1,!0),this.api.send({type:"JOIN_GAME",name:t,game_size:n})}onQueueUpdate(e){C(`Finding game... ${e.size}/${e.goal} connected players!`)}static transmuteCards(e,t){if(e.length!=t.length)throw new Error("cards and ids are not the same length");for(let n=0;n<t.length;n++)t[n].id=e[n];return t}renderAll(e){this.dealDeck.render(e),this.selfPlayer.queueCards.render(e),this.history.render(e),this.players.forEach((t=>t.cards.render(e)))}onReady(e){D.loginBox(!1,!1);let t=r.rotate(e.players.slice(0),e.players.findIndex((e=>e.id==this.api.id)));for(let[e,n]of t.entries())this.players.push(new T(this,e,n.id,n.name));this.dealDeck.deal(e.cards_per_player,this.players.map((e=>e.cards)),50,(()=>{P.transmuteCards(e.your_cards,this.selfPlayer.cards.array),this.selfPlayer.cards.face(!0),this.dealDeck.display(!1),this.renderAll()})),C("The game has started! Wait for your turn!")}onEnd(e){e.victor_id==this.selfPlayer.id?C("You won!"):C("You lost!"),setTimeout((()=>this.api.disconnect()),5e3)}onPlay(e){let t;if(e.player_id==this.selfPlayer.id){t=[];for(let n of e.card_ids){let e=this.selfPlayer.queueCards.removeID(n);if(e||(e=this.selfPlayer.cards.removeID(n)),!e)throw Error("Player is missing cards?");t.push(e)}}else t=this.getPlayerByID(e.player_id).cards.draw(e.card_ids.length,!0),P.transmuteCards(e.card_ids,t);this.history.push(...t),this.renderAll({speed:300})}onTurnChange(e){this.players.filter((t=>t.id!=e.player_id)).forEach((e=>e.tag.hidden=!0)),this.getPlayerByID(e.player_id).tag.hidden=!1,e.player_id==this.selfPlayer.id?(this.playButton.hidden=!1,this.passButton.hidden=e.new_pattern,e.first_turn?C("You got the first turn!"):C("It is your turn!")):(this.playButton.hidden=!0,this.passButton.hidden=!0),e.new_pattern&&(this.history.clear(),this.renderAll())}onSuccess(e){switch(e.message){case"PLAY":C("You successfully played this round.");break;case"PASS":C("You passed for this round.")}}onError(e){switch(console.log(e.message),e.message){case"INVALID_CARD":C("Invalid cards. (Client sent invalid ids)");break;case"INVALID_PATTERN":C("Your pattern is not valid.");break;case"BAD_PATTERN":C("Your pattern does not match the pile's pattern.");break;case"BAD_CARD":C("Your hand's highest must be higher than the pile's highest card.");break;case"OUT_OF_TURN":C("It's not your turn right now! Wait a bit.");break;case"MUST_START_NEW_PATTERN":C("You must start a new pattern.");break;case"NO_CARDS":C("You have to play a card.");break;case"MUST_PLAY_LOWEST":C("You must play your lowest card for this turn.")}}delete(){this.players.forEach((e=>e.delete())),this.dealDeck.delete(),this.api.disconnect(),this.history.clear(),this.playButton.hidden=!0,this.passButton.hidden=!0,window.onresize=null,C("Press Connect to look for a game!")}}class E{constructor(e){this.slots=[];for(let t=0;t<e;t++)this.slots.push(new v({faceUp:!0,position:new w({cx:0,cy:10-20*t}),zIndex:5-t}))}push(...e){this.slots[this.slots.length-1].delete();for(let e=this.slots.length-1;e>0;e--)this.slots[e].addCards(...this.slots[e-1].array.splice(0));this.slots[0].addCards(...e)}render(e){this.slots.forEach((t=>t.render(e)))}clear(){this.slots.forEach((e=>e.delete()))}}class T{constructor(e,t,n,r){switch(this.id=n,this.username=r,this.tag=document.createElement("div"),this.tag.style.position="absolute",this.tag.style.textAlign="center",this.tag.style.userSelect="none",this.tag.style.textShadow="0 0 10px black",this.tag.style.zIndex="1000",t){case 0:this.cards=new v({position:new w({bottom:25}),angle:0,zIndex:5}),this.queue=new v({faceUp:!0,position:new w({bottom:100})}),this.cards.click((e=>{this.queue.addCards(e),this.cards.render(),this.queue.render()})),this.queue.click((e=>{this.cards.addCards(e),this.cards.render(),this.queue.render()})),e.passButton.onclick=()=>e.api.send({type:"PASS"}),e.playButton.onclick=()=>e.api.send({type:"PLAY",card_ids:this.queueCards.array.map((e=>e.id))}),this.tag.style.bottom="0px",this.tag.style.width="100%";break;case 1:this.cards=new v({position:new w({top:0}),angle:180}),this.tag.style.top="0px",this.tag.style.width="100%";break;case 2:this.cards=new v({position:new w({left:0}),angle:90}),this.tag.style.writingMode="vertical-lr",this.tag.style.left="0px",this.tag.style.height="100%";break;case 3:this.cards=new v({position:new w({right:0}),angle:270}),this.tag.style.writingMode="vertical-rl",this.tag.style.right="0px",this.tag.style.height="100%";break;default:throw new Error("Something happened while loading...")}this.tag.innerText=r,e.table.appendChild(this.tag)}get queueCards(){if(this.queue)return this.queue;throw Error("Tried access queue of other players")}delete(){this.cards.delete(),this.queue&&this.queue.delete(),this.tag.remove()}}var D;!function(e){function t(e,t){document.querySelector("#username-select").disabled=!e,document.querySelector("#game-size-select").disabled=!e,document.querySelector(".login-box").hidden=!t}e.connectBtn=document.querySelector("#connect"),e.usernameSelect=document.querySelector("#username-select"),e.gameSizeSelect=document.querySelector("#game-size-select"),e.connectBtn.onclick=()=>{"Connect"!=e.connectBtn.innerText||S?S&&(S.api.disconnect(),S=void 0,e.connectBtn.innerText="Connect",t(!0,!0)):(S=new P(k),""==e.usernameSelect.value&&(e.usernameSelect.value=r.randomName()),e.connectBtn.innerText="Disconnect",t(!1,!0))},e.loginBox=t}(D||(D={})),C("Press Connect to look for a game!")})()})();
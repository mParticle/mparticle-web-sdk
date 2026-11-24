var mpDeviceMatchKit=function(t){
/*!
   * isobject <https://github.com/jonschlinkert/isobject>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */
function e(t){return null!=t&&"object"==typeof t&&!1===Array.isArray(t)}var r="DeviceMatchEventForwarder",n=function(){var t=this,e=null;t.name=r,this.init=function(r,n,i,a,o,c,s,d,u,l,m,p){e=r;try{if(!i){var f="https://tapestry.tapad.com/tapestry/1?ta_partner_id="+e.partnerId+" &ta_partner_did="+p+"&ta_format=png;",g=document.getElementsByTagName("body")[0],w=document.createElement("noscript"),y=document.createElement("img");y.src=f,y.style.display="none",y.setAttribute("height","1"),y.setAttribute("width","1"),w.appendChild(y),g.appendChild(w)}return!0,"Successfully initialized: "+t.name}catch(e){return"Can't initialize forwarder: "+t.name+": "+e}}};"undefined"!=typeof window&&window&&window.mParticle&&window.mParticle.addForwarder&&window.mParticle.addForwarder({name:r,constructor:n,getId:function(){return 109}});var i={register:function(t){t?e(t)?(e(t.kits)||(t.kits={}),t.kits[r]={constructor:n},console.log("Successfully registered "+r+" to your mParticle configuration")):console.log("'config' must be an object. You passed in a "+typeof t):console.log("You must pass a config object to register the kit "+r)}},a=i.register;return t.default=i,t.register=a,t}({});

// Auto-generated Harbor Manga Source Plugin from Paperback 0.9
// Source: FlameComics (v1.0.0-alpha.1)
// Upstream: inkdex/extensions (0.9/stable)

(() => {
  "use strict";

  // 1. In-memory state & interceptors for Paperback Application Bridge
  const __stateStore = new Map();
  const __interceptors = new Set();

  function __absUrl(url) {
    if (!url) return undefined;
    url = String(url).trim();
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("//")) return "https:" + url;
    return url;
  }

  function __cleanTitle(v) {
    return (v || "").replace(/[^\p{L}\p{N}\x27’]+/gu, " ").trim();
  }

  function __mapItem(item) {
    if (!item) return null;
    const id = item.mangaId || item.id;
    const title = item.title || item.primaryTitle || id;
    if (!id || !title) return null;
    return {
      id: String(id),
      title: __cleanTitle(title),
      cover: __absUrl(item.imageUrl || item.thumbnailUrl || item.cover)
    };
  }

  // 2. Mocked Paperback Application Host Bridge
  const Application = {
    arrayBufferToUTF8String(buf) {
      if (!buf) return "";
      return new TextDecoder().decode(buf);
    },
    decodeHTMLEntities(str) {
      if (!str) return "";
      return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    },
    async getDefaultUserAgent() {
      return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
    },
    getState(key, def) {
      return __stateStore.has(key) ? __stateStore.get(key) : def;
    },
    setState(val, key) {
      __stateStore.set(key, val);
    },
    isResourceLimited: false,
    registerInterceptor(i) {
      __interceptors.add(i);
    },
    unregisterInterceptor(i) {
      __interceptors.delete(i);
    },
    Selector(target, method) {
      return typeof target[method] === "function" ? target[method].bind(target) : () => {};
    },
    SelectorRegistry: {},
    formDidChange() {},
    sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    },
    async scheduleRequest(req) {
      const url = req.url;
      const method = req.method || "GET";
      const headers = req.headers || {};
      const body = req.body;

      const res = await harbor.http(url, {
        method,
        headers,
        body,
        responseType: "text",
        timeoutMs: req.timeoutMs || 25000,
      });

      const bodyBytes = new TextEncoder().encode(res.body || "").buffer;
      const responseObj = {
        status: res.status,
        ok: res.ok,
        headers: res.headers || {},
      };

      return [responseObj, bodyBytes];
    },
  };

  // 3. Evaluate upstream Paperback source bundle
  const __executeUpstream = (Application) => {
var source=(function(e){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});function t(e){"@babel/helpers - typeof";return t=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},t(e)}function n(e,n){if(t(e)!=`object`||!e)return e;var r=e[Symbol.toPrimitive];if(r!==void 0){var i=r.call(e,n||`default`);if(t(i)!=`object`)return i;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(n===`string`?String:Number)(e)}function r(e){var r=n(e,`string`);return t(r)==`symbol`?r:r+``}function i(e,t,n){return(t=r(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var a=class{constructor(){i(this,`requiresExplicitSubmission`,!1)}reloadForm(){let e=this.__underlying_formId;e&&Application.formDidChange(e)}};function o(e,t,n){return e[`__closure_selector-`+t]=n,Application.Selector(e,`__closure_selector-`+t)}function s(e,t){let n;return n=typeof e==`string`?{id:e}:e,{type:`listSection`,...n,items:t.filter(e=>e),allowAddition:!1,allowDeletion:!1,allowReorder:!1}}function c(e,t){let n;return n=typeof e==`string`?{id:e}:e,{type:`flowSection`,...n,items:t.filter(e=>e)}}function l(e,t){if(t.maxItemCount<1)throw Error(`[${t.id}] maxItemCount must not be less than one`);if(t.minItemCount<0)throw Error(`[${t.id}] minItemCount must not be less than zero`);if(t.minItemCount>=t.maxItemCount&&t.maxItemCount>1)throw Error(`[${t.id}] minItemCount must be less than maxItemCount, or both must be one`);if(t.value.length<t.minItemCount)throw Error(`[${t.id}] value count must not be less than minItemCount`);if(!t.value.every(e=>t.items.some(t=>t.id===e)))throw Error(`[${t.id}] All provided values must be inside items`);let n=Object.keys(t.value).length;return(t.layout==`flow`?c:s)({id:t.id,header:t.header,footer:t.footer},t.items.map(r=>{let i=t.value.indexOf(r.id),a=i!==-1;return d(r.id,{title:r.title,value:a?{symbol:`checkmark`,style:`success`}:void 0,onSelect:o(e,`__select_${t.id}#${r.id}`,async()=>{if(a)n>t.minItemCount&&t.value.splice(i,1);else if(t.maxItemCount==1)t.value.splice(0,t.value.length,r.id);else if(n<t.maxItemCount)t.value.push(r.id);else return;t.onValueChange&&await Application.SelectorRegistry.selector(t.onValueChange)(),e.reloadForm()})})}))}function u(e,t){let n=Object.keys(t.value).length;return(t.layout==`flow`?c:s)({id:t.id,header:t.header,footer:t.footer},t.items.map(r=>{let i=t.value[r.id],a,s;switch(i){case`included`:t.layout==`flow`?(s=`success`,a=void 0):(s=void 0,a={symbol:`checkmark`,style:`success`});break;case`excluded`:t.layout==`flow`?(s=`error`,a=void 0):(s=void 0,a={symbol:`xmark`,style:`error`});break;default:a=void 0,s=void 0;break}return d(r.id,{style:s,title:r.title,value:a,onSelect:o(e,`__multiselect_${t.id}#${r.id}`,async()=>{let a,o=!t.maximum||n<t.maximum,s=t.allowEmptySelection&&n==1||n>1;switch(i){case`included`:if(t.allowExclusion){a=`excluded`;break}if(s){a=void 0;break}else return;case`excluded`:if(s){a=void 0;break}else return;case void 0:if(o){a=`included`;break}else return}a==null?delete t.value[r.id]:t.value[r.id]=a,t.onValueChange&&await Application.SelectorRegistry.selector(t.onValueChange)(),e.reloadForm()})})}))}function d(e,t){return{...t,id:e,type:`labelRow`,isHidden:t.isHidden??!1,isSelectable:t.onSelect!=null}}function f(e,t){let n=Object.keys(t.value).length;return m(e,{form:new ee(t.title,t),title:t.title,subtitle:t.subtitle,value:n==1?`${(`items`in t?t.items.find(e=>e.id==t.value[0])?.title:t.options.find(e=>e.id==t.value[0])?.title)??`1 item`}`:`${Object.keys(t.value).length} items`,isHidden:t.isHidden})}function p(e,t){return m(e,{form:new h(t.title,t),title:t.title,subtitle:t.subtitle,value:`${Object.keys(t.value).length} items`,isHidden:t.isHidden})}function m(e,t){return{...t,id:e,type:`navigationRow`,isHidden:t.isHidden??!1}}var ee=class extends a{constructor(e,t){super(),i(this,`title`,void 0),i(this,`params`,void 0),i(this,`states`,[]),i(this,`requiresExplicitSubmission`,!0),this.title=e,this.params=t,this.states=[...t.value]}getSections(){return[l(this,{id:`select`,value:this.states,layout:`layout`in this.params?this.params.layout:`list`,items:`items`in this.params?this.params.items:this.params.options,minItemCount:this.params.minItemCount,maxItemCount:this.params.maxItemCount,isHidden:this.params.isHidden})]}async formDidSubmit(){await Application.SelectorRegistry.selector(this.params.onValueChange)(this.states)}},h=class extends a{constructor(e,t){super(),i(this,`title`,void 0),i(this,`params`,void 0),i(this,`states`,{}),i(this,`requiresExplicitSubmission`,!0),this.title=e,this.params=t,this.states={...t.value}}getSections(){return[u(this,{id:`multiselect`,value:this.states,items:this.params.items,allowExclusion:this.params.allowExclusion,allowEmptySelection:this.params.allowEmptySelection,maximum:this.params.maximum,layout:this.params.layout})]}async formDidSubmit(){await Application.SelectorRegistry.selector(this.params.onValueChange)(this.states)}},g=class extends a{constructor(...e){super(...e),i(this,`requiresExplicitSubmission`,!0)}async formDidSubmit(){}formDidCancel(){}},_=class{constructor(e){i(this,`id`,void 0),this.id=e}registerInterceptor(){Application.registerInterceptor(this.id,Application.Selector(this,`interceptRequest`),Application.Selector(this,`interceptResponse`))}unregisterInterceptor(){Application.unregisterInterceptor(this.id)}};let v={},y={},b=async e=>{if(v[e]){await v[e],await b(e);return}v[e]=new Promise(t=>y[e]=()=>{delete v[e],t()})},x=e=>{y[e]&&y[e]()};var S=class extends _{constructor(e,t){super(e),i(this,`options`,void 0),i(this,`promise`,void 0),i(this,`currentRequestsMade`,0),i(this,`lastReset`,Date.now()),i(this,`imageRegex`,new RegExp(/\.(avif|gif|jpeg|jpg|jxl|png|webp)(\?|$)/i)),this.options=t}async interceptRequest(e){return this.options.ignoreImages&&this.imageRegex.test(e.url)?e:(await b(this.id),await this.incrementRequestCount(),x(this.id),e)}async interceptResponse(e,t,n){return n}async incrementRequestCount(){if(await this.promise,(Date.now()-this.lastReset)/1e3>this.options.bufferInterval&&(this.currentRequestsMade=0,this.lastReset=Date.now()),this.currentRequestsMade+=1,this.currentRequestsMade>=this.options.numberOfRequests){let e=(Date.now()-this.lastReset)/1e3;if(e<=this.options.bufferInterval){let t=this.options.bufferInterval-e;console.log(`[BasicRateLimiter] rate limit hit, sleeping for ${t}`),this.promise=Application.sleep(t)}}}},C=class extends Error{constructor(e,t=`Cloudflare bypass is required`){super(t),i(this,`resolutionRequest`,void 0),i(this,`type`,`cloudflareError`),this.resolutionRequest=e}};function w(e){let t={},n=e.match(/^(?:([a-zA-Z][a-zA-Z\d+\-.]*):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/);if(!n)throw Error(`Invalid URL string provided.`);if(n[1]!==void 0&&n[1]!==``&&(t.protocol=n[1]),n[2]!==void 0&&n[2]!==``){let e=n[2],r=``,i=``,a=e.indexOf(`@`);if(a!==-1){if(r=e.substring(0,a),i=e.substring(a+1),r!==``){let e=r.indexOf(`:`);e===-1?(t.username=r,t.password=``):(t.username=r.substring(0,e),t.password=r.substring(e+1))}}else i=e;if(i!==``)if(i.startsWith(`[`)){let e=i.indexOf(`]`);if(e===-1)throw Error(`Invalid IPv6 address in URL update.`);t.hostname=i.substring(0,e+1);let n=i.substring(e+1);n.startsWith(`:`)&&(t.port=n.substring(1))}else{let e=i.lastIndexOf(`:`);e!==-1&&i.indexOf(`:`)===e?(t.hostname=i.substring(0,e),t.port=i.substring(e+1)):(t.hostname=i,t.port=``)}}if(n[3]!==void 0&&n[3]!==``&&(t.path=n[3].startsWith(`/`)?n[3]:`/${n[3]}`),n[4]!==void 0){let e={},r=n[4].split(`&`);for(let t of r){if(!t)continue;let[n,r=``]=t.split(`=`);if(n===void 0)continue;let i=decodeURIComponent(n),a=decodeURIComponent(r);if(i in e){let t=e[i];Array.isArray(t)?t.push(a):e[i]=[t,a]}else e[i]=a}t.queryItems=e}return n[5]!==void 0&&(t.fragment=n[5]),t}var T=class{constructor(e){i(this,`protocol`,void 0),i(this,`hostname`,void 0),i(this,`path`,void 0),i(this,`username`,void 0),i(this,`password`,void 0),i(this,`port`,void 0),i(this,`queryItems`,void 0),i(this,`fragment`,void 0);let t=w(e);if(!t.hostname||!t.protocol)throw Error(`URL Hostname and Protocol are required`);this.hostname=t.hostname,this.protocol=t.protocol,this.path=t.path??``,this.username=t.username,this.password=t.password,this.port=t.port,this.queryItems=t.queryItems,this.fragment=t.fragment}toString(){let e=`${this.protocol}://`;if(this.username!==void 0&&this.username!==``&&(e+=this.username,this.password!==void 0&&this.password!==``&&(e+=`:${this.password}`),e+=`@`),e+=this.hostname,this.port!==void 0&&this.port!==``&&(e+=`:${this.port}`),this.path!==``&&(e+=this.path.startsWith(`/`)?this.path:`/${this.path}`),this.queryItems!==void 0){let t=Object.keys(this.queryItems),n=[];if(t.length>0)for(let e of t){let t=this.queryItems[e];if(Array.isArray(t))for(let r of t)n.push(`${encodeURIComponent(e)}=${encodeURIComponent(r)}`);else t!==void 0&&n.push(`${encodeURIComponent(e)}=${encodeURIComponent(t)}`)}e+=`?${n.join(`&`)}`}return this.fragment!==void 0&&(e+=`#${this.fragment}`),e}setProtocol(e){if(e===``)throw Error(`Protocol is required`);return this.protocol=e,this}setUsername(e){return e===``?this.username=void 0:this.username=e,this}setPassword(e){return e===``?this.password=void 0:this.password=e,this}setHostname(e){if(e===``)throw Error(`Hostname is required`);return this.hostname=e,this}setPort(e){return e===``?this.port=void 0:this.port=e,this}setPath(e){return this.path=e.startsWith(`/`)?e:`/${e}`,this}addPathComponent(e){return this.path=(this.path??``)+(e.startsWith(`/`)?e:`/${e}`),this}setQueryItems(e){return this.queryItems=e,this}setQueryItem(e,t){return this.queryItems===void 0&&(this.queryItems={}),this.queryItems[e]=t,this}removeQueryItem(e){return delete this.queryItems?.[e],this}setFragment(e){return this.fragment=e,this}update(e){let t;return t=typeof e==`string`?w(e):e,t.protocol!==void 0&&this.setProtocol(t.protocol),t.username!==void 0&&this.setUsername(t.username),t.password!==void 0&&this.setPassword(t.password),t.hostname!==void 0&&this.setHostname(t.hostname),t.port!==void 0&&this.setPort(t.port),t.path!==void 0&&this.setPath(t.path),t.queryItems!==void 0&&this.setQueryItems(t.queryItems),t.fragment!==void 0&&this.setFragment(t.fragment),this}};let E=`cookie_store_cookies`;var te=class extends _{get cookies(){return Object.freeze(Object.values(this._cookies))}set cookies(e){let t={};for(let n of e)this.isCookieExpired(n)||(t[this.cookieIdentifier(n)]=n);this._cookies=t,this.saveCookiesToStorage()}constructor(e){super(`cookie_store`),i(this,`options`,void 0),i(this,`_cookies`,{}),this.options=e,this.loadCookiesFromStorage()}async interceptRequest(e){return e.cookies={...e.cookies??{},...this.cookiesForUrl(e.url).reduce((e,t)=>(e[t.name]=t.value,e),{})},e}async interceptResponse(e,t,n){let r=this._cookies;for(let e of t.cookies){let t=this.cookieIdentifier(e);if(this.isCookieExpired(e)){delete r[t];continue}r[t]=e}return this._cookies=r,this.saveCookiesToStorage(),n}setCookie(e){this.isCookieExpired(e)||(this._cookies[this.cookieIdentifier(e)]=e,this.saveCookiesToStorage())}deleteCookie(e){delete this._cookies[this.cookieIdentifier(e)]}cookiesForUrl(e){let t=new T(e),n=t.hostname;if(!n)return[];let r={},i=t.path.startsWith(`/`)?t.path:`/${t.path}`,a=n.split(`.`),o=i.split(`/`);o.shift();let s=this.cookies;for(let e of s){if(this.isCookieExpired(e)){delete this._cookies[this.cookieIdentifier(e)];continue}let t=this.cookieSanitizedDomain(e).split(`.`);if(a.length<t.length||t.length==0)continue;let n=!0;for(let e=0;e<t.length;e++){let r=t.length-1-e,i=a.length-1-e;if(t[r]!=a[i]){n=!1;break}}if(!n)continue;let s=this.cookieSanitizedPath(e),c=s.split(`/`);c.shift();let l=0;if(i===s)l=2**53-1;else if(c.length===0||s===`/`)l=1;else if(i.startsWith(s)&&o.length>=c.length)for(let e=0;e<c.length&&c[e]===o[e];e++)l+=1;l<=0||(r[e.name]?.pathMatches??0)<l&&(r[e.name]={cookie:e,pathMatches:l})}return Object.values(r).map(e=>e.cookie)}cookieIdentifier(e){return`${e.name}-${this.cookieSanitizedDomain(e)}-${this.cookieSanitizedPath(e)}`}cookieSanitizedPath(e){return e.path?.startsWith(`/`)?e.path:`/`+(e.path??``)}cookieSanitizedDomain(e){return e.domain.replace(/^(www)?\.?/gi,``).toLowerCase()}isCookieExpired(e){return!!(e.expires&&e.expires.getTime()<=Date.now())}loadCookiesFromStorage(){if(this.options.storage==`memory`)return;let e=Application.getState(E);if(!e){this._cookies={};return}let t={};for(let n of e)!n.expires||this.isCookieExpired(n)||(t[this.cookieIdentifier(n)]=n);this._cookies=t}saveCookiesToStorage(){this.options.storage!=`memory`&&Application.setState(this.cookies.filter(e=>e.expires),E)}},D;(function(e){e[e.NONE=0]=`NONE`,e[e.MANGA_CHAPTERS=1]=`MANGA_CHAPTERS`,e[e.CHAPTER_PROVIDING=1]=`CHAPTER_PROVIDING`,e[e.MANGA_PROGRESS=2]=`MANGA_PROGRESS`,e[e.MANGA_PROGRESS_PROVIDING=2]=`MANGA_PROGRESS_PROVIDING`,e[e.PROGRESS_PROVIDING=2]=`PROGRESS_PROVIDING`,e[e.DISCOVER_SECIONS=4]=`DISCOVER_SECIONS`,e[e.DISCOVER_SECIONS_PROVIDING=4]=`DISCOVER_SECIONS_PROVIDING`,e[e.DISCOVER_SECTION_PROVIDING=4]=`DISCOVER_SECTION_PROVIDING`,e[e.COLLECTION_MANAGEMENT=8]=`COLLECTION_MANAGEMENT`,e[e.MANAGED_COLLECTION_PROVIDING=8]=`MANAGED_COLLECTION_PROVIDING`,e[e.CLOUDFLARE_BYPASS_REQUIRED=16]=`CLOUDFLARE_BYPASS_REQUIRED`,e[e.CLOUDFLARE_BYPASS_PROVIDING=16]=`CLOUDFLARE_BYPASS_PROVIDING`,e[e.SETTINGS_UI=32]=`SETTINGS_UI`,e[e.SETTINGS_FORM_PROVIDING=32]=`SETTINGS_FORM_PROVIDING`,e[e.MANGA_SEARCH=64]=`MANGA_SEARCH`,e[e.SEARCH_RESULTS_PROVIDING=64]=`SEARCH_RESULTS_PROVIDING`,e[e.SEARCH_RESULT_PROVIDING=64]=`SEARCH_RESULT_PROVIDING`})(D||(D={}));var O;(function(e){e.EVERYONE=`SAFE`,e.MATURE=`MATURE`,e.ADULT=`ADULT`})(O||(O={}));var k;(function(e){e[e.featured=0]=`featured`,e[e.simpleCarousel=1]=`simpleCarousel`,e[e.prominentCarousel=2]=`prominentCarousel`,e[e.chapterUpdates=3]=`chapterUpdates`,e[e.genres=4]=`genres`})(k||(k={})),Object.freeze({items:[],metadata:void 0});var ne=class extends g{constructor(e,t){super(),i(this,`categories`,void 0),i(this,`categoriesMode`,void 0),i(this,`types`,void 0),i(this,`publisher`,void 0),i(this,`status`,void 0),i(this,`author`,void 0),i(this,`artist`,void 0),i(this,`year`,void 0),i(this,`language`,void 0),i(this,`country`,void 0),i(this,`categoriesOptions`,void 0),i(this,`typesOptions`,void 0),i(this,`publisherOptions`,void 0),i(this,`statusOptions`,void 0),i(this,`authorOptions`,void 0),i(this,`artistOptions`,void 0),i(this,`yearOptions`,void 0),i(this,`languageOptions`,void 0),i(this,`countryOptions`,void 0);let n=e=>(e??[]).map(e=>({id:e.id,title:e.value}));this.categoriesOptions=n(t?.categories),this.typesOptions=n(t?.types),this.publisherOptions=n(t?.publisher),this.statusOptions=n(t?.status),this.authorOptions=n(t?.author),this.artistOptions=n(t?.artist),this.yearOptions=n(t?.year),this.languageOptions=n(t?.language),this.countryOptions=n(t?.country);let r=e.metadata??{};this.categories={...r.categories},this.categoriesMode=[r.categoriesMode??`or`],this.types=r.types??[],this.publisher={...r.publisher},this.status=r.status??[],this.author={...r.author},this.artist={...r.artist},this.year=r.year??[],this.language=r.language??``,this.country=r.country??``}getSections(){return[s(`categories`,[p(`categories`,{title:`Categories`,layout:`flow`,value:this.categories,items:this.categoriesOptions,allowExclusion:!0,allowEmptySelection:!0,onValueChange:Application.Selector(this,`handleCategoriesChange`)})]),l(this,{id:`categories_mode`,layout:`flow`,value:this.categoriesMode??`or`,items:[{id:`and`,title:`AND`},{id:`or`,title:`OR`}],minItemCount:1,maxItemCount:1}),s(`types`,[f(`types`,{title:`Types`,value:this.types,options:this.typesOptions,minItemCount:0,maxItemCount:this.typesOptions.length,onValueChange:Application.Selector(this,`handleTypesChange`)})]),s(`publisher`,[p(`publisher`,{title:`Publisher`,layout:`flow`,value:this.publisher,items:this.publisherOptions,allowExclusion:!0,allowEmptySelection:!0,onValueChange:Application.Selector(this,`handlePublisherChange`)})]),s(`status`,[f(`status`,{title:`Status`,value:this.status,options:this.statusOptions,minItemCount:0,maxItemCount:this.statusOptions.length,onValueChange:Application.Selector(this,`handleStatusChange`)})]),s(`author`,[p(`author`,{title:`Author`,layout:`flow`,value:this.author,items:this.authorOptions,allowExclusion:!0,allowEmptySelection:!0,onValueChange:Application.Selector(this,`handleAuthorChange`)})]),s(`artist`,[p(`artist`,{title:`Artist`,layout:`flow`,value:this.artist,items:this.artistOptions,allowExclusion:!0,allowEmptySelection:!0,onValueChange:Application.Selector(this,`handleArtistChange`)})]),s(`year`,[f(`year`,{title:`Year`,value:this.year,options:this.yearOptions,minItemCount:0,maxItemCount:this.yearOptions.length,onValueChange:Application.Selector(this,`handleYearChange`)})]),s(`language`,[f(`language`,{title:`Language`,value:this.language?[this.language]:[],options:this.languageOptions,minItemCount:0,maxItemCount:1,onValueChange:Application.Selector(this,`handleLanguageChange`)})]),s(`country`,[f(`country`,{title:`Country`,value:this.country?[this.country]:[],options:this.countryOptions,minItemCount:0,maxItemCount:1,onValueChange:Application.Selector(this,`handleCountryChange`)})])]}async handleCategoriesChange(e){this.categories=e}async handleTypesChange(e){this.types=e}async handlePublisherChange(e){this.publisher=e}async handleStatusChange(e){this.status=e}async handleAuthorChange(e){this.author=e}async handleArtistChange(e){this.artist=e}async handleYearChange(e){this.year=e}async handleLanguageChange(e){this.language=e[0]??``}async handleCountryChange(e){this.country=e[0]??``}getSearchQueryMetadata(){let e={};return Object.keys(this.categories).length>0&&(e.categories=this.categories),this.categoriesMode&&(e.categoriesMode=this.categoriesMode[0]),this.types.length>0&&(e.types=this.types),Object.keys(this.publisher).length>0&&(e.publisher=this.publisher),this.status.length>0&&(e.status=this.status),Object.keys(this.author).length>0&&(e.author=this.author),Object.keys(this.artist).length>0&&(e.artist=this.artist),Object.keys(this.year).length>0&&(e.year=this.year),this.language&&(e.language=this.language),this.country&&(e.country=this.country),e}};let A=`https://flamecomics.xyz`,j=`https://cdn.flamecomics.xyz`;var re=class extends _{async interceptRequest(e){return{...e,headers:{...e.headers,referer:`${A}/`,"user-agent":await Application.getDefaultUserAgent()}}}async interceptResponse(e,t,n){if(t.headers?.[`cf-mitigated`]===`challenge`)throw new C({url:A,method:`GET`,headers:{"user-agent":await Application.getDefaultUserAgent()}});return n}};let M,N=0;async function P(e){let[,t]=await Application.scheduleRequest({url:e,method:`GET`});return Application.arrayBufferToUTF8String(t)}async function F(e){return JSON.parse(await P(e))}async function ie(){return(await P(`https://flamecomics.xyz/`)).match(/"buildId":"([^"]+)"/)?.[1]??`FSAQN1WFneGAAio7sG9-F`}async function I(){let e=Math.floor(Date.now()/1e3);return(!M||e-N>21600)&&(M=await ie(),N=e),M}async function L(e){let t=await I();try{return await e(t)}catch(n){if(n instanceof C)throw n;M=void 0;let r=await I();if(r===t)throw n;return await e(r)}}function R(e,t){let n=new T(A).addPathComponent(`_next`).addPathComponent(`data`).addPathComponent(e);return t.forEach(e=>n.addPathComponent(e)),n}async function z(e,t){return L(n=>{let r=R(n,e);if(t)for(let[e,n]of Object.entries(t))r.setQueryItem(e,n);return F(r.toString())})}async function B(){return F(new T(A).addPathComponent(`api`).addPathComponent(`series`).toString())}function V(e,t,n){return`${j}/uploads/images/series/${e}/${t}?${n}`}function H(e,t,n){return`${j}/uploads/images/series/${e}/${t}/${encodeURIComponent(n)}?${t}`}let U=e=>{let t=Number.parseFloat(e);return Number.isNaN(t)?e:String(t)},W=e=>e.replace(/<[^>]*>/g,``).replace(/&amp;/g,`&`).replace(/&lt;/g,`<`).replace(/&gt;/g,`>`).replace(/&quot;/g,`"`).replace(/&#39;/g,`'`).replace(/&nbsp;/g,` `).trim(),G=e=>{let t=Math.floor(Date.now()/1e3)-e;return t<60?`just now`:t<3600?`${Math.round(t/60)}m ago`:t<86400?`${Math.round(t/3600)}h ago`:t<2592e3?`${Math.round(t/86400)}d ago`:t<31536e3?`${Math.round(t/2592e3)}mo ago`:`${Math.round(t/31536e3)}y ago`},K=e=>e.novel_id!=null||(e.type?.toLowerCase().includes(`novel`)??!1),q=(e,t)=>{let n=new Map(t.map(e=>[e.series_id,e]));return e.map(e=>{let t=n.get(e.series_id);return{...e,year:e.year||t?.year,description:e.description||t?.description,categories:e.categories||t?.categories,author:e.author||t?.author,artist:e.artist||t?.artist,publisher:e.publisher||t?.publisher,time:e.time||t?.time}})},J=(e,t)=>({series_id:e.series_id,title:e.title,description:e.description??``,language:e.language??`English`,type:e.type??``,categories:e.categories??e.tags??[],country:e.country??``,author:e.author??[],artist:e.artist??[],publisher:e.publisher??[],year:e.year??0,status:e.status??``,likes:e.likes??0,cover:e.cover,last_edit:e.last_edit,updated:e.updated??e.last_edit,time:e.time??e.last_edit,chapter_count:Number(t?.chapter_count??0),chapters:e.chapters??[]}),ae=(e,t)=>{let n=new Map(t.map(e=>[e.id,e]));return e.map(e=>J(e,n.get(e.series_id)))},oe=(e,t)=>{let n=e.chapters&&e.chapters.length>0?`Ch. `+U(e.chapters[0].chapter):e.chapter_count.toString()+` Chaps`;switch(t.id){case`year`:n+=` | `+e.year;break;case`likes`:n+=` | `+e.likes.toString()+` ♥`;break;case`latest`:n+=` | `+G(e.updated);break}return{mangaId:String(e.series_id),title:e.title,imageUrl:V(e.series_id,e.cover,e.last_edit),contentRating:O.EVERYONE,subtitle:n}},Y=(e,t)=>{let n=t.pageProps;switch(e){case`popular`:return{items:(n.popularEntries?.blocks?.[0]?.series??[]).filter(e=>!K(e)).map(e=>({type:`featuredCarouselItem`,mangaId:String(e.series_id),title:e.title,imageUrl:V(e.series_id,e.cover,e.last_edit),contentRating:O.EVERYONE,subtitle:e.type??``})),metadata:void 0};case`latest`:return{items:(n.latestEntries?.blocks?.[0]?.series??[]).filter(e=>!K(e)).map(e=>{let t=e.chapters?.[0];return{type:`chapterUpdatesCarouselItem`,mangaId:String(e.series_id),chapterId:t?`${e.series_id}:${t.token}`:String(e.series_id),title:e.title,imageUrl:V(e.series_id,e.cover,e.last_edit),contentRating:O.EVERYONE,subtitle:t?`Ch. ${U(t.chapter)}`:e.type??``,publishDate:t?new Date(t.release_date*1e3):void 0}}),metadata:void 0};case`staff`:return{items:(n.staffPicks?.blocks?.[0]?.series??[]).filter(e=>!K(e)).map(e=>({type:`prominentCarouselItem`,mangaId:String(e.series_id),title:e.title,imageUrl:V(e.series_id,e.cover,e.last_edit),contentRating:O.EVERYONE,subtitle:e.type??``})),metadata:void 0};default:return{items:[],metadata:void 0}}},se=(e,t)=>{let n=t.pageProps.series;if(!n)throw Error(`FlameComics: empty series payload for id=${e}`);let r=[{id:`genres`,title:`Genres`,tags:(n.tags??[]).map(e=>({id:e.toLowerCase().replace(/\s+/g,`-`),title:e}))}],i=V(n.series_id,n.cover,n.last_edit);return{mangaId:e,mangaInfo:{thumbnailUrl:i,synopsis:W(n.description??``),primaryTitle:n.title,secondaryTitles:n.altTitles??[],contentRating:O.EVERYONE,status:n.status??`Unknown`,bannerUrl:i,artist:(n.artist??[]).join(`, `),author:(n.author??[]).join(`, `),rating:0,tagGroups:r,shareUrl:`${A}/series/${n.series_id}`}}},ce=(e,t)=>(t.pageProps.chapters??[]).map(t=>{let n=Number.parseFloat(t.chapter)||0;return{chapterId:`${t.series_id}:${t.token}`,sourceManga:e,langCode:`en`,chapNum:n,title:t.title&&t.title.length>0?t.title:`Chapter ${U(t.chapter)}`,volume:0,sortingIndex:n,publishDate:new Date(t.release_date*1e3),additionalInfo:{token:t.token}}}),le=(e,t)=>{let n=t.pageProps.chapter,r=Object.entries(n.images).sort(([e],[t])=>Number(e)-Number(t)).map(([,e])=>H(n.series_id,n.token,e.name));return{id:e,mangaId:String(n.series_id),pages:r}},ue=e=>encodeURIComponent(e).replace(/[!'()*~]/g,e=>`%`+e.charCodeAt(0).toString(16).toUpperCase()),X=e=>({id:ue(e),value:e}),de=(e,t)=>{let n=new Set,r=new Set,i=new Set,a=new Set,o=new Set,s=new Set;for(let t of e)t.categories?.forEach(e=>n.add(e)),t.publisher?.forEach(e=>r.add(e)),t.author?.forEach(e=>i.add(e)),t.artist?.forEach(e=>a.add(e)),t.language&&o.add(t.language),t.country&&s.add(t.country);return{categories:[...n].map(X),types:t?.types.filter(e=>e!=`all`).map(X),publisher:[...r].map(X),status:t?.status.filter(e=>e!=`all`).map(X),author:[...i].map(X),artist:[...a].map(X),year:t?.year.filter(e=>e!=`all`).map(X),language:[...o].map(X),country:[...s].map(X)}},Z=(e,t)=>{if(!e||Object.keys(e).length===0)return{hasFilters:!1,requestedNames:[],rejectedNames:[]};let n=[],r=Object.keys(e).filter(t=>e[t]===`included`?!0:(n.push(t),!1)),i=e=>t.find(t=>t.id===e)?.value;return{hasFilters:!0,requestedNames:r.map(i),rejectedNames:n.map(i)}},Q=(e,t,n,r)=>{if(n.some(t=>e.includes(t)))return!1;if(t.length===0)return!0;let i=t.filter(t=>e.includes(t)).length;return r?i===t.length:i>0},fe=(e,t,n)=>{let r=Z(t.categories,n.categories),i=Z(t.publisher,n.publisher),a=Z(t.author,n.author),o=Z(t.artist,n.artist),s=(t.categoriesMode??`or`)===`and`,c=(t.types?.length??0)>0,l=(t.status?.length??0)>0,u=(t.year?.length??0)>0;return e.filter(e=>!(r.hasFilters&&!Q(e.categories??[],r.requestedNames,r.rejectedNames,s)||i.hasFilters&&!Q(e.publisher??[],i.requestedNames,i.rejectedNames,!1)||a.hasFilters&&!Q(e.author??[],a.requestedNames,a.rejectedNames,!1)||o.hasFilters&&!Q(e.artist??[],o.requestedNames,o.rejectedNames,!1)||c&&!t.types?.includes(e.type)||l&&!t.status?.includes(e.status)||u&&!t.year?.includes(e.year.toString())||t.language&&t.language!==e.language||t.country&&t.country!==e.country))};var $=class{constructor(){i(this,`globalRateLimiter`,new S(`rateLimiter`,{numberOfRequests:10,bufferInterval:1,ignoreImages:!0})),i(this,`cookieStorageInterceptor`,new te({storage:`stateManager`})),i(this,`flameInterceptor`,new re(`main`)),i(this,`candidateCache`,null)}isCacheValid(){return!!this.candidateCache&&Date.now()-this.candidateCache.timestamp<3e5}async initialise(){this.globalRateLimiter.registerInterceptor(),this.cookieStorageInterceptor.registerInterceptor(),this.flameInterceptor.registerInterceptor()}async cloudflareBypassCompleted(e,t,n){for(let e of t)e.name===`cf_clearance`&&this.cookieStorageInterceptor.setCookie(e)}async refreshCandidateCache(){let[e,t,n]=await Promise.all([z([`latest.json`]),z([`browse.json`]),B()]),r=ae(q(e.pageProps.allSeries.filter(e=>!K(e)),t.pageProps.series),n),i=de(r,t.pageProps.initialFilters);return this.candidateCache={data:{candidates:r,params:i},timestamp:Date.now()},r}async getCandidates(){return this.isCacheValid()?[...this.candidateCache.data.candidates]:this.refreshCandidateCache()}async getDiscoverSections(){return[{id:`popular`,title:`Popular`,type:k.featured},{id:`latest`,title:`Latest Updates`,type:k.chapterUpdates},{id:`staff`,title:`Staff Picks`,type:k.prominentCarousel}]}async getDiscoverSectionItems(e,t){let n=await z([`index.json`]);return Y(e.id,n)}async getSearchResults(e,t,n){let r=t?.page??1,i=(e.title??``).trim().toLowerCase(),a=await this.getCandidates();switch(i.length>0&&(a=a.filter(e=>e.title.toLowerCase().includes(i))),e.metadata&&this.candidateCache&&(a=fe(a,e.metadata,this.candidateCache.data.params)),n.id){case`latest`:a.sort((e,t)=>(t.updated??t.last_edit)-(e.updated??e.last_edit));break;case`title_asc`:a.sort((e,t)=>e.title.localeCompare(t.title));break;case`title_desc`:a.sort((e,t)=>t.title.localeCompare(e.title));break;case`likes`:a.sort((e,t)=>(t.likes??0)-(e.likes??0));break;case`year`:a.sort((e,t)=>(t.year??0)-(e.year??0));break;case`random`:for(let e=a.length-1;e>0;e--){let t=Math.floor(Math.random()*(e+1));[a[e],a[t]]=[a[t],a[e]]}break}let o=(r-1)*100,s=o+100;return{items:a.slice(o,s).map(e=>oe(e,n)),metadata:s<a.length?{page:r+1}:void 0}}async getAdvancedSearchForm(e){return this.isCacheValid()||await this.refreshCandidateCache(),new ne(e,this.candidateCache?.data.params)}async getSortingOptions(e){return[{id:`latest`,label:`Latest Update`},{id:`title_asc`,label:`Title ↑`},{id:`title_desc`,label:`Title ↓`},{id:`likes`,label:`Most Liked`},{id:`year`,label:`Year`},{id:`random`,label:`Random`}]}async getMangaDetails(e){return se(e,await z([`series`,`${e}.json`],{id:e}))}async getChapters(e){return ce(e,await z([`series`,`${e.mangaId}.json`],{id:e.mangaId}))}async getChapterDetails(e){let[t,n]=e.chapterId.split(`:`),r=t??e.sourceManga?.mangaId,i=n??(typeof e.additionalInfo?.token==`string`?e.additionalInfo.token:void 0);if(!r||!i)throw Error(`[FlameComics] Cannot fetch chapter — missing series_id/token in chapterId=${e.chapterId}`);let a=await z([`series`,String(r),`${i}.json`],{id:String(r),token:i});return le(e.chapterId,a)}};return e.FlameComics=new $,e.FlameComicsExtension=$,e})({});
    return typeof source !== "undefined" ? source : {};
  };

  const __sourceModule = __executeUpstream(Application);

  // Extract the scraper extension instance
  let __ext = null;
  for (const k of Object.keys(__sourceModule)) {
    const candidate = __sourceModule[k];
    if (candidate && typeof candidate.getChapters === "function") {
      __ext = candidate;
      break;
    }
  }

  if (!__ext) {
    harbor.log("Failed to locate Paperback Extension instance in module:", Object.keys(__sourceModule));
  }

  // 4. Harbor MangaProvider Adapter
  const plugin = {
    id: "flamecomics",
    name: "FlameComics",

    async popular(offset, tagOrFilters) {
      if (__ext) {
        if (__ext.initialise && !this.__initDone) {
          try { await __ext.initialise(); } catch (_) {}
          this.__initDone = true;
        }

        if (!tagOrFilters) {
          const page = Math.floor(Math.max(0, offset) / 48) + 1;
          try {
            if (typeof __ext.getDiscoverSections === "function") {
              const sections = await __ext.getDiscoverSections();
              if (Array.isArray(sections) && sections.length > 0) {
                const targetSec =
                  sections.find((s) => ["hot", "recommended", "popular", "featured"].includes(String(s.id).toLowerCase())) ||
                  sections[0];
                const res = await __ext.getDiscoverSectionItems(targetSec, { page });
                const items = res?.items || (Array.isArray(res) ? res : []);
                if (items.length > 0) {
                  return items.map(__mapItem).filter(Boolean);
                }
              }
            }
          } catch (e) {
            harbor.log("getDiscoverSections error:", e);
          }
        }
      }
      return this.search("", offset, tagOrFilters);
    },

    async search(query, offset, tagOrFilters) {
      if (!__ext) return [];
      if (__ext.initialise && !this.__initDone) {
        try { await __ext.initialise(); } catch (_) {}
        this.__initDone = true;
      }

      const page = Math.floor(Math.max(0, offset) / 48) + 1;

      // 1. Resolve Sorting Options
      let sortOpts = [];
      let sortOption = { id: "default", label: "Default" };
      try {
        if (typeof __ext.getSortingOptions === "function") {
          sortOpts = (await __ext.getSortingOptions()) || [];
          if (Array.isArray(sortOpts) && sortOpts.length > 0) {
            sortOption = sortOpts[0];
          }
        }
      } catch (_) {}

      // 2. Resolve selected sort and metadata from tagOrFilters
      let metadata = undefined;
      if (typeof tagOrFilters === "string" && tagOrFilters) {
        if (tagOrFilters.startsWith("sort:")) {
          const sortId = tagOrFilters.slice(5);
          const matchedSort = sortOpts.find((s) => s.id === sortId || s.label === sortId || String(s.id).toLowerCase() === sortId.toLowerCase());
          if (matchedSort) sortOption = matchedSort;
        } else {
          const cleanTag = tagOrFilters.startsWith("genre:") ? tagOrFilters.slice(6) : tagOrFilters;
          if (typeof __ext.getSearchFilters === "function") {
            metadata = [{ id: "tags", value: { [cleanTag]: "included" } }];
          } else {
            metadata = {
              genres: [cleanTag],
              categories: { [cleanTag]: "included" },
              includedTags: [cleanTag],
              seriesStatuses: [cleanTag],
            };
          }
        }
      } else if (Array.isArray(tagOrFilters)) {
        // Structured PluginFilterGroup[]
        for (const group of tagOrFilters) {
          if (group.id === "sort" || group.name?.toLowerCase().includes("sort")) {
            const sortFilter = group.filters?.find((f) => f.type === "sort");
            if (sortFilter && sortFilter.selectedIndex != null && sortFilter.values) {
              const selectedVal = sortFilter.values[sortFilter.selectedIndex];
              const matchedSort = sortOpts.find((s) => s.label === selectedVal || s.id === selectedVal || String(s.id).toLowerCase() === String(selectedVal).toLowerCase());
              if (matchedSort) sortOption = matchedSort;
            }
          }
        }

        if (typeof __ext.getSearchFilters === "function") {
          const filterArr = [];
          for (const group of tagOrFilters) {
            if (group.id === "sort") continue;
            const groupVal = {};
            for (const f of group.filters || []) {
              if (f.type === "tri-state" && f.state && f.state !== "ignore") {
                groupVal[f.id] = f.state === "include" ? "included" : "excluded";
              } else if (f.type === "checkbox" && f.checked) {
                groupVal[f.id] = true;
              } else if (f.type === "select" && f.selectedIndex != null && f.values) {
                groupVal[f.id] = f.values[f.selectedIndex];
              }
            }
            if (Object.keys(groupVal).length > 0) {
              filterArr.push({ id: group.id, value: groupVal });
            }
          }
          if (filterArr.length > 0) metadata = filterArr;
        } else {
          const genres = [];
          const categories = {};
          for (const group of tagOrFilters) {
            if (group.id === "sort") continue;
            for (const f of group.filters || []) {
              if (f.type === "tri-state" && f.state && f.state !== "ignore") {
                if (f.state === "include") {
                  genres.push(f.id);
                  categories[f.id] = "included";
                } else if (f.state === "exclude") {
                  categories[f.id] = "excluded";
                }
              } else if (f.type === "checkbox" && f.checked) {
                genres.push(f.id);
              }
            }
          }
          if (genres.length > 0 || Object.keys(categories).length > 0) {
            metadata = { genres, categories, includedTags: genres };
          }
        }
      }

      const searchParams = { title: query || "", metadata };
      const res = await __ext.getSearchResults(searchParams, { offset, page }, sortOption);
      const items = res?.items || (Array.isArray(res) ? res : []);
      return items.map(__mapItem).filter(Boolean);
    },

    async detail(id) {
      if (!__ext) return null;
      if (__ext.initialise && !this.__initDone) {
        try { await __ext.initialise(); } catch (_) {}
        this.__initDone = true;
      }

      const res = await __ext.getMangaDetails(id);
      if (!res) return null;
      const info = res.mangaInfo || res;
      const primaryTitle = info.primaryTitle || info.title || id;
      const altTitles = info.secondaryTitles || (info.altTitle ? [info.altTitle] : []);

      return {
        id,
        title: __cleanTitle(primaryTitle),
        altTitle: altTitles[0] || undefined,
        cover: __absUrl(info.thumbnailUrl || info.imageUrl || info.cover),
        description: info.synopsis || info.description || undefined,
        status: info.status || undefined,
        author: info.author || undefined,
        contentRating: info.contentRating || undefined,
      };
    },

    async chapters(id) {
      if (!__ext) return [];
      if (__ext.initialise && !this.__initDone) {
        try { await __ext.initialise(); } catch (_) {}
        this.__initDone = true;
      }

      const res = await __ext.getChapters({ mangaId: id });
      const list = Array.isArray(res) ? res : (res?.chapters || []);
      return list
        .map((c, index) => {
          const chapterId = c.chapterId || c.id || String(index);
          const compositeId = `${id}::${chapterId}`;
          return {
            id: compositeId,
            chapter: c.chapNum != null ? String(c.chapNum) : (c.chapter != null ? String(c.chapter) : null),
            title: c.title || undefined,
            volume: c.volume != null ? String(c.volume) : null,
            pages: 0,
            language: c.langCode || "en",
            group: c.group || c.version || undefined,
            publishAt: c.publishDate ? new Date(c.publishDate).toISOString() : undefined,
          };
        })
        .filter((c) => Boolean(c.id));
    },

    async pageUrls(compositeId) {
      if (!__ext) return [];
      if (__ext.initialise && !this.__initDone) {
        try { await __ext.initialise(); } catch (_) {}
        this.__initDone = true;
      }

      let mangaId = "";
      let chapterId = compositeId;
      if (compositeId.includes("::")) {
        const parts = compositeId.split("::");
        mangaId = parts[0];
        chapterId = parts.slice(1).join("::");
      }

      const res = await __ext.getChapterDetails({
        sourceManga: { mangaId },
        chapterId,
      });

      const pages = res?.pages || res?.images || res?.imageUrls || (Array.isArray(res) ? res : []);
      return pages.map(__absUrl).filter(Boolean);
    },

    async getFilters() {
      if (!__ext) return [];
      if (__ext.initialise && !this.__initDone) {
        try { await __ext.initialise(); } catch (_) {}
        this.__initDone = true;
      }

      const groups = [];

      // 1. Sorting options group
      if (typeof __ext.getSortingOptions === "function") {
        try {
          const sortOpts = await __ext.getSortingOptions();
          if (Array.isArray(sortOpts) && sortOpts.length > 0) {
            groups.push({
              id: "sort",
              name: "Sort By",
              filters: [
                {
                  type: "sort",
                  id: "order",
                  name: "Order",
                  values: sortOpts.map((s) => s.label || s.id),
                  selectedIndex: 0,
                  ascending: false,
                },
              ],
            });
          }
        } catch (_) {}
      }

      // 2. Search tags / filters groups
      if (typeof __ext.getSearchTags === "function") {
        try {
          const tagGroups = await __ext.getSearchTags();
          if (Array.isArray(tagGroups)) {
            for (const tg of tagGroups) {
              if (tg.tags && tg.tags.length > 0) {
                groups.push({
                  id: tg.id || "tags",
                  name: tg.title || tg.id || "Tags",
                  filters: tg.tags.map((t) => ({
                    type: "tri-state",
                    id: t.id,
                    name: t.title || t.id,
                    state: "ignore",
                  })),
                });
              }
            }
          }
        } catch (_) {}
      } else if (typeof __ext.getSearchFilters === "function") {
        try {
          const filters = await __ext.getSearchFilters();
          if (Array.isArray(filters)) {
            for (const f of filters) {
              if (f.options && Array.isArray(f.options) && f.options.length > 0) {
                groups.push({
                  id: f.id,
                  name: f.title || f.id,
                  filters: f.options.map((o) => ({
                    type: "tri-state",
                    id: o.id,
                    name: o.title || o.id,
                    state: "ignore",
                  })),
                });
              }
            }
          }
        } catch (_) {}
      }

      return groups;
    },

    async tags() {
      const filters = await this.getFilters();
      const tagList = [];

      for (const group of filters) {
        if (group.id === "sort") {
          const sortFilter = group.filters?.find((f) => f.type === "sort");
          if (sortFilter && sortFilter.values) {
            for (const val of sortFilter.values) {
              tagList.push({ id: "sort:" + val, name: val, group: "Sort" });
            }
          }
        } else {
          for (const f of group.filters || []) {
            tagList.push({ id: "genre:" + f.id, name: f.name, group: group.name });
          }
        }
      }

      // Fallback to legacy getGenres if available and empty
      if (tagList.length === 0 && __ext && typeof __ext.getGenres === "function") {
        try {
          const genres = await __ext.getGenres();
          if (Array.isArray(genres)) {
            return genres
              .map((g) => ({
                id: g.id || g.title,
                name: g.title || g.id,
                group: "Genre",
              }))
              .filter((t) => t.id && t.name);
          }
        } catch (_) {}
      }

      return tagList;
    },
  };

  // Register with Harbor
  if (typeof harbor !== "undefined" && harbor.register) {
    try {
      harbor.register(plugin);
    } catch (_) {}
  }
})();

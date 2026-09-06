// Auto-generated Harbor Manga Source Plugin from Paperback 0.9
// Source: MangaPlus (v1.0.0-alpha.11)
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
var source=(function(e){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});function t(e){"@babel/helpers - typeof";return t=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},t(e)}function n(e,n){if(t(e)!=`object`||!e)return e;var r=e[Symbol.toPrimitive];if(r!==void 0){var i=r.call(e,n||`default`);if(t(i)!=`object`)return i;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(n===`string`?String:Number)(e)}function r(e){var r=n(e,`string`);return t(r)==`symbol`?r:r+``}function i(e,t,n){return(t=r(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var a=class{constructor(){i(this,`requiresExplicitSubmission`,!1)}reloadForm(){let e=this.__underlying_formId;e&&Application.formDidChange(e)}};function o(e,t,n){return e[`__closure_selector-`+t]=n,Application.Selector(e,`__closure_selector-`+t)}function s(e,t){let n;return n=typeof e==`string`?{id:e}:e,{type:`listSection`,...n,items:t.filter(e=>e),allowAddition:!1,allowDeletion:!1,allowReorder:!1}}function c(e,t){let n;return n=typeof e==`string`?{id:e}:e,{type:`flowSection`,...n,items:t.filter(e=>e)}}function l(e,t){if(t.maxItemCount<1)throw Error(`[${t.id}] maxItemCount must not be less than one`);if(t.minItemCount<0)throw Error(`[${t.id}] minItemCount must not be less than zero`);if(t.minItemCount>=t.maxItemCount&&t.maxItemCount>1)throw Error(`[${t.id}] minItemCount must be less than maxItemCount, or both must be one`);if(t.value.length<t.minItemCount)throw Error(`[${t.id}] value count must not be less than minItemCount`);if(!t.value.every(e=>t.items.some(t=>t.id===e)))throw Error(`[${t.id}] All provided values must be inside items`);let n=Object.keys(t.value).length;return(t.layout==`flow`?c:s)({id:t.id,header:t.header,footer:t.footer},t.items.map(r=>{let i=t.value.indexOf(r.id),a=i!==-1;return u(r.id,{title:r.title,value:a?{symbol:`checkmark`,style:`success`}:void 0,onSelect:o(e,`__select_${t.id}#${r.id}`,async()=>{if(a)n>t.minItemCount&&t.value.splice(i,1);else if(t.maxItemCount==1)t.value.splice(0,t.value.length,r.id);else if(n<t.maxItemCount)t.value.push(r.id);else return;t.onValueChange&&await Application.SelectorRegistry.selector(t.onValueChange)(),e.reloadForm()})})}))}function u(e,t){return{...t,id:e,type:`labelRow`,isHidden:t.isHidden??!1,isSelectable:t.onSelect!=null}}function d(e,t){return{...t,id:e,type:`toggleRow`,isHidden:t.isHidden??!1}}function f(e,t){let n=Object.keys(t.value).length;return m(e,{form:new h(t.title,t),title:t.title,subtitle:t.subtitle,value:n==1?`${(`items`in t?t.items.find(e=>e.id==t.value[0])?.title:t.options.find(e=>e.id==t.value[0])?.title)??`1 item`}`:`${Object.keys(t.value).length} items`,isHidden:t.isHidden})}function p(e,t){return{...t,id:e,type:`buttonRow`,isHidden:t.isHidden??!1}}function m(e,t){return{...t,id:e,type:`navigationRow`,isHidden:t.isHidden??!1}}var h=class extends a{constructor(e,t){super(),i(this,`title`,void 0),i(this,`params`,void 0),i(this,`states`,[]),i(this,`requiresExplicitSubmission`,!0),this.title=e,this.params=t,this.states=[...t.value]}getSections(){return[l(this,{id:`select`,value:this.states,layout:`layout`in this.params?this.params.layout:`list`,items:`items`in this.params?this.params.items:this.params.options,minItemCount:this.params.minItemCount,maxItemCount:this.params.maxItemCount,isHidden:this.params.isHidden})]}async formDidSubmit(){await Application.SelectorRegistry.selector(this.params.onValueChange)(this.states)}},g=class{constructor(e){i(this,`id`,void 0),this.id=e}registerInterceptor(){Application.registerInterceptor(this.id,Application.Selector(this,`interceptRequest`),Application.Selector(this,`interceptResponse`))}unregisterInterceptor(){Application.unregisterInterceptor(this.id)}};let _={},v={},y=async e=>{if(_[e]){await _[e],await y(e);return}_[e]=new Promise(t=>v[e]=()=>{delete _[e],t()})},b=e=>{v[e]&&v[e]()};var x=class extends g{constructor(e,t){super(e),i(this,`options`,void 0),i(this,`promise`,void 0),i(this,`currentRequestsMade`,0),i(this,`lastReset`,Date.now()),i(this,`imageRegex`,new RegExp(/\.(avif|gif|jpeg|jpg|jxl|png|webp)(\?|$)/i)),this.options=t}async interceptRequest(e){return this.options.ignoreImages&&this.imageRegex.test(e.url)?e:(await y(this.id),await this.incrementRequestCount(),b(this.id),e)}async interceptResponse(e,t,n){return n}async incrementRequestCount(){if(await this.promise,(Date.now()-this.lastReset)/1e3>this.options.bufferInterval&&(this.currentRequestsMade=0,this.lastReset=Date.now()),this.currentRequestsMade+=1,this.currentRequestsMade>=this.options.numberOfRequests){let e=(Date.now()-this.lastReset)/1e3;if(e<=this.options.bufferInterval){let t=this.options.bufferInterval-e;console.log(`[BasicRateLimiter] rate limit hit, sleeping for ${t}`),this.promise=Application.sleep(t)}}}},S;(function(e){e[e.NONE=0]=`NONE`,e[e.MANGA_CHAPTERS=1]=`MANGA_CHAPTERS`,e[e.CHAPTER_PROVIDING=1]=`CHAPTER_PROVIDING`,e[e.MANGA_PROGRESS=2]=`MANGA_PROGRESS`,e[e.MANGA_PROGRESS_PROVIDING=2]=`MANGA_PROGRESS_PROVIDING`,e[e.PROGRESS_PROVIDING=2]=`PROGRESS_PROVIDING`,e[e.DISCOVER_SECIONS=4]=`DISCOVER_SECIONS`,e[e.DISCOVER_SECIONS_PROVIDING=4]=`DISCOVER_SECIONS_PROVIDING`,e[e.DISCOVER_SECTION_PROVIDING=4]=`DISCOVER_SECTION_PROVIDING`,e[e.COLLECTION_MANAGEMENT=8]=`COLLECTION_MANAGEMENT`,e[e.MANAGED_COLLECTION_PROVIDING=8]=`MANAGED_COLLECTION_PROVIDING`,e[e.CLOUDFLARE_BYPASS_REQUIRED=16]=`CLOUDFLARE_BYPASS_REQUIRED`,e[e.CLOUDFLARE_BYPASS_PROVIDING=16]=`CLOUDFLARE_BYPASS_PROVIDING`,e[e.SETTINGS_UI=32]=`SETTINGS_UI`,e[e.SETTINGS_FORM_PROVIDING=32]=`SETTINGS_FORM_PROVIDING`,e[e.MANGA_SEARCH=64]=`MANGA_SEARCH`,e[e.SEARCH_RESULTS_PROVIDING=64]=`SEARCH_RESULTS_PROVIDING`,e[e.SEARCH_RESULT_PROVIDING=64]=`SEARCH_RESULT_PROVIDING`})(S||(S={}));var C;(function(e){e.EVERYONE=`SAFE`,e.MATURE=`MATURE`,e.ADULT=`ADULT`})(C||(C={}));var w;(function(e){e[e.featured=0]=`featured`,e[e.simpleCarousel=1]=`simpleCarousel`,e[e.prominentCarousel=2]=`prominentCarousel`,e[e.chapterUpdates=3]=`chapterUpdates`,e[e.genres=4]=`genres`})(w||(w={})),Object.freeze({items:[],metadata:void 0});function T(e,t){return e?.popups?.find(e=>(e.language??`ENGLISH`)===t)||null}var E=class{constructor(e,t,n,r,a){i(this,`titleId`,void 0),i(this,`name`,void 0),i(this,`author`,void 0),i(this,`portraitImageUrl`,void 0),i(this,`landscapeImageUrl`,void 0),i(this,`viewCount`,0),i(this,`language`,`ENGLISH`),this.titleId=e,this.name=t,this.portraitImageUrl=n,this.landscapeImageUrl=r,a&&(this.author=a)}},D=class e{constructor(){i(this,`title`,void 0),i(this,`titleImageUrl`,void 0),i(this,`overview`,void 0),i(this,`backgroundImageUrl`,void 0),i(this,`nextTimeStamp`,0),i(this,`viewingPeriodDescription`,``),i(this,`nonAppearanceInfo`,``),i(this,`chapterListGroup`,[]),i(this,`firstChapterList`,[]),i(this,`lastChapterList`,[]),i(this,`isSimulReleased`,!1),i(this,`chaptersDescending`,!0)}get isWebtoon(){return this.firstChapterList.every(e=>e.isVerticalOnly)&&this.lastChapterList.every(e=>e.isVerticalOnly)}get isOneShot(){return this.chapterCount==1&&this.firstChapterList.at(0)?.name?.localeCompare(`one-shot`,void 0,{sensitivity:`base`})==0}get chapterCount(){return this.firstChapterList?.length+this.lastChapterList?.length}get isReEdition(){return this.viewingPeriodDescription?.search(e.REEDITION_REGEX)!=0}get isCompleted(){return this.nonAppearanceInfo?.search(e.COMPLETED_REGEX)!=0||this.isOneShot}get isOnHiatus(){return this.nonAppearanceInfo?.search(e.HIATUS_REGEX)!=0}get genres(){let e=[];return this.isSimulReleased&&!this.isReEdition&&!this.isOneShot&&e.push(`Simulrelease`),this.isOneShot&&e.push(`One-shot`),this.isReEdition&&e.push(`Re-edition`),this.isWebtoon&&e.push(`Webtoon`),e}static fromJson(t){let n=JSON.parse(t);if(n.success?.titleDetailView===void 0)throw Error(`Cannot find manga`);let r=n.success.titleDetailView,i=new e;if(r.title===void 0)throw Error(`Cannot find title`);let a=r.title;return i.title=new E(a.titleId,a.name,a.portraitImageUrl,a.landscapeImageUrl,a.author),i.titleImageUrl=r.titleImageUrl,i.overview=r.overview,i.backgroundImageUrl=r.backgroundImageUrl,i.nextTimeStamp=r.nextTimeStamp,i.viewingPeriodDescription=r.viewingPeriodDescription,i.nonAppearanceInfo=r.nonAppearanceInfo,i.firstChapterList=r.chapterListGroup?.flatMap(e=>e.firstChapterList??[]).map(e=>Object.assign(new O(1,1,``,1,1),e)),i.lastChapterList=r.chapterListGroup?.flatMap(e=>e.lastChapterList??[]).map(e=>Object.assign(new O(1,1,``,1,1),e)),i}toSourceManga(){let e=this.title?.author?.split(`/`);return{mangaId:this.title?.titleId.toString()??``,mangaInfo:{thumbnailUrl:`imageMangaId=`+this.title?.titleId,synopsis:(this.overview??``)+`

`+(this.viewingPeriodDescription??``),primaryTitle:this.title?.name??``,secondaryTitles:[],contentRating:C.EVERYONE,status:this.isCompleted?`Completed`:this.isOnHiatus?`On hiatus`:`Ongoing`,artist:e?e[1]?.trimStart():this.title?.author??``,author:e?e[0]?.trimEnd():this.title?.author??``,tagGroups:[{id:`0`,title:`genres`,tags:this.genres.map(e=>({id:e,title:e}))}]}}}};i(D,`COMPLETED_REGEX`,/completado|complete|completo/),i(D,`HIATUS_REGEX`,/on a hiatus/i),i(D,`REEDITION_REGEX`,/revival|remasterizada/);var O=class{constructor(e,t,n,r,a){i(this,`titleId`,void 0),i(this,`chapterId`,void 0),i(this,`name`,void 0),i(this,`subTitle`,void 0),i(this,`startTimeStamp`,void 0),i(this,`endTimeStamp`,void 0),i(this,`isVerticalOnly`,!1),this.titleId=e,this.chapterId=t,this.name=n,this.startTimeStamp=r,this.endTimeStamp=a}get isExpired(){return this.subTitle==null}toSChapter(e){let t=parseFloat(this.name.slice(this.name.lastIndexOf(`#`)+1));return{chapterId:this.chapterId.toString(),sourceManga:e,langCode:`en`,title:this.subTitle?this.subTitle:``,chapNum:isNaN(t)?0:t,sortingIndex:isNaN(t)?-1:t,publishDate:new Date(this.startTimeStamp*1e3)}}};let k=()=>Application.getState(`languages`)??[`ENGLISH`],A=()=>Application.getState(`split_images`)??`yes`,j=()=>Application.getState(`image_resolution`)??`high`;var M=class extends a{getSections(){return[s(`content_settings`,[f(`languages`,{title:`Languages`,value:k(),minItemCount:1,maxItemCount:200,options:[{id:`ENGLISH`,title:`English`},{id:`SPANISH`,title:`Español`},{id:`FRENCH`,title:`Français`},{id:`INDONESIAN`,title:`Bahasa (IND)`},{id:`PORTUGUESE_BR`,title:`Portugûes (BR)`},{id:`RUSSIAN`,title:`Русский`},{id:`THAI`,title:`ภาษาไทย`},{id:`VIETNAMESE`,title:`Tiếng Việt`}],onValueChange:Application.Selector(this,`setLanguages`)}),d(`split_images`,{title:`Split Images`,value:A()===`yes`,onValueChange:Application.Selector(this,`setSplitImages`)}),f(`image_resolution`,{title:`Image Resolution`,value:[j()],minItemCount:1,maxItemCount:1,options:[{id:`low`,title:`Low`},{id:`medium`,title:`Medium`},{id:`high`,title:`High`},{id:`super_high`,title:`Super High`}],onValueChange:Application.Selector(this,`setResolution`)})]),s(`reset_settings`,[p(`reset`,{title:`Reset to Default`,onSelect:Application.Selector(this,`resetSettings`)})])]}async setLanguages(e){Application.setState(e,`languages`)}async setSplitImages(e){Application.setState(e?`yes`:`no`,`split_images`)}async setResolution(e){Application.setState(e.length>0?e[0]:`high`,`image_resolution`)}async resetSettings(){Application.setState([`ENGLISH`],`languages`),Application.setState(`yes`,`split_images`),Application.setState(`high`,`image_resolution`),Application.setState(void 0,`sessionToken`)}};let N=`https://mangaplus.shueisha.co.jp`,P=`https://jumpg-webapi.tokyo-cdn.com/api`;var F=class{constructor(){i(this,`globalRateLimiter`,new x(`rateLimiter`,{numberOfRequests:10,bufferInterval:1,ignoreImages:!0}))}getSessionToken(){let e=Application.getState(`sessionToken`);if(e)return e;let t=crypto.randomUUID();return Application.setState(t,`sessionToken`),t}async initialise(){this.registerInterceptors()}async getMangaDetails(e){let t={url:`${P}/title_detailV3?title_id=${e}&format=json`,method:`GET`},n=(await Application.scheduleRequest(t))[1];return D.fromJson(Application.arrayBufferToUTF8String(n)).toSourceManga()}async getThumbnailUrl(e){let t={url:`${P}/title_detailV3?title_id=${e}&format=json`,method:`GET`},n=(await Application.scheduleRequest(t))[1];return D.fromJson(Application.arrayBufferToUTF8String(n)).title?.portraitImageUrl??``}async getChapters(e){let t={url:`${P}/title_detailV3?title_id=${e.mangaId}&format=json`,method:`GET`},n=(await Application.scheduleRequest(t))[1],r=D.fromJson(Application.arrayBufferToUTF8String(n));return[...r.firstChapterList??[],...r.lastChapterList??[]].reverse().filter(e=>!e.isExpired).map(t=>t.toSChapter(e))}async getChapterDetails(e){let t={url:`${P}/manga_viewer?chapter_id=${e.chapterId}&split=${A()}&img_quality=${j()}&format=json`,method:`GET`},n=(await Application.scheduleRequest(t))[1],r=JSON.parse(Application.arrayBufferToUTF8String(n));if(r.success===void 0)throw Error(T(r.error,`ENGLISH`)?.body??`Unknown error`);let i=r.success.mangaViewer?.pages.map(e=>e.mangaPage).filter(e=>e).map(e=>e?.encryptionKey?`${e?.imageUrl}#${e?.encryptionKey}`:``);return{id:e.chapterId,mangaId:e.sourceManga.mangaId,pages:i??[]}}async getFeaturedTitles(){let e={url:`${P}/featuredV2?lang=eng&clang=eng&format=json`,method:`GET`},t=(await Application.scheduleRequest(e))[1],n=JSON.parse(Application.arrayBufferToUTF8String(t));if(n.success===void 0)throw Error(T(n.error,`ENGLISH`)?.body??`Unknown error`);let r=k(),i=n.success?.featuredTitlesViewV2?.contents?.find(e=>e.titleList&&e.titleList.listName==`WEEKLY SHONEN JUMP`)?.titleList.featuredTitles.filter(e=>r.includes(e.language??`ENGLISH`)),a=[],o=[];for(let e of i??[]){let t=e.titleId.toString(),n=e.name,r=e.author,i=e.portraitImageUrl;!t||!n||o.includes(t)||a.push({mangaId:t,title:n,subtitle:r,imageUrl:i,contentRating:C.EVERYONE})}return{items:a}}async getPopularTitles(){let e={url:`${P}/title_list/ranking?format=json`,method:`GET`},t=(await Application.scheduleRequest(e))[1],n=JSON.parse(Application.arrayBufferToUTF8String(t));if(n.success===void 0)throw Error(T(n.error,`ENGLISH`)?.body??`Unknown error`);let r=k(),i=n.success?.titleRankingView?.titles.filter(e=>r.includes(e.language??`ENGLISH`)),a=[],o=[];for(let e of i??[]){let t=e.titleId.toString(),n=e.name,r=e.author,i=e.portraitImageUrl;!t||!n||o.includes(t)||a.push({mangaId:t,title:n,subtitle:r,imageUrl:i,contentRating:C.EVERYONE})}return{items:a}}async getLatestUpdates(){let e={url:`${P}/web/web_homeV4?lang=eng&format=json`,method:`GET`},t=(await Application.scheduleRequest(e))[1],n=JSON.parse(Application.arrayBufferToUTF8String(t));if(n.success===void 0)throw Error(T(n.error,`ENGLISH`)?.body??`Unknown error`);let r=k(),i=n.success.webHomeViewV4?.groups.flatMap(e=>e.titleGroups).flatMap(e=>e.titles).map(e=>e.title).filter(e=>r.includes(e.language??`ENGLISH`)),a=[],o=[];for(let e of i??[]){let t=e.titleId.toString(),n=e.name,r=e.author,i=e.portraitImageUrl;!t||!n||o.includes(t)||a.push({mangaId:t,title:n,subtitle:r,imageUrl:i,contentRating:C.EVERYONE})}return{items:a}}async getSearchResults(e,t){let n=e.title??``,r={url:`${P}/title_list/allV2?format=JSON&${n?`filter=`+encodeURI(n)+`&`:``}format=json`,method:`GET`},i=(await Application.scheduleRequest(r))[1],a=JSON.parse(Application.arrayBufferToUTF8String(i));if(a.success===void 0)throw Error(T(a.error,`ENGLISH`)?.body??`Unknown error`);let o=e.title?.toLowerCase()??``,s=k(),c=a.success?.allTitlesViewV2?.AllTitlesGroup.flatMap(e=>e.titles).filter(e=>s.includes(e.language??`ENGLISH`)).filter(e=>e.author?.toLowerCase().includes(o)||e.name.toLowerCase().includes(o)),l=[],u=[];for(let e of c??[]){let t=e.titleId.toString(),n=e.name,r=e.author,i=e.portraitImageUrl;!t||!n||u.includes(t)||l.push({mangaId:t,title:n,subtitle:r,imageUrl:i,contentRating:C.EVERYONE})}return{items:l,metadata:t}}decodeXoRCipher(e,t){let n=t.match(/../g)?.map(e=>parseInt(e,16))??[];return e.map((e,t)=>e^(n[t%n.length]??0))}registerInterceptors(){this.globalRateLimiter.registerInterceptor(),Application.registerInterceptor(`mangaPlusInterceptor`,Application.Selector(this,`interceptRequest`),Application.Selector(this,`interceptResponse`))}async interceptRequest(e){if(e.headers={...e.headers,Origin:N,Referer:`${N}/`,"session-token":this.getSessionToken(),"user-agent":await Application.getDefaultUserAgent()},e.url.startsWith(`imageMangaId=`)){let t=e.url.replace(`imageMangaId=`,``);e.url=await this.getThumbnailUrl(t)}return e}async interceptResponse(e,t,n){let r=e.url.lastIndexOf(`#`);if(r==-1)return n;let i=e.url.substring(r+1);return i?this.decodeXoRCipher(new Uint8Array(n),i).buffer:n}getDiscoverSections(){return Promise.resolve([{id:`featured`,title:`Featured`,type:w.simpleCarousel},{id:`popular`,title:`Popular`,type:w.simpleCarousel},{id:`latest_updates`,title:`Latest Updates`,type:w.simpleCarousel}])}async getDiscoverSectionItems(e,t){let n={items:[]};switch(e.id){case`featured`:n=await this.getFeaturedTitles();break;case`popular`:n=await this.getPopularTitles();break;case`latest_updates`:n=await this.getLatestUpdates();break}return{items:n.items.map(e=>({type:`simpleCarouselItem`,...e})),metadata:t}}async getSettingsForm(){return new M}};return e.MangaPlus=new F,e.MangaPlusExtension=F,e})({});
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
    id: "mangaplus",
    name: "MangaPlus",

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

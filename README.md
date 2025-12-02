# DOM Performance Optimizer

a browser extension that makes heavy webpages actually usable again.

built this because chatgpt, claude, and other ai chat interfaces become unusably slow after long conversations. the browser tries to render thousands of dom nodes and everything grinds to a halt. this extension fixes that by trimming old messages from the dom while keeping them in memory so you can restore them anytime.

works on chatgpt, claude, grok, perplexity, gemini, and basically any content heavy site.

## what it does

the extension removes older messages from the page dom to reduce browser load. when you scroll up, it lazy loads them back. you can also manually trim and restore everything with a single click.

**trim dom** removes old messages from the rendered page. they stay in memory so nothing is lost.

**restore all** brings everything back instantly.

**performance boost** pauses css animations, transitions, and other gpu heavy effects that slow things down.

**auto trim** automatically keeps the dom light when you're at the bottom of the conversation.

**lazy loading** loads older messages in chunks when you scroll up.

## the ui

glassmorphism design with transparency, blur effects, and smooth animations. five color themes to choose from: ocean, dark blue, purple, forest, and sunset. theres a floating overlay widget on the page for quick actions, plus a full popup panel and settings page.

## installation

### load it locally in brave or chrome

1. clone or download this repo
2. open your browser and go to `brave://extensions` or `chrome://extensions`
3. flip the developer mode toggle in the top right corner
4. click load unpacked
5. select the folder you downloaded
6. done. the icon shows up in your toolbar

### thats it

no build step. no npm install. no webpack config. just load it and go.

## how to use it

click the extension icon to open the popup. from there you can:

**trim dom** to remove old messages and speed up the page

**restore all** to bring back everything you trimmed

**free memory** to clear offscreen images and pause videos

**purge cache** to clear the extensions local storage

theres a slider to set how many messages to keep visible. lower means faster performance, higher means more context on screen.

toggle auto trim to let the extension handle things automatically. when youre scrolled to the bottom it keeps trimming old stuff. when you scroll up it pauses and lets you browse history.

## keyboard shortcuts

```
alt+t    trim dom
alt+r    restore all
alt+a    toggle auto trim
alt+p    toggle performance boost
alt+o    toggle overlay widget
```

## settings

right click the extension icon and select options, or click the gear icon in the popup.

you can configure:

max visible messages and token limits

auto trim interval

lazy loading chunk size

which performance optimizations to apply

color theme

whether to show the overlay widget

export and import your settings as json

## supported sites

**chatgpt** chat.openai.com and chatgpt.com

**claude** claude.ai

**grok** grok.x.ai and x.com/i/grok

**perplexity** perplexity.ai

**gemini** gemini.google.com and bard.google.com

the extension also has a generic adapter that works on most other sites with scrollable content.

## privacy

this extension runs entirely in your browser. no data is sent anywhere. no analytics. no tracking. no api calls. all settings are stored locally using chrome.storage.local.

## technical stuff

manifest v3 compliant. uses a service worker for background tasks. content scripts handle the actual dom manipulation. each supported site has its own adapter that knows how to find and manipulate messages on that specific interface.

the trimmer works by removing dom nodes and storing references to them in a map. when you restore, it reinjects them in the right order. the lazy loader watches scroll position and loads chunks of messages as you scroll up.

performance boost injects css that pauses animations and transitions, plus it applies will change and contain properties to reduce layout thrashing.

## file structure

```
manifest.json           extension config
background.js           service worker
content/
  content.js            main orchestrator
  dom-trimmer.js        removes and restores nodes
  lazy-loader.js        scroll based loading
  performance-boost.js  optimization utilities
  site-detector.js      picks the right adapter
  site-adapters/        one file per supported site
popup/                  the popup ui
options/                settings page
overlay/                floating widget
styles/                 themes and glassmorphism css
utils/                  storage, state, config
icons/                  extension icons
```

## browser support

works on brave, chrome, edge, and any chromium based browser. manifest v3 so it should keep working as browsers phase out v2.

## contributing

pull requests welcome. if you want to add support for a new site, create an adapter in `content/site-adapters/` that extends the base adapter class.

## license

mit

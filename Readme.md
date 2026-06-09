# Submission

### Self-contained HTML (index.single.html)
> Simply double-click the file to open it on browser.

### How to run the Cocos Creator Project
> I use Cocos Creator editor version 3.8.5
> 1. Download that editor version
> 2. Open the project: Dashboard > Add Project > locate the project
> 3. Open the "game" scene inside scenes folder
> 4. hit the play button at the top of the editor window. it will open a browser
> 
> I use this NPM package to create the self-contained html file: https://www.npmjs.com/package/cocos-creator-single-file-package
> 

### A short explanation of the implemented feature set
> The smallest complete version was:
> 1. Loading assets: Table, background, pucks, striker and create nodes with rigidbody + collider needed
> 2. Functioning striker (slingshot mechanic) and puck
> 3. hardcoded holes and pucks position
> 4. can hit pucks to the holes
>
> What I added after:
> 1. tutorial and start text; tween
> 2. hands animation; tween
> 3. orientation handling
> 4. loading screen + endscreen
> 5. MRAID handling
> 6. Tracking Manager
>
### How to validate the tracking events
> I log the tracking events to the console. 
>
>```{
>    "start": {
>        "once": true,
>        "count": 1
>    },
>    "firstInteraction": {
>        "once": true,
>        "count": 0
>    },
>    "complete": {
>        "once": true,
>        "count": 0
>    },
>    "ctaClick": {
>        "once": false,
>        "count": 0
>    }
>
>```
> at the end of the game, there should be only 1 count for start, firstInteraction and complete while user can do ctaClick more than once.

### Key tradeoffs and scope decisions made
> I decided not to use any sfx or bgm since I need to add more handler for it and not to focus on the completeness of the UI. I prefer function
> 
> If I had more time, I would add sfx and more proper UI.

### Did I use AI?
> Yes, I used AI. mainly for coding.
>
> I asked AI agent to code mainly for the basics and I will adjust/complete/modify/continue from it. for example, I asked for a basic slingshot mechanic for the Striker class. then I adjusted some parts from it.
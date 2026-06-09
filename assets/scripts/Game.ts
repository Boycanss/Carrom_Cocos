import { _decorator, Component, find, Node, SpriteFrame, UITransform, tween, Vec3, Quat, Label, Color, Sprite, Tween } from 'cc';
import {NodeCreator} from './utils/NodeCreator';
import { SpriteLoader } from './utils/SpriteLoader';
import { GameDefine } from './Define';
import { Striker } from './Striker';
import { Puck } from './Puck';
import { GameManager } from './GameManager';
import TrackingManager, { TrackingEvents } from './utils/TrackingManager';
const { ccclass, property } = _decorator;

// MiniGame Carrom Ball main logic
@ccclass('Game')
export class Game extends Component {
    GameMgr: Node = null;
    nodeCreator: NodeCreator = null;
    spriteLoader: SpriteLoader = null;

    whitePucks: Node[] = null;
    blackPucks: Node[] = null;
    striker: Node = null;
    tableNode: Node = null;

    whitePuckSprite: SpriteFrame = null;
    blackPuckSprite: SpriteFrame = null;
    strikerSprite: SpriteFrame = null;

    // game state & scoring
    private playerScore: number = 0;
    private enemyScore: number = 0;
    private blackRemaining: number = 0;
    private whiteRemaining: number = 0;
    private state: 'Placing' | 'Playing' | 'GameOver' = 'Placing';
    tutorialState: 'TutPlacing' | 'TutPlaying' | 'None' = 'TutPlacing';
    private tutorialHand: Node = null;
    private tutorialText: Node = null;
    private bgBox: Node = null;
    private arrowFull: Node = null;
    isFirstTutorialShown: boolean = false;
    isSecondTutorialShown: boolean = false;

    tweenTut1: Tween = new Tween();
    tweenTut2: Tween = new Tween();

    gameTimer:number = GameDefine.gameTimer;
    isGameTimerstarted: boolean = false;
    // timerCountdown: number;

    start() {
        this.GameMgr = find('Canvas/GameManager');
        this.tableNode = this.GameMgr.getComponent(GameManager).table;
        this.nodeCreator = this.GameMgr.getComponent(NodeCreator);
        this.spriteLoader = this.GameMgr.getComponent(SpriteLoader);
        this.whitePuckSprite = this.spriteLoader.loadedAssets.get('whitePuck');
        this.blackPuckSprite = this.spriteLoader.loadedAssets.get('blackPuck');
        this.strikerSprite = this.spriteLoader.loadedAssets.get('striker');
        this.createPucks();
        this.loadAssets();
        // start in placing state: allow initial striker positioning
        const strikerComp = this.striker.getComponent(Striker);
        if (strikerComp) {
            strikerComp.enterPositioningModeOnce();
            this.striker.on('striker-launched', this.onStrikerLaunched, this);
        }
    }

    createPucks() {
        this.whitePucks = [];
        this.blackPucks = [];
        for (let i = 0; i < 3; i++) {
            const whitePuck = this.nodeCreator.createNode(`whitePuck_${i}`, {
                spriteFrame: this.whitePuckSprite,
                width: 40,
                height: 40,
                colliderType: 'circle',
                colliderRadius: 17,
                rigidBodyType: 'dynamic',
                rigidBodyGravityScale: 0,
                linearDamping: 1.5,
                position: GameDefine.whitepuck_pos[i],
                restitution: 1
            });
            const wComp = whitePuck.addComponent(Puck);
            if (wComp) wComp.color = 'white';
            // listen to events from the puck
            whitePuck.on('pocketed', this.onPuckPocketed, this);
            whitePuck.on('hit-by-striker', this.onPuckHit, this);
            whitePuck.setScale(1.5,1.5);
            this.whitePucks.push(whitePuck);
            this.tableNode.addChild(whitePuck);

            const blackPuck = this.nodeCreator.createNode(`blackPuck_${i}`, {
                spriteFrame: this.blackPuckSprite,
                width: 40,
                height: 40,
                colliderType: 'circle',
                colliderRadius: 17,
                rigidBodyType: 'dynamic',
                rigidBodyGravityScale: 0,
                linearDamping: 1.5,
                position: GameDefine.blackpuck_pos[i],
                restitution: 1
            });
            const bComp = blackPuck.addComponent(Puck);
            if (bComp) bComp.color = 'black';
            blackPuck.on('pocketed', this.onPuckPocketed, this);
            blackPuck.on('hit-by-striker', this.onPuckHit, this);
            blackPuck.setScale(1.5,1.5)
            this.blackPucks.push(blackPuck);
            this.tableNode.addChild(blackPuck);
        }
        this.blackRemaining = this.blackPucks.length;
        this.whiteRemaining = this.whitePucks.length;

        const tableSize = this.tableNode.getComponent(UITransform).contentSize;

        this.striker = this.nodeCreator.createNode('striker', {
            spriteFrame: this.strikerSprite,
            width: 50,
            height: 50,
            colliderType: 'circle',
            colliderRadius: 20,
            rigidBodyType: 'dynamic',
            rigidBodyGravityScale: 0,
            linearDamping: 1.5,
            position: {x: 0, y: -(tableSize.height/3)+50},
            restitution: 1
        });
        this.striker.addComponent(Striker);
        this.striker.setScale(1.5,1.5)
        this.tableNode.addChild(this.striker);
    }

    update(deltaTime: number) {
        switch (this.tutorialState) {
            case 'TutPlacing':
                if (!this.isFirstTutorialShown && this.striker && this.GameMgr.getComponent(GameManager).flowState === 'ingame') {
                    this.showStrikerTutorialHand();
                }
                break;
            case 'TutPlaying':
                // this.
                if(!this.isSecondTutorialShown){
                    this.showStrikingTutorial();
                }
                break;

            case 'None':
                this.disableTutorial();
                break
        }

        if(this.isGameTimerstarted){
            this.gameTimer-= deltaTime;
            if(this.gameTimer <= 0 ){
                this.gameOver('enemy');
            }
        }
    }

    private onStrikerLaunched() {
        if (this.state === 'Placing') {
            this.state = 'Playing';
            // prevent further positioning
            const s = this.striker.getComponent(Striker);
            if (s) s.disablePositioning();
            console.log('Game: state -> Playing');
        }
    }

    private onPuckPocketed(payload: any) {
        if (!payload || !payload.color) return;
        if (this.state !== 'Playing') return;

        if (payload.color === 'black') {
            this.playerScore += 1;
            this.blackRemaining -= 1;
            console.log(`Player scored! player=${this.playerScore} enemy=${this.enemyScore}`);
            if (this.blackRemaining <= 0) {
                this.gameOver('player');
            }
        } else {
            // white pocketed -> enemy scores and immediate game over
            this.enemyScore += 1;
            console.log(`Enemy scored by white pocket! player=${this.playerScore} enemy=${this.enemyScore}`);
            this.gameOver('enemy');
        }
    }

    private onPuckHit(payload: any) {
        if (!payload || !payload.color) return;
        if (this.state !== 'Playing') return;
        console.log(this.state);
        
        // if striker hits white puck -> immediate game over (enemy scores)
        if (payload.color === 'white') {
            // this.enemyScore += 1;
            console.log('Striker hit white puck -> Game Over');
            // this.gameOver('enemy');
        }
    }

    loadAssets(){
        //hand
        const handSprite = this.spriteLoader.loadedAssets.get('hand');
        if (!handSprite) {
            console.warn('Tutorial hand sprite not loaded');
            return;
        }
        this.tutorialHand = this.nodeCreator.createNode('tutorialHand', {
            spriteFrame: handSprite,
            position: { x: 0, y: 0 },
            anchorPoint: { x: 0.1, y: 0.5 }
        });
        this.tutorialHand.setScale(0.3, 0.3);
        this.tableNode.addChild(this.tutorialHand);

        const arrowSprite = this.spriteLoader.loadedAssets.get('arrowFull');
        if (arrowSprite) {
            this.arrowFull = this.nodeCreator.createNode('arrowFull', {
                spriteFrame: arrowSprite,
                position: { x: 0, y: 0 },
                anchorPoint: { x: 0.5, y: 0 }
            });
            this.arrowFull.setScale(0.3, 0.3);
            // this.arrowFull.setRotationFromEuler(new Vec3(0,0,-90))
            this.arrowFull.active = false;
            this.tableNode.addChild(this.arrowFull);
        } else {
            console.warn('Tutorial arrow sprite not loaded');
        }
       
        //background and text
        this.bgBox = this.nodeCreator.createNode('box', { 
            spriteFrame: this.spriteLoader.loadedAssets.get('box'),
            position: {x: 0, y:100}
        });
        this.bgBox.setScale(1.15, 1);
        this.bgBox.getComponent(Sprite).color = new Color(255,255,255, 150)
        this.node.addChild(this.bgBox);

        //text
        if (!this.tutorialText) {
            const txt = new Node('tutorialText');
            const lbl = txt.addComponent(Label);
            lbl.string = GameDefine.tut_1_text;
            lbl.fontSize = 28;
            lbl.lineHeight = 34;
            lbl.isBold = true;
            lbl.color = new Color(255, 255, 255);
            lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
            lbl.verticalAlign = Label.VerticalAlign.CENTER;
            txt.setPosition(0, 100);
            txt.setScale(0.9, 0.9, 0.9);
            this.node.addChild(txt);
            this.tutorialText = txt;
        }
        this.bgBox.active = false;
        this.tutorialText.active = false;
        this.tutorialHand.active = false;
    }

    startGametimer(){
        this.isGameTimerstarted = true;
    }

    showStrikerTutorialHand() {
        if (!this.tutorialHand || !this.striker || !this.spriteLoader) {
            return;
        }
        this.bgBox.active = true;
        this.tutorialText.active = true;
        this.tutorialHand.active = true;
        const strikerPos = this.striker.getPosition();
        const handY = strikerPos.y + 90;
        this.tutorialHand.setPosition(strikerPos.x, handY, 0);

        //tweening
            const leftPos = new Vec3(strikerPos.x - 45, handY, 0);
            const rightPos = new Vec3(strikerPos.x + 40, handY, 0);
            const centerPos = new Vec3(strikerPos.x, handY, 0);
            let quat1 = new Quat();
            let quat2 = new Quat();
            Quat.fromEuler(quat1, 0, 0, 10);
            Quat.fromEuler(quat2, 0, 0, 0);

           tween(this.tutorialHand)
                .to(0.3, {rotation: quat1})
                .to(0.7, { position: leftPos })
                .to(0.7, { position: rightPos })
                .to(0.7, { position: centerPos })
                .to(0.3, {rotation: quat2})
                .union()
                .repeatForever()
                .start();
        this.isFirstTutorialShown = true;
    }

    showStrikingTutorial(){
        this.tutorialHand.active = true;
        const strikerPos = this.striker.getPosition();
        this.tutorialHand.setPosition(strikerPos.x, strikerPos.y, 0);
        if (this.arrowFull) {
            this.arrowFull.active = true;
            this.arrowFull.setPosition(strikerPos.x, strikerPos.y, 0);
        }
        let quat1 = new Quat();
        let quat2 = new Quat();
        Quat.fromEuler(quat1, 0, 0, 10);
        Quat.fromEuler(quat2, 0, 0, 0);
        tween(this.tutorialHand)
            // .to(0.5, {position: new Vec3(strikerPos.x, strikerPos.y - 90, 0)})
            .to(0.7, {position: new Vec3(strikerPos.x-55, strikerPos.y - 90, 0)})
            .to(0.7, {position: new Vec3(strikerPos.x+55, strikerPos.y - 90, 0)})
            .union()
            .repeatForever()
            .start();

        if (this.arrowFull) {
            // const initArrow = new Quat();
            // Quat.fromEuler(initArrow,0,0,-90);
            

            const arrowRotA = new Quat();
            const arrowRotB = new Quat();
            Quat.fromEuler(arrowRotA, 0, 0, -10);
            Quat.fromEuler(arrowRotB, 0, 0, 10);
            tween(this.arrowFull)
                .to(0.7, { rotation: arrowRotA })
                .to(0.7, { rotation: arrowRotB })
                .union()
                .repeatForever()
                .start();
        }

        this.isSecondTutorialShown = true;
    }

    disableTutorial() {
        Tween.stopAllByTarget(this.tutorialHand);
        if (this.arrowFull) Tween.stopAllByTarget(this.arrowFull);
        if (this.tutorialHand) this.tutorialHand.active = false;
        if (this.arrowFull) this.arrowFull.active = false;
        if (this.tutorialText) this.tutorialText.active = false;
        if (this.bgBox) this.bgBox.active = false;
    }

    private gameOver(winner: 'player' | 'enemy') {
        this.state = 'GameOver';
        console.log(`GameOver. Winner: ${winner}. Final score player=${this.playerScore} enemy=${this.enemyScore}`);
        // disable striker interactions
        const s = this.striker.getComponent(Striker);
        if (s) s.disablePositioning();

        const gm = this.GameMgr.getComponent(GameManager);
        if (gm) {
            //Tracking Event: Complete
            TrackingManager.SendEventTracking(TrackingEvents.COMPLETE);
            gm.showEndscreen(winner);
        }
    }
}



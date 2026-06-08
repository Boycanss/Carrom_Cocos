import { _decorator, Component, Node, ResolutionPolicy, screen, view, Label, Color, Vec3, tween, Tween, Button, Vec2, Input,input, EventTouch, instantiate } from 'cc';
import { SpriteLoader } from './utils/SpriteLoader';
import { NodeCreator } from './utils/NodeCreator';
import { GameDefine } from './Define';
import { Table } from './Table';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property(Node)
    foreground: Node = null;

    @property(Node)
    ingame: Node = null;

    @property(Node)
    background: Node = null;

    @property(Node)
    endscreen: Node = null;

    spriteLoader: SpriteLoader = null;
    nodeCreator: NodeCreator = null;

    bg: Node = null;
    ctaBg: Node = null;
    table: Node = null;
    startLabel: Node = null;
    loadingLabel: Node = null;
    loadingTween: Tween = null;
    endCtaBg: Node = null;
    endTable: Node = null;
    downloadButton: Node = null;
    resultLabel: Node = null;
    rematchLabel: Node = null;
    startLabelHidden: boolean = false;
    hideTimer: number = null;

    currentOrientation: 'portrait' | 'landscape' = null;
    flowState: 'prestart' | 'ingame' | 'gameover' = 'prestart';

    onLoad() {
        this.ingame.active = false;
        this.foreground.active = false;
        this.endscreen.active = false;
        this.spriteLoader = this.getComponent(SpriteLoader);
        this.nodeCreator = this.getComponent(NodeCreator);
        
        if (!this.spriteLoader) {
            this.spriteLoader = this.node.addComponent(SpriteLoader);
        }
        if (!this.nodeCreator) {
            this.nodeCreator = this.node.addComponent(NodeCreator);
        }

        if (this.background) {
            this.loadingLabel = new Node('loadingLabel');
            const loadingText = this.loadingLabel.addComponent(Label);
            loadingText.string = 'Loading...';
            loadingText.fontSize = 40;
            loadingText.color = new Color(255, 255, 255);
            loadingText.horizontalAlign = Label.HorizontalAlign.CENTER;
            loadingText.verticalAlign = Label.VerticalAlign.CENTER;
            this.loadingLabel.setPosition(0, 0, 0);
            this.background.addChild(this.loadingLabel);
            this.loadingLabel.active = true;
            this.loadingTween = tween(this.loadingLabel)
                .to(0.75, { scale: new Vec3(1.1, 1.1, 1.1) })
                .to(0.75, { scale: new Vec3(1, 1, 1) })
                .repeatForever()
                .start();
        }

        window.addEventListener('resize', this.onImmediateResize.bind(this));
        input.on(Input.EventType.TOUCH_START, this.onTouchStart.bind(this));
    }

    onImmediateResize() {
        this.handleResize();
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (width > height) {
            this.currentOrientation = 'landscape';
            view.setDesignResolutionSize(1334, 750, ResolutionPolicy.FIXED_HEIGHT);
            if(this.bg) {
                this.bg.setScale(1.5, 1.5);
            }
            if(this.table){
                this.table.setPosition(0, 0);
            }
            if (this.startLabel) {
                this.startLabel.setPosition(0, 240, 0);
            }
        } else {
            this.currentOrientation = 'portrait';
            view.setDesignResolutionSize(750, 1334, ResolutionPolicy.FIXED_WIDTH);
            //set BG portrait
            if(this.bg) {
                this.bg.setScale(1.2, 1.5);
            }
            //set Table
            if(this.table){
                this.table.setPosition(0, -100);
            }
            if (this.startLabel) {
                this.startLabel.setPosition(0, 300, 0);
            }
        }

        this.positionEndscreen();
    }

    async start() {
        if (!this.spriteLoader || !this.nodeCreator) {
            console.error('Missing components');
            return;
        }

        try {
            await Promise.all([
                this.spriteLoader.loadSpriteFrame('bg', GameDefine.images.bg),
                this.spriteLoader.loadSpriteFrame('ctaBg', GameDefine.images.cta_bg),
                this.spriteLoader.loadSpriteFrame('table', GameDefine.images.table),
                this.spriteLoader.loadSpriteFrame('whitePuck', GameDefine.images.white_puck),
                this.spriteLoader.loadSpriteFrame('blackPuck', GameDefine.images.black_puck),
                this.spriteLoader.loadSpriteFrame('striker', GameDefine.images.striker),
                this.spriteLoader.loadSpriteFrame('hand', GameDefine.images.hand_icon),
                this.spriteLoader.loadSpriteFrame('tut_arrowBase', GameDefine.images.tutorial_arrow),
                this.spriteLoader.loadSpriteFrame('tut_arrowHead', GameDefine.images.tutorial_arrowhead),
                this.spriteLoader.loadSpriteFrame('box', GameDefine.images.box),
                this.spriteLoader.loadSpriteFrame('arrowFull', GameDefine.images.tutorial_arrowFull),
                this.spriteLoader.loadSpriteFrame('downloadBtn', GameDefine.images.download_btn),
            ]);

            this.bg = this.nodeCreator.createNode('bg', { spriteFrame: this.spriteLoader.loadedAssets.get('bg') });
            this.background.addChild(this.bg);

            this.table = this.nodeCreator.createNode('table', { spriteFrame: this.spriteLoader.loadedAssets.get('table'), position: { x: 0, y: -10 } });
            this.table.addComponent(Table);

            this.ingame.addChild(this.table);
            this.ingame.active = true;
            this.foreground.active = true;
            this.createEndscreen();
            if (this.loadingLabel) {
                Tween.stopAllByTarget(this.loadingLabel);
                this.loadingLabel.active = false;
            }

            this.createStartText();
        } catch (error) {
            console.error('Error:', error);
        }

        this.handleResize();
    }

    private createStartText() {
        if (this.startLabel) {
            return;
        }

        this.startLabel = new Node('startLabel');
        const label = this.startLabel.addComponent(Label);
        label.string = GameDefine.prestart_text;
        label.fontSize = 55;
        label.lineHeight = 58;
        label.color = new Color(255, 255, 255);
        label.enableOutline = true;
        label.outlineColor = new Color(0, 0, 0);
        label.outlineWidth = 4;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        this.startLabel.setScale(new Vec3(0.1, 0.1, 0.1));
        this.startLabel.setPosition(0, this.currentOrientation === 'landscape' ? 100 : 300, 0);
        this.foreground.addChild(this.startLabel);
        this.showtween();

        this.hideTimer = window.setTimeout(() => {
            this.hideStartLabel();
        }, 3000);
    }

    showtween(){
        tween(this.startLabel)
            .to(0.4, { scale: new Vec3(1.12, 1.12, 1.12) }, { easing: 'backOut' })
            .to(0.15, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    private hideStartLabel() {
        if (this.startLabelHidden || !this.startLabel) return;
        this.startLabelHidden = true;
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
        }
        this.hideTween();
    }

    private onTouchStart(event: EventTouch) {
        this.hideStartLabel();
    }

    hideTween() {
        if (!this.startLabel.active) return;
        tween(this.startLabel)
            .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .to(0.15, { scale: new Vec3(0.1, 0.1, 0.1) })
            .call(() => {
                this.startLabel.active = false;
                this.flowState = 'ingame';
            })
            .start();
    }

    private createEndscreen() {
        if (!this.endscreen) return;

        this.endCtaBg = this.nodeCreator.createNode('endCtaBg', {
            spriteFrame: this.spriteLoader.loadedAssets.get('ctaBg'),
            position: { x: 0, y: 0 }
        });
        this.endCtaBg.setScale(1.5, 1.5);
        this.endscreen.addChild(this.endCtaBg);

        this.endTable = instantiate(this.table);
        this.endTable.name = 'endTable';
        const tableComp = this.endTable.getComponent(Table);
        if (tableComp) {
            this.endTable.removeComponent(tableComp);
        }
        this.endTable.setScale(0.05, 0.05, 0.05);
        this.endscreen.addChild(this.endTable);

        this.downloadButton = this.nodeCreator.createNode('downloadButton', {
            spriteFrame: this.spriteLoader.loadedAssets.get('downloadBtn'),
            position: { x: 0, y: 0 },
        });
        this.downloadButton.setScale(.6, .6);
        const downloadBtnComp = this.downloadButton.addComponent(Button);
        this.downloadButton.on(Button.EventType.CLICK, this.onEndscreenAction, this);
        this.endscreen.addChild(this.downloadButton);

        this.resultLabel = new Node('resultLabel');
        const resultText = this.resultLabel.addComponent(Label);
        resultText.string = 'YOU WIN';
        resultText.fontSize = 72;
        resultText.lineHeight = 84;
        resultText.enableOutline = true;
        resultText.outlineColor = new Color(0, 0, 0, 100);
        resultText.outlineWidth = 4;
        resultText.isBold = true;
        resultText.color = new Color(230, 230, 230);
        resultText.horizontalAlign = Label.HorizontalAlign.CENTER;
        resultText.verticalAlign = Label.VerticalAlign.CENTER;
        this.resultLabel.setScale(0.05, 0.05, 0.05);
        this.endscreen.addChild(this.resultLabel);

        this.rematchLabel = new Node('rematchLabel');
        const rematchText = this.rematchLabel.addComponent(Label);
        rematchText.string = 'REMATCH?';
        rematchText.fontSize = 44;
        rematchText.lineHeight = 48;
        rematchText.isBold = true;
        rematchText.enableOutline = true;
        rematchText.outlineColor = new Color(0, 0, 0, 100);
        rematchText.outlineWidth = 4;
        rematchText.color = new Color(255, 255, 255);
        rematchText.horizontalAlign = Label.HorizontalAlign.CENTER;
        rematchText.verticalAlign = Label.VerticalAlign.CENTER;
        this.rematchLabel.addComponent(Button);
        this.rematchLabel.on(Button.EventType.CLICK, this.onEndscreenAction, this);
        this.rematchLabel.setScale(0.05, 0.05, 0.05);
        this.endscreen.addChild(this.rematchLabel);

        this.endscreen.active = false;
        this.positionEndscreen();
    }

    private positionEndscreen() {
        if (!this.endscreen) return;

        if (this.currentOrientation === 'landscape') {
            if (this.endTable) {
                this.endTable.setPosition(300, 0, 0);
            }
            if (this.downloadButton) {
                this.downloadButton.setPosition(-350, -200, 0);
            }
            if (this.resultLabel) {
                this.resultLabel.setPosition(300, 50, 0);
            }
            if (this.rematchLabel) {
                this.rematchLabel.setPosition(300, -30, 0);
            }
        } else {
            if (this.endTable) {
                this.endTable.setPosition(0, -220, 0);
            }
            if (this.downloadButton) {
                this.downloadButton.setPosition(0, 260, 0);
            }
            if (this.resultLabel) {
                this.resultLabel.setPosition(0, -140, 0);
            }
            if (this.rematchLabel) {
                this.rematchLabel.setPosition(0, -210, 0);
            }
        }
    }

    public showEndscreen(winner: 'player' | 'enemy') {
        if (!this.endscreen) return;

        if (this.background) this.background.active = false;
        if (this.ingame) this.ingame.active = false;
        if (this.foreground) this.foreground.active = false;

        const resultText = this.resultLabel?.getComponent(Label);
        if (resultText) {
            resultText.string = winner === 'player' ? 'YOU WIN' : 'YOU LOSE';
        }

        this.endscreen.active = true;
        this.flowState = 'gameover';
        this.positionEndscreen();

        if (this.endTable) {
            Tween.stopAllByTarget(this.endTable);
            this.endTable.setScale(0.05, 0.05, 0.05);
            const targetScale = this.currentOrientation === 'landscape' ? 0.9 : 0.95;
            tween(this.endTable)
                .to(0.35, { scale: new Vec3(targetScale, targetScale, targetScale) }, { easing: 'backOut' })
                .call(() => {
                    if (this.resultLabel) {
                        this.resultLabel.setScale(0.05, 0.05, 0.05);
                        tween(this.resultLabel)
                            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                            .start();
                    }
                    if (this.rematchLabel) {
                        this.rematchLabel.setScale(0.05, 0.05, 0.05);
                        tween(this.rematchLabel)
                            .delay(0.12)
                            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                            .start();
                    }
                })
                .start();
        }

        // if (this.downloadButton) {
        //     Tween.stopAllByTarget(this.downloadButton);
        //     this.downloadButton.setScale(.6,.6);
        //     tween(this.downloadButton)
        //         .to(0.8, { scale: new Vec3(.65, .65, 0) })
        //         .to(0.8, { scale: new Vec3(.6, .6, 0) })
        //         .union()
        //         .repeatForever()
        //         .start();
        // }
    }

    private onEndscreenAction() {
        console.log('Endscreen CTA clicked');
        window.location.reload();
    }

    update(deltaTime: number) {}
}



import {
    _decorator, Component, Node, Vec2, Vec3,
    RigidBody2D, UITransform, Sprite,
    EventTouch, Input, input,
    find
} from 'cc';
import { Game } from './Game';
import TrackingManager, { TrackingEvents } from './utils/TrackingManager';
const { ccclass } = _decorator;

enum StrikerState {
    Idle,
    Positioning,
    Launching
}

@ccclass('Striker')
export class Striker extends Component {

    private _state: StrikerState = StrikerState.Idle;
    private _positioningAllowed: boolean = false;
    private _initialPos: Vec3 = new Vec3();
    private _touchStartTime: number = 0;
    private _touchStartPos: Vec2 = new Vec2();
    private _holdThreshold: number = 200;
    private _moveThreshold: number = 10;
    private _minX: number = -160;
    private _maxX: number = 160;
    private _maxForce: number = 4000;
    private _maxDragDistance: number = 200;
    private _rb: RigidBody2D | null = null;
    private _holdTimer: any = null;
    private _touchActive: boolean = false;

    initScale:Vec2 = new Vec2;
    gamescr:Game = null;
    // trajectory visuals
    private tutorialArrowBase: Node | null = null;
    private tutorialArrowHead: Node | null = null;
    private _trajBaseOriginalWidth: number = 100;
    private _maxTrajectoryLength: number = 220;

    onLoad() {
        this._rb = this.node.getComponent(RigidBody2D);
        this.gamescr = find("Canvas/Ingame").getComponent(Game);
        this._initialPos = this.node.position.clone();
        this.initScale = new Vec2(this.node.scale.x, this.node.scale.y);
    }

    onEnable() {
        this.node.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(Input.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }

    onDisable() {
        this.node.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.off(Input.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        this._clearHoldTimer();
    }

    private _onTouchStart(event: EventTouch) {
        //Tracking Event: FirstInteraction
        TrackingManager.SendEventTracking(TrackingEvents.FIRSTINTERACTION);

        if (this._state !== StrikerState.Idle) return;
        if (!this._isStrikerStopped()) return;
        this._touchActive = true;
        this._touchStartTime = Date.now();
        this._touchStartPos = event.getUILocation();

        // only allow the long-press positioning behavior if enabled
        if (this._positioningAllowed) {
            this._holdTimer = setTimeout(() => {
                if (this._touchActive && this._state === StrikerState.Idle) {
                    this.node.setScale(this.initScale.x*1.2,this.initScale.y*1.2);
                    this._state = StrikerState.Positioning;
                    this.gamescr.disableTutorial();
                }
            }, this._holdThreshold);
        }
    }

    private _onTouchMove(event: EventTouch) {
        if (!this._touchActive) return;

        const currentPos = event.getUILocation();

        if (this._state === StrikerState.Idle) {
            const dx = currentPos.x - this._touchStartPos.x;
            const dy = currentPos.y - this._touchStartPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this._moveThreshold) {
                this._clearHoldTimer();
                this._state = StrikerState.Launching;
            }
            return;
        }

        if (this._state === StrikerState.Positioning) {
            const worldPos = this.node.parent!.getComponent(UITransform)!
                .convertToNodeSpaceAR(new Vec3(currentPos.x, currentPos.y, 0));
            const clampedX = Math.max(this._minX, Math.min(this._maxX, worldPos.x));
            this.node.setPosition(clampedX, this._initialPos.y, 0);
        }

        // when user is dragging to launch, update trajectory visuals
        if (this._state === StrikerState.Launching) {
            this.gamescr.tutorialState = 'None';
            // compute world-space positions similar to _launch
            const nodeWorldPos = this.node.getComponent(UITransform)!
                .convertToWorldSpaceAR(new Vec3(0, 0, 0));
            const dragX = currentPos.x - nodeWorldPos.x;
            const dragY = currentPos.y - nodeWorldPos.y;
            const dragDist = Math.sqrt(dragX * dragX + dragY * dragY);
            if (dragDist < 1) return;

            const forceRatio = Math.min(dragDist / this._maxDragDistance, 1.0);
            const dirX = -dragX / dragDist;
            const dirY = -dragY / dragDist;

            this._updateTrajectory(dirX, dirY, forceRatio);
        }
    }

    private _onTouchEnd(event: EventTouch) {
        if (!this._touchActive) return;
        this._touchActive = false;
        this._clearHoldTimer();
        if(this.gamescr.tutorialState == 'TutPlacing'){
            this.gamescr.tutorialState = 'TutPlaying';
        }

        if (this._state === StrikerState.Positioning) {
            this._initialPos = this.node.position.clone();
            this._state = StrikerState.Idle;
            this.node.setScale(this.initScale.x, this.initScale.y);
            return;
        }

        if (this._state === StrikerState.Launching) {
            this._launch(event);
            this._state = StrikerState.Idle;
            this._destroyTrajectory();
            return;
        }
        
        this._state = StrikerState.Idle;
    }

    private _launch(event: EventTouch) {
        if (!this._rb) return;

        const touchEnd = event.getUILocation();
        const nodeWorldPos = this.node.getComponent(UITransform)!
            .convertToWorldSpaceAR(new Vec3(0, 0, 0));

        const dragX = touchEnd.x - nodeWorldPos.x;
        const dragY = touchEnd.y - nodeWorldPos.y;
        const dragDist = Math.sqrt(dragX * dragX + dragY * dragY);

        if (dragDist < this._moveThreshold) return;

        const forceRatio = Math.min(dragDist / this._maxDragDistance, 1.0);
        const forceMagnitude = forceRatio * this._maxForce;

        const dirX = -dragX / dragDist;
        const dirY = -dragY / dragDist;

        this._rb.applyForceToCenter(
            new Vec2(dirX * forceMagnitude, dirY * forceMagnitude),
            true
        );

        // notify game that striker was launched
        this.node.emit('striker-launched');
        this._destroyTrajectory();
    }

    private _isStrikerStopped(): boolean {
        if (!this._rb) return true;
        const v = this._rb.linearVelocity;
        return v.length() < 0.5;
    }

    private _clearHoldTimer() {
        if (this._holdTimer) {
            clearTimeout(this._holdTimer);
            this._holdTimer = null;
        }
    }

    resetPosition() {
        this.node.setPosition(this._initialPos);
        if (this._rb) {
            this._rb.linearVelocity = Vec2.ZERO;
            this._rb.angularVelocity = 0;
        }
        this._state = StrikerState.Idle;
    }

    private _createTrajectory() {
        if (this.tutorialArrowBase || !this.gamescr || !this.gamescr.spriteLoader || !this.gamescr.nodeCreator) return;

        const baseSprite = this.gamescr.spriteLoader ? this.gamescr.spriteLoader.loadedAssets.get('tut_arrowBase') : this.gamescr.spriteLoader.loadedAssets.get('tut_arrowBase');
        const headSprite = this.gamescr.spriteLoader ? this.gamescr.spriteLoader.loadedAssets.get('tut_arrowHead') : this.gamescr.spriteLoader.loadedAssets.get('tut_arrowHead');
        if (!baseSprite || !headSprite) return;

        const parent = this.node.parent!;

        const base = this.gamescr.nodeCreator.createNode('tutorialArrowBase', {
            spriteFrame: baseSprite,
            width:  100,
            height: 40,
            anchorPoint: {x: 0, y:.5}
        });

        const head = this.gamescr.nodeCreator.createNode('tutorialArrowHead', {
            spriteFrame: headSprite,
            width: 40,
            height: 40,
        });

        parent.addChild(base);
        parent.addChild(head);

        this.tutorialArrowBase = base;
        this.tutorialArrowHead = head;
    }

    private _updateTrajectory(dirX: number, dirY: number, forceRatio: number) {
        if (!this.tutorialArrowBase || !this.tutorialArrowHead) {
            this._createTrajectory();
            if (!this.tutorialArrowBase || !this.tutorialArrowHead) return;
        }

        const angle = Math.atan2(dirY, dirX);
        const angleDeg = angle * 180 / Math.PI;

        const length = forceRatio * this._maxTrajectoryLength;

        const baseLocalPos = this.node.getPosition();
        this.tutorialArrowBase.setPosition(baseLocalPos.x, baseLocalPos.y, 0);
        this.tutorialArrowBase.setRotationFromEuler(0, 0, angleDeg);
        const scaleX = Math.max(0.01, length / this._trajBaseOriginalWidth);
        this.tutorialArrowBase.setScale(scaleX, 1, 1);

        const headX = baseLocalPos.x + Math.cos(angle) * length;
        const headY = baseLocalPos.y + Math.sin(angle) * length;
        this.tutorialArrowHead.setPosition(headX, headY, 0);
        this.tutorialArrowHead.setRotationFromEuler(0, 0, angleDeg);
    }

    private _destroyTrajectory() {
        if (this.tutorialArrowBase) {
            this.tutorialArrowBase.destroy();
            this.tutorialArrowBase = null;
        }
        if (this.tutorialArrowHead) {
            this.tutorialArrowHead.destroy();
            this.tutorialArrowHead = null;
        }
    }

    // allow the game to set the striker into positioning mode once
    enterPositioningModeOnce() {
        this._positioningAllowed = true;
        this._state = StrikerState.Idle;
    }

    // permanently disable the positioning behavior
    disablePositioning() {
        this._positioningAllowed = false;
        if (this._state === StrikerState.Positioning) {
            this._state = StrikerState.Idle;
        }
    }
}
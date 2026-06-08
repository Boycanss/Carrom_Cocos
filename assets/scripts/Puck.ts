import { _decorator, CircleCollider2D, BoxCollider2D, Component, Contact2DType, Node, Vec3, UITransform, find, RigidBody2D } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('Puck')
export class Puck extends Component {
    
    tableWidth: number;
    holeThreshold:number = 167;
    color: string = 'white';

    GameMgr:Node = null;
    rb:RigidBody2D = null;
    start() {
        this.GameMgr = find("Canvas/GameManager");
        this.rb = this.node.getComponent(RigidBody2D);
        // listen for 2D collider contacts for both circle and box colliders
        const c1 = this.node.getComponent(CircleCollider2D);
        const c2 = this.node.getComponent(BoxCollider2D);
        const collider = c1 || c2;
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }

        this.calculateHoleThreshold();
    }

    calculateHoleThreshold() {
        this.tableWidth = this.GameMgr.getComponent(GameManager).table.getComponent(UITransform).width;
        const w = this.tableWidth/2;
        const offset = this.tableWidth/6;
        this.holeThreshold = w - offset;
    }

    update(deltaTime: number) {
        if(this.rb && this.rb.linearVelocity.length() > 0.5){
            this.checkHoleAndDestroy();
        }
    }

    private checkHoleAndDestroy(): boolean {
        const pos: Vec3 = this.node.getPosition();
        const x = pos.x;
        const y = pos.y;
        const t = this.holeThreshold;
        
        let o = this.GameMgr.getComponent(GameManager).currentOrientation;
        const offsetPortrait = o == 'portrait' ? -100 : 0;
        // emit pocket event then destroy if inside one of the four pockets
        // top-left
        if (x < -t && y > t+offsetPortrait) { this.node.emit('pocketed', { color: this.color }); this.node.destroy(); return true; }
        // top-right
        if (x > t && y > t+offsetPortrait) { this.node.emit('pocketed', { color: this.color }); this.node.destroy(); return true; }
        // bottom-left
        if (x < -t && y < -t-offsetPortrait+10) { this.node.emit('pocketed', { color: this.color }); this.node.destroy(); return true; }
        // bottom-right
        if (x > t && y < -t-offsetPortrait+10) { this.node.emit('pocketed', { color: this.color }); this.node.destroy(); return true; }

        return false;
    }

    onBeginContact(selfCollider: any, otherCollider: any, contact: any) {

        try {
            if (otherCollider && otherCollider.node && otherCollider.node.name === 'striker') {
                this.node.emit('hit-by-striker', { color: this.color });
            }
        } catch (e) {

        }

        // this.checkHoleAndDestroy();
    }

    onCollisionEnter(other: any) {
        console.log(">>> COLLISION");
        // this.checkHoleAndDestroy();
    }
}



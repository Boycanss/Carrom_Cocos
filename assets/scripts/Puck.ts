import { _decorator, CircleCollider2D, BoxCollider2D, Component, Contact2DType, Node, Vec3, UITransform, find, RigidBody2D } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('Puck')
export class Puck extends Component {
    
    tableWidth: number;
    tableHeight: number;
    holeRadius: number = 140; // radius of pocket holes
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
        const table = this.GameMgr.getComponent(GameManager).table;
        const uiTransform = table.getComponent(UITransform);
        this.tableWidth = uiTransform.width;
        this.tableHeight = uiTransform.height;
    }

    update(deltaTime: number) {
        if(this.rb && this.rb.linearVelocity.length() > 0.5){
            this.checkHoleAndDestroy();
        }
    }

    private checkHoleAndDestroy(): boolean {
        const puckPos: Vec3 = this.node.getPosition();
        const table = this.GameMgr.getComponent(GameManager).table;
        const tablePos: Vec3 = table.getPosition();
        
        // Calculate 4 corner positions of the table
        const halfWidth = this.tableWidth / 2;
        const halfHeight = this.tableHeight / 2;
        
        const corners = [
            new Vec3(tablePos.x - halfWidth, tablePos.y + halfHeight, 0), // top-left
            new Vec3(tablePos.x + halfWidth, tablePos.y + halfHeight, 0), // top-right
            new Vec3(tablePos.x - halfWidth, tablePos.y - halfHeight, 0), // bottom-left
            new Vec3(tablePos.x + halfWidth, tablePos.y - halfHeight, 0)  // bottom-right
        ];
        
        // Check if puck is within hole radius of any corner
        for (const corner of corners) {
            const distance = Vec3.distance(puckPos, corner);
            if (distance < this.holeRadius) {
                this.node.emit('pocketed', { color: this.color });
                this.node.destroy();
                return true;
            }
        }
        
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


